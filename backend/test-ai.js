require('dotenv').config();
const { genkit, z } = require('genkit');
const { googleAI } = require('@genkit-ai/google-genai');

const ai = genkit({
  plugins: [googleAI()],
  model: 'googleAI/gemini-1.5-flash',
});

async function main() {
  try {
    const generatePoemFlow = ai.defineFlow({
      name: 'generatePoem',
      inputSchema: z.object({ subject: z.string() }),
      outputSchema: z.object({ poem: z.string() }),
    }, async ({ subject }) => {
      const { text } = await ai.generate(`Compose a short poem about ${subject}.`);
      return { poem: text };
    });
    
    console.log('Flow defined successfully. API key test might fail if missing.');
  } catch(e) {
    console.error(e);
  }
}

main();
