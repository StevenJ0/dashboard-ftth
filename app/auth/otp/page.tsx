"use client";

import { useState } from "react";
import OTPRequestForm from "@/components/auth/OTPRequestForm";
import OTPVerifyForm from "@/components/auth/OTPVerifyForm";

export default function OTPPage() {
  const [step, setStep] = useState<"REQUEST" | "VERIFY">("REQUEST");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleRequestSuccess = (phone: string) => {
    setPhoneNumber(phone);
    setStep("VERIFY");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      {step === "REQUEST" ? (
        <OTPRequestForm onSuccess={handleRequestSuccess} />
      ) : (
        <OTPVerifyForm phoneNumber={phoneNumber} />
      )}
    </div>
  );
}
