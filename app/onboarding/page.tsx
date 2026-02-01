"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Ruler, Weight, Check, User, Target, Dumbbell, Activity, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import ProgressIndicator from "@/components/ui/progress-indicator";
import { ModalPricing } from "@/components/ui/modal-pricing";
import { getUserProfile, saveUserPlan, saveOnboardingData } from "@/lib/api";

interface OnboardingFormData {
    units: string;
    gender: string;
    age: string;
    weight: string;
    height: string;
    goal: string;
    activityLevel?: string;
    dietaryPreference?: string;
}

export default function OnboardingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isEditMode = searchParams.get('mode') === 'edit';

    const [step, setStep] = useState(1);
    const totalSteps = 3;

    const [formData, setFormData] = useState<OnboardingFormData>({
        units: "metric", // 'metric' | 'imperial'
        gender: "",
        age: "",
        weight: "",
        height: "",
        goal: "",
        activityLevel: "",
        dietaryPreference: "", // Optional/Future use
    });

    const [isSaving, setIsSaving] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [pricingOpen, setPricingOpen] = useState(false);

    // Load existing data if Edit Mode
    useEffect(() => {
        if (isEditMode) {
            const loadData = async () => {
                const data = await getUserProfile();
                if (data) {
                    setFormData({
                        units: data.units || "metric",
                        gender: data.gender || "",
                        age: data.age?.toString() || "",
                        weight: data.weight?.toString() || "",
                        height: data.height?.toString() || "",
                        goal: data.goal || "",
                        activityLevel: data.activity_level || "",
                        dietaryPreference: data.dietary_preference || ""
                    });
                }
            };
            loadData();
        }
    }, [isEditMode]);

    // Helper to check if a specific field is valid
    const isFieldValid = (key: keyof OnboardingFormData) => {
        const val = formData[key];
        if (!val) return false;
        if (key === 'age' || key === 'weight' || key === 'height') {
            const num = parseFloat(val);
            if (isNaN(num) || num <= 0) return false;
            if (key === 'age' && (num < 10 || num > 100)) return false;
            if (key === 'height' && (num < 50 || num > 300)) return false;
            // Weight limit?
        }
        return true;
    };

    // Helper to check if the current step is fully valid
    const isStepValid = () => {
        switch (step) {
            case 1: // Units selection
                return !!formData.units;
            case 2: // Biometrics
                return isFieldValid('age') &&
                    isFieldValid('height') &&
                    isFieldValid('weight') &&
                    !!formData.gender;
            case 3: // Goals
                return !!formData.goal;
            default:
                return true;
        }
    };

    // Derived state for button disabled
    const canIsProceed = isStepValid();

    const handlePlanSelected = async (planId: string) => {
        try {
            const result = await saveUserPlan(planId);
            if (result.success) {
                router.push('/dashboard');
            } else {
                console.error("Plan save error:", result.error);
                alert("Failed to save plan. Please try again.");
                setIsSaving(false); // Allow retry
            }
        } catch (e) {
            console.error("Unexpected error saving plan:", e);
            setIsSaving(false);
        }
    };

    const handleNext = async () => {
        if (!canIsProceed) return;

        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            // Final Step - Save and Redirect
            setIsSaving(true);
            try {
                const result = await saveOnboardingData(formData);
                if (result.success) {
                    console.log("Saved!", result);
                    if (isEditMode) {
                        router.push('/dashboard');
                        setIsSaving(false);
                    } else {
                        setPricingOpen(true);
                        // Do NOT set isSaving(false) here, keep it loading while Modal opens
                    }
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const errorMsg = (result.error as any)?.message || JSON.stringify(result.error) || "Unknown error";
                    console.error("Save error:", result.error);
                    alert(`Error saving data: ${errorMsg}\nCheck console for details.`);
                    setIsSaving(false); // Enable retry on error
                }
            } catch (e) {
                console.error("Unexpected error saving:", e);
                setIsSaving(false);
            }
        }
    };

    const updateData = (key: keyof OnboardingFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const getInputErrorClass = (key: keyof OnboardingFormData) => {
        if (formData[key] !== "" && !isFieldValid(key)) {
            return "border-red-500 focus:border-red-500";
        }
        return "";
    };

    const handleBack = () => {
        if (isSaving) return;
        if (step > 1) setStep(step - 1);
        else router.back();
    };

    // Animation variants
    // ... we can just use inline or standard motion props

    return (
        <motion.div
            className="min-h-screen bg-black text-white flex flex-col items-center justify-start gap-12 p-6 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header/Nav - minimal */}
            <div className="w-full max-w-md pt-8 flex justify-between items-center z-10">
                <button
                    onClick={() => !isSaving && router.back()}
                    className={cn("text-gray-400 hover:text-white transition-colors", isSaving && "opacity-50 cursor-not-allowed")}
                    disabled={isSaving}
                >
                    Cancel
                </button>
                <div className="text-sm font-semibold text-gray-500">
                    Step {step} of {totalSteps}
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Content Container */}
            <div className="w-full max-w-md flex-1 flex flex-col items-center relative z-10 mt-8">
                <AnimatePresence mode="wait">
                    {/* STEP 1: UNITS */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full flex flex-col gap-6"
                        >
                            <h2 className="text-3xl font-bold text-center">Einheiten wählen</h2>
                            <p className="text-center text-gray-400">Wie möchtest du deine Fortschritte tracken?</p>

                            <div className="grid grid-cols-1 gap-4 mt-4">
                                {/* Metric */}
                                <button
                                    onClick={() => !isSaving && updateData("units", "metric")}
                                    disabled={isSaving}
                                    className={cn(
                                        "flex items-center justify-between p-6 rounded-2xl border-2 transition-all",
                                        formData.units === "metric"
                                            ? "border-primary bg-white/10"
                                            : "border-white/10 hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <Ruler className="text-gray-300" />
                                        <div className="text-left">
                                            <div className="font-bold text-lg">Metrisch</div>
                                            <div className="text-sm text-gray-400">kg, cm</div>
                                        </div>
                                    </div>
                                    {formData.units === "metric" && <Check className="text-primary" />}
                                </button>

                                {/* Imperial */}
                                <button
                                    onClick={() => !isSaving && updateData("units", "imperial")}
                                    disabled={isSaving}
                                    className={cn(
                                        "flex items-center justify-between p-6 rounded-2xl border-2 transition-all",
                                        formData.units === "imperial"
                                            ? "border-primary bg-white/10"
                                            : "border-white/10 hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <Weight className="text-gray-300" />
                                        <div className="text-left">
                                            <div className="font-bold text-lg">Imperial</div>
                                            <div className="text-sm text-gray-400">lbs, inches</div>
                                        </div>
                                    </div>
                                    {formData.units === "imperial" && <Check className="text-primary" />}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: DETAILS */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full flex flex-col gap-6"
                        >
                            <h2 className="text-3xl font-bold text-center">Über dich</h2>

                            {/* Gender */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-400">Geschlecht</label>
                                <div className="flex gap-4">
                                    {['Male', 'Female', 'Other'].map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => !isSaving && updateData("gender", g)}
                                            disabled={isSaving}
                                            className={cn(
                                                "flex-1 p-4 rounded-xl border border-white/10 text-center transition-all hover:bg-white/5",
                                                formData.gender === g && "bg-white/10 border-primary text-primary font-bold"
                                            )}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Age */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Alter</label>
                                <input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => updateData("age", e.target.value)}
                                    placeholder="25"
                                    disabled={isSaving}
                                    className={cn(
                                        "w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:border-primary transition-colors",
                                        getInputErrorClass('age'),
                                        isSaving && "opacity-50 cursor-not-allowed"
                                    )}
                                />
                            </div>

                            {/* Weight / Height */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Gewicht ({formData.units === 'metric' ? 'kg' : 'lbs'})</label>
                                    <input
                                        type="number"
                                        value={formData.weight}
                                        onChange={(e) => updateData("weight", e.target.value)}
                                        placeholder="70"
                                        disabled={isSaving}
                                        className={cn(
                                            "w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:border-primary transition-colors",
                                            getInputErrorClass('weight'),
                                            isSaving && "opacity-50 cursor-not-allowed"
                                        )}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Größe ({formData.units === 'metric' ? 'cm' : 'in'})</label>
                                    <input
                                        type="number"
                                        value={formData.height}
                                        onChange={(e) => updateData("height", e.target.value)}
                                        placeholder="175"
                                        disabled={isSaving}
                                        className={cn(
                                            "w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:border-primary transition-colors",
                                            getInputErrorClass('height'),
                                            isSaving && "opacity-50 cursor-not-allowed"
                                        )}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: GOALS */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full flex flex-col gap-6"
                        >
                            <h2 className="text-3xl font-bold text-center">Dein Ziel</h2>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: "lose_weight", label: "Abnehmen", icon: Flame, desc: "Fett verlieren, definiert aussehen" },
                                    { id: "build_muscle", label: "Muskelaufbau", icon: Dumbbell, desc: "Masse aufbauen, stärker werden" },
                                    { id: "endurance", label: "Ausdauer", icon: Activity, desc: "Kondition verbessern, fit bleiben" },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => !isSaving && updateData("goal", item.id)}
                                        disabled={isSaving}
                                        className={cn(
                                            "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left",
                                            formData.goal === item.id
                                                ? "border-primary bg-white/10"
                                                : "border-white/10 hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn("p-3 rounded-full", formData.goal === item.id ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-400")}>
                                            <item.icon size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg">{item.label}</div>
                                            <div className="text-sm text-gray-400">{item.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Progress Indicator / Buttons */}
            <div className="absolute bottom-32 w-full max-w-md px-6 z-20">
                <ProgressIndicator
                    currentStep={step}
                    totalSteps={totalSteps}
                    onNext={handleNext}
                    onBack={handleBack}
                    disabled={!canIsProceed || isSaving}
                    isLoading={isSaving}
                />
            </div>

            {/* Pricing Modal */}
            <ModalPricing
                isOpen={pricingOpen}
                setIsOpen={setPricingOpen}
                onPlanSelected={handlePlanSelected}
            />
        </motion.div>
    );
}
