"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface GradientOption {
    id: string;
    label: string;
    value: string;
    color: string;
    gradientFrom: string;
    gradientTo: string;
}

interface GradientSelectorProps {
    options?: GradientOption[];
    defaultSelected?: string;
    onSelectionChange?: (option: GradientOption, index: number) => void;
    className?: string;
}

const defaultOptions: GradientOption[] = [
    {
        id: "100k",
        label: "$100K",
        value: "100000",
        color: "#3b82f6",
        gradientFrom: "#3b82f6",
        gradientTo: "#6366f1",
    },
    {
        id: "1m",
        label: "$1M",
        value: "1000000",
        color: "#6366f1",
        gradientFrom: "#6366f1",
        gradientTo: "#8b5cf6",
    },
    {
        id: "5m",
        label: "$5M",
        value: "5000000",
        color: "#8b5cf6",
        gradientFrom: "#8b5cf6",
        gradientTo: "#a855f7",
    },
    {
        id: "10m",
        label: "$10M+",
        value: "10000000",
        color: "#a855f7",
        gradientFrom: "#a855f7",
        gradientTo: "#ec4899",
    }
];

export function GradientSelector({
    options = defaultOptions,
    defaultSelected,
    onSelectionChange,
    className
}: GradientSelectorProps) {
    const [selectedIndex, setSelectedIndex] = useState<number>(
        defaultSelected ? options.findIndex(opt => opt.id === defaultSelected) : -1
    );

    // If defaultSelected changes prop-wise (external control), sync state
    useEffect(() => {
        if (defaultSelected) {
            setSelectedIndex(options.findIndex(opt => opt.id === defaultSelected));
        }
    }, [defaultSelected, options]);

    const [gradientPosition, setGradientPosition] = useState<{ x: number; y: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const circleRefs = useRef<(HTMLDivElement | null)[]>([]);
    const shouldReduceMotion = useReducedMotion();

    // Ensure minimum of 3 options
    const validOptions = options.length >= 2 ? options : defaultOptions.slice(0, Math.max(2, options.length));

    // Update gradient position when selection changes
    useEffect(() => {
        if (selectedIndex >= 0 && circleRefs.current[selectedIndex] && containerRef.current) {
            const circleElement = circleRefs.current[selectedIndex];
            const containerElement = containerRef.current;

            const circleRect = circleElement.getBoundingClientRect();
            const containerRect = containerElement.getBoundingClientRect();

            // Calculate position relative to container
            const relativeX = circleRect.left + (circleRect.width / 2) - containerRect.left;
            const relativeY = circleRect.top + (circleRect.height / 2) - containerRect.top;

            setGradientPosition({ x: relativeX, y: relativeY });
        } else {
            setGradientPosition(null);
        }
    }, [selectedIndex]);

    const handleCircleClick = (option: GradientOption, index: number) => {
        setSelectedIndex(index);
        onSelectionChange?.(option, index);
    };

    // Create orbital dots around a circle - dots match the circle's color
    const createOrbitalDots = (count: number, radius: number, color: string) => {
        const dots = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * 2 * Math.PI;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            dots.push(
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    initial={{
                        opacity: 0,
                        scale: 0.3,
                        rotate: shouldReduceMotion ? 0 : -90,
                        x: x - 2, // Account for half the dot width
                        y: y - 2  // Account for half the dot height
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        rotate: 0,
                        x: x - 2,
                        y: y - 2
                    }}
                    transition={{
                        duration: shouldReduceMotion ? 0.2 : 0.6,
                        delay: shouldReduceMotion ? 0 : i * 0.03,
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                        ease: [0.04, 0.62, 0.23, 0.98]
                    }}
                    style={{
                        backgroundColor: color,
                        left: '50%',
                        top: '50%',
                    }}
                />
            );
        }
        return dots;
    };

    const getCircleSize = (index: number) => {
        // Dynamic sizing based on progress if desired, but keep simple for now
        // Or just simple responsive logic:
        return "w-4 h-4"; // Unified size for cleanliness
    };

    const getLineStyle = (lineIndex: number) => {
        const isLitUp = selectedIndex > lineIndex; // Line lights up when you progress past it
        const currentOption = validOptions[lineIndex];
        const nextOption = validOptions[lineIndex + 1];

        if (isLitUp) {
            // Fully lit with gradient
            return {
                background: `linear-gradient(to right, ${currentOption.gradientFrom}, ${nextOption?.gradientTo || currentOption.gradientTo})`
            };
        } else {
            return {
                background: `#3f3f46` // Zinc-700 equivalent for unlit
            };
        }
    };

    return (
        <div
            ref={containerRef}
            className={cn("relative flex flex-col items-center gap-8 p-6 md:p-8 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/50 w-full select-none", className)}
        >
            {/* Radial gradient overlay */}
            {selectedIndex >= 0 && gradientPosition && (
                <div
                    className="absolute inset-0 pointer-events-none z-0 transition-all duration-700 ease-out"
                    style={{
                        background: `radial-gradient(circle at ${gradientPosition.x}px ${gradientPosition.y + 440}px, ${validOptions[selectedIndex].color}18 0%, ${validOptions[selectedIndex].color}10 30%, transparent 70%)`,
                    }}
                />
            )}

            <div className="relative z-10 flex items-center justify-between w-full max-w-lg gap-0">
                {validOptions.map((option, index) => (
                    <div key={option.id} className="flex items-center flex-1 last:flex-none">
                        {/* Circle */}
                        <div
                            ref={(el) => { circleRefs.current[index] = el; }}
                            className={cn(
                                "relative cursor-pointer transition-all duration-300 hover:scale-125 z-20",
                                "w-4 h-4",
                                "rounded-full border-2 border-transparent"
                            )}
                            onClick={() => handleCircleClick(option, index)}
                            style={{
                                backgroundColor: selectedIndex >= index ? option.color : '#3f3f46', // Zinc-700
                                boxShadow: selectedIndex >= index
                                    ? `0 0 15px ${option.color}60, 0 0 30px ${option.color}30`
                                    : 'none',
                                transform: selectedIndex === index ? 'scale(1.3)' : 'scale(1)'
                            }}
                        >
                            {/* Only show orbital dots if active */}
                            {selectedIndex === index && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    {createOrbitalDots(8, 14, option.color)}
                                </div>
                            )}
                        </div>

                        {/* Line (don't render after last circle) */}
                        {index < validOptions.length - 1 && (
                            <div
                                className={cn("h-1 flex-1 mx-2 rounded-full transition-all duration-500")}
                                style={getLineStyle(index)}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Labels */}
            <div className="relative z-10 flex justify-between w-full max-w-lg px-0">
                {validOptions.map((option, index) => (
                    <div
                        key={`label-${option.id}`}
                        className="flex flex-col items-center cursor-pointer relative"
                        // Roughly align text under dots. Flex 'space-between' works if exact widths match.
                        // We use w-8 or absolute positioning to ensure center alignment? 
                        // Flex justify-between is easiest but assumes dots are endpoints.
                        onClick={() => handleCircleClick(option, index)}
                        style={{ width: '20px' }} // anchor width
                    >
                        <span
                            className={cn(
                                "absolute top-0 transform -translate-x-1/2 text-xs md:text-sm font-medium transition-colors duration-200 whitespace-nowrap pt-2",
                                selectedIndex === index ? "text-white font-bold" : (selectedIndex > index ? "text-zinc-400" : "text-zinc-600 hover:text-zinc-400")
                            )}
                            style={{
                                color: selectedIndex === index ? option.color : undefined,
                                textShadow: selectedIndex === index ? `0 0 10px ${option.color}40` : 'none'
                            }}
                        >
                            {option.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
