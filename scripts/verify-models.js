const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function verifyModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ No API KEY found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    console.log("Checking models with API Key: " + apiKey.substring(0, 5) + "...");

    const candidates = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.0-pro",
        "gemini-pro",
        "gemini-flash-latest"
    ];

    console.log("\n--- STARTING VERIFICATION ---");

    for (const modelName of candidates) {
        process.stdout.write(`Testing '${modelName}'... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            const response = await result.response;
            console.log(`✅ SUCCESS`);
        } catch (e) {
            if (e.message.includes("404")) {
                console.log(`❌ 404 Not Found`);
            } else if (e.message.includes("403")) {
                console.log(`⛔ 403 Forbidden`);
            } else {
                console.log(`⚠️ Error: ${e.message.split('\n')[0]}`);
            }
        }
    }
    console.log("--- END VERIFICATION ---\n");
}

verifyModels();
