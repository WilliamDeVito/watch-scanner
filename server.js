// =================================================================
//  UPDATED 'server.js' WITH RESULT FILTERING
// =================================================================

const express = require('express');
const { SerpAPI } = require('google-search-results-nodejs');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.static(path.join(__dirname)));
const upload = multer({ storage: multer.memoryStorage() });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/identify', upload.single('image'), async (req, res) => {
  console.log('LOG: Received a request at /identify');

  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.error('ERROR: SERPAPI_API_KEY is not set on the server.');
    return res.status(500).json({ error: 'Server configuration error: Missing API Key.' });
  }

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

    const searchResults = await search.json(params);
    console.log('LOG: Successfully received response from SerpAPI.');

    // --- NEW FILTERING LOGIC ---
    // Get the array of visual matches, or an empty array if it doesn't exist.
    const visualMatches = searchResults.visual_matches || [];

    // Map over the matches to create a clean, new array.
    // We'll take the top 5 results.
    const formattedResults = visualMatches.slice(0, 5).map(match => ({
      title: match.title,
      link: match.link,
      thumbnail: match.thumbnail,
      source: match.source,
    }));

    console.log(`LOG: Filtered down to ${formattedResults.length} results.`);
    
    // Send our new, clean array back to the frontend.
    res.json({ results: formattedResults });
    // --- END OF NEW LOGIC ---

  } catch (error) {
    console.error('ERROR: An error occurred during the SerpAPI call:', error);
    res.status(500).json({ error: 'Failed to perform the image search.', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server started successfully. Listening on port ${port}.`);
});
