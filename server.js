// =================================================================
//  UPDATED 'server.js' FILE - COPY AND PASTE THIS ENTIRE CODE
// =================================================================

const express = require('express');
const { SerpAPI } = require('google-search-results-nodejs');
const multer = require('multer');
const cors = require('cors');
const path = require('path'); // <-- ADDED: Needed to serve files

const app = express();
const port = process.env.PORT || 10000;

// --- MIDDLEWARE SETUP ---
app.use(cors());

// This sets up a temporary storage for the image file uploaded from the website
const upload = multer({ storage: multer.memoryStorage() });

// --- NEW CODE: SERVE THE WEBSITE ---
// This tells the server to send the 'index.html' file when a user visits the main URL.
// This fixes the "Cannot GET /" error.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
// --- END OF NEW CODE ---


// --- API ROUTE ---
// This is the specific endpoint your website will send the image to.
// It only accepts POST requests with an 'image' file.
app.post('/identify', upload.single('image'), async (req, res) => {
  console.log('Received an image for identification.');

  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.error('FATAL: SERPAPI_API_KEY is not set in the environment.');
    return res.status(500).json({ error: 'Server is missing API key configuration.' });
  }

  if (!req.file) {
    console.warn('Request received without an image file.');
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  const search = new SerpAPI(apiKey);

  try {
    console.log('Sending image to Google Lens for reverse image search...');
    const params = {
      engine: 'google_lens',
      url: `data:image/jpeg;base64,${req.file.buffer.toString('base64')}`,
    };

    const searchResults = await search.json(params);
    
    // The original server code had a filter here, but let's send the full results first to see what we get.
    // You can add the filter back later if you want.
    console.log(`Found potential matches.`);
    res.json(searchResults);

  } catch (error) {
    console.error('Error during SerpApi search:', error);
    res.status(500).json({ error: 'Failed to perform image search.' });
  }
});

// --- START THE SERVER ---
app.listen(port, () => {
  console.log(`Server is running and listening on port ${port}`);
});
