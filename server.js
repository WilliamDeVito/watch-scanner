// server.js
const express = require('express');
const multer = require('multer');
const { getJson } = require('serpapi');
const path = require('path');

const app = express();
// Render sets a PORT environment variable. We should use it if it exists.
const port = process.env.PORT || 3000;

// Use multer to handle file uploads. We'll store the image in memory.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve the frontend HTML file from the root URL
app.get('/', (req, res) => {
    // The path.join is important for compatibility across operating systems.
    res.sendFile(path.join(__dirname, 'index.html'));
});

// The API endpoint for identifying the watch. It expects a file named 'watchImage'.
app.post('/identify-watch', upload.single('watchImage'), async (req, res) => {
    console.log("Received image for identification...");

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    // Get your API key from the environment variables you will set in Render.
    const SERPAPI_KEY = process.env.SERPAPI_KEY; 
    if (!SERPAPI_KEY) {
        console.error("SERPAPI_KEY not found in environment variables.");
        return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }

    try {
        // The image is in req.file.buffer. We need to encode it to a Base64 string for the API call.
        const imageBase64 = req.file.buffer.toString('base64');

        console.log("Sending request to SerpApi...");
        // Call the SerpApi Google Lens engine with the image data.
        const response = await getJson({
            engine: "google_lens",
            url: `data:image/jpeg;base64,${imageBase64}`,
            api_key: SERPAPI_KEY,
        });
        console.log("Received response from SerpApi.");

        // The most likely matches are in the "visual_matches" array.
        const visualMatches = response.visual_matches;

        if (visualMatches && visualMatches.length > 0) {
            // The first result is usually the best one.
            const topMatch = visualMatches[0];
            console.log(`Top match found: ${topMatch.title}`);
            
            // Send a success response back to the frontend with the watch name.
            res.json({
                success: true,
                match: {
                    name: topMatch.title,
                }
            });
        } else {
            console.log("No visual matches found.");
            res.json({ success: false, message: 'Could not identify the watch.' });
        }

    } catch (error) {
        console.error('Error calling SerpApi:', error);
        res.status(500).json({ success: false, message: 'An error occurred during identification.' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});