import { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import UserList from "./components/UserList";
import PasswordRecovery from "./components/PasswordRecovery";

function App() {

    const [token, setToken] = useState(localStorage.getItem("token"));
    const [screen, setScreen] = useState("login");

    if (token) {
        return <UserList onLogout={() => setToken(null)} />;
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