"use client";

import { useState, useEffect, Suspense } from "react";
import { DashboardDock } from "@/components/ui/dashboard-dock";
import { ButtonColorful } from "@/components/ui/button-colorful";
import { getUserProfile, saveWorkoutRoutine, deleteUserPlan } from "@/lib/api";
import { Dumbbell, User, Calendar, Clock, Sparkles, Trash2, CheckCircle } from "lucide-react";
import { GlareCard } from "@/components/ui/glare-card";
import { useSearchParams, useRouter } from "next/navigation";
import { GradientCardShowcase } from "@/components/ui/gradient-card-showcase";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Gradient colors cycle for the week
const WEEK_GRADIENTS = [
    { from: '#ffbc00', to: '#ff0058' }, // Mon
    { from: '#03a9f4', to: '#ff0058' }, // Tue
    { from: '#4dff03', to: '#00d0ff' }, // Wed
    { from: '#f59e0b', to: '#ef4444' }, // Thu
    { from: '#8b5cf6', to: '#ec4899' }, // Fri
    { from: '#06b6d4', to: '#3b82f6' }, // Sat
    { from: '#10b981', to: '#2563eb' }  // Sun
];

function DashboardContent() {
    const [activeTab, setActiveTab] = useState("home");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [userPlan, setUserPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [generatedPlan, setGeneratedPlan] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // New Configuration State
    const [trainingDays, setTrainingDays] = useState(3);
    const [sessionDuration, setSessionDuration] = useState("45-60 Min");
    const [extraWishes, setExtraWishes] = useState("");

    const searchParams = useSearchParams();
    const router = useRouter();
    const view = searchParams.get('view');

    const isReviewMode = view === 'review';

    useEffect(() => {
        async function loadProfile() {
            try {
                const profile = await getUserProfile();
                setUserPlan(profile);
                // Load existing workout routine if available
                if (profile?.workout_routine) {
                    setGeneratedPlan(profile.workout_routine);
                }
            } catch (e) {
                console.error("Failed to load profile", e);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    const hasTrainingPlan = !!generatedPlan;

    // CLIENT-SIDE GENERATION LOGIC
    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            console.log("Using Client-Side Generation. API Key check:", !!apiKey);

            if (!apiKey) {
                alert("API Key fehlt! Bitte NEXT_PUBLIC_GEMINI_API_KEY in .env.local oder GitHub Secrets eintragen.");
                setIsGenerating(false);
                return;
            }

            const genAI = new GoogleGenerativeAI(apiKey);

            // AUTOMATIC MODEL SELECTION
            // Based on verification script: 
            // - 'gemini-flash-latest' WORKS (Success)
            // - 'gemini-2.0-flash' Exists (But hits Quota)
            const modelsToTry = [
                "gemini-flash-latest",
                "gemini-2.0-flash"
            ];

            let model = null;
            let result = null;
            let lastError = null;

            const prompt = `
              Du bist ein professioneller Fitness-Coach. Erstelle einen personalisierten 7-Tage-Trainingsplan.

              Daten:
              - Alter: ${userPlan?.age || 25}
              - Geschlecht: ${userPlan?.gender || 'male'}
              - Gewicht: ${userPlan?.weight || 70}
              - Ziel: ${userPlan?.goal || 'General Fitness'}
              
              Präferenzen:
              - Trainingstage pro Woche: ${trainingDays}
              - Dauer pro Einheit: ${sessionDuration}
              - Extra Wünsche/Einschränkungen: ${extraWishes || "Keine"}

              Anweisung:
              Erstelle ein Array mit genau 7 Objekten (für Montag bis Sonntag).
              Verteile die ${trainingDays} Trainingstage sinnvoll auf die Woche. 
              Die restlichen ${7 - trainingDays} Tage sollen "Active Recovery" oder "Rest Day" sein.

              Jedes Objekt soll enthalten:
              - "title": Der Fokus des Tages (z.B. "Push A", "Legs", "Active Recovery").
              - "desc": NUR die Muskelgruppen oder Aktivität, extrem kurz (max 5 Wörter). 
                 WICHTIG: Wiederhole NICHT den Wochentag im Text! (Also NICHT "Montag: Brust", sondern nur "Brust").
              - "exercises": Array der Übungen (bitte an die Dauer von ${sessionDuration} anpassen).
              
              JSON Struktur (Array):
              [
                  {
                    "title": "Push Day",
                    "desc": "Brust, Schultern, Trizeps",
                    "exercises": [ { "name": "Bankdrücken", "sets": "3", "reps": "8-12", "notes": "..." } ]
                  }
              ]
              Antworte NUR mit dem JSON Array.
            `;

            console.log("Starte Auto-Modell-Selektion...");

            for (const modelName of modelsToTry) {
                try {
                    console.log(`Versuche Modell: ${modelName}...`);
                    const currentModel = genAI.getGenerativeModel({ model: modelName });
                    result = await currentModel.generateContent(prompt);
                    // If we get here, it worked!
                    console.log(`ERFOLG mit Modell: ${modelName}`);
                    model = currentModel;
                    break;
                } catch (e: any) {
                    console.warn(`Fehler mit Modell ${modelName}:`, e.message);
                    lastError = e;
                    // Loop continues...
                }
            }

            if (!result) {
                console.error("Alle Modelle fehlgeschlagen.");
                if (lastError?.message?.includes("429")) {
                    throw new Error("Quota/Limit erreicht (429). Bitte warten oder API Plan prüfen.");
                }
                throw lastError || new Error("Kein funktionierendes Gemini-Modell gefunden.");
            }

            const response = await result.response;
            const text = response.text();

            console.log("Gemini Antwort erhalten.");
            const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

            try {
                const daysArray = JSON.parse(cleanedText);

                if (Array.isArray(daysArray) && daysArray.length > 0) {
                    // Hydrate static day names efficiently
                    const dayNames = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const hydratedDays = daysArray.map((day: any, index: number) => ({
                        ...day,
                        day_name: dayNames[index % 7]
                    }));

                    setGeneratedPlan({ days: hydratedDays });

                } else if (daysArray.days) {
                    // Fallback if AI returned object instead of array
                    const dayNames = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const hydratedDays = daysArray.days.map((day: any, index: number) => ({
                        ...day,
                        day_name: dayNames[index % 7]
                    }));
                    setGeneratedPlan({ days: hydratedDays });
                } else {
                    alert("Fehler: AI hat kein gültiges Format geliefert.");
                    console.warn("Invalid Format:", daysArray);
                }
            } catch (jsonError) {
                console.error("JSON Parse Error:", jsonError);
                alert("Fehler: AI Antwort war kein gültiges JSON.");
            }

        } catch (e: any) {
            console.error("Generierungsfehler (Final):", e);
            let errorMsg = e.message || JSON.stringify(e);
            if (errorMsg.includes("404")) {
                errorMsg = "Kein Modell gefunden (404). API Key oder Region prüfen.";
            } else if (errorMsg.includes("403")) {
                errorMsg = "Zugriff verweigert (403). API Key ungültig.";
            }
            alert("Fehler bei Generierung: " + errorMsg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeletePlan = async () => {
        if (confirm("Möchtest du deinen Trainingsplan wirklich löschen?")) {
            await deleteUserPlan();
            setGeneratedPlan(null);
            setUserPlan({ ...userPlan, workout_routine: null });
            // Redirect to dashboard home to avoid confusion
            window.location.href = '/dashboard';
        }
    };


    // Prepare Cards for Showcase if plan exists
    const showcaseCards = generatedPlan?.days?.map((day: any, idx: number) => ({
        // Fix: Title is ALWAYS the day name (Montag..Sonntag)
        title: day.day_name,
        // Fix: Description combines the focus topic + brief muscle summary
        desc: `${day.title || ''} \n ${day.desc || ''}`,
        dayIndex: idx,
        gradientFrom: WEEK_GRADIENTS[idx % 7].from,
        gradientTo: WEEK_GRADIENTS[idx % 7].to
    })) || [];

    const DURATION_OPTIONS = [
        "30-45 Min",
        "45-60 Min",
        "60-90 Min",
        "90-120 Min",
        "120+ Min"
    ];

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-black to-black -z-10" />

            <main className="container mx-auto px-4 pt-20 pb-32 flex flex-col items-center justify-center min-h-screen transition-all duration-500 max-w-7xl">

                {/* HOME TAB */}
                {!isReviewMode && activeTab === "home" && (
                    <div className="animate-in fade-in zoom-in duration-500 text-center space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-500">
                            Hallo User
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-lg mx-auto">
                            Willkommen zurück zu deinem Training.
                        </p>
                    </div>
                )}

                {/* TRAINING TAB (Standard) */}
                {!isReviewMode && activeTab === "training" && (
                    <div className="animate-in fade-in slide-in-from-right-10 duration-500 text-center flex flex-col items-center gap-6 w-full max-w-4xl">
                        <div className="flex items-center gap-2 text-zinc-400 mb-2">
                            <Dumbbell className="w-5 h-5" />
                            <span>Dein Trainings-Fokus</span>
                        </div>

                        <h1 className="text-4xl font-bold mb-8">Dein Trainingsplan</h1>

                        {loading ? (
                            <p className="text-zinc-500">Laden...</p>
                        ) : hasTrainingPlan ? (
                            // ACTIVE PLAN VIEW
                            <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-5 duration-700">
                                <div className="flex items-center gap-2 mb-8 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-green-400 text-sm font-medium">Aktiver Plan</span>
                                </div>

                                <GradientCardShowcase days={showcaseCards} />

                                <div className="mt-12">
                                    <button
                                        onClick={handleDeletePlan}
                                        className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors text-sm px-4 py-2 rounded-lg hover:bg-red-500/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Plan Löschen & Neu Generieren
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // NO PLAN - GENERATE CTA
                            <div className="flex flex-col items-center gap-6 p-8 border border-zinc-900 rounded-3xl bg-zinc-950/50 w-full max-w-2xl">
                                <div className="bg-zinc-900 p-4 rounded-full">
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                                <div className="space-y-2 max-w-md">
                                    <h3 className="text-xl font-semibold text-white">Noch kein Plan vorhanden?</h3>
                                    <p className="text-zinc-400">
                                        Lass dir von unserer AI einen perfekten Plan erstellen, der genau auf dich zugeschnitten ist.
                                    </p>
                                </div>

                                <ButtonColorful
                                    label="Trainingsplan Generieren"
                                    className="h-14 px-8 text-lg w-full md:w-auto min-w-[200px]"
                                    onClick={() => router.push('/dashboard?view=review')}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* REVIEW MODE (Review OR Showcase) */}
                {isReviewMode && (
                    <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center gap-8 w-full max-w-6xl">

                        {!generatedPlan ? (
                            <>
                                <div className="text-center space-y-2 mb-4">
                                    <h2 className="text-3xl font-bold">Plan Konfigurieren</h2>
                                    <p className="text-zinc-400 max-w-lg mx-auto">
                                        Passe deinen Plan an deine Bedürfnisse an.
                                    </p>
                                </div>

                                {/* Configuration Panel */}
                                <div className="w-full max-w-2xl grid gap-6 p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-sm">

                                    {/* Training Days */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 text-white font-medium">
                                                <Calendar className="w-4 h-4 text-pink-500" />
                                                Trainingstage pro Woche
                                            </label>
                                            <span className="text-2xl font-bold text-pink-500">{trainingDays}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="7"
                                            step="1"
                                            value={trainingDays}
                                            onChange={(e) => setTrainingDays(parseInt(e.target.value))}
                                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                        />
                                        <div className="flex justify-between text-xs text-zinc-500">
                                            <span>Light</span>
                                            <span>Moderate</span>
                                            <span>Intense</span>
                                        </div>
                                    </div>

                                    {/* Session Duration */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-white font-medium">
                                            <Clock className="w-4 h-4 text-blue-500" />
                                            Dauer pro Einheit
                                        </label>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                            {DURATION_OPTIONS.map((dur) => (
                                                <button
                                                    key={dur}
                                                    onClick={() => setSessionDuration(dur)}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${sessionDuration === dur
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                        }`}
                                                >
                                                    {dur}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Extra Wishes */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-white font-medium">
                                            <Sparkles className="w-4 h-4 text-amber-500" />
                                            Extra Wünsche / Einschränkungen
                                        </label>
                                        <textarea
                                            value={extraWishes}
                                            onChange={(e) => setExtraWishes(e.target.value.slice(0, 100))}
                                            placeholder="z.B. Knieschmerzen, Fokus auf Po, kein Cardio..."
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none h-24"
                                        />
                                        <div className="text-right text-xs text-zinc-500">
                                            {extraWishes.length}/100
                                        </div>
                                    </div>

                                </div>

                                <div className="flex gap-4 mt-4 flex-wrap justify-center">
                                    <ButtonColorful
                                        label="Abbrechen"
                                        className="h-12 px-8 bg-zinc-800 hover:bg-zinc-700"
                                        onClick={() => router.push('/dashboard')}
                                        disabled={isGenerating}
                                    />
                                    <ButtonColorful
                                        label={isGenerating ? "Generiere Plan..." : "Plan Generieren"}
                                        className="h-12 px-8"
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                    />
                                </div>
                            </>
                        ) : (
                            // SHOW GENERATED PLAN
                            <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-5 duration-700">
                                <h2 className="text-3xl font-bold mb-2">Dein Trainingsplan</h2>
                                <p className="text-zinc-400 max-w-lg text-center mb-8">
                                    Basierend auf deiner Analyse. Wähle einen Tag für Details.
                                </p>

                                <GradientCardShowcase days={showcaseCards} />

                                <div className="mt-8 flex gap-4">
                                    <ButtonColorful
                                        label="Zurück zur Konfiguration"
                                        className="h-12 px-8 bg-zinc-800 hover:bg-zinc-700"
                                        onClick={() => setGeneratedPlan(null)}
                                    />
                                    <ButtonColorful
                                        label="Plan Speichern & Starten"
                                        className="h-12 px-8"
                                        onClick={async () => {
                                            try {
                                                const res = await saveWorkoutRoutine(generatedPlan);
                                                if (res.success) {
                                                    // Force redirect to current Plan View
                                                    window.location.href = '/dashboard?view=training';
                                                } else {
                                                    alert("Fehler beim Speichern des Plans.");
                                                }
                                            } catch (e) {
                                                alert("Fehler beim Speichern.");
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </main>

            {!isReviewMode && <DashboardDock activeTab={activeTab} onTabChange={setActiveTab} />}
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardContent />
        </Suspense>
    )
}
