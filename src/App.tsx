import { BrowserRouter, Routes, Route } from "react-router-dom";
import Hero from "./components/landing/Hero";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import PaletaCoresPage from "./pages/PaletaCoresPage";
import CalculadoraMisturaPage from "./pages/CalculadoraMisturaPage";
import MateriaisPage from "./pages/MateriaisPage";
import OrcamentoPageWrapper from "./pages/OrcamentoPageWrapper";
import RecoveryPage from "./pages/RecoveryPage";
import Calendar from "./pages/Calendar";
import UserProfilePage from "./pages/UserProfilePage";
import ConfirmEmailPage from "./pages/ConfirmEmailPage";
import ConfirmEmailMudancaPage from "./pages/ConfirmEmailMudancaPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import OrdensPinturaPage from "./pages/OrdensPinturaPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import NotFoundPage from "./pages/NotFoundPage";
import SessionExpiredPage from "./pages/SessionExpiredPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* =====================================================
                    ROTAS PÚBLICAS
                ====================================================== */}

                <Route path="/" element={<Hero />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/recovery" element={<RecoveryPage />} />
                <Route
                    path="/confirmar-email"
                    element={<ConfirmEmailPage />}
                />
                <Route
                    path="/confirmar-mudanca-email"
                    element={<ConfirmEmailMudancaPage />}
                />
                <Route
                    path="/redefinir-senha"
                    element={<ResetPasswordPage />}
                />
                <Route
                    path="/sessao-expirada"
                    element={<SessionExpiredPage />}
                />


                {/* =====================================================
                    ÁREA PROTEGIDA
                ====================================================== */}

                <Route element={<ProtectedRoute />}>

                    <Route element={<DashboardLayout />}>

                        {/* -------------------------------------------------
                            PEDIDOS
                            Cliente pode visualizar.
                            Técnico/Gerente/Admin possuem acesso completo.
                        -------------------------------------------------- */}

                        <Route
                            path="/dashboard"
                            element={<DashboardPage />}
                        />


                        {/* -------------------------------------------------
                            FERRAMENTAS
                            Apenas Técnico/Gerente/Admin.
                        -------------------------------------------------- */}

                        <Route
                            element={
                                <ProtectedRoute
                                    allowedRoles={[
                                        "TECNICO",
                                        "GERENTE",
                                        "ADMIN"
                                    ]}
                                />
                            }
                        >
                            <Route
                                path="/paleta-cores"
                                element={<PaletaCoresPage />}
                            />

                            <Route
                                path="/calculadora-mistura"
                                element={<CalculadoraMisturaPage />}
                            />

                            <Route
                                path="/materiais"
                                element={<MateriaisPage />}
                            />

                            <Route
                                path="/orcamento"
                                element={<OrcamentoPageWrapper />}
                            />

                            <Route
                                path="/calendar"
                                element={<Calendar />}
                            />

                            <Route
                                path="/ordens-pintura"
                                element={<OrdensPinturaPage />}
                            />
                        </Route>


                        {/* -------------------------------------------------
                            PERFIL
                            Todos podem acessar o próprio perfil.
                        -------------------------------------------------- */}

                        <Route
                            path="/perfil"
                            element={<UserProfilePage />}
                        />

                    </Route>

                </Route>


                {/* =====================================================
                    ROTA 404
                ====================================================== */}

                <Route
                    path="*"
                    element={<NotFoundPage />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;