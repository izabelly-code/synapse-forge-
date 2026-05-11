import { useNavigate } from "react-router-dom";
import PedidosDashboard from "../components/PedidosDashboard";

function DashboardPage() {
  const navigate = useNavigate();

  return (
    <PedidosDashboard
      onLogout={() => navigate("/login")}
      onCalendario={() => navigate("/calendar")}
      onPerfil={() => navigate("/perfil")}
    />
  );
}

export default DashboardPage;
