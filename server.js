const express = require('express');
// CORRECT: We import the getJson function directly.
const { getJson } = require('serpapi');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Use CORS middleware to allow requests from your frontend
app.use(cors());

// Middleware to parse large base64 image strings
app.use(express.json({ limit: '10mb' }));

// The main identification endpoint
app.post('/identify', async (req, res) => {
  const { image } = req.body; // Expects a base64 string

  if (!image) {
    return res.status(400).json({ error: 'No image data provided.' });
  }

  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.error('Server Error: SERPAPI_API_KEY is not defined.');
    return res.status(500).json({ error: 'Server configuration error: Missing API Key.' });
  }

  try {
    console.log('Received image, sending to SerpAPI...');
    
    // CORRECT: We call the getJson function with all parameters in an object.
    // We are NOT using "new SerpAPI()".
    const response = await getJson({
      engine: 'google_lens',
      url: image,
      api_key: apiKey,
    });

    console.log('SerpAPI response successful.');
    res.json(response);

  } catch (error) {
    // This block will catch any errors from the SerpAPI call
    console.error('Error calling SerpAPI:', error);

    // This sends a clean JSON error back to the browser
    res.status(500).json({
      error: 'Failed to get data from SerpAPI.',
      details: error.message || 'An unknown error occurred.',
    });
  }
});

// Add this new route to handle confirmations
app.post('/send-to-automation', async (req, res) => {
  try {
    const { title, image, link, source } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Watch title is required.' });
    }
    
    console.log('Watch confirmed by user:', {
      title,
      image: image ? 'Image URL provided' : 'No image',
      link: link || 'No link',
      source: source || 'Unknown source'
    });
    
    // This is where you would add code to send data to your automation
    // For now, we'll just return success
    
    res.json({ success: true, message: 'Watch data received and processed.' });
  } catch (error) {
    console.error('Error in send-to-automation:', error);
    res.status(500).json({
      error: 'Failed to process watch data.',
      details: error.message || 'An unknown error occurred.'
    });
  }
});

// A simple health check endpoint
app.get('/', (req, res) => {
  res.send('Watch Scanner server is running.');
});

app.listen(PORT, () => {
  console.log(`Server started successfully on port ${PORT}`);
});
