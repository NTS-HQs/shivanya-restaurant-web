"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendOTP } from "@/lib/authApi";
import { useAuthStore } from "@/lib/stores/authStore";
import Image from "next/image";

const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkTokenValidity = useAuthStore((state) => state.checkTokenValidity);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated && checkTokenValidity()) {
      router.replace("/"); // or /profile
    }
  }, [isAuthenticated, checkTokenValidity, router]);

  const handleGetOTP = async () => {
    if (phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await sendOTP(phoneNumber);
      if (response.success) {
        // Navigate to OTP verification page with phone number and isSignup flag
        router.push(
          `/login/verify?phone=${phoneNumber}&isSignup=${response.isSignup}`
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] shadow-xl p-8 w-full max-w-sm border border-slate-100 flex flex-col items-center">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center">
              Welcome
            </h1>
            <p className="text-slate-500 text-sm mt-2 text-center">
              Login or sign up to continue.
            </p>
          </div>

          {error && (
            <div className="w-full bg-red-50 border border-red-200 rounded-xl p-3 mb-6">
              <p className="text-red-600 text-sm font-medium text-center">
                {error}
              </p>
            </div>
          )}

          <div className="w-full relative mb-6">
            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-3 outline-none focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-200 transition-all">
              <span className="text-xl mr-2">🇮🇳</span>
              <span className="text-slate-600 font-medium mr-2">+91</span>
              <div className="w-px h-6 bg-slate-300 mx-2" />
              <input
                type="tel"
                placeholder="Mobile Number"
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/\D/g, ""))
                }
                className="flex-1 bg-transparent border-none outline-none text-slate-800 font-medium placeholder-slate-400 w-full"
                maxLength={10}
                disabled={loading}
              />
            </div>
          </div>

          <button
            onClick={handleGetOTP}
            disabled={loading || phoneNumber.length !== 10}
            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-lg py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? "Sending..." : "Get OTP"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
