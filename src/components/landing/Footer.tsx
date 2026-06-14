import blackLogo from "../../assets/Images/black-logo.png";
import "./Footer.css";

const footerColumns = [
  {
    heading: "Produto",
    links: [
      { label: "Recursos", href: "#recursos" },
      { label: "Soluções", href: "#solucoes" },
      { label: "Como Funciona", href: "#como-funciona" },
      { label: "Preços", href: "#precos" },
    ],
  },
  {
    heading: "Empresa",
    links: [
      { label: "Sobre", href: "#sobre" },
      { label: "Blog", href: "#blog" },
      { label: "Contato", href: "#contato" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacidade", href: "#privacidade" },
      { label: "Termos de Uso", href: "#termos" },
    ],
  },
];

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">
      <path d="M4.98 3.5C4.98 4.6 4.1 5.5 3 5.5S1 4.6 1 3.5 1.9 1.5 3 1.5s1.98.9 1.98 2ZM1.2 7h3.55v11H1.2V7Zm5.57 0h3.4v1.5h.05C10.74 7.4 12 6.7 13.7 6.7c3.6 0 4.3 2.38 4.3 5.47V18h-3.54v-5.18c0-1.24-.02-2.83-1.72-2.83-1.73 0-2 1.35-2 2.74V18H7.17V7H6.77Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 1.5A8.5 8.5 0 0 0 1.5 10c0 3.74 2.43 6.91 5.8 8.03.42.08.58-.18.58-.4v-1.4c-2.36.51-2.86-1.14-2.86-1.14-.39-1-.95-1.27-.95-1.27-.77-.53.06-.52.06-.52.85.06 1.3.88 1.3.88.76 1.3 2 .92 2.48.7.08-.55.3-.92.54-1.13-1.88-.21-3.86-.94-3.86-4.2 0-.93.33-1.68.88-2.28-.09-.21-.38-1.07.08-2.24 0 0 .72-.23 2.35.88A8.2 8.2 0 0 1 10 6.07c.73 0 1.46.1 2.14.29 1.63-1.11 2.35-.88 2.35-.88.46 1.17.17 2.03.08 2.24.55.6.88 1.35.88 2.28 0 3.27-1.99 3.99-3.88 4.2.3.26.57.78.57 1.57v2.33c0 .22.16.49.59.4A8.502 8.502 0 0 0 18.5 10 8.5 8.5 0 0 0 10 1.5Z"
      />
    </svg>
  );
}

function Footer() {
  return (
    <footer className="sf-footer">
      <div className="sf-footer-shell">
        <div className="sf-footer-cta">
          <div className="sf-footer-cta-copy">
            <h2>
              Pronto para transformar sua<br />
              <strong>produção 3D?</strong>
            </h2>
            <p>
              Comece gratuitamente e descubra como o SynapseForge unifica
              cada etapa do seu processo produtivo.
            </p>
          </div>
          <div className="sf-footer-cta-actions">
            <a className="sf-footer-cta-primary" href="#comecar">
              Começar Agora
            </a>
            <a className="sf-footer-cta-secondary" href="#como-funciona">
              Ver Demonstração
            </a>
          </div>
        </div>

        <div className="sf-footer-divider" />

        <div className="sf-footer-main">
          <div className="sf-footer-brand">
            <a href="#top" aria-label="SynapseForge">
              <img src={blackLogo} alt="SynapseForge" />
            </a>
            <p>
              Gestão completa para empresas de impressão 3D. Do orçamento
              à entrega, tudo em um só lugar.
            </p>
          </div>

          <nav className="sf-footer-nav" aria-label="Links do rodapé">
            {footerColumns.map((col) => (
              <div key={col.heading} className="sf-footer-col">
                <span className="sf-footer-col-heading">{col.heading}</span>
                <ul>
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="sf-footer-divider" />

        <div className="sf-footer-bottom">
          <span>© 2025 SynapseForge. Todos os direitos reservados.</span>
          <div className="sf-footer-social">
            <a
              href="https://linkedin.com"
              aria-label="LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkedInIcon />
            </a>
            <a
              href="https://github.com"
              aria-label="GitHub"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
