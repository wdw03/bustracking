# 🚍 BusTracker — Smart School & Driver Fleet Tracking System

[![Expo](https://img.shields.io/badge/Expo-v52.0.0-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-v0.76.7-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.3.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

A modern, high-performance universal mobile application built with **React Native**, **Expo Router**, and **TypeScript** for real-time school bus fleet management, live GPS telemetry tracking, driver shift management, and parent communication.

---

## 📸 Overview & Key Features

### ⚡ 1. Ultra-Fast & Responsive UI (0ms Latency)
- Optimized with React Native Native Driver animations (`useNativeDriver: true`) for instant 60FPS UI transitions.
- Non-blocking asynchronous event dispatching for instantaneous touch response.

### 💎 2. Shimmer Skeleton Loading
- Custom pulsing shimmer skeleton loader (`src/components/common/Skeleton.tsx`) displayed during dynamic data fetching and tab switches.

### 🚍 3. Driver Dashboard & Live Telemetry
- **Live Speedometer Gauge**: Real-time speed tracking (`42 km/h`), engine telemetry, and battery status.
- **Dedicated Per-School Location Sharing**: Granular control to start or stop location sharing for individual school routes.
- **Assigned Fleet View**: Quick view of assigned buses, shift schedules (`Morning 7:00 AM – 2:30 PM`), and partner drivers.

### 🔄 4. Smart Navigation & Tab Memory State
- Stack-based dynamic routing (`src/components/main.tsx`).
- Integrated Android Hardware BackHandler that preserves the exact tab state (`Profile`, `Schools`, `Buses`) when navigating back from sub-settings screens.

### 🔒 5. Safe Native Location Service
- Robust native geolocation bridge (`src/services/locationService.ts`) preventing hot-reload Metro bundler crashes during development.

---

## 🔑 Demo Account Credentials

Use the pre-configured credentials below to test the **Driver Portal**:

| Portal | Phone Number | Password | Driver / Account |
| :--- | :--- | :--- | :--- |
| **Driver Portal** | `9876543210` | `1234` | **Rajesh Kumar** (DRV001) |

---

## 📊 JSON Data Schemas & Usage Matrix (किस Page में कौन सा Data Use होता है)

Below is the complete reference of all JSON data structures used in the application, including which page consumes them and what each field is used for:

### 👤 1. Driver Profile JSON (`DRIVER`)
- **Pages Used In**: `driverdashbaord.tsx` (Header & Profile Tab), `personaldetail.tsx`
- **JSON Structure**:
  ```json
  {
    "name": "Rajesh Kumar",
    "driverId": "DRV001",
    "phone": "+91 98765 43210",
    "license": "DL-0420110149646"
  }
  ```
- **Field Purpose**:
  - `name`: Display name rendered in the top greeting header and profile card.
  - `driverId`: Unique system badge ID for official verification and attendance.
  - `phone`: Driver's primary phone number used for login and parent emergency contact.
  - `license`: Driving License number for transport authority compliance.

---

### 🏫 2. School Fleet JSON (`School`)
- **Pages Used In**: `driverdashbaord.tsx` (Home & Schools Tab), `schooldetails.tsx`, `schooldetailsforherserds.tsx`
- **JSON Structure**:
  ```json
  {
    "id": "s1",
    "name": "Green Valley School",
    "code": "GVS-2024-113",
    "address": "Plot 7, Knowledge Park, Sector 62, Noida, UP 201301",
    "principal": "Dr. Meena Sharma",
    "contact": "+91 120 456 7890",
    "email": "office@greenvalley.edu.in",
    "shift": "Morning · 7:00 AM – 2:30 PM",
    "route": "Route A",
    "buses": [ ... ]
  }
  ```
- **Field Purpose**:
  - `id`: Primary key used to map location sharing state (`sharing[schoolId]`).
  - `name`: School title in list cards and search filters.
  - `code`: Affiliation code for instant search filtering (`GVS-2024-113`).
  - `address`: Complete physical address displayed in details view for navigation.
  - `principal`: School principal/head contact name.
  - `contact` & `email`: Direct phone call and email action triggers.
  - `shift`: Operating hours window for driver pickup/drop schedule.
  - `route`: Primary designated transit route.
  - `buses`: Array of bus vehicle objects assigned to this school.

---

### 🚍 3. Bus Fleet & Vehicle JSON (`Bus`)
- **Pages Used In**: `driverdashbaord.tsx` (Bus Tab & Bus Detail View), `busdetaisl.tsx`
- **JSON Structure**:
  ```json
  {
    "id": "b1",
    "number": "DL01AB1234",
    "route": "Route A",
    "model": "Tata Starbus 32-Seater",
    "capacity": "32 seats",
    "partner": "Suresh Yadav",
    "partnerPhone": "+91 98111 22334",
    "pickupTime": "7:10 AM",
    "stops": 12
  }
  ```
- **Field Purpose**:
  - `id`: Unique bus identifier.
  - `number`: Official vehicle license plate number shown on fleet cards.
  - `route`: Route assignment for student tracking.
  - `model`: Vehicle make and seating configuration.
  - `capacity`: Maximum seating limit for student safety audits.
  - `partner` & `partnerPhone`: Helper/conductor contact details for on-bus coordination.
  - `pickupTime`: Morning first student pickup timestamp.
  - `stops`: Total designated route stops.

---

### ⚡ 4. Live Vehicle Telemetry JSON (`Telemetry`)
- **Pages Used In**: `driverdashbaord.tsx` (Bus Detail Telemetry Dashboard), `busdetaisl.tsx`
- **JSON Structure**:
  ```json
  {
    "speed": "42 km/h",
    "engineStatus": "ON",
    "gpsSignal": "STRONG (12 Satellites)",
    "batteryLevel": "98% (13.8V)",
    "fuelLevel": "76%",
    "lastPing": "Just now"
  }
  ```
- **Field Purpose**:
  - `speed`: Real-time vehicle velocity rendered on the 3D speedometer gauge.
  - `engineStatus`: Vehicle ignition state (`ON` / `OFF`).
  - `gpsSignal`: Satellite connection strength for position precision.
  - `batteryLevel`: On-board battery health and voltage.
  - `fuelLevel`: Fuel level percentage for trip planning.

---

### 📡 5. Location Sharing State JSON (`sharing`)
- **Pages Used In**: `driverdashbaord.tsx` (Schools & Bus Detail Views)
- **JSON Structure**:
  ```json
  {
    "s1": true,
    "s2": false,
    "s3": false
  }
  ```
- **Field Purpose**:
  - `key (schoolId)`: Maps each school ID to a `boolean` indicating whether live GPS location broadcast is active (`true`) or inactive (`false`).

---

## 🧠 Codebase Architecture & File Purpose Guide (कौन सा Code किस Purpose के लिए है)

Here is a detailed breakdown of every key file and directory in this repository, explaining its exact role and responsibility:

### 📂 1. Expo Router & Root Entry (`src/app/`)
- 📄 **`src/app/_layout.tsx`**: The top-level root layout wrapper. Configures safe area providers, loads custom fonts (Inter, Sora), initializes global gesture handlers, and sets up status bar styling.
- 📄 **`src/app/index.tsx`**: The main entry screen component. Mounts `MainComponent` from `src/components/main.tsx`.

---

### 📂 2. Main Navigation & Core Auth Components (`src/components/`)
- 📄 **`src/components/main.tsx`**: **The Navigation Brain.** Manages stack history (`history: RouteName[]`), handles instant screen switches (`navigateTo`, `goBack`, `resetTo`), listens to physical Android Back button presses, and remembers the driver's active tab (`initialTab`).
- 📄 **`src/components/loginpageonly.tsx`**: **Login Screen.** Provides user login via Phone Number and Password for Drivers, School Authorities, and Parents.
- 📄 **`src/components/signupmethod.tsx`**: **Registration Role Chooser.** Allows new users to select whether they are registering as a Driver, Parent, or School Authority.
- 📄 **`src/components/signuisngnumber.tsx`**: **Phone Verification Screen.** Collects user phone numbers for OTP authentication during registration.
- 📄 **`src/components/otp.tsx`**: **OTP Verification.** Renders a 4-digit PIN input with a live countdown timer and resend capability.
- 📄 **`src/components/createpasswordpage.tsx`**: **Password Creation.** Allows users to set up a secure account password during registration.
- 📄 **`src/components/forgetpassword.tsx`**: **Password Reset Request.** Handles password recovery prompts via SMS/OTP.
- 📄 **`src/components/forgtrsucesssfull.tsx`**: **Password Reset Success.** Displays confirmation message after password update.
- 📄 **`src/components/schoolsinuppage.tsx`**: **School Signup Form.** Collects school affiliation code, principal details, address, and official email.
- 📄 **`src/components/driversignup.tsx`**: **Driver Signup Form.** Collects driver's DL (Driving License) number, phone, experience, and shift details.
- 📄 **`src/components/loadter.tsx`**: **Animated Loader/Splash.** Renders initial loading animations during app startup.

---

### 📂 3. Driver Portal & Dashboard (`src/components/driver/`)
- 📄 **`src/components/driver/driverdashbaord.tsx`**: **Driver Main Dashboard.** The primary hub for bus drivers featuring:
  - **4 Bottom Tabs**: `Home`, `Schools`, `Bus`, `Profile`.
  - **Video Hero Header Cards**: Dynamic native video clips for each tab (`useVideoPlayer`).
  - **Location Switch**: Dedicated per-school live GPS location sharing toggle.
  - **School & Bus Search**: Instant search filtering for assigned schools and buses.
  - **Shimmer Skeleton Integration**: Automatically displays skeleton loading placeholders during data fetching.

---

### 📂 4. Driver Sub-Pages & Settings (`src/components/driver/driverpages/`)
- 📄 **`src/components/driver/driverpages/personaldetail.tsx`**: Displays driver profile details (Full Name, Driver ID `DRV001`, License number `DL-0420110149646`, Phone number, Emergency contacts).
- 📄 **`src/components/driver/driverpages/schooldetails.tsx`** & **`schooldetailsforherserds.tsx`**: Displays detailed information about assigned schools (School Name, Address, Principal Contact, Shift Timings, Assigned Buses).
- 📄 **`src/components/driver/driverpages/busdetaisl.tsx`**: Displays bus specs, seating capacity, bus model (e.g. *Tata Starbus 32-Seater*), partner helper contacts, and live route telemetry.
- 📄 **`src/components/driver/driverpages/accounysseting.tsx`**: Account settings panel featuring location permission switches, dark mode toggles, language preferences, and delete account option.
- 📄 **`src/components/driver/driverpages/NotificationSettings.tsx`**: Manages push notification alerts, route update sounds, and vibration preferences.

---

### 📂 5. Parent Portal (`src/components/parents/`)
- 📄 **`src/components/parents/partesinup.tsx`**: Parent registration portal for connecting student IDs to assigned school bus routes.

---

### 📂 6. Common Components & UI (`src/components/common/`)
- 📄 **`src/components/common/Skeleton.tsx`**: **Shimmer Loader Module.** Exporting `SkeletonItem`, `SkeletonCard`, and `SkeletonList` components powered by animated opacity loops for dynamic loading states.

---

### 📂 7. Services & Infrastructure (`src/services/`)
- 📄 **`src/services/locationService.ts`**: **GPS & Location Permission Service.** Safe native location service that handles device location permissions without crashing Metro bundler during development.

---

## 🛠️ Technology Stack

- **Framework**: [Expo](https://expo.dev) (v52+) with New Architecture
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Media Engine**: `expo-video` (High-performance native video decoding)
- **Location Services**: `expo-location` (Native GPS Geolocation bridge)
- **UI Components**: Custom 3D Neomorphic & Glassmorphic styling system with `@expo/vector-icons`

---

## 📁 Directory Structure Summary

```
BusTracker/
├── assets/                  # 3D Vehicle icons, media, video clips & fonts
├── src/
│   ├── app/                 # Expo Router file-based entry points (_layout.tsx, index.tsx)
│   ├── components/
│   │   ├── common/          # Reusable UI components (Skeleton.tsx)
│   │   ├── driver/          # Driver Dashboard & sub-pages
│   │   │   ├── driverdashbaord.tsx
│   │   │   └── driverpages/ # PersonalDetails, SchoolDetails, AccountSettings, etc.
│   │   ├── parents/         # Parent portal components & signup
│   │   ├── schooldashboard/ # School authority management dashboard
│   │   ├── loginpageonly.tsx# Authentication screen
│   │   └── main.tsx         # Primary routing & history stack manager
│   └── services/
│       └── locationService.ts # Safe location permission & GPS telemetry service
├── app.json                 # Expo project configuration
├── eas.json                 # Expo Application Services build configuration
├── metro.config.js          # Metro bundler custom configuration
├── package.json             # Project dependencies & scripts
└── README.md                # Project documentation
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
Ensure you have the following installed on your development machine:
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** / **pnpm**
- **Expo Go App** on your physical phone, OR **Android Studio Emulator** / **iOS Simulator**

### 2. Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/wdw03/bustracking.git
   cd BusTracker
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Metro Bundler**:
   ```bash
   npx expo start -c
   ```

4. **Run on Device / Emulator**:
   - Press `a` to open in connected **Android Emulator** or physical device over ADB.
   - Scan the generated **QR Code** using the Expo Go app.

---

## 📱 Building Android APK / Production App (EAS)

This project is fully configured for **Expo Application Services (EAS)** build.

### 1. Install EAS CLI & Login
```bash
npm install -g eas-cli
eas login
```

### 2. Configure Build Project
```bash
eas build:configure
```

### 3. Build Standalone APK (Preview / Distribution)
To generate a direct installable `.apk` file for Android devices:
```bash
eas build -p android --profile preview
```

### 4. Build Production Android App Bundle (.aab)
To generate an app bundle for Google Play Store publishing:
```bash
eas build -p android --profile production
```

---

## 🤝 Git Workflow & Contribution

To commit and push updates to the repository:

```bash
# Check status of modified files
git status

# Stage all changes
git add .

# Commit changes with a descriptive message
git commit -m "docs: Add JSON data schemas and usage matrix to README.md"

# Push to GitHub repository
git push origin main
```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<p align="center">Crafted with ❤️ for Safe School Transportation</p>