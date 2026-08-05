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

### 📂 7. Services & Infrastructure (`src/services/`)
- 📄 **`src/services/locationService.ts`**: **GPS & Location Permission Service.** Safe native location service that handles device location permissions without crashing Metro bundler during development.

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
git commit -m "docs: Update README with School Dashboard details while retaining old JSON schemas"

# Push to GitHub
git push
```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<p align="center">Crafted with ❤️ for Safe School Transportation</p>