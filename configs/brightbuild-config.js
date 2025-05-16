module.exports = {
  intake: {
    requiredFields: {
      value: [
        "full_name",
        "email",
        "phone",
        "project_type",
        "location",
        "budget",
        "timeline",
        "must_have_features",
        "additional_notes"
      ]
    }
  },
  submission: {
    photoField: { value: "site_photo" },
    photoRequired: { enabled: true },
    generatePdfWithoutPhoto: { enabled: false },
    uploadToDrive: { enabled: true },
    emailTarget: { value: "hello@brightbuild.ai" }
  },
  pdf: {
    generatePDF: { enabled: true },
    header: { value: "BrightBuild Project Summary" },
    includeImages: { enabled: true },
    logoPlacement: { value: "top-left" },
    watermark: { value: "/branding/brightbuild/watermark.png" },
    footerText: { value: "Powered by Solomon AI • BrightBuild" },
    filenamePrefix: { value: "BrightBuild-" }
  },
  modules: {
    MonitorAI: { fallbackEnabled: { enabled: true } },
    Stripe: { enabled: true },
    OCR: { enabled: true },
    Analytics: { enabled: true }
  },
  branding: {
    brandingKey: { value: "brightbuild" },
    logoUrl: { value: "/branding/brightbuild/logo.png" },
    watermarkUrl: { value: "/branding/brightbuild/watermark.png" },
    primaryColor: { value: "#FF5733" }
  },
  ui: {
    typingIndicator: { enabled: true },
    exitMessage: { value: "Thanks for reaching out to BrightBuild!" },
    photoPrompt: { value: "📸 Upload a photo of your project site or skip to continue." },
    completeMessage: { value: "✅ You're all set! We'll review your info and follow up soon." }
  },
  system: {
    sessionPrefix: { value: "BB-" }
  }
};
