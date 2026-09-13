import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Register from "../components/auth/Register";
import "./RegisterPage.css";

type TipoCadastro = "ESCOLHA" | "CLIENTE" | "GERENTE";

function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
          <h1>{t("register.choice.title")}</h1>

          <p className="register-choice-description">
            {t("register.choice.description")}
          </p>

          <div className="register-choice-options">
            <button
              type="button"
              className="register-choice-button register-choice-client"
              onClick={() => setTipoCadastro("CLIENTE")}
            >
              <span className="register-choice-button-title">
                {t("register.choice.client.title")}
              </span>

              <span className="register-choice-button-description">
                {t("register.choice.client.description")}
              </span>
            </button>

            <button
              type="button"
              className="register-choice-button register-choice-manager"
              onClick={() => setTipoCadastro("GERENTE")}
            >
              <span className="register-choice-button-title">
                {t("register.choice.manager.title")}
              </span>

              <span className="register-choice-button-description">
                {t("register.choice.manager.description")}
              </span>
            </button>
          </div>

          <button
            type="button"
            className="register-choice-back"
            onClick={() => navigate("/login")}
          >
            {t("register.choice.back")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;