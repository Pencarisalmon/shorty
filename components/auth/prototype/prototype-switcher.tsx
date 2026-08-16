"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useCallback } from "react";
import Link from "next/link";

export type PrototypeVariant = "A" | "B" | "C";

const VARIANTS: { id: PrototypeVariant; label: string; tag: string }[] = [
  {
    id: "A",
    label: "Variant A — Itemized Register Slip",
    tag: "Continuous Narrow Cash Register Slip with Tear-off Stub",
  },
  {
    id: "B",
    label: "Variant B — Perforated Voucher Card",
    tag: "Two-Part Express Pass & Verification Voucher with Cut-out Notches",
  },
  {
    id: "C",
    label: "Variant C — Thermal Tape Strip",
    tag: "Continuous Paper Feed with Stamped Badges & Mode Switcher",
  },
];

export function PrototypeSwitcher({
  currentVariant,
  onVariantChange,
  previewStep,
  onStepChange,
  showError,
  onToggleError,
}: {
  currentVariant: PrototypeVariant;
  onVariantChange: (v: PrototypeVariant) => void;
  previewStep: "email" | "otp";
  onStepChange: (s: "email" | "otp") => void;
  showError: boolean;
  onToggleError: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentIndex = VARIANTS.findIndex((v) => v.id === currentVariant);
  const current = VARIANTS[currentIndex >= 0 ? currentIndex : 0];

  const cycleVariant = useCallback(
    (direction: 1 | -1) => {
      const nextIndex =
        (currentIndex + direction + VARIANTS.length) % VARIANTS.length;
      const nextVariant = VARIANTS[nextIndex].id;
      onVariantChange(nextVariant);
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("variant", nextVariant);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [currentIndex, onVariantChange, pathname, router, searchParams]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        cycleVariant(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        cycleVariant(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cycleVariant]);

  return (
    <aside
      aria-label="Prototype variant controls"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 max-w-[95vw]"
    >
      {/* Simulation Controls (Step toggle & Error toggle) */}
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-none border-2 border-ink bg-white px-3 py-1.5 shadow-[3px_3px_0_0_var(--ink)] text-[11px] font-bold">
        <span className="text-muted-foreground mr-1">SIMULATE:</span>
        <div className="inline-flex border border-ink">
          <button
            type="button"
            onClick={() => onStepChange("email")}
            className={`px-2 py-0.5 transition-colors cursor-pointer ${
              previewStep === "email"
                ? "bg-ink text-paper"
                : "bg-white text-ink hover:bg-[#eaeae2]"
            }`}
          >
            STEP 1: EMAIL
          </button>
          <button
            type="button"
            onClick={() => onStepChange("otp")}
            className={`px-2 py-0.5 border-l border-ink transition-colors cursor-pointer ${
              previewStep === "otp"
                ? "bg-ink text-paper"
                : "bg-white text-ink hover:bg-[#eaeae2]"
            }`}
          >
            STEP 2: 6-DIGIT OTP
          </button>
        </div>
        <button
          type="button"
          onClick={onToggleError}
          className={`cursor-pointer px-2 py-0.5 border border-ink transition-colors ${
            showError
              ? "bg-error text-white font-bold"
              : "bg-white text-muted-foreground hover:text-ink"
          }`}
        >
          {showError ? "ERROR: ON" : "ERROR: OFF"}
        </button>
        <span className="h-3 w-px bg-line mx-1" />
        <Link
          href={pathname === "/sign-in" ? "/sign-up" : "/sign-in"}
          className="text-stamp hover:underline underline-offset-2"
        >
          GO TO {pathname === "/sign-in" ? "/sign-up" : "/sign-in"} ↗
        </Link>
      </div>

      {/* Main Variant Switcher Bar */}
      <div className="flex items-center gap-2 rounded-none border-2 border-ink bg-ink px-3 py-2 text-paper shadow-[4px_4px_0_0_rgba(0,0,0,0.4)]">
        <button
          type="button"
          onClick={() => cycleVariant(-1)}
          aria-label="Previous UI Variant"
          className="cursor-pointer rounded-none border border-paper/40 bg-ink px-2 py-1 text-[13px] font-bold hover:bg-paper hover:text-ink transition-colors"
        >
          ← [Prev]
        </button>

        <div className="flex flex-col items-center px-2 text-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-stamp font-bold">
              PROTOTYPE #26
            </span>
            <span className="text-[13px] font-bold tracking-wider">
              {current.label}
            </span>
          </div>
          <span className="text-[10px] text-paper/70 font-mono tracking-tight hidden sm:inline">
            {current.tag}
          </span>
        </div>

        <button
          type="button"
          onClick={() => cycleVariant(1)}
          aria-label="Next UI Variant"
          className="cursor-pointer rounded-none border border-paper/40 bg-ink px-2 py-1 text-[13px] font-bold hover:bg-paper hover:text-ink transition-colors"
        >
          [Next] →
        </button>
      </div>
    </aside>
  );
}
