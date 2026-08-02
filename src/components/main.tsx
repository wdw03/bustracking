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
    />
  );
}
