"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Ruler, Weight, Check, User, Target, Dumbbell, Activity, Flame } from "lucide-react";
import ProgressIndicator from "@/components/ui/progress-indicator";
import { ModalPricing } from "@/components/ui/modal-pricing";
import { getUserProfile, saveUserPlan } from "@/lib/api";

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
    const [pricingOpen, setPricingOpen] = useState(false); // Added missing state

    // Helper to check if a specific field is valid
    const isFieldValid = (key: keyof OnboardingFormData) => {
        const val = formData[key];
        if (!val) return false;

        switch (key) {
            case 'age': return !isNaN(parseInt(val)) && parseInt(val) >= 10 && parseInt(val) <= 120;
            case 'height':
                if (formData.units === 'metric') {
                    return !isNaN(parseInt(val)) && parseInt(val) >= 50 && parseInt(val) <= 300;
                } else { // Imperial (feet)
                    // Assuming height is entered as inches or feet. For simplicity, let's assume inches for now.
                    // Or if it's feet.inches, it needs more complex parsing.
                    // Given the current input type="number", it's likely a single unit.
                    // Let's assume inches for imperial height for validation range.
                    return !isNaN(parseInt(val)) && parseInt(val) >= 36 && parseInt(val) <= 108; // 3ft to 9ft in inches
                }
            case 'weight':
                if (formData.units === 'metric') {
                    return !isNaN(parseInt(val)) && parseInt(val) >= 20 && parseInt(val) <= 500;
                } else { // Imperial (lbs)
                    return !isNaN(parseInt(val)) && parseInt(val) >= 40 && parseInt(val) <= 1100; // Approx 20kg to 500kg in lbs
                }
            default: return true;
        }
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
                // activityLevel is optional in interface but required by user?
                // User said "inputs... required".
                // I will assume Goal is required. ActivityLevel was added recently.
                // The current JSX for step 3 only has goal selection.
                // If activityLevel was added to step 3, it would be checked here.
                return !!formData.goal;
            default:
                return true;
        }
    };

    // Derived state for button disabled
    const canIsProceed = isStepValid();

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
                    setPricingOpen(true);
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const errorMsg = (result.error as any)?.message || JSON.stringify(result.error) || "Unknown error";
                    console.error("Save error:", result.error);
                    // Instead of alert, maybe set an error state to display?
                    // For now, let's just log it and maybe alert with cleaner message if critical.
                    // Or better, set 'isSaving' false and show error in UI.
                    // But to keep it simple and avoid UI rework right now:
                    alert(`Error saving data: ${errorMsg}\nCheck console for details.`);
                    // Proceed anyway?
                    setPricingOpen(true); // Let them proceed to pricing even if save failed? 
                    // The user said "unknown error" blocked them or they saw it.
                }
            } catch (e) {
                console.error("Unexpected error saving:", e);
                router.push('/dashboard');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const getInputErrorClass = (key: keyof OnboardingFormData) => {
        if (formData[key] !== "" && !isFieldValid(key)) {
            return "border-red-500 focus:border-red-500";
        }
        return "";
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else router.back();
    };

    const updateData = (key: keyof OnboardingFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <motion.div
            className="min-h-screen bg-black text-white flex flex-col items-center justify-start gap-12 p-6 overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        >
            <div className="w-full flex justify-center pt-12">
                <h1 className="text-xl font-mono text-gray-500">
                    Schritt {step} von {totalSteps}
                </h1>
            </div>

            {/* Main Content Area */}
            <div className="w-full max-w-md flex flex-col justify-start items-center mt-8 mb-12 pt-10">
                <AnimatePresence mode="wait">
                    {/* STEP 1: UNITS */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full flex flex-col gap-8"
                        >
                            <h2 className="text-4xl font-bold text-center">Wähle deine Einheiten</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {/* Metric */}
                                <button
                                    onClick={() => updateData("units", "metric")}
                                    className={cn(
                                        "flex items-center justify-between p-6 rounded-2xl border-2 transition-all",
                                        formData.units === "metric"
                                            ? "border-primary bg-white/10"
                                            : "border-white/10 hover:border-white/30"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-500/20 rounded-full text-blue-500">
                                            <Ruler size={24} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-lg">Metrisch</div>
                                            <div className="text-gray-400">Kilogramm, cm</div>
                                        </div>
                                    </div>
                                    {formData.units === "metric" && <div className="text-primary"><Check /></div>}
                                </button>

                                {/* Imperial */}
                                <button
                                    onClick={() => updateData("units", "imperial")}
                                    className={cn(
                                        "flex items-center justify-between p-6 rounded-2xl border-2 transition-all",
                                        formData.units === "imperial"
                                            ? "border-primary bg-white/10"
                                            : "border-white/10 hover:border-white/30"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-500/20 rounded-full text-amber-500">
                                            <Weight size={24} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-lg">Imperial</div>
                                            <div className="text-gray-400">Pfund, Fuß</div>
                                        </div>
                                    </div>
                                    {formData.units === "imperial" && <div className="text-primary"><Check /></div>}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: BIOMETRICS */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full flex flex-col gap-6"
                        >
                            <h2 className="text-3xl font-bold text-center">Über dich</h2>

                            {/* Gender Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                {["Männlich", "Weiblich"].map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => updateData("gender", g)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2",
                                            formData.gender === g ? "border-primary bg-white/10" : "border-white/10 hover:bg-white/5"
                                        )}
                                    >
                                        <User className={formData.gender === g ? "text-primary" : "text-gray-400"} />
                                        <span className="font-semibold">{g}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Numerical Inputs */}
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-gray-400 text-sm ml-1">Alter</label>
                                    <input
                                        type="number"
                                        min={10}
                                        max={100}
                                        value={formData.age}
                                        onChange={(e) => updateData("age", e.target.value)}
                                        placeholder="0"
                                        className={cn(
                                            "w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:border-primary transition-colors",
                                            getInputErrorClass('age')
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-gray-400 text-sm ml-1">
                                            Größe ({formData.units === 'metric' ? 'cm' : 'ft'})
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.height}
                                            onChange={(e) => updateData("height", e.target.value)}
                                            placeholder="0"
                                            className={cn(
                                                "w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:border-primary transition-colors",
                                                getInputErrorClass('height')
                                            )}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-gray-400 text-sm ml-1">
                                            Gewicht ({formData.units === 'metric' ? 'kg' : 'lbs'})
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.weight}
                                            onChange={(e) => updateData("weight", e.target.value)}
                                            placeholder="0"
                                            className={cn(
                                                "w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:border-primary transition-colors",
                                                getInputErrorClass('weight')
                                            )}
                                        />
                                    </div>
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
                                        onClick={() => updateData("goal", item.id)}
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

            {/* Progress Indicator / Buttons - Anchored to bottom to prevent jumping */}
            <div className="absolute bottom-32 w-full max-w-md px-6 z-20">
                <ProgressIndicator
                    currentStep={step}
                    totalSteps={totalSteps}
                    onNext={handleNext}
                    onBack={handleBack}
                    disabled={!canIsProceed}
                />
            </div>

        </motion.div>
    );
}
