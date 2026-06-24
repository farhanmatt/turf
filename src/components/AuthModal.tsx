"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { X, Phone, User, Key, CheckCircle, ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** @deprecated No longer used — kept for backward compatibility */
  initialTab?: "login" | "register";
}

type Step = "phone" | "otp" | "name";

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [name, setName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetModal = () => {
    setStep("phone");
    setPhoneNumber("");
    setOtpCode("");
    setName("");
    setIsNewUser(false);
    setError("");
    setDebugOtp(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  /** Step 1: Send OTP */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        setError("Please enter a valid 10-digit phone number.");
        return;
      }

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: cleanPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send OTP. Please try again.");
      } else {
        setIsNewUser(data.isNewUser);
        setStep("otp");
        if (data.otpDebug) setDebugOtp(data.otpDebug);
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  /** Step 2: Verify OTP */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          code: otpCode,
          // Pass name only if we already have it (existing user — name is skipped)
          name: !isNewUser ? undefined : name || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "OTP verification failed.");
      } else {
        if (isNewUser) {
          // New user — go to name collection step
          setStep("name");
        } else {
          // Existing user — log in and redirect to booking
          login(data.user);
          resetModal();
          onClose();
          router.push("/dashboard");
        }
      }
    } catch {
      setError("Network error. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  /** Step 3: Complete new user profile (name) */
  const handleCompleteName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      // Re-verify to also create the user with their name.
      // Since OTP was already consumed, we update the user that was just created.
      const res = await fetch("/api/user/update-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: cleanPhone, name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save your name. Please try again.");
      } else {
        login(data.user);
        resetModal();
        onClose();
        router.push("/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cleanPhone = phoneNumber.replace(/\D/g, "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          suppressHydrationWarning
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step indicator dots */}
        <div className="flex justify-center space-x-2 mb-5">
          {(["phone", "otp", ...(isNewUser ? ["name"] : [])] as Step[]).map((s, i) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? "w-6 bg-emerald-400"
                  : i < (["phone", "otp", "name"] as Step[]).indexOf(step)
                  ? "w-1.5 bg-emerald-600"
                  : "w-1.5 bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Modal Header */}
        <div className="mb-6 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              {step === "phone" && <Phone className="h-6 w-6 text-emerald-400" />}
              {step === "otp" && <Key className="h-6 w-6 text-emerald-400" />}
              {step === "name" && <User className="h-6 w-6 text-emerald-400" />}
            </div>
          </div>

          <h2 className="text-xl font-bold text-white tracking-wide">
            {step === "phone" && "Book Your Slot"}
            {step === "otp" && "Verify Your Number"}
            {step === "name" && "One Last Step"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            {step === "phone" &&
              "Enter your phone number to get started. We'll send you a quick OTP."}
            {step === "otp" &&
              `Enter the 6-digit code we sent to +${cleanPhone}`}
            {step === "name" &&
              "Tell us your name to complete your account setup."}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center space-x-2 rounded-lg bg-rose-950/50 border border-rose-800/80 p-3 text-xs text-rose-300">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Step 1: Phone Number ── */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Phone Number</label>
              <div className="relative">
                <Phone className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
                <input
                  suppressHydrationWarning
                  type="tel"
                  required
                  autoFocus
                  placeholder="e.g. 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-500 pl-1">
                We'll automatically create your account if you're new.
              </p>
            </div>

            <button
              suppressHydrationWarning
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center space-x-2 glow-btn bg-emerald-500 text-slate-950 font-bold text-sm py-2.5 rounded-lg disabled:opacity-50 transition-transform active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>Send OTP</span>
              )}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP Verification ── */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">6-Digit Code</label>
              <div className="relative">
                <Key className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
                <input
                  suppressHydrationWarning
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none text-center tracking-[0.35em] font-semibold transition-colors"
                />
              </div>
            </div>

            {debugOtp && (
              <div className="flex items-center space-x-2 rounded-lg bg-emerald-950/30 border border-emerald-800/50 p-2 text-xs text-emerald-400">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Dev helper:</strong> Enter code{" "}
                  <code className="font-mono">{debugOtp}</code>
                </span>
              </div>
            )}

            <button
              suppressHydrationWarning
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full mt-2 flex items-center justify-center space-x-2 glow-btn bg-emerald-500 text-slate-950 font-bold text-sm py-2.5 rounded-lg disabled:opacity-50 transition-transform active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>{isNewUser ? "Verify & Continue" : "Verify & Log In"}</span>
              )}
            </button>

            <button
              suppressHydrationWarning
              type="button"
              onClick={() => { setStep("phone"); setError(""); setOtpCode(""); }}
              className="w-full flex items-center justify-center space-x-1 text-xs text-slate-400 hover:text-slate-300 py-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Change phone number</span>
            </button>
          </form>
        )}

        {/* ── Step 3: New User — Collect Name ── */}
        {step === "name" && (
          <form onSubmit={handleCompleteName} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Your Full Name</label>
              <div className="relative">
                <User className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
                <input
                  suppressHydrationWarning
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Arjun Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-500 pl-1">
                Used on your bookings and account profile.
              </p>
            </div>

            <button
              suppressHydrationWarning
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full mt-2 flex items-center justify-center space-x-2 glow-btn bg-emerald-500 text-slate-950 font-bold text-sm py-2.5 rounded-lg disabled:opacity-50 transition-transform active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>Complete Setup & Book</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
