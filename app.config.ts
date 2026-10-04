import type { ExpoConfig } from "expo/config";

// Reads secrets/config from environment variables set in the project's
// environment settings (cloud env menu -> Edit, or a local .env for
// `expo start` via EXPO_PUBLIC_*-style tooling). Nothing sensitive is
// hardcoded here, and the Tink client *secret* must never appear in this
// file or anywhere in the app bundle -- only the backend touches it.
const config: ExpoConfig = {
  name: "financial-hub",
  slug: "financial-hub",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  scheme: "financialhub",
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  extra: {
    supabaseUrl: process.env.SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
    // Tink CLIENT ID only -- this is not secret, it's fine in the client bundle.
    tinkClientId: process.env.TINK_CLIENT_ID ?? "",
    tinkRedirectUri: process.env.TINK_REDIRECT_URI ?? "financialhub://tink-callback",
    apiBaseUrl: process.env.API_BASE_URL ?? "",
  },
};

export default config;
