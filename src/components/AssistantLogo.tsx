import React from "react";
import { motion } from "motion/react";

export type AssistantState = "idle" | "listening" | "thinking" | "processing" | "speaking";

interface AssistantLogoProps {
  className?: string;
  size?: number | string;
  state?: AssistantState;
}

export const AssistantLogo: React.FC<AssistantLogoProps> = ({
  className = "w-10 h-10",
  size,
  state = "idle",
}) => {
  // Subtle professional animations that do not distort the logo
  const variants = {
    idle: {
      scale: 1,
      opacity: 1,
      boxShadow: "0px 0px 0px rgba(0, 0, 0, 0)",
      transition: { duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
    },
    listening: {
      scale: [1, 1.05, 1],
      opacity: 1,
      boxShadow: [
        "0px 0px 10px rgba(244, 63, 94, 0.3)",
        "0px 0px 20px rgba(244, 63, 94, 0.6)",
        "0px 0px 10px rgba(244, 63, 94, 0.3)",
      ],
      transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
    },
    thinking: {
      scale: 1,
      opacity: [0.85, 1, 0.85],
      boxShadow: [
        "0px 0px 8px rgba(56, 189, 248, 0.2)",
        "0px 0px 15px rgba(56, 189, 248, 0.5)",
        "0px 0px 8px rgba(56, 189, 248, 0.2)",
      ],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
    processing: {
      scale: 1.02,
      opacity: 1,
      boxShadow: [
        "0px 0px 12px rgba(168, 85, 247, 0.4)",
        "0px 0px 22px rgba(168, 85, 247, 0.7)",
        "0px 0px 12px rgba(168, 85, 247, 0.4)",
      ],
      transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
    },
    speaking: {
      scale: [1, 1.06, 1, 1.03, 1],
      boxShadow: [
        "0px 0px 12px rgba(16, 185, 129, 0.3)",
        "0px 0px 24px rgba(16, 185, 129, 0.6)",
        "0px 0px 12px rgba(16, 185, 129, 0.3)",
      ],
      transition: { duration: 1.5, repeat: Infinity, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={variants as any}
      animate={state}
      initial="idle"
      className={`relative shrink-0 rounded-full flex items-center justify-center bg-transparent ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <img
        src="/assets/icons/logo.png"
        alt="Assistant Official Logo"
        className="w-full h-full object-contain rounded-full"
        onError={(e) => {
          // Fallback if the user hasn't uploaded their logo.png yet
          (e.target as HTMLImageElement).src = "/vr-logo.svg";
        }}
      />
    </motion.div>
  );
};
