import { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import PedidosDashboard from "./components/PedidosDashboard";
import PasswordRecovery from "./components/PasswordRecovery";
import Calendar from "./pages/Calendar";

type Screen = "login" | "register" | "recovery" | "dashboard" | "calendario";

function App() {

    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const [screen, setScreen] = useState<Screen>("login");

    if (token) {
        if (screen === "calendario") {
            return <Calendar onBack={() => setScreen("dashboard")} />;
        }
        return <PedidosDashboard
            onLogout={() => { setToken(null); setScreen("login"); }}
            onCalendario={() => setScreen("calendario")}
        />;
    }

    if (screen === "register") {
        return <Register onRegister={() => setScreen("login")} />;
    }

    if (screen === "recovery") {
        return <PasswordRecovery goToLogin={() => setScreen("login")} />;
    }

    return (
        <Login
            onLogin={setToken}
            goToRegister={() => setScreen("register")}
            goToRecovery={() => setScreen("recovery")}
        />
    );
}

export default App;
