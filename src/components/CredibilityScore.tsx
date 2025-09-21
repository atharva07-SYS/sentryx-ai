import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CredibilityScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function CredibilityScore({ score, size = "md" }: CredibilityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 70) return CheckCircle;
    if (score >= 40) return AlertTriangle;
    return XCircle;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Highly Credible";
    if (score >= 60) return "Likely Credible";
    if (score >= 40) return "Questionable";
    return "Not Credible";
  };

  const Icon = getScoreIcon(score);
  
  const sizes = {
    sm: { text: "text-2xl", icon: "h-6 w-6", container: "p-4" },
    md: { text: "text-4xl", icon: "h-8 w-8", container: "p-6" },
    lg: { text: "text-6xl", icon: "h-12 w-12", container: "p-8" }
  };

  return (
    <motion.div
      className={cn(
        "glass-strong rounded-2xl text-center",
        sizes[size].container
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", duration: 0.6 }}
    >
      <div className="flex items-center justify-center gap-3 mb-2">
        <Icon className={cn(sizes[size].icon, getScoreColor(score))} />
        <motion.span
          className={cn(
            "font-bold tracking-tight",
            sizes[size].text,
            getScoreColor(score)
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {score}
        </motion.span>
      </div>
      <motion.p
        className="text-sm text-muted-foreground font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {getScoreLabel(score)}
      </motion.p>
    </motion.div>
  );
}
