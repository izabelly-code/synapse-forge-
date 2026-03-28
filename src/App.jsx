import { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import UserList from "./components/UserList";

function App() {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [screen, setScreen] = useState("login");

    if (token) {
    return <UserList onLogout={() => setToken(null)} />;
    }  

    if (screen === "register") {
        return <Register onRegister={() => setScreen("login")} />;
    }

    return (
        <Login
            onLogin={setToken}
            goToRegister={() => setScreen("register")}
        />
    );

}

export default App;