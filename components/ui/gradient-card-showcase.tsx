"use client";
import React from 'react';
import { ButtonColorful } from './button-colorful';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface DayCardProps {
    title: string;
    desc: string;
    gradientFrom: string;
    gradientTo: string;
    dayIndex: number;
}

export function GradientCardShowcase({ days }: { days: DayCardProps[] }) {
    const router = useRouter();

    return (
        <div className="flex justify-center items-center flex-wrap gap-8 py-10 w-full">
            {days.map(({ title, desc, gradientFrom, gradientTo, dayIndex }, idx) => (
                <div
                    key={idx}
                    className="group relative w-[300px] h-[380px] transition-all duration-500"
                >
                    {/* Skewed gradient panels */}
                    <span
                        className="absolute top-0 left-[20px] w-3/4 h-full rounded-2xl transform skew-x-[10deg] transition-all duration-500 group-hover:skew-x-0 group-hover:left-0 group-hover:w-full opacity-80 group-hover:opacity-100"
                        style={{
                            background: `linear-gradient(315deg, ${gradientFrom}, ${gradientTo})`,
                        }}
                    />
                    <span
                        className="absolute top-0 left-[20px] w-3/4 h-full rounded-2xl transform skew-x-[10deg] blur-[30px] transition-all duration-500 group-hover:skew-x-0 group-hover:left-0 group-hover:w-full opacity-60 group-hover:opacity-80"
                        style={{
                            background: `linear-gradient(315deg, ${gradientFrom}, ${gradientTo})`,
                        }}
                    />

                    {/* Content */}
                    <div className="absolute inset-0 z-20 p-6 flex flex-col justify-between bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-white transition-all duration-500 group-hover:bg-black/40">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">{title}</h2>
                            <p className="text-zinc-300 leading-relaxed text-sm line-clamp-4">{desc}</p>
                        </div>

                        <div className="mt-4">
                            <ButtonColorful
                                label="Ansehen"
                                className="w-full"
                                onClick={() => router.push(`/dashboard/training/${dayIndex}`)}
                            />
                        </div>
                    </div>
                </div>
            ))}

            {/* Animation Styles */}
            <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translateY(10px); }
          50% { transform: translate(-10px); }
        }
        .animate-blob { animation: blob 2s ease-in-out infinite; }
        .animation-delay-1000 { animation-delay: -1s; }
      `}</style>
        </div>
    );
}
