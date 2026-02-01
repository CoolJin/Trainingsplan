const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Just to get client, listing is usually separate?
        // Actually ListModels is on the genAI instance or specific manager?
        // The SDK documentation says request 'models/...' via Rest, or...
        // Only newer SDKs support listModels via client?

        // Let's try to just Instantiate a model and generate simple text.
        // If list is not easy, we brute force common names.

        const modelsToTry = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-1.0-pro",
            "gemini-pro"
        ];

        console.log("Testing Models with Key: " + apiKey.substring(0, 10) + "...");

        for (const m of modelsToTry) {
            process.stdout.write(`Testing ${m}... `);
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("Hello");
                const response = await result.response;
                console.log("SUCCESS! ✅");
                return; // Found one!
            } catch (e) {
                console.log("FAILED ❌ (" + e.message?.split(':')[0] + ")");
            }
        }

    } catch (e) {
        console.error(e);
    }
}

listModels();
