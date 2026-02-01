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
}

export default function ProgressIndicator({
    currentStep,
    totalSteps,
    onNext,
    onBack,
    className,
    disabled = false,
}: ProgressIndicatorProps) {
    // Determine internal expansion state based on step or interaction
    const [isExpanded, setIsExpanded] = useState(false)

    // Create an array for the steps
    const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

    // Calculate progress percentage
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100

    // Sync expansion state with steps if needed
    // Logic adapted from original: 
    // "if step < 3" (not last step) -> allow next.
    // "if step == 2" (going back from last) -> expand.

    const handleNext = () => {
        if (disabled) return;
        if (currentStep < totalSteps) {
            if (currentStep === totalSteps - 1) { // e.g. step 2 (of 3)
                // Pre-expand before last step if desired? 
                // Or keep simple.
            }
            onNext()
        } else {
            // Final step action
            onNext()
        }
    }

    const handleBack = () => {
        // Disabled check removed so user can always go back (to correct previous steps)
        if (currentStep === totalSteps - 1) {
            setIsExpanded(true)
        }
        if (currentStep > 1) {
            onBack()
        }
    }

    // Reset expansion when step changes? 
    // Original code toggled expansion on click.
    // Let's ensure if we are on step 1/2 it is expanded?
    // Actually the original code had complex expand logic.
    // For now, let's keep it simple: Expand when not transitioning?
    // Or just default to true.

    useEffect(() => {
        // Reset expansion state when step changes if needed
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

                {/* Green progress overlay */}
                {/* Width calculation needs to be generic or mapped */}
                {/* 1->24px, 2->60px, 3->96px. 
                    Difference is 36px per step? 
                    12 initial?
                    Let's map it dynamically or keep it minimal for 3 steps.
                */}
                {/* Progress Overlay - Changed to Primary Color and centered */}
                <motion.div
                    initial={{ width: '12px', height: "24px", x: 0 }}
                    animate={{
                        width: `${24 + (currentStep - 1) * 36}px`,
                        x: 0
                    }}
                    // Adjusted positioning to be perfectly centered relative to dots
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





            {/* Buttons container */}
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
                            disabled={currentStep <= 1}
                            tabIndex={currentStep <= 1 ? -1 : 0}
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
                            className={cn("w-full h-12", disabled && "opacity-50 cursor-not-allowed")}
                            label={currentStep === totalSteps ? 'Finish' : 'Continue'}
                            disabled={disabled}
                        />
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}
