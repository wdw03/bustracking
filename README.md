# 🚍 BusTracker — Smart School & Driver Fleet Tracking System

[![Expo](https://img.shields.io/badge/Expo-v52.0.0-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-v0.76.7-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.3.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

A modern, high-performance universal mobile application built with **React Native**, **Expo Router**, and **TypeScript** for real-time school bus fleet management, live GPS telemetry tracking, driver shift management, parent communication, and full school administrative control.

---

## 📸 Overview & Key Features

### ⚡ 1. Ultra-Fast & Responsive UI (0ms Latency)
- Optimized with React Native Native Driver animations (`useNativeDriver: true`) for instant 60FPS UI transitions.
- Non-blocking asynchronous event dispatching for instantaneous touch response.
- Integrated Dark Mode and Light Mode support with glassmorphic and neomorphic aesthetic design.

### 💎 2. Advanced Custom Skeleton Loading
- Custom pulsing shimmer skeleton loader (`src/components/common/Skeleton.tsx`) used across dashboards during data fetch, creating a seamless user experience.

### 🚍 3. Complete Driver Portal
- **Live Speedometer Gauge**: Real-time speed tracking, engine telemetry, and battery status.
- **Location Sharing**: Dedicated per-school granular control to start or stop location sharing.
- **Assigned Fleet View**: View assigned buses, shift schedules (`Morning 7:00 AM – 2:30 PM`), and helper/conductor details.
- **Profile & Settings**: View driver ID, license, edit notification preferences, and manage account state.

### 🏫 4. Powerful School Admin Dashboard
- **Live Fleet Tracking**: Full-screen interactive map (powered by `MapLibre` & `OpenFreeMap`) tracking every active bus in real time.
- **Student, Parent, & Driver Management**: Dedicated CRUD views to add, remove, search, and manage students, linked parents, and drivers.
- **Bus Fleet Assignment**: Instantly assign students to buses and routes.
- **Subscription & Earnings Hub**: Visual usage analytics, subscription tiers, driver/school commissions, and one-tap IMPS/UPI withdrawal requests with animated processing screens.
- **Notification & Contact Center**: Broadcast real-time alerts to parents/drivers and handle emergency reports.

### 🔄 5. Smart Navigation & Tab Memory State
- Stack-based dynamic routing (`src/components/main.tsx`).
- Integrated Android Hardware BackHandler that preserves tab states (`Profile`, `Schools`, `Buses`) and gracefully handles sub-page nested back navigation without exiting the app.

---

## 🔑 Demo Account Credentials

Use the pre-configured credentials below to test the App Portals:

| Portal | Phone Number | Password | Account Holder |
| :--- | :--- | :--- | :--- |
| **Driver Portal** | `9876543210` | `1234` | **Rajesh Kumar** (DRV001) |
| **School Admin** | `9898989898` | `1234` | **Green Valley School** |

---

## 🧠 Codebase Architecture & File Guide

Here is a detailed breakdown of every key component and directory in this repository:

### 📂 1. Expo Router & Root Entry (`src/app/`)
- 📄 **`src/app/_layout.tsx`**: Top-level root wrapper. Configures safe area providers, loads custom fonts (Inter, Sora), initializes global gesture handlers, and sets up status bar styling.
- 📄 **`src/app/index.tsx`**: Main entry screen component. Mounts `MainComponent` from `src/components/main.tsx`.

### 📂 2. Main Navigation & Core Auth (`src/components/`)
- 📄 **`main.tsx`**: **The Navigation Brain.** Manages stack history, handles instant screen switches (`navigateTo`, `goBack`), intercepts Android hardware back button presses, and coordinates global routing.
- 📄 **`loginpageonly.tsx`**: Login Screen via Phone Number and Password for all roles.
- 📄 **`signupmethod.tsx`**: Role Chooser (Driver, Parent, or School Authority).
- 📄 **`signuisngnumber.tsx`**, **`otp.tsx`**, **`createpasswordpage.tsx`**: Complete mobile OTP verification & password setup flow.
- 📄 **`schoolsinuppage.tsx`** & **`driversignup.tsx`**: Specialized registration forms for schools and drivers.
- 📄 **`loadter.tsx`**: Animated Splash loader.

### 📂 3. School Admin Dashboard (`src/components/schooldashboard/`)
- 📄 **`schooldashbaordmain.tsx`**: **School Root Hub.** Provides 2x2 dynamic grid statistics (Students, Parents, Drivers, Buses) and quick-action access.
- 📄 **`pages/livetracking.tsx`**: Full-screen interactive fleet tracking Map UI.
- 📄 **`pages/studentmanagement.tsx`** & **`parentmanagement.tsx`**: Detailed CRUD pages for students and parents.
- 📄 **`pages/drivermanagement.tsx`** & **`busmanagement.tsx`**: Add/remove buses and drivers with instant search.
- 📄 **`pages/busassignment.tsx`**: Maps a student to a specific bus route.
- 📄 **`pages/subscription.tsx`**: Comprehensive financial center for viewing limits, commission earnings, parent payments, and withdrawing funds.
- 📄 **`pages/notificationcenter.tsx`**, **`contactcenter.tsx`**, **`reports.tsx`**, **`settings.tsx`**: System operations, broadcasting, audits, and configuration.

### 📂 4. Driver Portal & Dashboard (`src/components/driver/`)
- 📄 **`driverdashbaord.tsx`**: **Driver Main Dashboard.** 4 Bottom Tabs (`Home`, `Schools`, `Bus`, `Profile`) featuring dynamic video hero headers.
- 📄 **`driverpages/personaldetail.tsx`**, **`schooldetails.tsx`**, **`busdetaisl.tsx`**: Drill-down panels showing driver ID, route assignments, school schedules, and bus telemetry.
- 📄 **`driverpages/NotificationSettings.tsx`** & **`accounysseting.tsx`**: Preference controls and permissions.

### 📂 5. Parent Portal (`src/components/parents/`)
- 📄 **`partesinup.tsx`**: Parent portal registration logic.

### 📂 6. Common UI & Shared State (`src/components/common/` & `schooldashboard/common.tsx`)
- 📄 **`Skeleton.tsx`**: Modular shimmering placeholders used while data is rendering.
- 📄 **`common.tsx`**: Context provider (`useSchoolData`, `useTheme`) bridging robust dummy JSON state (lists of drivers, students, buses) and global CSS variables across the dashboard.

---

## 📊 Core Data Architecture (JSON Logic)

The app's logic currently relies on robust mock datasets inside `common.tsx` designed to map 1:1 with any future NoSQL (Firebase/MongoDB) schema:

1. **School Schema**: Holds `code`, `principal`, `shift` timings, and linked subscription data.
2. **Bus Schema**: Linked to schools via nested arrays. Contains `status` (Running, Offline), `speed`, `battery`, and mapped `driverId`.
3. **Driver Schema**: Holds personal info, `experience`, `rating`, `license`, and a pointer to `busId`.
4. **Student/Parent Schema**: Relational models linking `parentPhone` -> `students` -> `busId`.
5. **Subscription Schema**: Transaction ledgers, withdrawal request queue, and limit ceilings (students/buses allowed).

---

## 🛠️ Technology Stack

- **Framework**: [Expo](https://expo.dev) (v52+) with Custom Dev Client & New Architecture
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Media Engine**: `expo-video` (High-performance native video decoding)
- **Mapping**: `@maplibre/maplibre-react-native` (Smooth vector tracking)
- **UI & Animations**: `react-native-reanimated` + native `Animated` API

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn**
- **Expo Go App** on your physical phone, OR **Android Studio Emulator**

### 2. Installation Steps

```bash
# 1. Clone the Repository
git clone https://github.com/wdw03/bustracking.git
cd BusTracker

# 2. Install Dependencies
npm install

# 3. Start the Metro Bundler with clean cache
npx expo start -c
```

### 3. Run on Device / Emulator
- Press `a` in terminal to launch in an Android Emulator.
- Scan the generated QR Code using **Expo Go** or compile the custom dev client.

---

## 📱 Building Android APK / Production App (EAS)

This project is fully configured for **Expo Application Services (EAS)** build.

### 1. Build Custom Metro Dev Client APK (For Live Development)
```bash
eas build -p android --profile development
```

### 2. Build Standalone Preview APK (For Testing without Metro)
```bash
eas build -p android --profile preview
```

### 3. Build Production Android App Bundle (.aab) (For Play Store)
```bash
eas build -p android --profile production
```

*(Note: Add `--local` flag to any of these commands to build entirely on your own PC without using Expo's cloud queues, provided Android Studio is installed).*

---

## 🤝 Git Workflow

To commit and push updates to the repository:

```bash
# Stage all changes
git add .

# Commit changes
git commit -m "docs: Comprehensive README update with School Dashboard features"

# Push to GitHub
git push
```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<p align="center">Crafted with ❤️ for Safe School Transportation</p>