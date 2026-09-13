import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Register from "../components/auth/Register";
import "./RegisterPage.css";

type TipoCadastro = "ESCOLHA" | "CLIENTE" | "GERENTE";

function RegisterPage() {
  const navigate = useNavigate();

  const [tipoCadastro, setTipoCadastro] =
    useState<TipoCadastro>("ESCOLHA");

  if (tipoCadastro === "CLIENTE") {
    return (
      <Register
        tipoCadastro="CLIENTE"
        onRegister={() => navigate("/login")}
        onVoltarEscolha={() => setTipoCadastro("ESCOLHA")}
      />
    );
  }

  if (tipoCadastro === "GERENTE") {
    return (
      <Register
        tipoCadastro="GERENTE"
        onRegister={() => navigate("/login")}
        onVoltarEscolha={() => setTipoCadastro("ESCOLHA")}
      />
    );
  }

  return (
    <div className="register-choice-page">
      <div className="register-choice-card">
        <div className="register-choice-content">
          <h1>Qual seu objetivo no Synapse Forge?</h1>

          <p className="register-choice-description">
            Escolha como você pretende utilizar o Synapse Forge.
          </p>

          <div className="register-choice-options">
            <button
              type="button"
              className="register-choice-button register-choice-client"
              onClick={() => setTipoCadastro("CLIENTE")}
            >
              <span className="register-choice-button-title">
                Como cliente
              </span>

              <span className="register-choice-button-description">
                Quero solicitar serviços e acompanhar meus pedidos.
              </span>
            </button>

            <button
              type="button"
              className="register-choice-button register-choice-manager"
              onClick={() => setTipoCadastro("GERENTE")}
            >
              <span className="register-choice-button-title">
                Para meu negócio
              </span>

              <span className="register-choice-button-description">
                Quero gerenciar meu negócio e minha equipe.
              </span>
            </button>
          </div>

          <button
            type="button"
            className="register-choice-back"
            onClick={() => navigate("/login")}
          >
            Voltar para o login
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;