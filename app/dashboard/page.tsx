"use client";

import { useState, useEffect, Suspense } from "react";
import { DashboardDock } from "@/components/ui/dashboard-dock";
import { ButtonColorful } from "@/components/ui/button-colorful";
import { getUserProfile, saveWorkoutRoutine } from "@/lib/api";
import { Dumbbell, User } from "lucide-react";
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

    const searchParams = useSearchParams();
    const router = useRouter();
    const view = searchParams.get('view');

    const isReviewMode = view === 'review';

    useEffect(() => {
        async function loadProfile() {
            try {
                const profile = await getUserProfile();
                setUserPlan(profile);
            } catch (e) {
                console.error("Failed to load profile", e);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    const hasTrainingPlan = userPlan && userPlan.workout_routine;

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
            // Use gemini-1.5-flash which is free, faster, and smarter usually
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
              Du bist ein professioneller Fitness-Coach. Erstelle einen personalisierten 7-Tage-Trainingsplan (Montag bis Sonntag) basierend auf folgenden Daten:
              - Alter: ${userPlan?.age || 25}
              - Geschlecht: ${userPlan?.gender || 'male'}
              - Gewicht: ${userPlan?.weight || 70} ${userPlan?.units === 'imperial' ? 'lbs' : 'kg'}
              - Größe: ${userPlan?.height || 180} ${userPlan?.units === 'imperial' ? 'ft' : 'cm'}
              - Ziel: ${userPlan?.goal || 'General Fitness'}

              Anweisungen:
              1. Der Plan muss für 7 Tage sein (Montag - Sonntag).
              2. Ausgabe MUSS ein valides JSON-Objekt sein.
              JSON Struktur:
              {
                "days": [
                  {
                    "day_name": "Montag",
                    "title": "Kurzer Titel",
                    "desc": "Kurze Beschreibung",
                    "exercises": [
                      { "name": "Übungsname", "sets": "3", "reps": "8-12", "notes": "Hinweis" }
                    ]
                  }
                ]
              }
              Antworte nur mit dem JSON. Keine Code-Blöcke.
            `;

            console.log("Sendung an Gemini...");
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log("Gemini Antwort erhalten.");
            const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const plan = JSON.parse(cleanedText);

            if (plan && plan.days) {
                setGeneratedPlan(plan);
            } else {
                alert("Fehler: AI hat kein gültiges JSON geliefert.");
            }

        } catch (e: any) {
            console.error("Generierungsfehler:", e);
            alert("Fehler Detail: " + (e.message || JSON.stringify(e)));
        } finally {
            setIsGenerating(false);
        }
    };

    // Prepare Cards for Showcase if plan exists
    const showcaseCards = generatedPlan?.days?.map((day: any, idx: number) => ({
        title: day.title || day.day_name,
        desc: day.desc || `Training für ${day.day_name}`,
        dayIndex: idx,
        gradientFrom: WEEK_GRADIENTS[idx % 7].from,
        gradientTo: WEEK_GRADIENTS[idx % 7].to
    })) || [];

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
                            <div className="w-full p-8 border border-zinc-800 rounded-3xl bg-zinc-900/50 backdrop-blur-sm">
                                <p className="text-green-400 font-medium mb-2">Plan Aktiv</p>
                                <p className="text-zinc-300">Dein personalisierter Plan wird bald hier angezeigt.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6 p-8 border border-zinc-900 rounded-3xl bg-zinc-950/50 w-full max-w-2xl">
                                <div className="bg-zinc-900 p-4 rounded-full">
                                    <Dumbbell className="w-8 h-8 text-white" />
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
                                <div className="text-center space-y-2">
                                    <h2 className="text-3xl font-bold">Überprüfe deine Daten</h2>
                                    <p className="text-zinc-400 max-w-lg mx-auto">
                                        Diese Daten werden für die Generierung des Trainingsplans verwendet.
                                    </p>
                                </div>

                                <div className="flex flex-wrap justify-center gap-6 w-full">
                                    {/* Card 1: Age */}
                                    <GlareCard className="flex flex-col items-center justify-center p-6 text-center">
                                        <h3 className="text-lg font-bold mb-1 text-zinc-400">Alter</h3>
                                        <p className="text-4xl font-bold text-white">
                                            {userPlan?.age || '-'}
                                        </p>
                                        <span className="text-sm text-zinc-500">Jahre</span>
                                    </GlareCard>

                                    {/* Card 2: Weight */}
                                    <GlareCard className="flex flex-col items-center justify-center p-6 text-center">
                                        <h3 className="text-lg font-bold mb-1 text-zinc-400">Gewicht</h3>
                                        <p className="text-4xl font-bold text-white">
                                            {userPlan?.weight || '-'}
                                        </p>
                                        <span className="text-sm text-zinc-500">{userPlan?.units === 'imperial' ? 'lbs' : 'kg'}</span>
                                    </GlareCard>

                                    {/* Card 3: Height */}
                                    <GlareCard className="flex flex-col items-center justify-center p-6 text-center">
                                        <h3 className="text-lg font-bold mb-1 text-zinc-400">Größe</h3>
                                        <p className="text-4xl font-bold text-white">
                                            {userPlan?.height || '-'}
                                        </p>
                                        <span className="text-sm text-zinc-500">{userPlan?.units === 'imperial' ? 'ft' : 'cm'}</span>
                                    </GlareCard>

                                    {/* Card 4: Gender */}
                                    <GlareCard className="flex flex-col items-center justify-center p-6 text-center">
                                        <h3 className="text-lg font-bold mb-1 text-zinc-400">Geschlecht</h3>
                                        <div className="text-4xl font-bold text-white mb-2">
                                            {userPlan?.gender === 'male' ? 'Männlich' : userPlan?.gender === 'female' ? 'Weiblich' : userPlan?.gender || '-'}
                                        </div>
                                        <User className="w-6 h-6 text-zinc-500" />
                                    </GlareCard>

                                    {/* Card 5: Goal */}
                                    <GlareCard className="flex flex-col items-center justify-center p-6 text-center">
                                        <h3 className="text-lg font-bold mb-1 text-zinc-400">Ziel</h3>
                                        <div className="text-2xl font-bold text-white mb-2 capitalize break-words w-full">
                                            {userPlan?.goal?.replace('_', ' ') || '-'}
                                        </div>
                                        <Dumbbell className="w-6 h-6 text-zinc-500" />
                                    </GlareCard>
                                </div>

                                <div className="flex gap-4 mt-8 flex-wrap justify-center">
                                    <ButtonColorful
                                        label="Daten Bearbeiten"
                                        className="h-12 px-8 bg-zinc-800 hover:bg-zinc-700"
                                        onClick={() => router.push('/onboarding?edit=true')}
                                        disabled={isGenerating}
                                    />
                                    <ButtonColorful
                                        label={isGenerating ? "Generiere Plan..." : "Jetzt Generieren"}
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
                                        label="Plan Speichern & Starten"
                                        className="h-12 px-8"
                                        onClick={async () => {
                                            try {
                                                const res = await saveWorkoutRoutine(generatedPlan);
                                                if (res.success) {
                                                    // Use window.location to force reload/redirect properly
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
