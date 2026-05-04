import { useNavigate } from "react-router-dom";
import Register from "../components/Register";

function RegisterPage() {
  const navigate = useNavigate();

  return <Register onRegister={() => navigate("/login")} />;
}

export default RegisterPage;
