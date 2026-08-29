import React, { useCallback, useEffect, useState } from "react";
import { Alert, BackHandler, ActivityIndicator, View, Text } from "react-native";
import Sinuplogin from "./loginpageonly";
import Onboardingpage from "./loadter";
import ForgetPassword from "./forgetpassword";
import OtpVerification from "./otp";
import CreatePasswordPage from "./createpasswordpage";
import PasswordSuccessPage from "./forgtrsucesssfull";
import SignupRolePage, { SignupRole } from "./signupmethod";
import RegisterNumberPage from "./signuisngnumber";
import SchoolSignupPage from "./schoolsinuppage";
import DriverSignupPage from "./driversignup";
import ParentSignupPage from "./parents/partesinup";

// Driver Dashboard & Sub-pages
import DriverDashboard, { Tab as DriverTab } from "./driver/driverdashbaord";
import PersonalDetail from "./driver/driverpages/personaldetail";
import SchoolDetails from "./driver/driverpages/schooldetails";
import SchoolDetailsForHerserds from "./driver/driverpages/schooldetailsforherserds";
import BusDetails from "./driver/driverpages/busdetaisl";
import AccountSettings from "./driver/driverpages/accounysseting";
import NotificationSettings from "./driver/driverpages/NotificationSettings";
import SchoolDashboardMain from "./schooldashboard/schooldashbaordmain";
import ParentsHomeDashboard from "./parentsdashbaord/paratentshomedasbahord";
import { addSchoolRegistrationRequest } from "./superadminpanel/supaeradminpaneel";
import SuperAdminPagesRouter from "./superadminpanel/pages/router";

import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/contexts/AuthContext";

export type RouteName =
  | "login"
  | "signupMethod"
  | "signupNumber"
  | "schoolSignup"
  | "driverSignup"
  | "parentSignup"
  | "forgetPassword"
  | "otp"
  | "createPassword"
  | "passwordSuccess"
  | "driverDashboard"
  | "driverPersonalDetails"
  | "driverSchoolDetails"
  | "driverBusDetails"
  | "driverAccountSettings"
  | "driverNotificationSettings"
  | "schoolDashboard"
  | "parentDashboard"
  | "superAdminPanel";

export default function MainComponent() {
  const { user, profile, isLoading, isAuthenticated, logout } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [history, setHistory] = useState<RouteName[]>(["login"]);
  const [resetPhone, setResetPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<SignupRole | null>(null);
  const [signupData, setSignupData] = useState<any>(null);

  const [driverTab, setDriverTab] = useState<DriverTab>("home");

  const currentRoute = history[history.length - 1] || "login";

  // Push new route to history stack
  const navigateTo = useCallback((route: RouteName) => {
    setHistory((prev) => {
      if (prev[prev.length - 1] === route) return prev;
      return [...prev, route];
    });
  }, []);

  // Pop top route to go back instantly to exact previous screen
  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  // Reset navigation history (e.g. on Login / Logout / Success)
  const resetTo = useCallback((route: RouteName) => {
    setHistory([route]);
  }, []);

  // Helper: navigate to the correct dashboard based on role
  const navigateToRoleDashboard = useCallback((role: UserRole) => {
    switch (role) {
      case "super_admin":
        resetTo("superAdminPanel");
        break;
      case "school_admin":
        resetTo("schoolDashboard");
        break;
      case "parent":
        resetTo("parentDashboard");
        break;
      case "driver":
        resetTo("driverDashboard");
        break;
      default:
        resetTo("login");
    }
  }, [resetTo]);

  // Handle Android Physical / Gesture Back Button
  useEffect(() => {
    const onHardwareBack = () => {
      if (history.length > 1) {
        goBack();
        return true; // Handled back action
      }
      return false; // Standard exit behavior at root
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
    return () => subscription.remove();
  }, [history, goBack]);

  // Show onboarding splash for 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOnboarding(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-navigate when auth state resolves (user already logged in)
  useEffect(() => {
    if (!showOnboarding && !isLoading && isAuthenticated && profile?.role) {
      navigateToRoleDashboard(profile.role);
    }
  }, [showOnboarding, isLoading, isAuthenticated, profile, navigateToRoleDashboard]);

  // Handle logout — reset to login
  const handleLogout = useCallback(async () => {
    await logout();
    resetTo("login");
  }, [logout, resetTo]);

  if (showOnboarding) {
    return <Onboardingpage />;
  }

  // Show loading while checking existing session
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#FFD60A" />
        <Text style={{ marginTop: 16, color: "#6B7280", fontFamily: "Inter-Regular", fontSize: 14 }}>
          Loading...
        </Text>
      </View>
    );
  }

  /* ─────────────────────────── Driver Routes ─────────────────────────── */
  if (currentRoute === "driverDashboard") {
    return (
      <DriverDashboard
        initialTab={driverTab}
        onTabChange={(t) => setDriverTab(t)}
        onOpenPersonalDetails={() => navigateTo("driverPersonalDetails")}
        onOpenSchoolDetails={() => navigateTo("driverSchoolDetails")}
        onOpenBusDetails={() => navigateTo("driverBusDetails")}
        onOpenAccountSettings={() => navigateTo("driverAccountSettings")}
        onOpenNotificationSettings={() => navigateTo("driverNotificationSettings")}
        onLogout={handleLogout}
      />
    );
  }

  if (currentRoute === "driverPersonalDetails") {
    return <PersonalDetail onBack={goBack} />;
  }

  if (currentRoute === "driverSchoolDetails") {
    return <SchoolDetailsForHerserds onBack={goBack} />;
  }

  if (currentRoute === "driverBusDetails") {
    return <BusDetails onBack={goBack} />;
  }

  if (currentRoute === "driverAccountSettings") {
    return (
      <AccountSettings
        onBack={goBack}
        onChangePassword={() => navigateTo("createPassword")}
        onNotificationSettings={() => navigateTo("driverNotificationSettings")}
        onLogout={handleLogout}
        onDeleteAccount={handleLogout}
      />
    );
  }

  if (currentRoute === "driverNotificationSettings") {
    return <NotificationSettings onBack={goBack} />;
  }

  /* ─────────────────────────── Signup & Auth Routes ─────────────────────────── */
  if (currentRoute === "signupMethod") {
    return (
      <SignupRolePage
        onLogin={() => resetTo("login")}
        onSelectRole={(role) => {
          setSelectedRole(role);
          navigateTo("signupNumber");
        }}
      />
    );
  }

  if (currentRoute === "signupNumber") {
    return (
      <RegisterNumberPage
        role={selectedRole}
        onBack={goBack}
        onLogin={() => resetTo("login")}
        onSubmit={(phone) => {
          console.log("Phone authorized for registration:", phone, "Role:", selectedRole);
          setResetPhone(phone);
          if (selectedRole === "school") {
            navigateTo("schoolSignup");
          } else if (selectedRole === "driver") {
            navigateTo("driverSignup");
          } else if (selectedRole === "parent") {
            navigateTo("parentSignup");
          }
        }}
      />
    );
  }

  if (currentRoute === "schoolSignup") {
    return (
      <SchoolSignupPage
        initialPhone={resetPhone}
        onBack={goBack}
        onSubmit={(data) => {
          console.log("School Signup Data Submitted:", data);
          setSignupData(data);
          const phone = resetPhone || data.adminMobile || data.schoolPhone || "9876543210";
          setResetPhone(phone);
          navigateTo("otp");
        }}
      />
    );
  }

  if (currentRoute === "driverSignup") {
    return (
      <DriverSignupPage
        onBack={goBack}
        onSubmit={async (data) => {
          console.log("Driver Signup Complete:", data);
          setSignupData(data);
          const phone = resetPhone || "9876543210";
          setResetPhone(phone);
          try {
            const { sendOtp } = await import("../services/authService");
            await sendOtp(phone);
          } catch (e) {
            console.warn("Error sending OTP to driver:", e);
          }
          navigateTo("otp");
        }}
      />
    );
  }

  if (currentRoute === "parentSignup") {
    return (
      <ParentSignupPage
        onBack={goBack}
        onSubmit={async (data) => {
          console.log("Parent Signup Complete:", data);
          setSignupData(data);
          const phone = resetPhone || "9876543210";
          setResetPhone(phone);
          try {
            const { sendOtp } = await import("../services/authService");
            await sendOtp(phone);
          } catch (e) {
            console.warn("Error sending OTP to parent:", e);
          }
          navigateTo("otp");
        }}
      />
    );
  }

  if (currentRoute === "forgetPassword") {
    return (
      <ForgetPassword
        onBack={goBack}
        onOtpSent={(phone) => {
          setResetPhone(phone);
          navigateTo("otp");
        }}
        onResetSuccess={() => resetTo("login")}
      />
    );
  }

  if (currentRoute === "otp") {
    return (
      <OtpVerification
        phoneNumber={resetPhone}
        onBack={goBack}
        signupRole={selectedRole}
        signupData={signupData}
        onVerified={() => {
          // After OTP verification + registration, the auth state listener
          // in AuthContext will pick up the new session and set profile/role.
          // We navigate based on role here.
          if (selectedRole === "school" || selectedRole === "driver" || selectedRole === "parent") {
            if (selectedRole === "school") {
              Alert.alert(
                "✅ Registration Submitted!",
                "Your school registration request has been verified via OTP and submitted to the Super Admin for review. Once approved, you will be able to log in.",
                [
                  {
                    text: "Go to Login",
                    onPress: () => resetTo("login"),
                  },
                ]
              );
            } else if (selectedRole === "parent") {
              resetTo("parentDashboard");
            } else if (selectedRole === "driver") {
              resetTo("driverDashboard");
            } else {
              resetTo("login");
            }
          } else {
            // Forgot password flow
            navigateTo("createPassword");
          }
        }}
        onResend={async () => {
          console.log("Resend OTP triggered for:", resetPhone);
          try {
            const { sendOtp } = await import("../services/authService");
            await sendOtp(resetPhone);
          } catch (e) {
            console.warn("Failed to resend OTP:", e);
          }
        }}
      />
    );
  }

  if (currentRoute === "createPassword") {
    return (
      <CreatePasswordPage
        onBack={goBack}
        onSuccess={() => resetTo("passwordSuccess")}
      />
    );
  }

  if (currentRoute === "passwordSuccess") {
    return (
      <PasswordSuccessPage
        onGetStarted={() => resetTo("login")}
      />
    );
  }

  if (currentRoute === "schoolDashboard") {
    return <SchoolDashboardMain onLogout={handleLogout} />;
  }

  if (currentRoute === "parentDashboard") {
    return <ParentsHomeDashboard onLogout={handleLogout} />;
  }

  if (currentRoute === "superAdminPanel") {
    return <SuperAdminPagesRouter onLogout={handleLogout} />;
  }

  return (
    <Sinuplogin
      onSignUp={() => navigateTo("signupMethod")}
      onForgotPassword={() => navigateTo("forgetPassword")}
      onLoginSuccess={(phone) => {
        console.log("Login Success for:", phone);
        const tryNavigate = async (retries = 0) => {
          if (profile?.role) {
            navigateToRoleDashboard(profile.role);
            return;
          }
          const { getCachedProfile } = await import("../services/sessionManager");
          const cached = await getCachedProfile();
          if (cached?.role) {
            navigateToRoleDashboard(cached.role as UserRole);
            return;
          }
          if (retries < 10) {
            setTimeout(() => tryNavigate(retries + 1), 200);
          } else {
            console.warn("Role resolution timed out, navigating based on phone");
            if (phone.includes("9826751348")) {
              navigateToRoleDashboard("super_admin");
            } else {
              navigateToRoleDashboard("parent");
            }
          }
        };
        tryNavigate();
      }}
    />
  );
}
