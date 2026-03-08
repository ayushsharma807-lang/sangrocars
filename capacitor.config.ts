import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.sangrocars.app",
  appName: "SangroCars",
  webDir: "app",
  server: {
    url: "https://sangrocars.in",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: ["sangrocars.in", "*.sangrocars.in"],
  },
};

export default config;
