import React, { useCallback, useEffect, useState } from "react";
import { BackHandler } from "react-native";
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
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<RouteName[]>(["login"]);
  const [resetPhone, setResetPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<SignupRole | null>(null);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // Wait for onboarding/splash

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Onboardingpage />;
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
        onLogout={() => resetTo("login")}
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
        onLogout={() => resetTo("login")}
        onDeleteAccount={() => resetTo("login")}
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
          console.log("Submitted mobile number for registration:", phone, "Role:", selectedRole);
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
        onBack={goBack}
        onSubmit={(data) => {
          console.log("School Signup Complete:", data);
          addSchoolRegistrationRequest(data);
          setResetPhone(data.adminMobile || data.schoolPhone || resetPhone || "9876543210");
          navigateTo("otp");
        }}
      />
    );
  }

  if (currentRoute === "driverSignup") {
    return (
      <DriverSignupPage
        onBack={goBack}
        onSubmit={(data) => {
          console.log("Driver Signup Complete:", data);
          setResetPhone(resetPhone || "9876543210");
          navigateTo("otp");
        }}
      />
    );
  }

  if (currentRoute === "parentSignup") {
    return (
      <ParentSignupPage
        onBack={goBack}
        onSubmit={(data) => {
          console.log("Parent Signup Complete:", data);
          setResetPhone(resetPhone || "9876543210");
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
        onVerified={() => {
          if (selectedRole === "school" || selectedRole === "driver" || selectedRole === "parent") {
            resetTo("login");
          } else {
            navigateTo("createPassword");
          }
        }}
        onResend={() => console.log("Resend API call placeholder")}
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
    return <SchoolDashboardMain onLogout={() => resetTo("login")} />;
  }

  if (currentRoute === "parentDashboard") {
    return <ParentsHomeDashboard onLogout={() => resetTo("login")} />;
  }

  if (currentRoute === "superAdminPanel") {
    return <SuperAdminPagesRouter onLogout={() => resetTo("login")} />;
  }

  return (
    <Sinuplogin
      onSignUp={() => navigateTo("signupMethod")}
      onForgotPassword={() => navigateTo("forgetPassword")}
      onLoginSuccess={(phone) => {
        console.log("Login Success for:", phone);
        if (phone === "8789968980") {
          resetTo("schoolDashboard");
        } else if (phone === "9826751348") {
          resetTo("superAdminPanel");
        } else if (phone === "9876543210" || phone === "9102765934") {
          resetTo("parentDashboard");
        } else if (phone === "9810839381") {
          resetTo("driverDashboard");
        } else {
          resetTo("driverDashboard");
        }
      }}
    />
  );
}
