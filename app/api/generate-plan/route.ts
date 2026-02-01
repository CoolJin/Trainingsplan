import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize inside handler to avoid top-level crashes if ENV is missing/empty momentarily
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || ""); 

export async function POST(req: Request) {
  try {
    console.log("--- API Generate Plan Called ---");
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("API Key present:", !!apiKey);

    if (!apiKey) {
      console.error("API Key is MISSING in process.env");
      return NextResponse.json({ success: false, error: "Server Configuration Error: API Key Missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { age, gender, weight, height, goal, units } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Du bist ein professioneller Fitness-Coach. Erstelle einen personalisierten 7-Tage-Trainingsplan (Montag bis Sonntag) basierend auf folgenden Daten:
      - Alter: ${age}
      - Geschlecht: ${gender}
      - Gewicht: ${weight} ${units === 'imperial' ? 'lbs' : 'kg'}
      - Größe: ${height} ${units === 'imperial' ? 'ft' : 'cm'}
      - Ziel: ${goal} (z.B. Build Muscle -> Muskelaufbau, Lose Weight -> Abnehmen)

      Anweisungen:
      1. Der Plan muss für 7 Tage sein (Montag - Sonntag).
      2. Berücksichtige Ruhetage (Active Recovery) wo sinnvoll.
      3. Ausgabe MUSS ein valides JSON-Objekt sein. KEIN Markdown, KEIN Text davor/danach.
      
      JSON Struktur:
      {
        "days": [
          {
            "day_name": "Montag",
            "title": "Kurzer Titel (z.B. Push Day)",
            "desc": "Kurze Beschreibung des Fokus (max 2 Sätze).",
            "exercises": [
              { "name": "Übungsname", "sets": "3", "reps": "8-12", "notes": "Optionaler Hinweis" }
            ]
          }
        ]
      }
      
      Antworte nur mit dem JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("AI Response received (length):", text.length);

    // Clean up potential markdown code blocks if Gemini adds them
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const json = JSON.parse(cleanedText);
      return NextResponse.json({ success: true, plan: json });
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Text:", text);
      return NextResponse.json({ success: false, error: "Failed to parse AI response" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error: " + error.message }, { status: 500 });
  }
}
