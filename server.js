const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Your SerpAPI key - you'll need to replace this with your actual key
const SERPAPI_KEY = '1d6816078f96f61fd7d5d3847974dbcf1d5aafc074eaddf74ad10654a8179850';

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Basic route
app.get('/', (req, res) => {
  res.send('Watch Scanner server is running.');
});

// Watch identification endpoint
app.post('/identify', async (req, res) => {
  try {
    // Get image data from request
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    // Extract base64 data (remove the prefix if it exists)
    let base64Image = image;
    if (image.includes(',')) {
      base64Image = image.split(',')[1];
    }
    
    console.log('Received image for identification');
    
    // Make request to SerpAPI
    const response = await axios.post('https://serpapi.com/search', {
      engine: 'google_lens',
      api_key: 1d6816078f96f61fd7d5d3847974dbcf1d5aafc074eaddf74ad10654a8179850,
      image_data: base64Image
    });
    
    console.log('Received response from SerpAPI');
    
    // Return the results
    return res.json({
      success: true,
      visual_matches: response.data.visual_matches || [],
      knowledge_graph: response.data.knowledge_graph || null
    });
    
  } catch (error) {
    console.error('Error identifying watch:', error.message);
    return res.status(500).json({ 
      error: 'Failed to identify watch',
      details: error.message
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
