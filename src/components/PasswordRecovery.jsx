import { useState } from "react";

function PasswordRecovery({ goToLogin }) {

    const [email, setEmail] = useState("");

    function handleSubmit() {
        alert("Recuperação enviada!");
    }

    return (
        <div className="container">

            {/* LEFT SIDE */}
            <div className="left-side">
                <div className="left-overlay"></div>

                <div className="logo">SynapseForge</div>

                <div className="left-content">
                    <h1>Recuperação de senha</h1>
                    <p>Informe seu email para recuperar o acesso à sua conta.</p>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="right-side">
                <div className="card">

                    <h2>Recuperar senha</h2>

                    <div className="input-group">
                        <label>Email</label>
                        <input
                            placeholder="Digite seu email"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button className="button" onClick={handleSubmit}>
                        Enviar
                    </button>

                    <div className="link" onClick={goToLogin}>
                        Voltar ao login
                    </div>

                </div>
            </div>

        </div>
    );
}

export default PasswordRecovery;