const config = {
  appId: "in.sangrocars.app",
  appName: "SangroCars Wealth",
  webDir: "app",
  server: {
    url: "https://sangrocars.in/wealth/login",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: ["sangrocars.in", "*.sangrocars.in"],
  },
};

export default config;
