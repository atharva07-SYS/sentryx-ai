import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "strong" | "subtle";
  hover?: boolean;
}

export function GlassCard({ 
  children, 
  className, 
  variant = "default",
  hover = false 
}: GlassCardProps) {
  const variants = {
    default: "glass-card",
    strong: "glass-strong", 
    subtle: "glass"
  };

  return (
    <motion.div
      className={cn(
        "rounded-2xl p-6",
        variants[variant],
        hover && "transition-all duration-300 hover:scale-[1.02] hover:glow",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { scale: 1.02 } : undefined}
    >
      {children}
    </motion.div>
  );
}
