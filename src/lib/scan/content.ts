export const SCAN_GUIDE = {
  eyebrow: "before you scan",
  title: "Set up for a clean read.",
  body: "Good light and a straight-on frame help us read your skin, hair, and beard accurately.",
  privacy:
    "Your photo stays on this device for now — it is not uploaded to our servers in this build.",
  tips: [
    {
      label: "Light",
      text: "Face a window or soft light. Avoid harsh overhead shadows.",
    },
    {
      label: "Expression",
      text: "Neutral face, relaxed jaw. No filter, no sunglasses.",
    },
    {
      label: "Hair",
      text: "Pull hair off your forehead so we can read your hairline.",
    },
    {
      label: "Frame",
      text: "Head and shoulders in frame, camera at eye level.",
    },
  ],
  continue: "Continue to capture",
} as const;

export const SCAN_CAPTURE = {
  eyebrow: "capture",
  title: "Take your scan.",
  capture: "Capture photo",
  upload: "Upload a photo instead",
  useCamera: "Use camera instead",
  cameraError:
    "Camera access was denied or unavailable. Upload a photo to continue.",
} as const;

export const SCAN_REVIEW = {
  eyebrow: "review",
  title: "Look good?",
  confirm: "Use this photo",
  retake: "Retake",
} as const;

export const SCAN_ERRORS = {
  fileTooLarge: "That file is too large. Please use an image under 10 MB.",
  fileType: "Please upload a JPEG, PNG, or WebP image.",
  saveFailed: "Could not save your photo. Try again or use a smaller image.",
} as const;

export const DASHBOARD = {
  eyebrow: "scan complete",
  title: "You're in.",
  body: "Your profile and feature workflows are coming soon. This selfie will be reused across skin, hair, and beard reads — no need to scan again.",
  retake: "Retake scan",
  home: "Back to home",
} as const;

export const AUTH = {
  signInEyebrow: "welcome back",
  signUpEyebrow: "get started",
  signInTitle: "Log in.",
  signUpTitle: "Create account.",
  emailLabel: "Email",
  passwordLabel: "Password",
  signIn: "Log in",
  signUp: "Create account",
  toggleSignUp: "Need an account? Create one",
  toggleSignIn: "Already have an account? Log in",
  signOut: "Log out",
} as const;
