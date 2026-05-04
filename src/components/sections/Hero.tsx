import blackLogo from "../../assets/Images/black-logo.png";
import bigLogo from "../../assets/Images/big logo.png";
import card1Image from "../../assets/Images/card1.png";
import card2Image from "../../assets/Images/card2.png";
import card3Image from "../../assets/Images/card3.png";
import card4Image from "../../assets/Images/card4.png";
import "./Hero.css";
import Footer from "./Footer";

const navItems = [
  { href: "#recursos", label: "Recursos" },
  { href: "#solucoes", label: "Soluções" },
  { href: "#como-funciona", label: "Como Funciona" },
  { href: "#precos", label: "Preços" },
  { href: "#blog", label: "Blog" },
];

const trustItems = [
  {
    label: "Plataforma 100% Integrada",
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M10 2.3 15.6 4.4v4.5c0 3.7-2.2 6.1-5.6 7.8C6.6 15 4.4 12.6 4.4 8.9V4.4L10 2.3Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.65"
        />
        <path
          d="m7.6 9.7 1.7 1.7 3.3-3.6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.65"
        />
      </svg>
    ),
  },
  {
    label: "Segurança e Escalabilidade",
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect
          x="5.1"
          y="8.2"
          width="9.8"
          height="8.1"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.65"
        />
        <path
          d="M7.4 8.2V6.4a2.6 2.6 0 1 1 5.2 0v1.8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.65"
        />
        <path
          d="M10 11v2.3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.65"
        />
      </svg>
    ),
  },
  {
    label: "Suporte Especializado",
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M4.6 10a5.4 5.4 0 0 1 10.8 0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.65"
        />
        <rect
          x="3.2"
          y="9.1"
          width="2.8"
          height="5.7"
          rx="1.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.65"
        />
        <rect
          x="14"
          y="9.1"
          width="2.8"
          height="5.7"
          rx="1.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.65"
        />
        <path
          d="M15.2 14.1c-.3 1.6-1.8 2.8-3.5 2.8H10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.65"
        />
      </svg>
    ),
  },
];

const partnerLogos = [
  { label: "logipsum", glyph: "spark" },
  { label: "IPSUM", glyph: "split" },
  { label: "LOGOIPSUM", glyph: "seal" },
  { label: "logoipsum", glyph: "grid" },
  { label: "OGO", glyph: "loop" },
];

const marqueeLogos = [...partnerLogos, ...partnerLogos];

function GrowthIcon() {
  return (
    <svg viewBox="0 0 46 46" aria-hidden="true">
      <path
        d="M12 12v22h22"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="m16.5 28.5 7.1-7.1 5.6 5.6L34 22"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="M29.8 22H34v4.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg viewBox="0 0 46 46" aria-hidden="true">
      <path
        d="M23 8.5 34.5 12v9.5c0 7.1-4.4 11.6-11.5 15-7.1-3.4-11.5-7.9-11.5-15V12L23 8.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
      <path
        d="m18.4 22.9 3.3 3.3 6.9-7.3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 46 46" aria-hidden="true">
      <rect
        x="8.5"
        y="11.5"
        width="29"
        height="25"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M15 8.5v6M31 8.5v6M8.5 18.5h29"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
      <path
        d="m18.5 27 3 3 6-7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function Hero() {
  return (
    <main className="sf-hero-page">
      <div className="sf-hero-shell">
        <header className="sf-hero-nav">
          <a className="sf-hero-brand" href="#top" aria-label="SynapseForge">
            <img src={blackLogo} alt="SynapseForge" />
          </a>

          <nav className="sf-hero-links" aria-label="Navegação principal">
            {navItems.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <a className="sf-hero-contact" href="/login">
            Entrar
          </a>
        </header>

        <div className="sf-hero-trust" aria-label="Diferenciais">
          {trustItems.map((item) => (
            <div key={item.label} className="sf-hero-trust-item">
              <span className="sf-hero-trust-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <section className="sf-hero-content">
          <div className="sf-hero-copy">
            <h1>
              <span>Gestão completa para sua</span>
              <span>
                empresa de <strong>impressão 3D</strong>
              </span>
            </h1>

            <p>
              Conecte clientes, gestoras e equipes técnicas em um único fluxo. Acompanhe cada
              pedido em tempo real, do orçamento à entrega.
            </p>

            <div className="sf-hero-actions">
              <a className="sf-hero-primary" href="#comecar">
                Começar Agora
              </a>
              <a className="sf-hero-secondary" href="#como-funciona">
                Ver Demonstração
              </a>
            </div>
          </div>

          <div className="sf-hero-visual" aria-hidden="true">
            <div className="sf-hero-visual-panel">
              <div className="sf-hero-symbol-shadow" />
              <img className="sf-hero-symbol" src={bigLogo} alt="" />
            </div>

            <article className="sf-hero-card sf-hero-card-growth">
              <div className="sf-hero-card-icon">
                <GrowthIcon />
              </div>
              <div className="sf-hero-card-copy">
                <h2>Pedidos em Tempo Real</h2>
                <p>Acompanhe orçamentos, produção e entrega em um único painel.</p>
              </div>
            </article>

            <article className="sf-hero-card sf-hero-card-security">
              <div className="sf-hero-card-icon">
                <CalendarIcon />
              </div>
              <div className="sf-hero-card-copy">
                <h2>Produção Organizada</h2>
                <p>Visualize prazos e etapas da modelagem ao acabamento com clareza.</p>
              </div>
            </article>
          </div>

          <div className="sf-hero-logo-marquee" aria-label="Marcas parceiras">
            <div className="sf-hero-logo-track">
              {marqueeLogos.map((logo, index) => (
                <div key={logo.label + logo.glyph + index} className="sf-hero-logo-item">
                  <span className={`sf-hero-logo-glyph sf-hero-logo-glyph-${logo.glyph}`} />
                  <span>{logo.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sf-showcase-section" aria-label="Fluxos e recursos da plataforma">
          <div className="sf-showcase-grid">
            <article className="sf-showcase-card sf-showcase-card-tall">
              <div className="sf-showcase-visual sf-showcase-visual-image-wrap">
                <img
                  className="sf-showcase-image"
                  src={card1Image}
                  alt="Visão do fluxo completo de pedidos na plataforma"
                />
              </div>
              <div className="sf-showcase-copy">
                <h2>Gestão completa do fluxo</h2>
                <p>
                  Acompanhe cada pedido desde a solicitação até a entrega final, com todas as
                  etapas do processo produtivo integradas.
                </p>
              </div>
            </article>

            <div className="sf-showcase-stack">
              <article className="sf-showcase-card sf-showcase-card-top">
                <div className="sf-showcase-copy sf-showcase-copy-compact">
                  <h2>Acompanhamento em tempo real</h2>
                  <p>
                    Visualize o status de cada pedido e o progresso de cada etapa da produção em
                    tempo real.
                  </p>
                </div>
                <div className="sf-showcase-visual sf-showcase-visual-image-wrap sf-showcase-visual-medium">
                  <img
                    className="sf-showcase-image"
                    src={card2Image}
                    alt="Painel com acompanhamento em tempo real dos pedidos"
                  />
                </div>
              </article>

              <article className="sf-showcase-card sf-showcase-card-bottom">
                <div className="sf-showcase-copy sf-showcase-copy-compact">
                  <h2>Controle e eficiência</h2>
                  <p>
                    Gerencie equipes, prazos e recursos de forma organizada para aumentar a
                    produtividade.
                  </p>
                </div>
                <div className="sf-showcase-visual sf-showcase-visual-image-wrap sf-showcase-visual-small">
                  <img
                    className="sf-showcase-image"
                    src={card3Image}
                    alt="Tela de controle operacional e eficiência da produção"
                  />
                </div>
              </article>
            </div>

            <article className="sf-showcase-card sf-showcase-card-tall">
              <div className="sf-showcase-visual sf-showcase-visual-image-wrap">
                <img
                  className="sf-showcase-image"
                  src={card4Image}
                  alt="Centralização de clientes, pedidos, estoque e equipes"
                />
              </div>
              <div className="sf-showcase-copy">
                <h2>Tudo conectado em um só lugar</h2>
                <p>
                  Integre clientes, pedidos, estoque, máquinas e equipes em uma plataforma única e
                  centralizada.
                </p>
              </div>
            </article>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}

export default Hero;
