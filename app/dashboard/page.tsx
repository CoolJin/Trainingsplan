"use client";

import { useState, useEffect, Suspense } from "react";
import { DashboardDock } from "@/components/ui/dashboard-dock";
import { ButtonColorful } from "@/components/ui/button-colorful";
import { getUserProfile, saveWorkoutRoutine, deleteUserPlan } from "@/lib/api";
import { Dumbbell, User, Calendar, Clock, Sparkles, CheckCircle } from "lucide-react";
import { NativeDelete } from "@/components/ui/delete-button";
import { GlareCard } from "@/components/ui/glare-card";
import { useSearchParams, useRouter } from "next/navigation";
import { GradientCardShowcase } from "@/components/ui/gradient-card-showcase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GradientSelector, GradientOption } from "@/components/ui/gradient-selector-card";
import { CardStack, CardStackItem } from "@/components/ui/card-stack";
import { QuantumPulseLoader } from "@/components/ui/quantum-pulse-loader";

const TRAINING_FREQUENCY_OPTIONS: GradientOption[] = [
    {
        id: "2",
        label: "2 Tage",
        value: "2",
        color: "#22c55e", // Green
        gradientFrom: "#22c55e",
        gradientTo: "#3b82f6",
    },
    {
        id: "3",
        label: "3 Tage",
        value: "3",
        color: "#3b82f6", // Blue
        gradientFrom: "#3b82f6",
        gradientTo: "#8b5cf6",
    },
    {
        id: "4",
        label: "4 Tage",
        value: "4",
        color: "#8b5cf6", // Purple
        gradientFrom: "#8b5cf6",
        gradientTo: "#a855f7",
    },
    {
        id: "5",
        label: "5 Tage",
        value: "5",
        color: "#a855f7", // Vivid Purple
        gradientFrom: "#a855f7",
        gradientTo: "#ec4899",
    },
    {
        id: "6",
        label: "6 Tage",
        value: "6",
        color: "#ec4899", // Pink
        gradientFrom: "#ec4899",
        gradientTo: "#f97316",
    },
    {
        id: "7",
        label: "7 Tage",
        value: "7",
        color: "#f97316", // Orange/Red
        gradientFrom: "#f97316",
        gradientTo: "#ef4444",
    }
];

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
    const [reviewStep, setReviewStep] = useState(1);

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

    // Sync Tab with View
    useEffect(() => {
        if (view === 'profile') setActiveTab('profile');
        if (view === 'training') setActiveTab('training');
        if (!view || view === 'home') setActiveTab('home');
    }, [view]);

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
        // Now handled by NativeDelete UI expansion, but still needed as the action callback
        await deleteUserPlan();
        setGeneratedPlan(null);
        setUserPlan({ ...userPlan, workout_routine: null });
        router.push('/dashboard');
        router.refresh();
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

                {/* PROFILE TAB */}
                {!isReviewMode && activeTab === "profile" && (
                    <div className="animate-in fade-in slide-in-from-left-10 duration-500 text-center flex flex-col items-center gap-6 w-full max-w-4xl">
                        <div className="flex items-center gap-2 text-zinc-400 mb-2">
                            <User className="w-5 h-5" />
                            <span>Mein Account</span>
                        </div>

                        <h1 className="text-4xl font-bold mb-8">Dein Profil</h1>

                        <div className="flex flex-wrap justify-center gap-6">
                            {/* Stats Card (Reused from Review Mode) */}
                            <GlareCard className="flex flex-col items-start justify-end py-8 px-6">
                                <div className="font-bold text-white text-lg">Dein Profil</div>
                                <div className="text-zinc-400 text-sm mb-4">Basisdaten</div>
                                <div className="space-y-2 w-full">
                                    <div className="flex justify-between border-b border-white/10 pb-1">
                                        <span>Alter</span>
                                        <span className="font-mono text-white">{userPlan?.age || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-1">
                                        <span>Gewicht</span>
                                        <span className="font-mono text-white">{userPlan?.weight || '-'} kg</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-1">
                                        <span>Größe</span>
                                        <span className="font-mono text-white">{userPlan?.height || '-'} cm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Geschlecht</span>
                                        <span className="font-mono text-white capitalize">{userPlan?.gender || '-'}</span>
                                    </div>
                                </div>
                            </GlareCard>

                            {/* Goal Card (Reused from Review Mode) */}
                            <GlareCard className="flex flex-col items-start justify-end py-8 px-6 bg-gradient-to-br from-indigo-900/50 to-purple-900/50">
                                <div className="font-bold text-white text-lg">Dein Ziel</div>
                                <div className="text-zinc-400 text-sm mb-4">Fokus</div>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/10 rounded-full">
                                        {userPlan?.goal === 'build_muscle' ? <Dumbbell className="w-6 h-6 text-blue-400" /> :
                                            userPlan?.goal === 'lose_weight' ? <Sparkles className="w-6 h-6 text-orange-400" /> :
                                                <User className="w-6 h-6 text-green-400" />}
                                    </div>
                                    <span className="text-xl font-bold capitalize">
                                        {userPlan?.goal?.replace('_', ' ') || 'General Fitness'}
                                    </span>
                                </div>
                            </GlareCard>
                        </div>

                        <div className="mt-8">
                            <ButtonColorful
                                label="Profil Bearbeiten"
                                className="h-12 px-8"
                                onClick={() => router.push('/onboarding?edit=true')}
                            />
                        </div>
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

                                {(() => {
                                    // Calculate 0-based index for Mon-Sun (Mon=0, Sun=6)
                                    // JS getDay(): Sun=0, Mon=1...
                                    const todayJs = new Date().getDay();
                                    const currentDayIndex = (todayJs + 6) % 7;

                                    return (
                                        <CardStack
                                            items={showcaseCards.map((card: any, idx: number) => ({
                                                id: idx,
                                                title: card.title, // Day Name
                                                description: card.desc,
                                                imageSrc: "", // No image for now, gradient will show
                                                ctaLabel: "Starten"
                                            }))}
                                            initialIndex={currentDayIndex}
                                            loop={false}
                                            autoAdvance={false}
                                            renderCard={(item, { active }) => (
                                                <div className={`relative h-full w-full flex flex-col justify-between p-6 ${active ? 'opacity-100' : 'opacity-40'}`}
                                                    style={{
                                                        background: `linear-gradient(135deg, ${showcaseCards[item.id as number].gradientFrom}40, ${showcaseCards[item.id as number].gradientTo}20)`,
                                                        border: '1px solid rgba(255,255,255,0.1)'
                                                    }}
                                                >
                                                    {/* Content Top */}
                                                    <div>
                                                        <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                                                            {item.title}
                                                        </div>
                                                        <div className="mt-2 text-zinc-300 text-sm whitespace-pre-wrap">
                                                            {item.description}
                                                        </div>
                                                    </div>

                                                    {/* Action Button (Only visible/interactive if active?) */}
                                                    <div className="mt-4">
                                                        <ButtonColorful
                                                            label="Training Starten"
                                                            className="w-full h-10 text-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Don't trigger card click
                                                                router.push('/dashboard?view=session&day=' + item.id, { scroll: false });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    );
                                })()}

                                <div className="mt-12">
                                    <NativeDelete
                                        onDelete={handleDeletePlan}
                                        buttonText="Plan Löschen & Neu Generieren"
                                        confirmText="Wirklich löschen?"
                                    />
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
                                {/* STEP 1: VERIFICATION (Holo Cards) */}
                                {reviewStep === 1 && (
                                    <div className="flex flex-col items-center gap-8 w-full">
                                        <div className="text-center space-y-2 mb-4">
                                            <h2 className="text-3xl font-bold">Profil Überprüfen</h2>
                                            <p className="text-zinc-400 max-w-lg mx-auto">
                                                Sind diese Daten noch aktuell? Der Plan basiert darauf.
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap justify-center gap-6">
                                            {/* GlareCard for Stats */}
                                            <GlareCard className="flex flex-col items-start justify-end py-8 px-6">
                                                <div className="font-bold text-white text-lg">Dein Profil</div>
                                                <div className="text-zinc-400 text-sm mb-4">Basisdaten</div>
                                                <div className="space-y-2 w-full">
                                                    <div className="flex justify-between border-b border-white/10 pb-1">
                                                        <span>Alter</span>
                                                        <span className="font-mono text-white">{userPlan?.age || '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-white/10 pb-1">
                                                        <span>Gewicht</span>
                                                        <span className="font-mono text-white">{userPlan?.weight || '-'} kg</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-white/10 pb-1">
                                                        <span>Größe</span>
                                                        <span className="font-mono text-white">{userPlan?.height || '-'} cm</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Geschlecht</span>
                                                        <span className="font-mono text-white capitalize">{userPlan?.gender || '-'}</span>
                                                    </div>
                                                </div>
                                            </GlareCard>

                                            {/* GlareCard for Goal */}
                                            <GlareCard className="flex flex-col items-start justify-end py-8 px-6 bg-gradient-to-br from-indigo-900/50 to-purple-900/50">
                                                <div className="font-bold text-white text-lg">Dein Ziel</div>
                                                <div className="text-zinc-400 text-sm mb-4">Fokus</div>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-white/10 rounded-full">
                                                        {userPlan?.goal === 'build_muscle' ? <Dumbbell className="w-6 h-6 text-blue-400" /> :
                                                            userPlan?.goal === 'lose_weight' ? <Sparkles className="w-6 h-6 text-orange-400" /> :
                                                                <User className="w-6 h-6 text-green-400" />}
                                                    </div>
                                                    <span className="text-xl font-bold capitalize">
                                                        {userPlan?.goal?.replace('_', ' ') || 'General Fitness'}
                                                    </span>
                                                </div>
                                            </GlareCard>
                                        </div>

                                        <div className="flex gap-4 mt-8">
                                            <ButtonColorful
                                                label="Abbrechen"
                                                className="h-12 px-8 bg-zinc-800 hover:bg-zinc-700"
                                                onClick={() => router.push('/dashboard')}
                                            />
                                            <ButtonColorful
                                                label="Bearbeiten"
                                                className="h-12 px-8 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                                                onClick={() => router.push('/onboarding?edit=true')}
                                            />
                                            <ButtonColorful
                                                label="Weiter"
                                                className="h-12 px-8"
                                                onClick={() => setReviewStep(2)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: CONFIGURATION */}
                                {reviewStep === 2 && (
                                    <>
                                        {isGenerating ? (
                                            <div className="flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-700">
                                                <QuantumPulseLoader />
                                                <p className="text-zinc-400 mt-8 animate-pulse text-center max-w-md">
                                                    Dein Plan wird von der AI erstellt. Das kann einen Moment dauern...
                                                </p>
                                            </div>
                                        ) : (
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
                                                        <GradientSelector
                                                            options={TRAINING_FREQUENCY_OPTIONS}
                                                            defaultSelected={trainingDays.toString()}
                                                            onSelectionChange={(option) => setTrainingDays(parseInt(option.value))}
                                                            className="w-full border-zinc-800 bg-zinc-900/50"
                                                        />
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
                                                        label="Zurück"
                                                        className="h-12 px-8 bg-zinc-800 hover:bg-zinc-700"
                                                        onClick={() => setReviewStep(1)}
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
                                        )}
                                    </>
                                )}
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
                                                    // Use Router to respect basePath like /Trainingsplan
                                                    router.push('/dashboard?view=training');
                                                    router.refresh();
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
