// src/WavyOrb.jsx
import { motion, useReducedMotion } from "framer-motion";

/**
 * A lightweight animated "orb" background element.
 * Keeps the build happy and looks good in ImmersivePlayer.
 */
export default function WavyOrb({
  size = 380,
  className = "",
  intensity = 1,
}) {
  const reduced = useReducedMotion();

  const s = typeof size === "number" ? `${size}px` : size;

  if (reduced) {
    return (
      <div
        className={`rounded-full blur-3xl opacity-70 ${className}`}
        style={{
          width: s,
          height: s,
          background:
            "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.55), rgba(168,85,247,0.35), rgba(236,72,153,0.18), transparent 70%)",
        }}
      />
    );
  }

  const dur = Math.max(6, 12 / Math.max(0.6, intensity));

  return (
    <motion.div
      className={`rounded-full blur-3xl opacity-70 ${className}`}
      style={{
        width: s,
        height: s,
        background:
          "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.55), rgba(168,85,247,0.35), rgba(236,72,153,0.18), transparent 70%)",
      }}
      animate={{
        scale: [1, 1.08, 0.98, 1.05, 1],
        rotate: [0, 8, -6, 10, 0],
        x: [0, 14, -10, 16, 0],
        y: [0, -10, 12, -14, 0],
      }}
      transition={{
        duration: dur,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
