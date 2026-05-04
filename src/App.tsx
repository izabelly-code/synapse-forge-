import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Hero from "./components/sections/Hero";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import RecoveryPage from "./pages/RecoveryPage";
import Calendar from "./pages/Calendar";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/recovery" element={<RecoveryPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function CalendarPage() {
  const navigate = useNavigate();

  return <Calendar onBack={() => navigate("/dashboard")} />;
}

export default App;
