import { useNavigate } from "react-router-dom";
import Login from "../components/Login";

function LoginPage() {
  const navigate = useNavigate();

  function handleLogin(token: string) {
    localStorage.setItem("token", token);
    navigate("/dashboard");
  }

  return (
    <Login
      onLogin={handleLogin}
      goToRegister={() => navigate("/register")}
      goToRecovery={() => navigate("/recovery")}
    />
  );
}

export default LoginPage;
