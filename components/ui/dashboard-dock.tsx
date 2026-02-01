"use client";

import React, { useState } from "react";
import { Home, Dumbbell, Activity, User, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Define menu items
const menuItems = [
    { id: 'home', title: "Home", icon: <Home className="w-6 h-6" />, gradientFrom: "#a955ff", gradientTo: "#ea51ff" },
    { id: 'workouts', title: "Workouts", icon: <Dumbbell className="w-6 h-6" />, gradientFrom: "#56CCF2", gradientTo: "#2F80ED" },
    { id: 'analytics', title: "Progress", icon: <Activity className="w-6 h-6" />, gradientFrom: "#FF9966", gradientTo: "#FF5E62" },
    { id: 'community', title: "Community", icon: <Share2 className="w-6 h-6" />, gradientFrom: "#80FF72", gradientTo: "#7EE8FA" },
    { id: 'profile', title: "Profile", icon: <User className="w-6 h-6" />, gradientFrom: "#ffa9c6", gradientTo: "#f434e2" },
];

interface DashboardDockProps {
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export function DashboardDock({ activeTab, onTabChange }: DashboardDockProps) {
    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <ul className="flex gap-4 p-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
                {menuItems.map(({ id, title, icon, gradientFrom, gradientTo }) => {
                    const isActive = activeTab === id;
                    return (
                        <li
                            key={id}
                            onClick={() => onTabChange(id)}
                            className={cn(
                                "relative h-[60px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 group overflow-hidden",
                                "bg-zinc-900 border border-white/10", // Dark base from ButtonColorful (modified for shape)
                                // Width transition (Animation from GradientMenu)
                                "w-[60px] hover:w-[150px]",
                                isActive ? "w-[60px]" : "" // Active state
                            )}
                        >
                            {/* --- Global Button Style (ButtonColorful) --- */}

                            {/* Gradient Blur Layer */}
                            <div
                                className={cn(
                                    "absolute inset-0",
                                    "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
                                    "opacity-40 group-hover:opacity-80", // Interaction from ButtonColorful
                                    "blur transition-opacity duration-500"
                                )}
                            />

                            {/* Icon */}
                            <span className={cn(
                                "relative z-10 transition-all duration-500 group-hover:scale-0 group-hover:opacity-0 delay-0",
                                "text-white"
                            )}>
                                {icon}
                            </span>

                            {/* Title (Reveals on Hover) */}
                            <span className={cn(
                                "absolute text-white font-medium tracking-wide text-sm whitespace-nowrap transition-all duration-300 transform",
                                "scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 delay-100",
                                "z-20"
                            )}>
                                {title}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

// Helper for Glass Filter (if we need to enforce global SVG filter,
// we assume it's loaded in layout or here. Since component might not render SVG defs multiple times...)
// For now, I'll omit the complex SVG filter `url("#container-glass")` to avoid ID collisions and bugs,
// relying on the CSS shadows for the liquid feel which is 90% of the look.
