import { useNavigate } from "react-router-dom";

export default function SignupSuccess() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg,#181314 0%,#222 70%,#1793d1 100%)",
      }}
    >
      <div
        style={{
          background: "rgba(24,19,20,0.85)",
          padding: "2.5em 2em",
          borderRadius: "1.2em",
          boxShadow: "0 2px 32px rgba(23,147,209,0.12)",
          textAlign: "center",
          minWidth: "320px",
        }}
      >
        <h2 style={{ fontSize: "2.2em", fontWeight: 800, color: "#1793d1", marginBottom: "0.5em" }}>
          Sign up successful!
        </h2>
        <p style={{ color: "#f0f0f0", marginBottom: "2em" }}>
          Go to login page and start fresh!
        </p>
        <button
          className="w-full py-3 rounded-lg bg-[#1793d1] text-white font-bold text-lg mt-2 hover:bg-[#106fa0] transition"
          onClick={() => navigate("/login")}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}