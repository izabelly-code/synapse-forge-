import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiPackage, FiCalendar, FiUser, FiLogOut } from "react-icons/fi";
import { getUserById } from "../services/UserService";
import logo from "../assets/Images/black-logo.png";

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
    { label: "Pedidos", path: "/dashboard", icon: <FiPackage size={18} /> },
    { label: "Calendário", path: "/calendar", icon: <FiCalendar size={18} /> },
    { label: "Perfil", path: "/perfil", icon: <FiUser size={18} /> },
];

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const [nome, setNome] = useState(() => localStorage.getItem("userNome") ?? "");
    const [email, setEmail] = useState(() => localStorage.getItem("userEmail") ?? "");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        if (!userId || !token) return;
        getUserById(userId, token).then((user) => {
            if (user) {
                const nextNome = user.nome ?? "";
                const nextEmail = user.email ?? "";
                setNome(nextNome);
                setEmail(nextEmail);
                localStorage.setItem("userNome", nextNome);
                localStorage.setItem("userEmail", nextEmail);
            }
        });
    }, []);

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userNome");
        localStorage.removeItem("userEmail");
        navigate("/login");
    }

    function getInitial() {
        return nome ? nome.charAt(0).toUpperCase() : "?";
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <img src={logo} alt="SynapseForge" className="sidebar-logo" />
            </div>

            <div className="sidebar-user">
                <div className="sidebar-avatar">{getInitial()}</div>
                <div className="sidebar-user-info">
                    <span className="sidebar-user-name">{nome || "Usuário"}</span>
                    {email && <span className="sidebar-user-email">{email}</span>}
                </div>
            </div>

            <nav className="sidebar-nav">
                {NAV_ITEMS.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            type="button"
                            className={`sidebar-nav-item ${active ? "active" : ""}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="sidebar-nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <button type="button" className="sidebar-logout" onClick={handleLogout}>
                <span className="sidebar-nav-icon"><FiLogOut size={18} /></span>
                <span>Sair</span>
            </button>
        </aside>
    );
}

export default Sidebar;
