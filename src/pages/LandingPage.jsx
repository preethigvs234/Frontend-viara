import React, { useEffect, useState } from "react";
import { FaBolt } from "react-icons/fa";
import { MdOutlineAutoAwesome, MdInfoOutline } from "react-icons/md";
import { Link } from "react-router-dom";

const items = ["Movies", "Books", "And", "Music"];
const features = [
  {
    title: "Personalized AI Suggestions",
    desc: "Get recommendations tailored to your taste across genres and languages.",
  },
  {
    title: "Cross-Domain Discovery",
    desc: "Explore movies, books, and music all in one place.",
  },
  {
    title: "Real-Time Learning",
    desc: "CurateMe adapts instantly as your interests change.",
  },
];

export default function LandingPage() {
  const [animate, setAnimate] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 500);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-tr from-[#181314] via-[#222] to-[#1793d1]/30 transition-all duration-500 relative overflow-hidden">
      {/* Floating particles effect (optional) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* You can use a library for particles, or simple animated circles here */}
      </div>

      <h1
        className="text-[6rem] md:text-[8rem] font-extrabold text-[#1793d1] mb-3 text-center leading-none z-10"
        title="Welcome!"
      >
        CurateMe
      </h1>
      <div className="text-xl md:text-2xl text-gray-400 mb-6 text-center font-medium z-10">
        The smart way to discover what you'll love next
      </div>
      <h2 className="text-[2.5rem] md:text-[3.5rem] font-bold text-white mb-6 text-center z-10">
        Your AI-Powered Guide to
      </h2>
      <div className="flex gap-8 mb-8 z-10">
        {items.map((item, idx) => (
          <span
            key={item}
            className={`text-[2rem] md:text-[2.5rem] text-[#1793d1] font-semibold transition-all duration-500
              ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
            `}
            style={{ transitionDelay: `${idx * 150}ms` }}
          >
            {item}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 text-gray-400 mb-8 z-10">
        <MdOutlineAutoAwesome size={28} />
        <span className="text-xl">Powered by Google Gemini</span>
        <button
          aria-label="How does CurateMe work?"
          className="ml-4 hover:text-[#1793d1] focus:text-[#1793d1] transition"
          onClick={() => setShowInfo(true)}
        >
          <MdInfoOutline size={24} />
        </button>
      </div>
      {/* Feature highlights */}
      <div className="flex flex-col md:flex-row gap-4 mb-12 z-10">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="bg-[#222]/70 backdrop-blur-md border border-[#1793d1]/30 rounded-xl px-6 py-4 text-left max-w-xs shadow-lg transition-all hover:scale-105"
            style={{ transitionDelay: `${i * 120}ms` }}
          >
            <div className="font-bold text-[#1793d1] mb-2 text-lg">{f.title}</div>
            <div className="text-gray-300 text-base">{f.desc}</div>
          </div>
        ))}
      </div>
      {/* Call to action buttons */}
      <div className="flex gap-8 z-10">
        <div className="flex gap-4">
  <Link to="/signup">
    <button
      aria-label="Sign up and get started"
      className="flex items-center gap-2 px-12 py-5 rounded-2xl bg-[#1793d1] text-white text-[2.3rem] font-semibold shadow hover:bg-[#106fa0] hover:scale-105 focus:scale-105 transition-all active:bg-[#106fa0]"
    >
      <FaBolt size={30} /> Get Started
    </button>
  </Link>
  <Link to="/login">
    <button
      aria-label="Sign in to your account"
      className="flex items-center gap-2 px-12 py-5 rounded-2xl bg-[#1793d1] text-white text-[2.3rem] font-semibold shadow hover:bg-[#106fa0] hover:scale-105 focus:scale-105 transition-all active:bg-[#106fa0]"
    >
      <FaBolt size={30} /> Sign In
    </button>
  </Link>
</div>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-20">
          <div className="bg-[#181314] rounded-2xl shadow-xl p-8 max-w-lg text-white relative">
            <button
              className="absolute top-2 right-4 text-xl font-bold text-[#1793d1] hover:text-white"
              onClick={() => setShowInfo(false)}
              aria-label="Close info"
            >
              ×
            </button>
            <h3 className="text-2xl font-bold mb-2 text-[#1793d1]">How does CurateMe work?</h3>
            <p className="mb-2">
              CurateMe uses AI to learn your taste in movies, books, and music. It adapts instantly as you interact, recommending content that matches your evolving interests. Your preferences for genre and language are securely stored and used only for improving your experience.
            </p>
            <ul className="mb-2 list-disc pl-5">
              <li>Sign up and select your favorite genres/languages</li>
              <li>Get personalized recommendations instantly</li>
              <li>CurateMe keeps learning and improving just for you!</li>
            </ul>
            <div className="text-sm text-gray-400 mt-4">
              Your data is private and never shared.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}