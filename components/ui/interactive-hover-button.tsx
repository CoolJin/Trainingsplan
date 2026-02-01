import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    text?: string;
    dotColor?: string;
}

const InteractiveHoverButton = React.forwardRef<
    HTMLButtonElement,
    InteractiveHoverButtonProps
>(({ text = "Button", dotColor = "bg-primary", className, ...props }, ref) => {
    return (
        <button
            ref={ref}
            className={cn(
                "group relative w-64 h-20 cursor-pointer overflow-hidden rounded-full border bg-background text-center font-semibold",
                className,
            )}
            {...props}
        >
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 transition-all duration-300 group-hover:-translate-y-20 group-hover:opacity-0">
                <span className="mb-2 text-xl">{text}</span>
            </div>

            {/* The expanding dot */}
            <div className={cn(
                "absolute left-1/2 bottom-4 h-2 w-2 -translate-x-1/2 rounded-full transition-transform duration-500 group-hover:duration-2000 ease-out group-hover:scale-[150]",
                dotColor
            )}
            />

            <div className="absolute inset-0 z-10 flex h-full w-full items-center justify-center gap-2 text-primary-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="text-xl">{text}</span>
                <ArrowRight />
            </div>
        </button>
    );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };
