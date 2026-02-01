const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    console.log("Testing Models with Key: " + apiKey.substring(0, 10) + "...");

    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.0-pro"
    ];

    for (const m of modelsToTry) {
        process.stdout.write(`Testing ${m}... `);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hello?");
            const response = await result.response;
            console.log("SUCCESS! ✅");
            return;
        } catch (e) {
            console.log("FAILED ❌");
            console.error("--- FULL ERROR START ---");
            console.error(JSON.stringify(e, null, 2)); // Print JSON structure
            console.error(e.message); // Print message
            console.error("--- FULL ERROR END ---");
        }
    }
}

listModels();
