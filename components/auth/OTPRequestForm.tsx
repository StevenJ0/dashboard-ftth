"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OTPRequestFormProps {
  onSuccess: (phoneNumber: string) => void;
}

export default function OTPRequestForm({ onSuccess }: OTPRequestFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // On success, notify parent component to switch to Verify step
      onSuccess(phoneNumber);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-4 bg-white rounded shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-center">Login with OTP</h2>
      <p className="text-center text-xs text-gray-500 mt-2">
        Pastikan nomor Anda telah diverifikasi melalui <b>Bot Telegram</b> (@nama_bot) dengan format <code>/verify {phoneNumber || 'NomorHP'}</code>
      </p>
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone Number
          </label>
          <input
            type="text"
            id="phoneNumber"
            className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="08123456789"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Sending OTP..." : "Request OTP"}
        </button>
      </form>
    </div>
  );
}
