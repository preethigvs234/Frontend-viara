import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignUp from "./pages/SignUp";
import LoginPage from "./pages/LoginPage";
import Onboarding from "./pages/Onboarding";
import SignupSuccess from "./pages/SignupSuccess";
import TestSupabaseConnection from "./TestSupabaseConnection";
import UserDashboard from "./pages/UserDashboard";
 // <-- Import your Dashboard component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup-success" element={<SignupSuccess />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/test-connection" element={<TestSupabaseConnection />} />
        <Route path="/dashboard" element={<UserDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;