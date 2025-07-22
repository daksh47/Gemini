// This file acts as a serverless function.
// Vercel will automatically create an endpoint at /api/chat

const fetch = require('node-fetch');

export default async function handler(req, res) {
  // --- Start of Debugging Code ---
  console.log("Function invoked. Request method:", req.method);

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  try {
    const API_KEY = process.env.GEMINI_API_KEY;

    // Log to check if the API key is loaded.
    // For security, we only log if it exists and its first few characters.
    if (API_KEY) {
      console.log("API Key found, starts with:", API_KEY.substring(0, 4));
    } else {
      console.error("CRITICAL: GEMINI_API_KEY environment variable not found!");
      // Send a specific error back to the frontend
      return res.status(500).json({ error: "Server configuration error: API key is missing." });
    }

    const { prompt } = req.body;
    console.log("Received prompt:", prompt);

    if (!prompt) {
      console.error("Error: Prompt is missing in the request body.");
      return res.status(400).json({ error: "The request body must contain a 'prompt' field." });
    }
    
    // --- End of Debugging Code ---

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      return res.status(response.status).json({ error: 'Failed to fetch from Gemini API.' });
    }

    const responseData = await response.json();

    if (responseData.candidates && responseData.candidates.length > 0) {
      const textResponse = responseData.candidates[0].content.parts[0].text;
      return res.status(200).json({ text: textResponse });
    } else {
      console.error("Unexpected response structure from Gemini API:", responseData);
      return res.status(500).json({ error: 'No valid content received from Gemini API.' });
    }

  } catch (error) {
    // Log the full error object for detailed debugging
    console.error("Internal Server Error in catch block:", error);
    return res.status(500).json({ error: "An internal server error occurred." });
  }
}
