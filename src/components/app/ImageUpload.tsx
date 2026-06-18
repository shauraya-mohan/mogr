"use client";

import { useRef } from "react";
import { SCAN_ERRORS } from "@/lib/scan/content";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

interface ImageUploadProps {
  onSelect: (dataUrl: string) => void;
  onError: (message: string) => void;
}

export default function ImageUpload({ onSelect, onError }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_BYTES) {
      onError(SCAN_ERRORS.fileTooLarge);
      e.target.value = "";
      return;
    }

    if (!ACCEPT.split(",").some((t) => file.type === t.trim())) {
      onError(SCAN_ERRORS.fileType);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onSelect(reader.result);
    };
    reader.onerror = () => onError(SCAN_ERRORS.saveFailed);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="font-mono text-[13px] text-graphite transition-colors duration-[400ms] hover:text-bronze underline-offset-4 hover:underline"
      >
        upload a photo
      </button>
    </>
  );
}

export function ImageUploadTrigger({
  onSelect,
  onError,
  label,
}: ImageUploadProps & { label: string }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_BYTES) {
      onError(SCAN_ERRORS.fileTooLarge);
      e.target.value = "";
      return;
    }

    if (!ACCEPT.split(",").some((t) => file.type === t.trim())) {
      onError(SCAN_ERRORS.fileType);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onSelect(reader.result);
    };
    reader.onerror = () => onError(SCAN_ERRORS.saveFailed);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="font-mono text-[13px] text-graphite transition-colors duration-[400ms] hover:text-bronze"
      >
        {label}
      </button>
    </>
  );
}
