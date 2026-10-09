"use client";

import { motion } from "motion/react";
import { memo, type RefObject } from "react";
import { cn } from "@/lib/utils";

interface WordItemProps {
  active: boolean;
  elementRef?: RefObject<HTMLDivElement | null>;
  hasError: boolean;
  input: string;
  past: boolean;
  word: string;
}

const caretSpring = { type: "spring", stiffness: 700, damping: 38, mass: 0.6 } as const;

function Caret({ side }: { side: "left" | "right" }) {
  return (
    <motion.span
      className={cn(
        "typing-caret absolute top-[0.15em] h-[1.15em] w-[2.5px] rounded-full bg-primary",
        side === "left" ? "-left-px" : "-right-px",
      )}
      layoutId="caret"
      transition={caretSpring}
    />
  );
}

export const WordItem = memo(function WordItem({
  active,
  elementRef,
  hasError,
  input,
  past,
  word,
}: WordItemProps) {
  const caretAtEnd = active && input.length >= word.length;
  const extra = input.length > word.length ? input.slice(word.length) : "";

  return (
    <div
      className={cn(
        "relative",
        past &&
          hasError &&
          "after:absolute after:inset-x-0 after:bottom-0.5 after:h-[2px] after:rounded-full after:bg-danger/50",
      )}
      ref={active ? elementRef : undefined}
    >
      {[...word].map((char, index) => {
        let tone = "text-faint";
        if ((past || active) && index < input.length) {
          tone = input[index] === char ? "text-foreground" : "text-danger";
        }
        return (
          <span className="relative inline-block" key={index}>
            {active && index === input.length && <Caret side="left" />}
            {caretAtEnd && index === word.length - 1 && extra.length === 0 && (
              <Caret side="right" />
            )}
            <span className={cn("transition-colors duration-75", tone)}>{char}</span>
          </span>
        );
      })}
      {[...extra].map((char, index) => (
        <span className="relative inline-block text-danger/60" key={`extra-${index}`}>
          {active && index === extra.length - 1 && <Caret side="right" />}
          {char}
        </span>
      ))}
    </div>
  );
});
