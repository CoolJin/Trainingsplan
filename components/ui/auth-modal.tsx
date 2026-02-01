'use client';
import React from 'react';
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    ModalTitle,
} from '@/components/ui/modal';
import { Button } from './button';
import { Input } from './input';
import { AtSignIcon } from 'lucide-react';
import { OTPVerification } from './otp-verify';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

type AuthModalProps = Omit<React.ComponentProps<typeof Modal>, 'children'> & {
    onAuthSuccess?: () => void;
};

export function AuthModal({ onAuthSuccess, ...props }: AuthModalProps) {
    const [view, setView] = React.useState<'email' | 'otp'>('email');
    const [email, setEmail] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleEmailContinue = async () => {
        if (email) {
            setIsLoading(true);
            setError(null); // Clear previous errors
            const { error: authError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    // Redirect to current page? Or purely API based?
                    // API based is fine for OTP.
                },
            });

            if (authError) {
                console.error('Error sending OTP:', authError.message);
                setError(authError.message);
                setIsLoading(false);
                return;
            }

            setView('otp');
            setIsLoading(false);
        }
    };

    const handleVerify = async (code: string) => {
        // ... (keep verification logic similar or add error handling if needed later)
        // For now focusing on Email step errors as requested.
        setIsLoading(true);
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token: code,
            type: 'email',
        });

        if (verifyError) {
            console.error('Error verifying OTP:', verifyError.message);
            alert('Invalid code: ' + verifyError.message); // Should we inline this too? 
            // The user specifically asked for "under the email input field".
            // So for OTP, maybe handle differently or later. But let's stick to email mainly.
            throw verifyError;
        }

        console.log("Logged in!", data);
        if (onAuthSuccess) {
            onAuthSuccess();
        }
    };

    // ...

    const handleResend = async () => {
        await handleEmailContinue();
    };

    return (
        <Modal {...props}>
            <ModalContent
                className={cn(
                    'p-0 overflow-hidden transition-all duration-300',
                    view === 'otp' ? 'bg-transparent border-0 shadow-none max-w-sm' : ''
                )}
            >
                {view === 'email' ? (
                    <>
                        <ModalHeader>
                            <ModalTitle>Sign In or Join Now!</ModalTitle>
                        </ModalHeader>
                        <ModalBody>
                            <p className="text-muted-foreground mb-2 text-start text-xs">
                                Enter your email address to sign in or create an account
                            </p>
                            <div className="relative h-max">
                                <Input
                                    placeholder="your.email@example.com"
                                    className={cn("peer ps-9", error && "border-red-500 focus-visible:ring-red-500")}
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    disabled={isLoading}
                                />
                                <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                                    <AtSignIcon className="size-4" aria-hidden="true" />
                                </div>
                            </div>

                            {/* Inline Error Message */}
                            {error && (
                                <p className="mt-2 text-xs text-red-500 font-medium animate-in slide-in-from-top-1 fade-in">
                                    {error}
                                </p>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                className="animate-in fade-in mt-4 w-full duration-300"
                                onClick={handleEmailContinue}
                                disabled={isLoading}
                            >
                                <span>{isLoading ? 'Sending...' : 'Continue With Email'}</span>
                            </Button>
                        </ModalBody>
                    </>
                ) : (
                    <div className="animate-in fade-in zoom-in duration-300">
                        {/* Radix requires a DialogTitle for accessibility */}
                        <ModalTitle className="sr-only">Enter Verification Code</ModalTitle>
                        <OTPVerification
                            email={email}
                            onVerify={handleVerify}
                            onResend={handleResend}
                        />
                    </div>
                )}
            </ModalContent>
        </Modal>
    );
}
