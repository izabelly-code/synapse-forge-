import { useState } from "react";
import { login } from "../services/AuthService";

function Login({ onLogin, goToRegister }) {

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    async function handleLogin() {
        try {
            const token = await login(email, senha);
            localStorage.setItem("token", token);
            onLogin(token);
        } catch (error) {
            alert("Erro ao fazer login");
        }
    }

    return (
        <div className="container">
            <div className="card">

                <h2>Login</h2>

                <div className="input-group">
                    <label>Email</label>
                    <input
                        type="text"
                        placeholder="Digite seu email"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Senha</label>
                    <input
                        type="password"
                        placeholder="Digite sua senha"
                        onChange={(e) => setSenha(e.target.value)}
                    />
                </div>

                <button className="button" onClick={handleLogin}>
                    Entrar
                </button>

                <div className="link" onClick={goToRegister}>
                    Não tem conta? Cadastre-se
                </div>

            </div>
        </div>
    );
}

export default Login;