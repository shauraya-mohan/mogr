"use client";

/**
 * SKIN AGENT OWNS THIS FILE.
 * Rendered inside the dashboard "Edit preferences" modal under the Skin tab.
 * Replace this stub with the skin preferences form (pills like the hair
 * questionnaire) and persist to skin_profiles.questionnaire via the browser
 * supabase client — mirror components/dashboard/EditPreferences.tsx's hair tab.
 */
export default function SkinPreferences() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <p className="font-display text-[20px] font-bold tracking-[-0.02em]">
        Skin<span className="dot">.</span>
      </p>
      <p className="max-w-[36ch] text-[14px] leading-relaxed text-graphite">
        Editable skin preferences are coming soon.
      </p>
    </div>
  );
}
