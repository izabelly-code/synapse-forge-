import { useEffect, useState } from "react";
import { getUsers } from "../services/UserService";

function UserList({ onLogout }) {

    const [users, setUsers] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        getUsers(token).then(setUsers);
    }, []);

    function handleLogout() {
        localStorage.removeItem("token");
        onLogout(); // avisa o App
    }

    return (
        <div className="container">
            <div className="card">

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <h2>Usuários</h2>
                    <button onClick={handleLogout}>Logout</button>
                </div>

                {users.map(user => (
                    <div key={user.id}>
                        {user.nome} - {user.email}
                    </div>
                ))}

            </div>
        </div>
    );
}

export default UserList;