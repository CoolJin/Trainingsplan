"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Ruler, Weight, Check, User, Target, Dumbbell, Activity, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import ProgressIndicator from "@/components/ui/progress-indicator";
import { ModalPricing } from "@/components/ui/modal-pricing";
import { getUserProfile, saveUserPlan, saveOnboardingData } from "@/lib/api";

interface OnboardingFormData {
    name: string;
    units: string;
    gender: string;
    age: string;
    weight: string;
    height: string;
    goal: string;
    activityLevel?: string;
    dietaryPreference?: string;
}

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isEditMode = searchParams.get('edit') === 'true';

    const [step, setStep] = useState(1);
    const totalSteps = 4; // 1: Name, 2: Units, 3: Biometrics, 4: Goals

    const [formData, setFormData] = useState<OnboardingFormData>({
        name: "",
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
    const [pricingOpen, setPricingOpen] = useState(false);

    // If editing, maybe pre-fill data effectively?
    // We assume data is already in formData state or fetched.
    useEffect(() => {
        if (isEditMode) {
            console.log("Edit Mode Active - Should fetch current data ideally.");
            // Future enhancement: Fetch current profile to pre-fill
            async function loadCurrent() {
                try {
                    const profile = await getUserProfile();
                    if (profile) {
                        setFormData({
                            name: profile.name || "",
                            units: profile.units || "metric",
                            gender: profile.gender || "",
                            age: profile.age?.toString() || "",
                            weight: profile.weight?.toString() || "",
                            height: profile.height?.toString() || "",
                            goal: profile.goal || "",
                            activityLevel: "",
                            dietaryPreference: ""
                        });
                    }
                } catch (e) {
                    console.error("Error loading profile for edit", e);
                }
            }
            loadCurrent();
        }
    }, [isEditMode]);

    // Helper to check if a specific field is valid
    const isFieldValid = (key: keyof OnboardingFormData) => {
        const val = formData[key];
        if (!val) return false;
        if (key === 'age') {
            const num = parseInt(val as string);
            return !isNaN(num) && num > 10 && num < 100;
        }
        if (key === 'height') return true; // Could add range check
        if (key === 'weight') return true;
        return true;
    };

    // Helper to check if the current step is fully valid
    const isStepValid = () => {
        switch (step) {
            case 1: // Name
                return !!formData.name && formData.name.length > 1;
            case 2: // Units
                return !!formData.units;
            case 3: // Biometrics
                return isFieldValid('age') &&
                    isFieldValid('height') &&
                    isFieldValid('weight') &&
                    !!formData.gender;
            case 4: // Goals
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
                        // Redirect back to Review/Card view
                        router.push('/dashboard?view=profile');
                    } else {
                        setPricingOpen(true);
                    }
                    // Do NOT set isSaving(false) here, keep it loading while Modal opens/redirects
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

    return (
        <motion.div
            className="min-h-screen bg-black text-white flex flex-col items-center justify-start gap-12 p-6 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header / Logo */}
            <div className="w-full max-w-md pt-8 flex justify-center z-10">
                <h1 className="text-xl font-bold tracking-wider text-white/80">FITNESS APP</h1>
            </div>

            {/* Content Container */}
            <div className="w-full max-w-md flex-1 relative z-10">
                <AnimatePresence mode="wait">
                    {/* STEP 1: NAME */}
                    {step === 1 && (
                        <motion.div
                            key="step1-name"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full flex flex-col gap-8"
                        >
                            <h2 className="text-3xl font-bold text-center">Wie heißt du?</h2>
                            <div className="space-y-4">
                                <p className="text-gray-400 text-center text-sm">Damit wir dich persönlich ansprechen können.</p>
                                <input
                                    type="text"
                                    value={formData.name || ""}
                                    onChange={(e) => updateData("name", e.target.value)}
                                    placeholder="Dein Vorname"
                                    disabled={isSaving}
                                    className={cn(
                                        "w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:border-primary transition-colors text-center",
                                        formData.name === "" ? "" : (formData.name?.length || 0) < 2 ? "border-red-500" : "border-green-500/50",
                                        isSaving && "opacity-50 cursor-not-allowed"
                                    )}
                                    autoFocus
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: UNITS */}
                    {step === 2 && (
                        <motion.div
                            key="step2-units"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full flex flex-col gap-8"
                        >
                            <h2 className="text-3xl font-bold text-center">Wähle dein Einheitensystem</h2>
                            <div className="flex flex-col gap-4">
                                {/* Metric */}
                                <button
                                    onClick={() => !isSaving && updateData("units", "metric")}
                                    disabled={isSaving}
                                    className={cn(
                                        "flex items-center justify-between p-6 rounded-2xl border-2 transition-all",
                                        formData.units === "metric"
                                            ? "border-primary bg-white/10"
                                            : "border-white/10 hover:bg-white/5",
                                        isSaving && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-3 rounded-full", formData.units === "metric" ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-400")}>
                                            <Ruler size={24} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-lg">Metrisch</div>
                                            <div className="text-sm text-gray-400">cm, kg</div>
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
                                            : "border-white/10 hover:bg-white/5",
                                        isSaving && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-3 rounded-full", formData.units === "imperial" ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-400")}>
                                            <Weight size={24} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-lg">Imperial</div>
                                            <div className="text-sm text-gray-400">ft, lbs</div>
                                        </div>
                                    </div>
                                    {formData.units === "imperial" && <Check className="text-primary" />}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: DETAILS */}
                    {step === 3 && (
                        <motion.div
                            key="step3-details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full flex flex-col gap-6"
                        >
                            <h2 className="text-3xl font-bold text-center">Über Dich</h2>

                            {/* Gender */}
                            <div className="grid grid-cols-2 gap-4">
                                {["male", "female"].map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => !isSaving && updateData("gender", g)}
                                        disabled={isSaving}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                            formData.gender === g
                                                ? "border-primary bg-white/10"
                                                : "border-white/10 hover:bg-white/5",
                                            isSaving && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <User size={32} className={formData.gender === g ? "text-primary" : "text-gray-400"} />
                                        <span className="capitalize">{g === "male" ? "Männlich" : "Weiblich"}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Inputs */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 ml-1">Alter</label>
                                    <input
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => updateData("age", e.target.value)}
                                        placeholder="z.B. 25"
                                        disabled={isSaving}
                                        className={cn(
                                            "w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:border-primary transition-colors",
                                            getInputErrorClass('age'),
                                            isSaving && "opacity-50 cursor-not-allowed"
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400 ml-1">
                                            Gewicht ({formData.units === 'metric' ? 'kg' : 'lbs'})
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.weight}
                                            onChange={(e) => updateData("weight", e.target.value)}
                                            placeholder="0"
                                            disabled={isSaving}
                                            className={cn(
                                                "w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:border-primary transition-colors",
                                                getInputErrorClass('weight'),
                                                isSaving && "opacity-50 cursor-not-allowed"
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400 ml-1">
                                            Größe ({formData.units === 'metric' ? 'cm' : 'ft'})
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.height}
                                            onChange={(e) => updateData("height", e.target.value)}
                                            placeholder="0"
                                            disabled={isSaving}
                                            className={cn(
                                                "w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:border-primary transition-colors",
                                                getInputErrorClass('height'),
                                                isSaving && "opacity-50 cursor-not-allowed"
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: GOALS */}
                    {step === 4 && (
                        <motion.div
                            key="step4-goals"
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
                                                : "border-white/10 hover:bg-white/5",
                                            isSaving && "opacity-50 cursor-not-allowed"
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

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Laden...</div>}>
            <OnboardingContent />
        </Suspense>
    );
}
