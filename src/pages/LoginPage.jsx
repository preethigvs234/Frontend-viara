import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../supabaseClient';

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [welcome, setWelcome] = useState("");
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    let firstName = data?.user?.user_metadata?.first_name;
    if (!firstName && data?.user?.id) {
      // Fallback: fetch from public.users table using Supabase
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("first_name")
        .eq("id", data.user.id)
        .single();
      if (!profileError && profile?.first_name) {
        firstName = profile.first_name;
      }
    }

    setWelcome(firstName ? `Welcome, ${firstName}!!` : `Welcome!!`);
    setLoading(false);

    setTimeout(() => {
      navigate("/dashboard");
    }, 1200);
  }

  if (welcome) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181314]">
        <div className="bg-[#232323] w-full max-w-md rounded-xl shadow-lg px-8 py-10 flex flex-col items-center">
          <h2 className="text-3xl font-bold text-[#1793d1] mb-2 text-center">{welcome}</h2>
          <p className="text-gray-400 text-center mt-2">You have successfully logged in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#181314]">
      <div className="bg-[#232323] w-full max-w-md rounded-xl shadow-lg px-8 py-10 flex flex-col">
        <h2 className="text-3xl font-bold text-[#1793d1] mb-2 text-center">Login to Viara</h2>
        <p className="text-center text-gray-300 mb-6">
          Enter your credentials to continue
        </p>
        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <div>
            <label className="block font-medium text-gray-200 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-lg bg-[#171717] text-white border border-[#232323] focus:outline-none focus:ring-2 focus:ring-[#1793d1] placeholder:text-gray-400"
              value={form.email}
              onChange={handleChange}
              autoComplete="off"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-medium text-gray-200 mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-lg bg-[#171717] text-white border border-[#232323] focus:outline-none focus:ring-2 focus:ring-[#1793d1] placeholder:text-gray-400"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            className={`w-full py-3 rounded-lg bg-[#1793d1] text-white font-bold text-lg mt-2 hover:bg-[#106fa0] transition${loading ? " opacity-70 cursor-not-allowed" : ""}`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-xs text-center text-gray-400 mt-4">
          Powered by Google Gemini
        </p>
      </div>
    </div>
  );
}