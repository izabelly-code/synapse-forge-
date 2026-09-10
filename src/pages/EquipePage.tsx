import { UserAdd01Icon, UserGroupIcon } from "hugeicons-react";
import { getUserRole } from "../hooks/useAuth";

function EquipePage() {
    const role = getUserRole();

    const isGerente = role === "GERENTE";
    const isTecnico = role === "TECNICO";
    const isAdmin = role === "ADMIN";

    const podeGerenciarEquipe = isGerente || isAdmin;

    return (
        <>
            <style>{`
                .equipe-page {
                    min-height: 100vh;
                    padding: 40px 48px 56px;
                    max-width: 1400px;
                    margin: 0 auto;
                    box-sizing: border-box;
                }

                .equipe-page-header {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    gap: 24px;
                    margin-bottom: 28px;
                }

                .equipe-page-kicker {
                    display: block;
                    margin-bottom: 8px;
                    color: var(--color-primary, #FB4A14);
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                }

                .equipe-page-title {
                    margin: 0;
                    color: var(--color-text, #262626);
                    font-size: 32px;
                    line-height: 1.15;
                    font-weight: 750;
                    letter-spacing: -0.025em;
                }

                .equipe-page-subtitle {
                    margin: 8px 0 0;
                    color: var(--color-text-muted, #737373);
                    font-size: 15px;
                    line-height: 1.5;
                }

                .equipe-primary-button,
                .equipe-secondary-button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    border-radius: 10px;
                    padding: 11px 16px;
                    font: inherit;
                    font-size: 14px;
                    font-weight: 650;
                    cursor: pointer;
                    transition:
                        transform 140ms ease,
                        box-shadow 140ms ease,
                        background 140ms ease,
                        border-color 140ms ease;
                }

                .equipe-primary-button {
                    flex-shrink: 0;
                    border: 1px solid var(--color-primary, #FB4A14);
                    background: var(--color-primary, #FB4A14);
                    color: #ffffff;
                    box-shadow: 0 4px 12px rgba(251, 74, 20, 0.18);
                }

                .equipe-primary-button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(251, 74, 20, 0.24);
                }

                .equipe-secondary-button {
                    margin-left: auto;
                    border: 1px solid var(--color-border-strong, rgba(67, 70, 86, 0.24));
                    background: var(--color-surface, #ffffff);
                    color: var(--color-text, #262626);
                }

                .equipe-secondary-button:hover {
                    border-color: var(--color-primary, #FB4A14);
                    color: var(--color-primary, #FB4A14);
                }

                .equipe-primary-button:focus-visible,
                .equipe-secondary-button:focus-visible {
                    outline: 3px solid rgba(251, 74, 20, 0.2);
                    outline-offset: 2px;
                }

                .equipe-card {
                    border: 1px solid var(--color-border, rgba(67, 70, 86, 0.15));
                    border-radius: 16px;
                    background: var(--color-surface, #ffffff);
                    box-shadow: var(--shadow-card, 0 2px 10px rgba(0, 0, 0, 0.04));
                }

                .equipe-header-card {
                    overflow: hidden;
                    margin-bottom: 32px;
                }

                .equipe-banner {
                    position: relative;
                    height: 220px;
                    overflow: hidden;
                    background:
                        radial-gradient(
                            circle at 18% 30%,
                            rgba(251, 74, 20, 0.36),
                            transparent 28%
                        ),
                        radial-gradient(
                            circle at 80% 20%,
                            rgba(251, 74, 20, 0.2),
                            transparent 30%
                        ),
                        linear-gradient(
                            135deg,
                            #252525 0%,
                            #3b3b3b 50%,
                            #202020 100%
                        );
                }

                .equipe-banner::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background:
                        linear-gradient(
                            120deg,
                            transparent 0%,
                            rgba(255, 255, 255, 0.035) 45%,
                            transparent 70%
                        );
                    pointer-events: none;
                }

                .equipe-banner-placeholder {
                    position: absolute;
                    width: 180px;
                    height: 180px;
                    right: 9%;
                    top: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 50%;
                    transform: rotate(18deg);
                }

                .equipe-banner-placeholder::before,
                .equipe-banner-placeholder::after {
                    content: "";
                    position: absolute;
                    inset: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.07);
                    border-radius: 50%;
                }

                .equipe-banner-placeholder::after {
                    inset: 48px;
                }

                .equipe-info {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                    padding: 22px 24px 24px;
                }

                .equipe-avatar {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 76px;
                    height: 76px;
                    margin-top: -56px;
                    border: 4px solid var(--color-surface, #ffffff);
                    border-radius: 20px;
                    background:
                        linear-gradient(
                            145deg,
                            var(--color-primary, #FB4A14),
                            #ff774c
                        );
                    color: #ffffff;
                    box-shadow: 0 5px 16px rgba(0, 0, 0, 0.14);
                    z-index: 1;
                }

                .equipe-info-text {
                    min-width: 0;
                }

                .equipe-info-text h2 {
                    margin: 0;
                    color: var(--color-text, #262626);
                    font-size: 21px;
                    line-height: 1.25;
                    font-weight: 720;
                }

                .equipe-info-text p {
                    margin: 5px 0 0;
                    color: var(--color-text-muted, #737373);
                    font-size: 14px;
                    line-height: 1.45;
                }

                .equipe-members-section {
                    width: 100%;
                }

                .equipe-section-header {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 14px;
                }

                .equipe-section-header h2 {
                    margin: 0;
                    color: var(--color-text, #262626);
                    font-size: 20px;
                    font-weight: 720;
                    letter-spacing: -0.015em;
                }

                .equipe-section-header p {
                    margin: 5px 0 0;
                    color: var(--color-text-muted, #737373);
                    font-size: 14px;
                }

                .equipe-member-count {
                    flex-shrink: 0;
                    color: var(--color-text-muted, #737373);
                    font-size: 13px;
                    font-weight: 600;
                }

                .equipe-empty-card {
                    min-height: 300px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 24px;
                    text-align: center;
                    color: var(--color-text-muted, #737373);
                }

                .equipe-empty-card > svg {
                    margin-bottom: 14px;
                    opacity: 0.55;
                }

                .equipe-empty-card h3 {
                    margin: 0;
                    color: var(--color-text, #262626);
                    font-size: 17px;
                    font-weight: 700;
                }

                .equipe-empty-card p {
                    max-width: 430px;
                    margin: 7px 0 20px;
                    font-size: 14px;
                    line-height: 1.55;
                }

                @media (max-width: 900px) {
                    .equipe-page {
                        padding: 32px 28px 48px;
                    }

                    .equipe-banner {
                        height: 190px;
                    }

                    .equipe-page-header {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .equipe-primary-button {
                        width: 100%;
                    }
                }

                @media (max-width: 600px) {
                    .equipe-page {
                        padding: 24px 18px 40px;
                    }

                    .equipe-page-title {
                        font-size: 27px;
                    }

                    .equipe-banner {
                        height: 150px;
                    }

                    .equipe-info {
                        align-items: flex-start;
                        flex-wrap: wrap;
                        padding: 18px;
                    }

                    .equipe-avatar {
                        width: 64px;
                        height: 64px;
                        margin-top: -46px;
                        border-radius: 16px;
                    }

                    .equipe-info-text {
                        padding-top: 2px;
                        max-width: calc(100% - 82px);
                    }

                    .equipe-secondary-button {
                        width: 100%;
                        margin-left: 0;
                    }

                    .equipe-section-header {
                        align-items: flex-start;
                        flex-direction: column;
                        gap: 7px;
                    }

                    .equipe-empty-card {
                        min-height: 260px;
                    }
                }
            `}</style>

            <main className="equipe-page">
                <header className="equipe-page-header">
                    <div>
                        <span className="equipe-page-kicker">
                            Equipe
                        </span>

                        <h1 className="equipe-page-title">
                            Minha equipe
                        </h1>

                        <p className="equipe-page-subtitle">
                            Visualize e gerencie os integrantes da sua equipe.
                        </p>
                    </div>

                    {podeGerenciarEquipe && (
                        <button
                            type="button"
                            className="equipe-primary-button"
                        >
                            <UserAdd01Icon size={18} />
                            Convidar usuário
                        </button>
                    )}
                </header>

                <section className="equipe-card equipe-header-card">
                    <div className="equipe-banner">
                        <div className="equipe-banner-placeholder" />
                    </div>

                    <div className="equipe-info">
                        <div className="equipe-avatar">
                            <UserGroupIcon size={30} />
                        </div>

                        <div className="equipe-info-text">
                            <h2>
                                Minha Equipe
                            </h2>

                            <p>
                                Equipe de produção e desenvolvimento
                            </p>
                        </div>

                        {podeGerenciarEquipe && (
                            <button
                                type="button"
                                className="equipe-secondary-button"
                            >
                                Editar equipe
                            </button>
                        )}
                    </div>
                </section>

                <section className="equipe-members-section">
                    <div className="equipe-section-header">
                        <div>
                            <h2>
                                Integrantes
                            </h2>

                            <p>
                                Pessoas que fazem parte desta equipe.
                            </p>
                        </div>

                        <span className="equipe-member-count">
                            0 integrantes
                        </span>
                    </div>

                    <div className="equipe-card equipe-empty-card">
                        <UserGroupIcon size={34} />

                        <h3>
                            Nenhum integrante ainda
                        </h3>

                        <p>
                            {isTecnico
                                ? "Você ainda não está vinculado a uma equipe."
                                : isGerente || isAdmin
                                    ? "Convide usuários para começar a montar sua equipe."
                                    : "Nenhum integrante encontrado."}
                        </p>

                        {podeGerenciarEquipe && (
                            <button
                                type="button"
                                className="equipe-primary-button"
                            >
                                <UserAdd01Icon size={18} />
                                Convidar primeiro integrante
                            </button>
                        )}
                    </div>
                </section>
            </main>
        </>
    );
}

export default EquipePage;