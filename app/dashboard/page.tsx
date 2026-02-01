"use client";

import { useState, useEffect } from "react";
import { DashboardDock } from "@/components/ui/dashboard-dock";
import { ButtonColorful } from "@/components/ui/button-colorful";
import { getUserProfile } from "@/lib/api";
import { Dumbbell } from "lucide-react";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("home");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [userPlan, setUserPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

    const hasTrainingPlan = userPlan && userPlan.workout_routine; // Check if routine exists

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-black to-black -z-10" />

            {/* Content Area */}
            <main className="container mx-auto px-4 pt-20 pb-32 flex flex-col items-center justify-center min-h-screen transition-all duration-500">

                {/* HOME TAB */}
                {activeTab === "home" && (
                    <div className="animate-in fade-in zoom-in duration-500 text-center space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-500">
                            Hallo User
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-lg mx-auto">
                            Willkommen zurück zu deinem Training.
                        </p>
                    </div>
                )}

                {/* TRAINING TAB */}
                {activeTab === "training" && (
                    <div className="animate-in fade-in slide-in-from-right-10 duration-500 text-center flex flex-col items-center gap-6 w-full max-w-2xl">
                        {/* Small Greeting as requested */}
                        <div className="flex items-center gap-2 text-zinc-400 mb-2">
                            <Dumbbell className="w-5 h-5" />
                            <span>Dein Trainings-Fokus</span>
                        </div>

                        <h1 className="text-4xl font-bold mb-8">Dein Trainingsplan</h1>

                        {loading ? (
                            <p className="text-zinc-500">Laden...</p>
                        ) : (
                            <div className="flex flex-col items-center w-full">
                                {hasTrainingPlan ? (
                                    <div className="w-full p-8 border border-zinc-800 rounded-3xl bg-zinc-900/50 backdrop-blur-sm">
                                        <p className="text-green-400 font-medium mb-2">Plan Aktiv</p>
                                        <p className="text-zinc-300">Dein personalisierter Plan wird bald hier angezeigt.</p>
                                        {/* Placeholder for actual plan display */}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-6 p-8 border border-zinc-900 rounded-3xl bg-zinc-950/50 w-full">
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
                                            onClick={() => alert("Gemini API Integration folgt...")}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

            </main>

            {/* Navigation Dock */}
            <DashboardDock activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
}
