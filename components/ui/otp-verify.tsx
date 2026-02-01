"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface OTPVerificationProps {
    email?: string;
    onVerify: (code: string) => Promise<void>;
    onResend: () => Promise<void>;
}

// Update OTPVerification to support 6 to 8 digits, or fixed 8? 
// User said "he sends me 8 digit code". So 8 is key. 
// I'll default to 8.

// Update to 4 digits as requested.
// User MUST ensure Supabase sends 4 digits.

// Update to 6 digits as confirmed by User.

export function OTPVerification({ email = "your.email@example.com", onVerify, onResend }: OTPVerificationProps) {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]) // 6 digits
    const [isLoading, setIsLoading] = useState(false)
    const [cooldown, setCooldown] = useState(60);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldown > 0) {
            timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleResendClick = async () => {
        if (cooldown > 0) return;
        await onResend();
        setCooldown(60);
    };

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        if (value && index < 5) { // Max index 5 for 6 items
            inputRefs.current[index + 1]?.focus()
        }

        // Auto-submit if all filled
        if (newOtp.every(digit => digit !== "") && index === 5) {
            handleVerifyInternal(newOtp.join(""));
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleVerifyInternal = async (code: string) => {
        if (code.length !== 6) return // Validator check
        setIsLoading(true)
        try {
            await onVerify(code);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false)
        }
    }

    // Trigger verify on button click if manually needed
    const handleVerifyClick = () => {
        handleVerifyInternal(otp.join(""));
    }

    return (
        <div className="flex items-center justify-center p-4 w-full h-full">
            <div className="relative w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl bg-zinc-950 border border-white/10">
                {/* Clean background, no image */}
                <div className="absolute inset-0 bg-zinc-900/50" />

                <div className="relative z-10 p-8 py-14">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-semibold text-white mb-3">Enter verification code</h1>
                        <p className="text-white/70 text-sm leading-relaxed">
                            We emailed you a verification code to
                            <br />
                            <span className="text-white font-medium">{email}</span>
                        </p>
                    </div>

                    <div className="flex justify-center gap-2 mb-8">
                        {otp.map((digit, index) => (
                            <div key={index} className="relative">
                                <input
                                    ref={(el) => { inputRefs.current[index] = el }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    // ... check styling details
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-10 h-12 text-center text-xl font-medium bg-white/5 border-white/10 text-white placeholder-white/20 focus:bg-white/10 focus:border-white/30 focus:outline-none transition-all duration-200 border shadow-lg opacity-100 rounded-xl"
                                />
                            </div>
                        ))}
                    </div>
// ...


                    <div className="text-center mb-8">
                        {cooldown > 0 ? (
                            <span className="text-white/60 text-sm">Resend code in {cooldown}s</span>
                        ) : (
                            <>
                                <span className="text-white/60 text-sm">Didn't get the code? </span>
                                <button
                                    onClick={handleResendClick}
                                    className="text-white/80 hover:text-white text-sm font-medium transition-colors duration-200"
                                >
                                    Resend
                                </button>
                            </>
                        )}
                    </div>

                    {/* Footer Removed as requested */}

                </div>
            </div>
        </div>
    )
}
