import { useState } from "react";
import { register } from "../services/AuthService";

function Register({ onRegister }) {

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    async function handleRegister() {
        try {
            await register({
                nome,
                email,
                senha,
                role: "CLIENTE"
            });

            alert("Conta criada com sucesso!");
            onRegister();

        } catch (error) {
            alert("Erro ao cadastrar");
        }
    }

    return (
        <div className="container">
            <div className="card">

                <h2>Cadastro</h2>

                <div className="input-group">
                    <label>Nome</label>
                    <input
                        placeholder="Digite seu nome"
                        onChange={(e) => setNome(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Email</label>
                    <input
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

                <button className="button" onClick={handleRegister}>
                    Cadastrar
                </button>

                <div className="link" onClick={onRegister}>
                    Já tem conta? Voltar para login
                </div>

            </div>
        </div>
    );
}

export default Register;