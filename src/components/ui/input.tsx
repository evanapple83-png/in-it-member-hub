import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-2xl border border-charcoal/12 bg-white/80 px-4 text-sm text-charcoal shadow-sm outline-none transition placeholder:text-charcoal/40 focus:border-deep-blue/40 focus:ring-4 focus:ring-dutch-blue/20",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-2xl border border-charcoal/12 bg-white/80 px-4 py-3 text-sm text-charcoal shadow-sm outline-none transition placeholder:text-charcoal/40 focus:border-deep-blue/40 focus:ring-4 focus:ring-dutch-blue/20",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
