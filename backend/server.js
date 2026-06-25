require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// ── Genkit + Google AI ──────────────────────────────────────────────────────
const { genkit, z } = require('genkit');
const { googleAI } = require('@genkit-ai/google-genai');

const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});

// ── Firebase Admin SDK ──────────────────────────────────────────────────────
let firestoreDb;
try {
  const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(serviceAccount) });
  firestoreDb = getFirestore();
  console.log('✅ Firebase Admin SDK initialized.');
} catch (error) {
  console.error('❌ Firebase Admin SDK failed:', error.message);
}

// ═══════════════════════════════════════════════════════════════════════════
//  LEVEL 5: TOOL CALLING — AI can call these functions automatically
// ═══════════════════════════════════════════════════════════════════════════

// Tool: Check available hotel services
const getHotelServices = ai.defineTool(
  {
    name: 'getHotelServices',
    description: 'Get list of available hotel services like spa, laundry, room service, restaurant, gym, pool, etc.',
    inputSchema: z.object({}),
    outputSchema: z.object({
      services: z.array(z.object({
        name: z.string(),
        available: z.boolean(),
        hours: z.string(),
      })),
    }),
  },
  async () => {
    // Pull live services from Firestore if available
    let services = [
      { name: 'Room Service', available: true, hours: '24/7' },
      { name: 'Spa & Wellness', available: true, hours: '9:00 AM - 9:00 PM' },
      { name: 'Swimming Pool', available: true, hours: '6:00 AM - 10:00 PM' },
      { name: 'Fitness Center', available: true, hours: '5:00 AM - 11:00 PM' },
      { name: 'Restaurant', available: true, hours: '7:00 AM - 11:00 PM' },
      { name: 'Laundry Service', available: true, hours: '8:00 AM - 6:00 PM' },
      { name: 'Airport Shuttle', available: true, hours: 'On Request' },
      { name: 'Concierge', available: true, hours: '24/7' },
    ];

    if (firestoreDb) {
      try {
        const snap = await firestoreDb.collection('services').get();
        if (!snap.empty) {
          services = snap.docs.map(d => ({
            name: d.data().name || d.id,
            available: d.data().isActive !== false,
            hours: d.data().hours || 'Contact front desk',
          }));
        }
      } catch (e) { /* fallback to defaults */ }
    }
    return { services };
  }
);

// Tool: Check room availability
const checkRoomAvailability = ai.defineTool(
  {
    name: 'checkRoomAvailability',
    description: 'Check if hotel rooms are available for a given date or date range. Use when guest asks about room availability or booking.',
    inputSchema: z.object({
      checkIn: z.string().describe('Check-in date (e.g. "2026-06-20")'),
      roomType: z.string().optional().describe('Room type like "deluxe", "suite", "standard"'),
    }),
    outputSchema: z.object({
      available: z.boolean(),
      rooms: z.array(z.object({
        type: z.string(),
        pricePerNight: z.number(),
        available: z.boolean(),
      })),
    }),
  },
  async ({ checkIn, roomType }) => {
    // In a real app, query Firestore for real availability
    const rooms = [
      { type: 'Standard Room', pricePerNight: 2500, available: true },
      { type: 'Deluxe Room', pricePerNight: 4500, available: true },
      { type: 'Suite', pricePerNight: 8000, available: true },
      { type: 'Presidential Suite', pricePerNight: 15000, available: false },
    ];

    const filtered = roomType
      ? rooms.filter(r => r.type.toLowerCase().includes(roomType.toLowerCase()))
      : rooms;

    return {
      available: filtered.some(r => r.available),
      rooms: filtered,
    };
  }
);

// Tool: Get hotel policies
const getHotelPolicies = ai.defineTool(
  {
    name: 'getHotelPolicies',
    description: 'Get hotel policies about check-in/out times, cancellation, pets, smoking, Wi-Fi, parking, etc.',
    inputSchema: z.object({
      topic: z.string().describe('Policy topic like "check-in", "cancellation", "wifi", "parking", "pets"'),
    }),
    outputSchema: z.object({ policy: z.string() }),
  },
  async ({ topic }) => {
    const policies = {
      'check-in': 'Check-in time is 2:00 PM. Early check-in available upon request (subject to availability). Check-out time is 11:00 AM. Late check-out can be requested at the front desk.',
      'cancellation': 'Free cancellation up to 24 hours before check-in. Cancellations within 24 hours will be charged one night\'s stay.',
      'wifi': 'Complimentary high-speed Wi-Fi is available throughout the hotel. Premium Wi-Fi (100 Mbps) is available for ₹299/day.',
      'parking': 'Free self-parking is available for all guests. Valet parking is available for ₹500/day.',
      'pets': 'We are a pet-friendly hotel! Small pets (under 10 kg) are welcome with a ₹1000 cleaning fee per stay.',
      'smoking': 'The hotel is a non-smoking property. Designated smoking areas are available outdoors.',
      'payment': 'We accept all major credit/debit cards, UPI, and cash. A valid ID is required at check-in.',
    };

    const key = Object.keys(policies).find(k => topic.toLowerCase().includes(k));
    return { policy: key ? policies[key] : `Please contact our front desk for information about "${topic}". They can be reached 24/7.` };
  }
);

// Tool: Create a service request (Level 7: AI Agent Action)
const createServiceRequest = ai.defineTool(
  {
    name: 'createServiceRequest',
    description: 'Create a hotel service request for the guest (e.g. order food, book spa, request housekeeping, laundry). Only use this if the guest explicitly asks to order/request/book a service.',
    inputSchema: z.object({
      services: z.array(z.string()).describe('List of services requested, e.g. ["Room Service - Burger", "Extra Towels"]'),
      guestName: z.string().describe('Name of the guest'),
      bookingId: z.string().describe('Booking ID of the guest'),
      hotelId: z.string().optional().describe('Hotel ID if known'),
      userId: z.string().optional().describe('User ID if known'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async ({ services, guestName, bookingId, hotelId, userId }) => {
    if (!firestoreDb) return { success: false, message: 'Database not connected. Please contact front desk.' };
    try {
      // Add the request
      await firestoreDb.collection('serviceRequests').add({
        userId: userId || 'AI_GUEST',
        guestName: guestName,
        bookingId: bookingId,
        hotelId: hotelId || 'Unknown',
        services: services,
        status: 'Pending',
        createdAt: new Date(), // using server time approximation
      });
      
      // Notify Admin
      await firestoreDb.collection('notifications').add({
        title: 'AI Service Request',
        message: `${guestName} (Booking: ${bookingId}) requested: ${services.join(', ')} via AI Concierge.`,
        isRead: false,
        createdAt: new Date(),
        type: 'service_request'
      });
      return { success: true, message: 'Your request has been sent to the hotel staff successfully.' };
    } catch (e) {
      console.error('Error creating request via AI:', e);
      return { success: false, message: 'Failed to submit request. Please try again or call the front desk.' };
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
//  LEVEL 4: AI FLOWS — Reusable AI logic
// ═══════════════════════════════════════════════════════════════════════════

// Flow: Hotel Concierge Chat (with tool calling)
const conciergeFlow = ai.defineFlow(
  {
    name: 'hotelConcierge',
    inputSchema: z.object({
      message: z.string(),
      guestInfo: z.object({
        name: z.string(),
        bookingId: z.string(),
        hotelId: z.string().optional(),
        userId: z.string().optional()
      }).optional().nullable(),
      history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })).optional(),
    }),
    outputSchema: z.object({ reply: z.string() }),
  },
  async ({ message, guestInfo, history }) => {
    const chatHistory = (history || []).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      content: [{ text: h.content }],
    }));

    let systemContext = `You are "HotelBot", a friendly and professional AI Hotel Concierge.
You help guests with services, amenities, room info, policies, local recommendations, and bookings.
Rules:
- Keep responses concise (2-3 sentences unless details are needed)
- Be warm, helpful, and professional
- Use tools to get real hotel data when possible
- Emojis are good, but use them sparingly
- If asked to order or book something, use the createServiceRequest tool.`;

    if (guestInfo?.name) {
      systemContext += `\n\nCURRENT GUEST CONTEXT:
- Name: ${guestInfo.name}
- Booking ID: ${guestInfo.bookingId}
(Use this context if you need to create a service request for them, or to greet them by name occasionally!)`;
    }

    const { text } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: systemContext,
      tools: [getHotelServices, checkRoomAvailability, getHotelPolicies, createServiceRequest],
      history: chatHistory,
      prompt: message,
    });

    return { reply: text };
  }
);

// Flow: Review Summarizer (Level 3 — Structured Output)
const summarizeReviewsFlow = ai.defineFlow(
  {
    name: 'summarizeReviews',
    inputSchema: z.object({ reviews: z.string() }),
    outputSchema: z.object({
      summary: z.string(),
      sentiment: z.enum(['positive', 'neutral', 'negative']),
      highlights: z.array(z.string()),
      rating: z.number(),
    }),
  },
  async ({ reviews }) => {
    const result = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `Analyze these hotel reviews and provide a structured summary:\n\n${reviews}`,
      output: {
        schema: z.object({
          summary: z.string().describe('2-3 sentence summary of the reviews'),
          sentiment: z.enum(['positive', 'neutral', 'negative']),
          highlights: z.array(z.string()).describe('Top 3 highlights mentioned'),
          rating: z.number().describe('Estimated rating out of 5'),
        }),
      },
    });

    return result.output || { summary: 'Unable to summarize', sentiment: 'neutral', highlights: [], rating: 3 };
  }
);

// Flow: Seed Content from Image (Multimodal)
const seedContentFlow = ai.defineFlow(
  {
    name: 'seedContent',
    inputSchema: z.object({
      imageUrl: z.string().url(),
      section: z.string()
    }),
    outputSchema: z.object({
      title: z.string().optional(),
      subheading: z.string().optional(),
      heading: z.string().optional(),
      paragraph1: z.string().optional(),
      paragraph2: z.string().optional(),
      description: z.string().optional(),
      caption: z.string().optional(),
      buttonText: z.string().optional()
    }),
  },
  async ({ imageUrl, section }) => {
    const result = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: [
        { text: `You are an expert copywriter for a luxury hotel. Analyze this image and generate compelling text for a website section named/typed: "${section}". Keep descriptions concise, evocative, and luxurious. Fill out the relevant fields.` },
        { media: { url: imageUrl } }
      ],
      output: {
        schema: z.object({
          title: z.string().describe('A short, elegant title for the section').optional(),
          subheading: z.string().describe('A very short uppercase subheading (e.g. EXCLUSIVE SANCTUARY)').optional(),
          heading: z.string().describe('A main heading, slightly longer than the title').optional(),
          paragraph1: z.string().describe('A detailed paragraph describing the image and experience').optional(),
          paragraph2: z.string().describe('An optional secondary paragraph with more details').optional(),
          description: z.string().describe('A 2-3 sentence description of the amenity or service').optional(),
          caption: z.string().describe('A very short caption for the image').optional(),
          buttonText: z.string().describe('A call to action button text (e.g. Explore Now)').optional()
        })
      }
    });
    return result.output || {};
  }
);

// ═══════════════════════════════════════════════════════════════════════════
//  EXPRESS SERVER
// ═══════════════════════════════════════════════════════════════════════════

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Status
app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend running with Genkit AI ✅', timestamp: new Date() });
});

// Auth middleware
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token' });
  try {
    req.user = await getAuth().verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: `Hello ${req.user.email}, you are authenticated!` });
});

// ── AI Chat Endpoint ────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, guestInfo } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const result = await conciergeFlow({ message, guestInfo, history: history || [] });
    res.json(result);
  } catch (error) {
    console.error('❌ AI Chat error:', error.message);
    res.status(500).json({ error: 'AI service unavailable', details: error.message });
  }
});

// ── Review Summarizer Endpoint ──────────────────────────────────────────────
app.post('/api/summarize-reviews', async (req, res) => {
  try {
    const { reviews } = req.body;
    if (!reviews) return res.status(400).json({ error: 'Reviews text is required' });
    const result = await summarizeReviewsFlow({ reviews });
    res.json(result);
  } catch (error) {
    console.error('❌ Review summarizer error:', error.message);
    res.status(500).json({ error: 'Failed to summarize', details: error.message });
  }
});

// ── Seed Content Endpoint ───────────────────────────────────────────────────
app.post('/api/seed-content', async (req, res) => {
  try {
    const { imageUrl, section } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'Image URL is required' });
    const result = await seedContentFlow({ imageUrl, section: section || 'General' });
    res.json(result);
  } catch (error) {
    console.error('❌ Seed content error:', error.message);
    res.status(500).json({ error: 'Failed to seed content', details: error.message });
  }
});

// ── Simple Generate Endpoint (Level 1) ──────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const result = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt,
    });
    res.json({ text: result.text });
  } catch (error) {
    console.error('❌ Generate error:', error.message);
    res.status(500).json({ error: 'Generation failed', details: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🤖 AI Concierge ready (Genkit + Gemini 2.5 Flash)`);
});
