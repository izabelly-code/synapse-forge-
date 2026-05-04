import { useNavigate } from "react-router-dom";
import PasswordRecovery from "../components/PasswordRecovery";

function RecoveryPage() {
  const navigate = useNavigate();

  return <PasswordRecovery goToLogin={() => navigate("/login")} />;
}

export default RecoveryPage;
