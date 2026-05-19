import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-blue disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" && "bg-deep-blue text-white shadow-[0_14px_34px_rgba(16,54,92,0.22)] hover:bg-date",
          variant === "secondary" && "bg-gold text-charcoal shadow-[0_14px_34px_rgba(205,163,87,0.22)] hover:bg-date hover:text-white",
          variant === "ghost" && "text-charcoal hover:bg-sand/70",
          variant === "outline" && "border border-charcoal/15 bg-white/60 text-charcoal hover:border-deep-blue/30 hover:bg-white",
          variant === "danger" && "bg-date text-white hover:bg-charcoal",
          size === "sm" && "h-9 px-4 text-sm",
          size === "md" && "h-11 px-5 text-sm",
          size === "lg" && "h-13 px-7 text-base",
          size === "icon" && "h-10 w-10",
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
