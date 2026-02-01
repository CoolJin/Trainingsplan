"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Sparkles, Zap } from "lucide-react";

interface PlanOption {
    id: string;
    name: string;
    price: string;
    description: string;
    features: string[];
}

const plansSample: PlanOption[] = [
    {
        id: "basic",
        name: "Basic",
        price: "Free", // Changed to Free as requested "One plan is Free"
        description: "Perfect for starting out",
        features: ["Access to basic workouts", "Progress tracking", "Community support"],
    },
    {
        id: "pro",
        name: "Pro",
        price: "$19",
        description: "For serious training",
        features: [
            "Unlimited plans",
            "Advanced analytics",
            "Priority support",
            "Custom Goals"
        ],
    },
];

interface ModalPricingProps {
    plans?: PlanOption[];
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onPlanSelected: (planId: string) => void;
}

// Check if User provided code matches my export expectation.
// User code had the button inside.
// I need `isOpen` to be controlled from outside (OnboardingPage).
// So I will modify User's code slightly to accept `isOpen` and `setIsOpen` or just be a controllable component.
// User provided:
/*
function ModalPricing({
    plans = plansSample,
}: {
    plans: PlanOption[];
}) {
    const [isOpen, setIsOpen] = useState(false);
    ...
    return ( <> <Button onClick={() => setIsOpen(true)}... /> <Dialog ... /> </> )
}
*/
// The user wants this to open AUTOMATICALLY after Onboarding.
// So I should elevate the state or use a `useEffect` to open it?
// Or better: `ModalPricing` should be controlled.
// I'll modify it to accept props for open state.

export function ModalPricing({
    plans = plansSample,
    isOpen,
    setIsOpen,
    onPlanSelected,
}: ModalPricingProps) {
    const [selectedPlan, setSelectedPlan] = useState("basic"); // Default to basic (Free)

    const handleConfirm = () => {
        onPlanSelected(selectedPlan);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-white">
                        <Zap className="h-5 w-5 text-zinc-900 dark:text-white" />
                        Choose Your Plan
                    </DialogTitle>
                    <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-300">
                        Select the perfect plan for your needs.
                    </DialogDescription>
                </DialogHeader>

                <RadioGroup
                    defaultValue={selectedPlan}
                    onValueChange={setSelectedPlan}
                    className="gap-4 py-4"
                >
                    {plans.map((plan) => (
                        <label
                            key={plan.id}
                            className={`relative flex flex-col p-4 cursor-pointer rounded-xl border-2 transition-all
                                ${selectedPlan === plan.id
                                    ? "border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/50"
                                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                }`}
                        >
                            <RadioGroupItem
                                value={plan.id}
                                className="sr-only"
                            />
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                                        {plan.name}
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        {plan.description}
                                    </p>
                                </div>
                                <div className="flex items-baseline">
                                    <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                                        {plan.price}
                                    </span>
                                    {plan.price !== "Free" && (
                                        <span className="ml-1 text-zinc-500 dark:text-zinc-400">
                                            /mo
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ul className="space-y-2 mt-4">
                                {plan.features.map((feature, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center text-sm text-zinc-600 dark:text-zinc-300"
                                    >
                                        <Check className="w-4 h-4 mr-2 text-zinc-900 dark:text-white" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            {selectedPlan === plan.id && (
                                <div className="absolute -top-2 -right-2">
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 dark:bg-white">
                                        <Check className="h-3 w-3 text-white dark:text-zinc-900" />
                                    </span>
                                </div>
                            )}
                        </label>
                    ))}
                </RadioGroup>

                <DialogFooter className="flex flex-col gap-2">
                    <Button
                        onClick={handleConfirm}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                    >
                        Confirm Selection
                    </Button>
                    {/* Removed Cancel button because this is mandatory flow step? User said "Choose a plan". */}
                    {/* Maybe keep Cancel if they want to think about it, but user said "Finish -> Choose Plan -> Dashboard". */}
                    {/* I'll keep it simple: Confirm only. */}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
