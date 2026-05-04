import { useNavigate } from "react-router-dom";
import PedidosDashboard from "../components/PedidosDashboard";

function DashboardPage() {
  const navigate = useNavigate();

  return (
    <PedidosDashboard
      onLogout={() => navigate("/login")}
      onCalendario={() => navigate("/calendar")}
    />
  );
}

export default DashboardPage;
