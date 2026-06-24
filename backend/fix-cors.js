require('dotenv').config({ path: '../.env' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');

const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
  storageBucket: process.env.FIREBASE_PROJECT_ID + '.firebasestorage.app'
});

async function configureCors() {
  try {
    console.log("Configuring CORS for Firebase Storage bucket...");
    const bucket = getStorage(app).bucket();
    
    await bucket.setCorsConfiguration([
      {
        origin: ['*'],
        method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
        responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-goog-resumable'],
        maxAgeSeconds: 3600
      }
    ]);

    console.log("Success! CORS policy has been updated for the Firebase Storage bucket.");
    console.log("You can now upload images from localhost without errors.");
  } catch (error) {
    console.error("Error setting CORS:", error.message);
  }
}

configureCors();
