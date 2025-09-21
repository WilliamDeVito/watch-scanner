// =================================================================
//  FINAL 'server.js' -- COPY AND PASTE THIS ENTIRE CODE
// =================================================================

const express = require('express');
const { SerpAPI } = require('google-search-results-nodejs');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

// --- MIDDLEWARE ---
// Use CORS to allow requests from any origin. This is important for web apps.
app.use(cors());
// Use Express's built-in middleware to serve static files like index.html, css, etc.
// This tells Express that your main directory contains the files for the website.
app.use(express.static(path.join(__dirname)));

// Set up Multer for handling image uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// --- ROUTES ---

// **ROUTE 1: Serve the main webpage**
// When a user goes to "your-site.com/", send them the index.html file.
// This fixes the "Cannot GET /" error.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// **ROUTE 2: Handle the image identification**
// This is the API endpoint that the website's JavaScript will call.
// It listens for POST requests at "your-site.com/identify"
app.post('/identify', upload.single('image'), async (req, res) => {
  console.log('LOG: Received a request at /identify');

  // Check for the API key
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.error('ERROR: SERPAPI_API_KEY is not set on the server.');
    return res.status(500).json({ error: 'Server configuration error: Missing API Key.' });
  }

  // Check that a file was actually sent
  if (!req.file) {
    console.warn('WARN: Request to /identify made without an image file.');
    return res.status(400).json({ error: 'No image file was uploaded.' });
  }

  console.log('LOG: Image file received. Preparing to call SerpAPI.');
  const search = new SerpAPI(apiKey);

  try {
    const params = {
      engine: 'google_lens',
      url: `data:image/jpeg;base64,${req.file.buffer.toString('base64')}`,
    };

    // Make the call to the external API
    const searchResults = await search.json(params);

    console.log('LOG: Successfully received response from SerpAPI.');
    res.json(searchResults); // Send the full results back to the frontend

  } catch (error) {
    console.error('ERROR: An error occurred during the SerpAPI call:', error);
    res.status(500).json({ error: 'Failed to perform the image search.', details: error.message });
  }
});

// --- START THE SERVER ---
app.listen(port, () => {
  console.log(`Server started successfully. Listening on port ${port}.`);
  console.log(`Main page is served from: ${path.join(__dirname, 'index.html')}`);
  console.log('API endpoint is listening at: POST /identify');
});
