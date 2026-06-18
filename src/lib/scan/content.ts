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
  scanning: "Scanning…",
  upload: "Upload a photo instead",
  useCamera: "Use camera instead",
  cameraError:
    "Camera access was denied or unavailable. Upload a photo to continue.",

  // Side panel (fills the wide-screen space next to the camera)
  sideEyebrow: "groommax",
  sideTitle: "A clean frame, a sharper read",
  sideBody:
    "Line up like you would for a fresh cut — straight on, good light, nothing hiding your face. One pass reads your skin, hair and beard.",
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

export const VERIFY = {
  waitingEyebrow: "one more step",
  waitingTitle: "Check your inbox.",
  waitingBody:
    "We emailed you a 6-digit code and a confirmation link. Enter the code below — it works from any device — or open the link on this computer.",
  waitingHint: "Verified on your phone? Just type the code here.",

  // Code-entry form
  emailLabel: "Email",
  codeLabel: "6-digit code",
  codePlaceholder: "000000",
  verifyButton: "Verify & continue",
  needEmail: "Enter the email you signed up with.",
  codeInvalid: "Enter the 6-digit code from your email.",

  successEyebrow: "you're verified",
  successTitle: "You're in.",
  successBody: (seconds: number) =>
    `Redirecting to your scan in ${seconds} second${seconds !== 1 ? "s" : ""}…`,

  errorEyebrow: "something went wrong",
  errorTitle: "Verification failed.",
  backToLogin: "← Back to login",
};

