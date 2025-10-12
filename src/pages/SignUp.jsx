import React, { useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";

export default function SignUp() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.first_name || !form.last_name || !form.email || !form.password || !form.confirm) {
      setError("All fields are required.");
      return;
    }
    if (!validateEmail(form.email)) {
      setError("Invalid email format.");
      return;
    }
    if (!validatePassword(form.password)) {
      setError(
        "Password must be at least 8 characters, include uppercase, lowercase, number, and special character."
      );
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // Register user with password (will send confirmation email with OTP/magic link)
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { first_name: form.first_name, last_name: form.last_name },
        shouldCreateUser: true,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setStep("otp");
    setLoading(false);
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Verify the OTP (user must enter code from email)
    const { error: otpError } = await supabase.auth.verifyOtp({
      email: form.email,
      token: otp,
      type: "email",
    });

    if (otpError) {
      setError("Invalid OTP. Please check the code sent to your email.");
      setLoading(false);
      return;
    }

    // Get the newly created user and upsert into public.users table
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const hashedPassword = bcrypt.hashSync(form.password, 10);

      await supabase.from("users").upsert({
        id: user.id,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password_hash: hashedPassword,
      });

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Redirect to onboarding
    navigate("/onboarding", { state: { email: form.email, name: form.first_name } });
    setLoading(false);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-[#181314] via-[#222] to-[#1793d1]/30 transition-all duration-500 relative overflow-hidden">
      <div className="bg-[#181314]/80 w-full max-w-md rounded-xl shadow-2xl px-8 py-10 flex flex-col backdrop-blur-md border border-[#1793d1]/30 mt-4">
        <h2 className="text-4xl font-extrabold text-[#1793d1] mb-4 text-center">Join Viara</h2>
        <p className="text-center text-gray-300 mb-6 text-lg">
          {step === "form"
            ? "Create your account and discover amazing recommendations"
            : "Enter the OTP sent to your email to verify your account"}
        </p>
        {step === "form" ? (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="block font-semibold text-gray-200 mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                placeholder="Enter your first name"
                className="w-full px-4 py-3 rounded-lg bg-[#181314] text-white border border-[#1793d1]/20 focus:outline-none focus:ring-2 focus:ring-[#1793d1] placeholder:text-gray-400"
                value={form.first_name}
                onChange={handleChange}
                autoComplete="off"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-200 mb-1">Last Name</label>
              <input
                type="text"
                name="last_name"
                placeholder="Enter your last name"
                className="w-full px-4 py-3 rounded-lg bg-[#181314] text-white border border-[#1793d1]/20 focus:outline-none focus:ring-2 focus:ring-[#1793d1] placeholder:text-gray-400"
                value={form.last_name}
                onChange={handleChange}
                autoComplete="off"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-200 mb-1">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg bg-[#181314] text-white border border-[#1793d1]/20 focus:outline-none focus:ring-2 focus:ring-[#1793d1] placeholder:text-gray-400"
                value={form.email}
                onChange={handleChange}
                autoComplete="off"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-200 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  className="w-full px-4 py-3 rounded-lg bg-[#181314] text-white border border-[#1793d1]/20 focus:outline-none focus:ring-2 focus:ring-[#1793d1] placeholder:text-gray-400 pr-12"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <span className="absolute inset-y-0 right-3 flex items-center">
                  <button
                    type="button"
                    className="p-0 bg-transparent border-none shadow-none focus:outline-none"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <MdVisibility size={22} className="text-gray-400 hover:text-gray-200" />
                    ) : (
                      <MdVisibilityOff size={22} className="text-gray-400 hover:text-gray-200" />
                    )}
                  </button>
                </span>
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-200 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirm"
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 rounded-lg bg-[#181314] text-white border border-[#1793d1]/20 focus:outline-none focus:ring-2 focus:ring-[#1793d1] placeholder:text-gray-400 pr-12"
                  value={form.confirm}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <span className="absolute inset-y-0 right-3 flex items-center">
                  <button
                    type="button"
                    className="p-0 bg-transparent border-none shadow-none focus:outline-none"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {showConfirm ? (
                      <MdVisibility size={22} className="text-gray-400 hover:text-gray-200" />
                    ) : (
                      <MdVisibilityOff size={22} className="text-gray-400 hover:text-gray-200" />
                    )}
                  </button>
                </span>
              </div>
            </div>
            {error && <p className="text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#1793d1] text-white font-bold text-[1.7rem] mt-1 shadow hover:bg-[#106fa0] hover:scale-105 focus:scale-105 transition-all active:bg-[#106fa0]${loading ? " opacity-70 cursor-not-allowed" : ""}`}
              disabled={loading}
            >
              {loading ? "Creating..." : <> Sign Up </>}
            </button>
          </form>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleVerifyOtp}>
            <label className="block font-semibold text-gray-200 mb-1">Enter OTP from Email</label>
            <input
              type="text"
              name="otp"
              placeholder="Enter OTP"
              className="w-full px-4 py-3 rounded-lg bg-[#181314] text-white border border-[#1793d1]/20 focus:outline-none focus:ring-2 focus:ring-[#1793d1] placeholder:text-gray-400"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoComplete="off"
              disabled={loading}
            />
            {error && <p className="text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#1793d1] text-white font-bold text-[1.5rem] shadow hover:bg-[#106fa0] transition-all${loading ? " opacity-70 cursor-not-allowed" : ""}`}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
          </form>
        )}
        <p className="text-xs text-center text-gray-400 mt-2">
          Powered by Google Gemini
        </p>
      </div>
    </div>
  );
}