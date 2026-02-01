"use client";
import { useRouter } from "next/navigation";
import { FallingPattern } from "@/components/ui/falling-pattern";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { AuthModal } from "@/components/ui/auth-modal";
import React, { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <main className="w-full relative min-h-screen">
      <FallingPattern className="h-screen [mask-image:radial-gradient(ellipse_at_center,transparent,var(--background))]" />
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-12 pointer-events-none pb-20">
        <div className="relative">
          <h1 className="font-mono text-7xl font-extrabold tracking-tighter text-foreground">
            Trainingsplan
          </h1>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-foreground absolute -top-2 -right-8"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </div>
        <div className="pointer-events-auto">
          <InteractiveHoverButton
            text="Plan erstellen"
            onClick={() => setAuthModalOpen(true)}
          />
        </div>
      </div>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onAuthSuccess={() => router.push("/onboarding")}
      />
    </main>
  );
}
