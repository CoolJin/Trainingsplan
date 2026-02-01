"use client";

import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/api";
import { DashboardDock } from "@/components/ui/dashboard-dock";
import { ButtonColorful } from "@/components/ui/button-colorful";
import { ArrowLeft, Play, Clock, Repeat } from "lucide-react";
import { useRouter } from "next/navigation";

export function DayDetailView({ dayIndex }: { dayIndex: number }) {
    const [dayPlan, setDayPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function loadData() {
            try {
                const profile = await getUserProfile();
                if (profile && profile.workout_routine && profile.workout_routine.days) {
                    const day = profile.workout_routine.days[dayIndex];
                    if (day) {
                        setDayPlan(day);
                    } else {
                        // Invalid day index
                        router.push('/dashboard');
                    }
                } else {
                    // No plan found
                    router.push('/dashboard');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [dayIndex, router]);

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Laden...</div>;

    if (!dayPlan) return null;

    return (
        <div className="min-h-screen bg-black text-white relative pb-32">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black -z-10" />

            <header className="fixed top-0 left-0 right-0 p-4 z-50 flex items-center bg-black/50 backdrop-blur-md border-b border-white/5">
                <button onClick={() => router.back()} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <h1 className="ml-4 text-lg font-bold truncate">{dayPlan.title || dayPlan.day_name}</h1>
            </header>

            <main className="container mx-auto px-4 pt-24 max-w-3xl">

                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        {dayPlan.day_name}
                    </h2>
                    <p className="text-zinc-400">{dayPlan.desc}</p>
                </div>

                <div className="space-y-4">
                    {dayPlan.exercises?.map((ex: any, idx: number) => (
                        <div key={idx} className="bg-zinc-900/50 border border-zinc-800/50 p-6 rounded-2xl flex items-center justify-between group hover:border-zinc-700 transition-all">

                            <div className="flex-1">
                                <h3 className="text-xl font-semibold mb-1 group-hover:text-white transition-colors">{ex.name}</h3>
                                <div className="flex gap-4 text-sm text-zinc-500">
                                    <div className="flex items-center gap-1">
                                        <Repeat className="w-4 h-4" />
                                        <span>{ex.sets} Sets</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{ex.reps} Reps</span>
                                    </div>
                                </div>
                                {ex.notes && (
                                    <p className="mt-2 text-xs text-zinc-600 italic border-l-2 border-zinc-700 pl-2">
                                        {ex.notes}
                                    </p>
                                )}
                            </div>

                            <button className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 hover:bg-blue-600 hover:text-white transition-all">
                                <Play className="w-5 h-5 ml-0.5" />
                            </button>

                        </div>
                    ))}
                </div>

                <div className="mt-12 flex justify-center">
                    <ButtonColorful
                        label="Training Starten"
                        className="w-full h-14 text-lg"
                        onClick={() => alert("Start Tracking (Future Feature)")}
                    />
                </div>

            </main>

            <DashboardDock activeTab="training" onTabChange={(tab) => router.push(`/dashboard?view=${tab === 'home' ? '' : tab}`)} />
        </div>
    );
}
