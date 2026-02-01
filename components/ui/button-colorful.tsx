import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonColorfulProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label?: string;
    isLoading?: boolean;
}

export function ButtonColorful({
    className,
    label = "Explore Components",
    isLoading = false,
    disabled,
    ...props
}: ButtonColorfulProps) {
    return (
        <Button
            disabled={disabled || isLoading}
            className={cn(
                "relative h-10 px-4 overflow-hidden",
                "bg-zinc-900 dark:bg-zinc-100",
                "transition-all duration-200",
                "group",
                className
            )}
            {...props}
        >
            {/* Gradient background effect */}
            <div
                className={cn(
                    "absolute inset-0",
                    "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
                    "opacity-40 group-hover:opacity-80",
                    "blur transition-opacity duration-500",
                    (disabled || isLoading) && "opacity-20 group-hover:opacity-20" // Dim when disabled
                )}
            />

            {/* Content */}
            <div className="relative flex items-center justify-center gap-2">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-white dark:text-zinc-900" />}
                <span className="text-white dark:text-zinc-900">{label}</span>
            </div>
        </Button>
    );
}


