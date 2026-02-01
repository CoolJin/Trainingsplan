"use client";
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ButtonColorful } from "@/components/ui/button-colorful"

interface ProgressIndicatorProps {
    currentStep: number;
    totalSteps: number;
    onNext: () => void;
    onBack: () => void;
    className?: string;
    disabled?: boolean;
    isLoading?: boolean;
}

export default function ProgressIndicator({
    currentStep,
    totalSteps,
    onNext,
    onBack,
    className,
    disabled = false,
    isLoading = false,
}: ProgressIndicatorProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100

    const handleNext = () => {
        if (disabled || isLoading) return;
        if (currentStep < totalSteps) {
            onNext()
        } else {
            onNext()
        }
    }

    const handleBack = () => {
        if (currentStep === totalSteps - 1) {
            setIsExpanded(true)
        }
        if (currentStep > 1) {
            onBack()
        }
    }

    useEffect(() => {
        if (currentStep < totalSteps) {
            setIsExpanded(true)
        }
    }, [currentStep, totalSteps])

    return (
        <div className="flex flex-col items-center justify-center gap-8 w-full">
            <div className="flex items-center gap-6 relative">
                {Array.from({ length: totalSteps }).map((_, i) => {
                    const dot = i + 1;
                    return (
                        <div
                            key={dot}
                            className={cn(
                                "w-2 h-2 rounded-full relative z-10",
                                dot <= currentStep ? "bg-white" : "bg-gray-300"
                            )}
                        />
                    )
                })}

                <motion.div
                    initial={{ width: '12px', height: "24px", x: 0 }}
                    animate={{
                        width: `${24 + (currentStep - 1) * 36}px`,
                        x: 0
                    }}
                    className="absolute -left-[8px] top-1/2 -translate-y-1/2 h-3 bg-primary rounded-full z-0"
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        mass: 0.8,
                        bounce: 0.25,
                        duration: 0.6
                    }}
                />
            </div>

            <div className="w-full max-w-sm">
                <motion.div
                    className="flex items-center gap-1"
                    animate={{
                        justifyContent: isExpanded ? 'stretch' : 'space-between'
                    }}
                >
                    <motion.div
                        initial={false}
                        animate={{
                            opacity: currentStep > 1 ? 1 : 0,
                            width: currentStep > 1 ? "auto" : 0,
                            flex: currentStep > 1 ? 1 : 0,
                            marginRight: currentStep > 1 ? 4 : 0
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                            duration: 0.4
                        }}
                        className="overflow-hidden"
                    >
                        <ButtonColorful
                            onClick={handleBack}
                            className="w-full h-12"
                            label="Back"
                            disabled={currentStep <= 1 || isLoading}
                            tabIndex={currentStep <= 1 || isLoading ? -1 : 0}
                        />
                    </motion.div>

                    <motion.div
                        className={cn("transition-all", !isExpanded ? 'w-44' : 'w-56')}
                        animate={{
                            flex: 1,
                        }}
                    >
                        <ButtonColorful
                            onClick={handleNext}
                            isLoading={isLoading}
                            className={cn("w-full h-12", (disabled || isLoading) && "opacity-50 cursor-not-allowed")}
                            label={currentStep === totalSteps ? 'Finish' : 'Continue'}
                            disabled={disabled || isLoading}
                        />
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}
