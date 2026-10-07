"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

interface AnimatedNumberProps {
  className?: string;
  duration?: number;
  suffix?: string;
  value: number;
}

export function AnimatedNumber({
  className,
  duration = 0.9,
  suffix = "",
  value,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) => `${Math.round(latest)}${suffix}`);

  useEffect(() => {
    const controls = animate(motionValue, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [motionValue, value, duration]);

  return <motion.span className={className}>{display}</motion.span>;
}
