"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AnimatedGradient({ className }: { className?: string }) {
  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(205,163,87,0.22),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(82,133,184,0.18),transparent_28%),linear-gradient(135deg,#fbf6ee_0%,#f6ead9_38%,#eef5fb_100%)]",
        className,
      )}
      animate={{ backgroundPosition: ["0% 0%", "100% 50%", "0% 0%"] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
