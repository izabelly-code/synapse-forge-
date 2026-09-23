import { useNavigate } from "react-router-dom";
import Login from "../components/auth/Login";
import { getUserRole } from "../hooks/useAuth";

const API_URL = "http://localhost:8081";

/** Gerente recém-cadastrado ainda não tem equipe: sem ela, todas as telas vêm vazias. */
async function gerenteSemEquipe(token: string): Promise<boolean> {
  if (getUserRole() !== "GERENTE") return false;
  try {
    const response = await fetch(`${API_URL}/equipes/minha`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.status === 404;
  } catch {
    return false;
  }
}

function LoginPage() {
  const navigate = useNavigate();

  async function handleLogin(token: string) {
    localStorage.setItem("token", token);
    navigate((await gerenteSemEquipe(token)) ? "/equipe?semEquipe=1" : "/dashboard");
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
