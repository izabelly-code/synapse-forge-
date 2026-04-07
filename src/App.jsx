import { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import PedidosDashboard from "./components/PedidosDashboard";
import PasswordRecovery from "./components/PasswordRecovery";

function App() {

    const [token, setToken] = useState(localStorage.getItem("token"));
    const [screen, setScreen] = useState("login");

    if (token) {
        return <PedidosDashboard onLogout={() => setToken(null)} />;
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