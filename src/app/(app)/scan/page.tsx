"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ScanGuide from "@/components/app/ScanGuide";
import CameraCapture from "@/components/app/CameraCapture";
import ScanReview from "@/components/app/ScanReview";
import { uploadSelfie } from "@/lib/scan/persist";
import { SCAN_ERRORS } from "@/lib/scan/content";

type Step = "guide" | "capture" | "review";

export default function ScanPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("guide");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleCapture(dataUrl: string) {
    setPreview(dataUrl);
    setError(null);
    setStep("review");
  }

  function handleRetake() {
    setPreview(null);
    setStep("capture");
  }

  async function handleConfirm() {
    if (!preview) return;
    setSaving(true);
    setError(null);
    try {
      await uploadSelfie(preview);
      router.push("/dashboard");
    } catch {
      setError(SCAN_ERRORS.saveFailed);
      setSaving(false);
    }
  }

  return (
    <div className="transition-opacity duration-[400ms]">
      {error && (
        <p className="mb-6 text-[14px] text-bronze max-w-[560px]" role="alert">
          {error}
        </p>
      )}

      {step === "guide" && <ScanGuide onContinue={() => setStep("capture")} />}

      {step === "capture" && (
        <CameraCapture onCapture={handleCapture} onError={setError} />
      )}

      {step === "review" && preview && (
        <ScanReview
          imageSrc={preview}
          onConfirm={handleConfirm}
          onRetake={handleRetake}
          saving={saving}
        />
      )}
    </div>
  );
}
