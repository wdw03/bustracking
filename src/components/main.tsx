import React, { useEffect, useState } from "react";
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
import DriverDashboard from "./driver/driverdashbaord";
import PersonalDetail from "./driver/driverpages/personaldetail";
import SchoolDetails from "./driver/driverpages/schooldetails";
import BusDetails from "./driver/driverpages/busdetaisl";
import AccountSettings from "./driver/driverpages/accounysseting";
import NotificationSettings from "./driver/driverpages/NotificationSettings";

export default function MainComponent() {
  const [loading, setLoading] = useState(true);
  const [currentRoute, setCurrentRoute] = useState<
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
  >("login");
  const [resetPhone, setResetPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<SignupRole | null>(null);

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
        onOpenPersonalDetails={() => setCurrentRoute("driverPersonalDetails")}
        onOpenSchoolDetails={() => setCurrentRoute("driverSchoolDetails")}
        onOpenBusDetails={() => setCurrentRoute("driverBusDetails")}
        onOpenAccountSettings={() => setCurrentRoute("driverAccountSettings")}
        onOpenNotificationSettings={() => setCurrentRoute("driverNotificationSettings")}
        onLogout={() => setCurrentRoute("login")}
      />
    );
  }

  if (currentRoute === "driverPersonalDetails") {
    return <PersonalDetail onBack={() => setCurrentRoute("driverDashboard")} />;
  }

  if (currentRoute === "driverSchoolDetails") {
    return <SchoolDetails onBack={() => setCurrentRoute("driverDashboard")} />;
  }

  if (currentRoute === "driverBusDetails") {
    return <BusDetails onBack={() => setCurrentRoute("driverDashboard")} />;
  }

  if (currentRoute === "driverAccountSettings") {
    return (
      <AccountSettings
        onBack={() => setCurrentRoute("driverDashboard")}
        onChangePassword={() => setCurrentRoute("createPassword")}
        onNotificationSettings={() => setCurrentRoute("driverNotificationSettings")}
        onLogout={() => setCurrentRoute("login")}
        onDeleteAccount={() => setCurrentRoute("login")}
      />
    );
  }

  if (currentRoute === "driverNotificationSettings") {
    return <NotificationSettings onBack={() => setCurrentRoute("driverDashboard")} />;
  }

  /* ─────────────────────────── Signup & Auth Routes ─────────────────────────── */
  if (currentRoute === "signupMethod") {
    return (
      <SignupRolePage
        onLogin={() => setCurrentRoute("login")}
        onSelectRole={(role) => {
          setSelectedRole(role);
          setCurrentRoute("signupNumber");
        }}
      />
    );
  }

  if (currentRoute === "signupNumber") {
    return (
      <RegisterNumberPage
        role={selectedRole}
        onBack={() => setCurrentRoute("signupMethod")}
        onLogin={() => setCurrentRoute("login")}
        onSubmit={(phone) => {
          console.log("Submitted mobile number for registration:", phone, "Role:", selectedRole);
          setResetPhone(phone);
          if (selectedRole === "school") {
            setCurrentRoute("schoolSignup");
          } else if (selectedRole === "driver") {
            setCurrentRoute("driverSignup");
          } else if (selectedRole === "parent") {
            setCurrentRoute("parentSignup");
          }
        }}
      />
    );
  }

  if (currentRoute === "schoolSignup") {
    return (
      <SchoolSignupPage
        onBack={() => setCurrentRoute("signupNumber")}
        onSubmit={(data) => {
          console.log("School Signup Complete:", data);
          setResetPhone(data.adminMobile || data.schoolPhone || resetPhone || "9876543210");
          setCurrentRoute("otp");
        }}
      />
    );
  }

  if (currentRoute === "driverSignup") {
    return (
      <DriverSignupPage
        onBack={() => setCurrentRoute("signupNumber")}
        onSubmit={(data) => {
          console.log("Driver Signup Complete:", data);
          setResetPhone(resetPhone || "9876543210");
          setCurrentRoute("otp");
        }}
      />
    );
  }

  if (currentRoute === "parentSignup") {
    return (
      <ParentSignupPage
        onBack={() => setCurrentRoute("signupNumber")}
        onSubmit={(data) => {
          console.log("Parent Signup Complete:", data);
          setResetPhone(resetPhone || "9876543210");
          setCurrentRoute("otp");
        }}
      />
    );
  }

  if (currentRoute === "forgetPassword") {
    return (
      <ForgetPassword
        onBack={() => setCurrentRoute("login")}
        onOtpSent={(phone) => {
          setResetPhone(phone);
          setCurrentRoute("otp");
        }}
        onResetSuccess={() => setCurrentRoute("login")}
      />
    );
  }

  if (currentRoute === "otp") {
    return (
      <OtpVerification
        phoneNumber={resetPhone}
        onBack={() =>
          setCurrentRoute(
            selectedRole === "school"
              ? "schoolSignup"
              : selectedRole === "driver"
                ? "driverSignup"
                : selectedRole === "parent"
                  ? "parentSignup"
                  : selectedRole
                    ? "signupNumber"
                    : "forgetPassword",
          )
        }
        onVerified={() => {
          if (selectedRole === "school" || selectedRole === "driver" || selectedRole === "parent") {
            setCurrentRoute("login");
          } else {
            setCurrentRoute("createPassword");
          }
        }}
        onResend={() => console.log("Resend API call placeholder")}
      />
    );
  }

  if (currentRoute === "createPassword") {
    return (
      <CreatePasswordPage
        onBack={() => setCurrentRoute("login")}
        onSuccess={() => setCurrentRoute("passwordSuccess")}
      />
    );
  }

  if (currentRoute === "passwordSuccess") {
    return (
      <PasswordSuccessPage
        onGetStarted={() => setCurrentRoute("login")}
      />
    );
  }

  return (
    <Sinuplogin
      onSignUp={() => setCurrentRoute("signupMethod")}
      onForgotPassword={() => setCurrentRoute("forgetPassword")}
      onLoginSuccess={(phone) => {
        console.log("Login Success for:", phone);
        setCurrentRoute("driverDashboard");
      }}
    />
  );
}
