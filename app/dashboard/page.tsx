"use client";

import { useState } from "react";
import { DashboardDock } from "@/components/ui/dashboard-dock";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("home");

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-black to-black -z-10" />

            {/* Content Area */}
            <main className="container mx-auto px-4 pt-20 pb-32 flex flex-col items-center justify-center min-h-screen transition-all duration-500">

                {activeTab === "home" && (
                    <div className="animate-in fade-in zoom-in duration-500 text-center space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-500">
                            Welcome Back
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-lg mx-auto">
                            Your personalized fitness journey continues here.
                        </p>
                        {/* Placeholder Content */}
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                            <div className="h-40 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-colors p-6">
                                <h3 className="text-xl font-semibold mb-2">Today's Workout</h3>
                                <div className="h-2 w-24 bg-purple-500 rounded-full mb-4"></div>
                                <p className="text-zinc-500">Upper Body Power</p>
                            </div>
                            <div className="h-40 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-colors p-6">
                                <h3 className="text-xl font-semibold mb-2">Calories</h3>
                                <div className="h-2 w-24 bg-orange-500 rounded-full mb-4"></div>
                                <p className="text-zinc-500">1,250 / 2,400 kcal</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "workouts" && (
                    <div className="animate-in fade-in slide-in-from-right-10 duration-500 text-center">
                        <h1 className="text-4xl font-bold mb-4">Your Workouts</h1>
                        <div className="p-12 border border-dashed border-zinc-800 rounded-3xl text-zinc-600">
                            Workout Library Placeholder
                        </div>
                    </div>
                )}

                {activeTab === "analytics" && (
                    <div className="animate-in fade-in slide-in-from-right-10 duration-500 text-center">
                        <h1 className="text-4xl font-bold mb-4">Analytics</h1>
                        <div className="p-12 border border-dashed border-zinc-800 rounded-3xl text-zinc-600">
                            Charts & Graphs Placeholder
                        </div>
                    </div>
                )}

                {activeTab === "community" && (
                    <div className="animate-in fade-in slide-in-from-right-10 duration-500 text-center">
                        <h1 className="text-4xl font-bold mb-4">Community</h1>
                        <div className="p-12 border border-dashed border-zinc-800 rounded-3xl text-zinc-600">
                            Social Feed Placeholder
                        </div>
                    </div>
                )}

                {activeTab === "profile" && (
                    <div className="animate-in fade-in slide-in-from-right-10 duration-500 text-center">
                        <h1 className="text-4xl font-bold mb-4">Your Profile</h1>
                        <div className="p-12 border border-dashed border-zinc-800 rounded-3xl text-zinc-600">
                            Settings & Preferences Placeholder
                        </div>
                    </div>
                )}
            </main>

            {/* Navigation Dock */}
            <DashboardDock activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
}
