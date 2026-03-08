"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OTPVerifyFormProps {
  phoneNumber: string;
  onSuccess?: () => void;
}

export default function OTPVerifyForm({ phoneNumber, onSuccess }: OTPVerifyFormProps) {
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Verification failed");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to dashboard or home on success
        // Adjust standard path as needed
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-2xl shadow-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-800">Verify OTP</h2>
      <p className="text-center text-sm text-gray-600">
        Cek pesan dari Bot Telegram untuk nomor <span className="font-semibold">{phoneNumber}</span>
      </p>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 mb-1">
            OTP Code
          </label>
          <input
            type="text"
            id="otpCode"
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-gray-900 text-center tracking-[0.5em] font-bold text-xl"
            placeholder="123456"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            required
            maxLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 text-white bg-red-600 rounded-xl font-medium hover:bg-red-700 disabled:opacity-70 transition-colors shadow-lg shadow-red-100 hover:shadow-red-200"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}

