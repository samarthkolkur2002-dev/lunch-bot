const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Initialize the Gemini AI and Supabase Database
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ROUTE: Get a list of all saved restaurants
app.get('/api/restaurants', async (req, res) => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error("Database fetch error:", error);
    return res.status(500).json({ error: 'Failed to fetch restaurants.' });
  }
  res.json(data);
});

// ROUTE: Get menu items for a specific restaurant
app.get('/api/menu', async (req, res) => {
  const { restaurantId } = req.query;
  
  let query = supabase.from('menu_items').select('*').order('created_at', { ascending: false });
  
  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Database fetch error:", error);
    return res.status(500).json({ error: 'Failed to fetch menu.' });
  }
  res.json(data);
});

// ROUTE: AI Menu Scanner 
app.post('/api/scan-menu', upload.single('menuImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const restaurantName = req.body.restaurantName;
    if (!restaurantName) {
      return res.status(400).json({ error: 'Restaurant name is required.' });
    }

    // 1. Find or create the restaurant in the database
    let restaurantId;
    const { data: existingRest, error: searchError } = await supabase
      .from('restaurants')
      .select('id')
      .ilike('name', restaurantName)
      .single();

    if (existingRest) {
      restaurantId = existingRest.id;
    } else {
      const { data: newRest, error: insertError } = await supabase
        .from('restaurants')
        .insert([{ name: restaurantName }])
        .select()
        .single();
        
      if (insertError) throw insertError;
      restaurantId = newRest.id;
    }

    // 2. Process image with Gemini
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        imagePart,
        "Analyze this menu image. Extract all food items and their prices. Return ONLY a valid JSON array of objects, where each object has a 'name' (string) and 'price' (number). Do not include markdown code blocks like ```json, just the raw array text."
      ]
    });

    let rawText = response.text.trim();
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const extractedItems = JSON.parse(rawText);

    // 3. Attach the specific restaurant ID
    const itemsToInsert = extractedItems.map(item => ({
      name: item.name,
      price: Number(item.price),
      restaurant_id: restaurantId
    }));

    // 4. Save to database
    const { data: savedItems, error: menuError } = await supabase
      .from('menu_items')
      .insert(itemsToInsert)
      .select();

    if (menuError) throw menuError;

    res.json({ success: true, menu: savedItems, restaurantId: restaurantId });

  } catch (error) {
    console.error("AI Scan Error:", error);
    res.status(500).json({ error: 'Failed to process menu image with AI.' });
  }
});

// NEW ROUTE: Submit a final order to the ledger
app.post('/api/orders', async (req, res) => {
  const { buyerName, restaurantId, cartItems, totalPrice } = req.body;

  if (!buyerName || !restaurantId || !cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: 'Missing order details.' });
  }

  const { data, error } = await supabase
    .from('orders')
    .insert([{
      buyer_name: buyerName,
      restaurant_id: restaurantId,
      cart_items: cartItems,
      total_price: totalPrice
    }])
    .select();

  if (error) {
    console.error("Order database error:", error);
    return res.status(500).json({ error: 'Failed to save order to database.' });
  }

  res.json({ success: true, order: data });
});

app.listen(PORT, () => {
  console.log(`Server is purring at http://localhost:${PORT}`);
});