"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  type Icon,
  PawPrint,
} from "@phosphor-icons/react";
import {
  type CSSProperties,
  memo,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { LcdDisplay, type LcdState } from "@/components/keyboard/lcd-display";
import { DISPLAY, KEY_BY_CODE, KEYS, type KeyDef, type KeyIcon } from "@/lib/keyboard/layout";
import { playKeySound, preloadPack } from "@/lib/keyboard/sound";
import type { SoundPackId } from "@/lib/settings/options";
import { cn } from "@/lib/utils";

const ICONS: Record<KeyIcon, Icon> = {
  up: ArrowUp,
  down: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight,
  paw: PawPrint,
};

type Register = (code: string, node: HTMLElement | null) => void;
type Handler = (code: string) => void;

function place(x: number, y: number, w: number, h = 1): CSSProperties {
  return {
    left: `calc(var(--u) * ${x})`,
    top: `calc(var(--u) * ${y})`,
    width: `calc(var(--u) * ${w})`,
    height: `calc(var(--u) * ${h})`,
  };
}

function Legend({ keyDef }: { keyDef: KeyDef }) {
  const { legend, shift, icon, tone } = keyDef;
  const IconGlyph = icon ? ICONS[icon] : null;

  if (IconGlyph && !legend) {
    return (
      <span className="flex flex-1 items-center justify-center">
        <IconGlyph className="size-[calc(var(--u)*0.24)]" weight="bold" />
      </span>
    );
  }
  if (shift) {
    return (
      <>
        <span className="text-[calc(var(--u)*0.17)] opacity-70">{shift}</span>
        <span className="text-[calc(var(--u)*0.2)]">{legend}</span>
      </>
    );
  }
  if (tone === "alpha" && legend && legend.length === 1) {
    return <span className="text-[calc(var(--u)*0.24)]">{legend}</span>;
  }
  return (
    <span className="mt-auto flex items-end justify-between text-[calc(var(--u)*0.15)] lowercase tracking-wide">
      {legend}
      {IconGlyph && <IconGlyph className="size-[calc(var(--u)*0.22)]" weight="duotone" />}
    </span>
  );
}

interface KeyProps {
  keyDef: KeyDef;
  onPress: Handler;
  onRelease: Handler;
  register: Register;
}

const Key = memo(function Key({ keyDef, onPress, onRelease, register }: KeyProps) {
  const { code } = keyDef;

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onPress(code);
  };

  return (
    <button
      aria-label={keyDef.legend ?? keyDef.icon ?? code}
      className="kb-key"
      data-tone={keyDef.tone}
      onLostPointerCapture={() => onRelease(code)}
      onPointerCancel={() => onRelease(code)}
      onPointerDown={handlePointerDown}
      onPointerUp={() => onRelease(code)}
      ref={(node) => {
        register(code, node);
        return () => register(code, null);
      }}
      style={place(keyDef.x, keyDef.y, keyDef.w)}
      tabIndex={-1}
      type="button"
    >
      <span className="kb-cap">
        <span className="kb-face">
          <Legend keyDef={keyDef} />
        </span>
      </span>
    </button>
  );
});

const KeyField = memo(function KeyField(props: Omit<KeyProps, "keyDef">) {
  return KEYS.map((keyDef) => <Key key={keyDef.code} keyDef={keyDef} {...props} />);
});

interface KeyboardSound {
  enabled: boolean;
  pack: SoundPackId;
  volume: number;
}

interface MechanicalKeyboardProps {
  className?: string;
  lcd: LcdState;
  sound: KeyboardSound;
}

export function MechanicalKeyboard({ className, lcd, sound }: MechanicalKeyboardProps) {
  const nodesRef = useRef(new Map<string, HTMLElement>());
  const heldRef = useRef(new Set<string>());
  const audioRef = useRef(sound);
  const [taps, setTaps] = useState(0);
  const { enabled, pack, volume } = sound;

  useEffect(() => {
    audioRef.current = { enabled, pack, volume };
    if (enabled) {
      void preloadPack(pack);
    }
  }, [enabled, pack, volume]);

  const register = useCallback<Register>((code, node) => {
    if (node) {
      nodesRef.current.set(code, node);
    } else {
      nodesRef.current.delete(code);
    }
  }, []);

  const press = useCallback<Handler>((code) => {
    const keyDef = KEY_BY_CODE.get(code);
    if (!keyDef || heldRef.current.has(code)) {
      return;
    }
    heldRef.current.add(code);
    nodesRef.current.get(code)?.setAttribute("data-pressed", "");
    if (audioRef.current.enabled) {
      playKeySound(audioRef.current.pack, keyDef.sound, "down", audioRef.current.volume);
    }
    setTaps((count) => count + 1);
  }, []);

  const release = useCallback<Handler>((code) => {
    if (!heldRef.current.delete(code)) {
      return;
    }
    nodesRef.current.get(code)?.removeAttribute("data-pressed");
    const keyDef = KEY_BY_CODE.get(code);
    if (keyDef && audioRef.current.enabled) {
      playKeySound(audioRef.current.pack, keyDef.sound, "up", audioRef.current.volume);
    }
  }, []);

  useEffect(() => {
    const releaseAll = () => {
      for (const code of [...heldRef.current]) {
        release(code);
      }
    };
    const handleDown = (event: KeyboardEvent) => {
      if (!event.repeat) {
        press(event.code);
      }
    };
    const handleUp = (event: KeyboardEvent) => {
      release(event.code);
      if (event.key === "Meta") {
        releaseAll();
      }
    };
    const handleVisibility = () => {
      if (document.hidden) {
        releaseAll();
      }
    };
    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
      window.removeEventListener("blur", releaseAll);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [press, release]);

  return (
    <div className={cn("kb-root w-full", className)}>
      <div className="kb">
        <div className="kb-plate">
          <KeyField onPress={press} onRelease={release} register={register} />
          <div className="kb-lcd" style={place(DISPLAY.x, DISPLAY.y, DISPLAY.w, DISPLAY.h)}>
            <LcdDisplay state={lcd} taps={taps} />
          </div>
        </div>
        <span className="absolute right-[calc(var(--u)*0.55)] bottom-[calc(var(--u)*0.12)] font-semibold text-[calc(var(--u)*0.14)] text-[var(--kb-brand)] lowercase tracking-[0.3em]">
          keyclash 75
        </span>
      </div>
    </div>
  );
}
