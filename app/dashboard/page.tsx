"use client";

import { useState, useEffect } from "react";
import { DashboardDock } from "@/components/ui/dashboard-dock";
import { ButtonColorful } from "@/components/ui/button-colorful";
import { getUserProfile } from "@/lib/api";
import { Dumbbell, User } from "lucide-react";
import { GlareCard } from "@/components/ui/glare-card";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function DashboardContent() {
    const [activeTab, setActiveTab] = useState("home");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [userPlan, setUserPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
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

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-black to-black -z-10" />

            <main className="container mx-auto px-4 pt-20 pb-32 flex flex-col items-center justify-center min-h-screen transition-all duration-500">

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

                {/* REVIEW MODE (Cards) */}
                {isReviewMode && (
                    <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center gap-8 w-full max-w-6xl">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold">Überprüfe deine Daten</h2>
                            <p className="text-zinc-400 max-w-lg mx-auto">
                                Diese Daten werden für die Generierung des Trainingsplans verwendet.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full place-items-center">
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
                            />
                            <ButtonColorful
                                label="Jetzt Generieren"
                                className="h-12 px-8"
                                onClick={() => alert("Gemini API Integration folgt...")}
                            />
                        </div>
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
