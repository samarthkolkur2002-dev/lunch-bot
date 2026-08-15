const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Set up multer to temporarily hold the uploaded menu photo in computer memory
const upload = multer({ storage: multer.memoryStorage() });

// Initialize the Google Gemini AI using your secure key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Temporary database for our menus 
let savedMenus = [
  { id: 1, name: "Chicken Biryani", price: 250 },
  { id: 2, name: "Paneer Butter Masala", price: 200 },
  { id: 3, name: "Garlic Naan", price: 50 }
];

// Route to get the menu
app.get('/api/menu', (req, res) => {
  res.json(savedMenus);
});

// NEW ROUTE: AI Menu Scanner
app.post('/api/scan-menu', upload.single('menuImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    // Convert the uploaded image into the format Gemini expects
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    // Ask Gemini AI to extract items and prices (UPDATED TO 3.6-FLASH)
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        imagePart,
        "Analyze this menu image. Extract all food items and their prices. Return ONLY a valid JSON array of objects, where each object has a 'name' (string) and 'price' (number). Do not include markdown code blocks like ```json, just the raw array text."
      ]
    });

    // Clean up and parse the AI's response text into a real JavaScript array
    let rawText = response.text.trim();
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const extractedItems = JSON.parse(rawText);

    // Give each item a unique ID and add it to our menu list
    savedMenus = extractedItems.map((item, index) => ({
      id: Date.now() + index,
      name: item.name,
      price: Number(item.price)
    }));

    res.json({ success: true, menu: savedMenus });

  } catch (error) {
    console.error("AI Scan Error:", error);
    res.status(500).json({ error: 'Failed to process menu image with AI.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is purring at http://localhost:${PORT}`);
});