"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyOTP } from "@/lib/authApi";
import { useAuthStore } from "@/lib/stores/authStore";

const OTPVerificationContent = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const searchParams = useSearchParams();
  const phoneNumber = searchParams.get("phone");
  const isSignup = searchParams.get("isSignup") === "true";

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [signUpName, setSignUpName] = useState("");

  useEffect(() => {
    if (!phoneNumber) {
      router.replace("/login");
    }
  }, [phoneNumber, router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!digits) return;
    const newOtp = ["", "", "", "", "", ""];
    digits.split("").forEach((d, i) => {
      newOtp[i] = d;
    });
    setOtp(newOtp);
    const nextEmpty = Math.min(digits.length, 5);
    inputRefs.current[nextEmpty]?.focus();
  };

  const handleVerify = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await verifyOTP(
        phoneNumber!,
        otpValue,
        isSignup ? signUpName : undefined,
      );
      if (response.success) {
        setAuth({
          user: response.user,
          tokens: response.tokens,
        });
        router.replace("/"); // Redirect to home on success
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!phoneNumber) return null;

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] shadow-xl p-8 w-full max-w-sm border border-slate-100 flex flex-col items-center">
          <div className="mb-8 w-full text-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Verify OTP
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Code sent to{" "}
              <span className="font-bold text-slate-800">
                +91 {phoneNumber}
              </span>
            </p>
          </div>

          {error && (
            <div className="w-full bg-red-50 border border-red-200 rounded-xl p-3 mb-6">
              <p className="text-red-600 text-sm font-medium text-center">
                {error}
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-center mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading}
                className="w-11 h-14 text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-slate-800"
              />
            ))}
          </div>

          {isSignup && (
            <div className="w-full relative mb-6">
              <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-3 outline-none focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-200 transition-all">
                <span className="text-xl mr-2">👤</span>
                <div className="w-px h-6 bg-slate-300 mx-2" />
                <input
                  type="text"
                  placeholder="Your Name (Required)"
                  className="flex-1 bg-transparent border-none outline-none text-slate-800 font-medium placeholder-slate-400 w-full"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={
              loading ||
              otp.join("").length !== 6 ||
              (isSignup && signUpName.trim().length === 0)
            }
            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-lg py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? "Verifying..." : "Verify & Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function OTPVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          Loading...
        </div>
      }
    >
      <OTPVerificationContent />
    </Suspense>
  );
}
