import { BrowserRouter, Routes, Route } from "react-router-dom";
import Hero from "./components/sections/Hero";
import DashboardLayout from "./components/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import PaletaCoresPage from "./pages/PaletaCoresPage";
import MateriaisPage from "./pages/MateriaisPage";
import RecoveryPage from "./pages/RecoveryPage";
import Calendar from "./pages/Calendar";
import UserProfilePage from "./pages/UserProfilePage";
import ConfirmEmailPage from "./pages/ConfirmEmailPage";
import ConfirmEmailMudancaPage from "./pages/ConfirmEmailMudancaPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/recovery" element={<RecoveryPage />} />
        <Route path="/confirmar-email" element={<ConfirmEmailPage />} />
        <Route path="/confirmar-mudanca-email" element={<ConfirmEmailMudancaPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/paleta-cores" element={<PaletaCoresPage />} />
          <Route path="/materiais" element={<MateriaisPage />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/perfil" element={<UserProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
