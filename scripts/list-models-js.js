const https = require('https');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("Fetching models from:", url.replace(apiKey, "HIDDEN_KEY"));

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("--- AVAILABLE MODELS ---");
                json.models.forEach(m => console.log(m.name));
                console.log("------------------------");
            } else {
                console.error("Error/No Models:", json);
            }
        } catch (e) {
            console.error("Parse Error:", e);
            console.log("Raw:", data);
        }
    });
}).on('error', (e) => {
    console.error("Network Error:", e);
});
