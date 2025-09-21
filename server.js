// =================================================================
//  COPY AND PASTE THIS ENTIRE CODE INTO YOUR 'server.js' FILE
// =================================================================

const express = require('express');
const { SerpAPI } = require('google-search-results-nodejs');
const multer = require('multer');
const cors = require('cors'); // <-- ADDED: Imports the CORS library

const app = express();
const port = process.env.PORT || 10000; // Use Render's port or 10000 for local

// --- MIDDLEWARE SETUP ---

// ADDED: This is the crucial line that fixes the CORS error.
// It allows your website (from Genspark) to make requests to this server.
app.use(cors());

// This sets up a temporary storage for the image file uploaded from the website
const upload = multer({ storage: multer.memoryStorage() });

// --- API ROUTE ---

// This is the specific endpoint your website will send the image to.
// It only accepts POST requests with an 'image' file.
app.post('/identify', upload.single('image'), async (req, res) => {
  console.log('Received an image for identification.');

  // Check if the API key is available in the environment variables
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.error('FATAL: SERPAPI_API_KEY is not set in the environment.');
    // Send a clear error message back to the website
    return res.status(500).json({ error: 'Server is missing API key configuration.' });
  }

  // Check if an image file was actually uploaded
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

    // Filter and format the results to only send what we need
    const visualMatches = searchResults.visual_matches || [];
    const formattedResults = visualMatches.slice(0, 5).map(match => ({
      title: match.title,
      thumbnail: match.thumbnail,
      link: match.link,
    }));

    console.log(`Found ${formattedResults.length} potential matches.`);
    res.json({ results: formattedResults });

  } catch (error) {
    console.error('Error during SerpApi search:', error);
    res.status(500).json({ error: 'Failed to perform image search.' });
  }
});

// --- START THE SERVER ---

app.listen(port, () => {
  console.log(`Server is running and listening on port ${port}`);
});
