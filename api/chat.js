// This file acts as a serverless function.
// Vercel will automatically create an endpoint at /api/chat

// We don't need the firebase-functions or cors packages here.
const fetch = require('node-fetch');

export default async function handler(req, res) {
  // Ensure this function only handles POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Get the prompt from the request body
  const { prompt } = req.body;

  // Get the secret API key from Vercel's environment variables
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!prompt) {
    return res.status(400).json({ error: "The request body must contain a 'prompt' field." });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: "The API key is not configured on the server." });
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    console.error("Internal Server Error:", error);
    return res.status(500).json({ error: "An internal server error occurred." });
  }
}
