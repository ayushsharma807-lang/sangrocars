# SangroCars Native Release Guide

This project ships a native app shell for the live site at `https://sangrocars.in`.

Current native identity:

- App name: `SangroCars`
- Bundle ID / package ID: `in.sangrocars.app`
- Native wrapper config: `capacitor.config.ts`
- Android project: `android/`
- iOS project: `ios/`
- Icon source: `resources/icon.png`
- Splash source: `resources/splash.png`

## 1. Local prerequisites

Install these before building store binaries:

- Node.js `20.x`
- Xcode from the Mac App Store
- Xcode Command Line Tools selected from full Xcode
- Java `17`
- Android Studio
- Android SDK Platform + Build Tools
- Apple Developer account
- Google Play Console account

Recommended local checks:

```bash
xcodebuild -version
java -version
echo "$ANDROID_HOME"
```

## 2. Daily native workflow

From the project root:

```bash
npm install
npm run cap:sync
```

Open the native projects:

```bash
npm run cap:open:ios
npm run cap:open:android
```

If the web URL or app metadata changes, update `capacitor.config.ts` and run:

```bash
npm run cap:sync
```

If the app icon or splash changes, replace `resources/icon.png` and `resources/splash.png`, then run:

```bash
npm run cap:assets
npm run cap:sync
```

## 3. iOS release setup

Open `ios/App/App.xcodeproj` in Xcode.

Set these before the first App Store upload:

- Signing Team
- iOS Deployment Target
- `Bundle Identifier` if Apple rejects `in.sangrocars.app`
- App version in `MARKETING_VERSION`
- Build number in `CURRENT_PROJECT_VERSION`

Suggested first release values:

- Version: `1.0.0`
- Build: `1`

Archive flow:

1. Open `ios/App/App.xcodeproj`
2. Select a real device or `Any iOS Device (arm64)`
3. Product -> Archive
4. Organizer -> Distribute App
5. Upload to App Store Connect
6. Add the build to TestFlight
7. Submit for App Review

## 4. Android release setup

Open `android/` in Android Studio.

Set these before Play Store upload:

- Confirm `applicationId` in `android/app/build.gradle`
- Confirm `versionCode`
- Confirm `versionName`
- Create or import the release keystore
- Configure Play App Signing

Suggested first release values:

- `versionCode 1`
- `versionName "1.0.0"`

Release bundle flow:

1. Open `android/` in Android Studio
2. Wait for Gradle sync
3. Build -> Generate Signed Bundle / APK
4. Choose `Android App Bundle`
5. Use your release keystore
6. Build the `.aab`
7. Upload the `.aab` to Play Console

## 5. Store metadata checklist

Prepare these before submission:

- App name: `SangroCars`
- Subtitle / short description
- Full description
- Keywords
- Support URL
- Privacy Policy URL
- Marketing URL
- Contact email
- App category
- Content rating answers
- Screenshots for iPhone
- Screenshots for Android phone
- App icon

Suggested short description:

`Buy and sell verified used cars across India.`

Suggested full description:

`SangroCars helps buyers discover used cars and helps sellers post listings quickly. Browse verified listings, connect with dealers, compare options, and explore cars across India in one place.`

## 6. Release checklist

- Verify `https://sangrocars.in` is live and stable on mobile
- Verify login, listing browse, seller flow, dealer flow, and contact flow
- Verify app opens HTTPS content without mixed-content errors
- Verify launcher icon and splash screen on both platforms
- Verify privacy policy page exists and is public
- Verify support email is active
- Bump app version and build number
- Create signed release build
- Test on one iPhone and one Android phone
- Upload to TestFlight and internal Play testing first

## 7. Known environment gaps on this machine

These were missing during setup:

- Full Xcode toolchain
- Java runtime
- Android SDK environment variables

The native projects are already generated, but store builds will not run on this machine until those are installed.
