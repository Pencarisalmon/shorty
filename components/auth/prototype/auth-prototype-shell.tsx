"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { PrototypeSwitcher, PrototypeVariant } from "./prototype-switcher";
import { VariantARegisterSlip } from "./variant-a-register-slip";
import { VariantBVoucherCard } from "./variant-b-voucher-card";
import { VariantCThermalTape } from "./variant-c-thermal-tape";

function PrototypeContent({ mode }: { mode: "sign-in" | "sign-up" }) {
  const searchParams = useSearchParams();
  const rawParam = searchParams?.get("variant")?.toUpperCase();
  const validUrlVariant =
    rawParam === "A" || rawParam === "B" || rawParam === "C"
      ? (rawParam as PrototypeVariant)
      : null;

  const [localVariant, setLocalVariant] = useState<PrototypeVariant>("A");
  const [previewStep, setPreviewStep] = useState<"email" | "otp">("otp");
  const [showError, setShowError] = useState<boolean>(false);

  const activeVariant = validUrlVariant ?? localVariant;

  return (
    <div className="min-h-svh bg-paper flex flex-col justify-between">
      <div className="mx-auto flex w-full max-w-[720px] flex-col px-4 pb-[130px] pt-6 sm:pt-8">
        {/* Global Shorty App Header */}
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b-[3px] border-ink pb-2 text-[13px]">
          <div className="flex items-center gap-2">
            <p className="text-[20px] font-bold tracking-[0.12em]">SHORTY</p>
            <span className="text-[10px] font-bold bg-ink text-paper px-1.5 py-0.5">
              PROTOTYPE
            </span>
          </div>
          <p className="text-muted-foreground tracking-[0.04em] text-[12px] sm:text-[13px]">
            receipt printer for the web
          </p>
        </header>

        {/* Prototype Variant Mount Point */}
        <main className="w-full flex justify-center">
          {activeVariant === "A" && (
            <VariantARegisterSlip
              mode={mode}
              simulatedStep={previewStep}
              showSimulatedError={showError}
            />
          )}
          {activeVariant === "B" && (
            <VariantBVoucherCard
              mode={mode}
              simulatedStep={previewStep}
              showSimulatedError={showError}
            />
          )}
          {activeVariant === "C" && (
            <VariantCThermalTape
              mode={mode}
              simulatedStep={previewStep}
              showSimulatedError={showError}
            />
          )}
        </main>
      </div>

      {/* Floating Switcher Controls */}
      <PrototypeSwitcher
        currentVariant={activeVariant}
        onVariantChange={setLocalVariant}
        previewStep={previewStep}
        onStepChange={setPreviewStep}
        showError={showError}
        onToggleError={() => setShowError((prev) => !prev)}
      />
    </div>
  );
}

export function AuthPrototypeShell({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh bg-paper flex items-center justify-center font-mono text-sm">
          Loading auth prototype…
        </div>
      }
    >
      <PrototypeContent mode={mode} />
    </Suspense>
  );
}
