import React, { useEffect, useState } from "react";
import Sinuplogin from "./loginpageonly";
import Onboardingpage from "./loadter";
import ForgetPassword from "./forgetpassword";
import OtpVerification from "./otp";
import CreatePasswordPage from "./createpasswordpage";
import PasswordSuccessPage from "./forgtrsucesssfull";

export default function MainComponent() {
  const [loading, setLoading] = useState(true);
  const [currentRoute, setCurrentRoute] = useState<"login" | "forgetPassword" | "otp" | "createPassword" | "passwordSuccess">("login");
  const [resetPhone, setResetPhone] = useState("");

  useEffect(() => {
    console.log("MainComponent route changed to:", currentRoute);
  }, [currentRoute]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // Wait for onboarding/splash

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Onboardingpage />;
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
        onBack={() => setCurrentRoute("forgetPassword")}
        onVerified={() => setCurrentRoute("createPassword")}
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
      onForgotPassword={() => setCurrentRoute("forgetPassword")}
    />
  );
}
