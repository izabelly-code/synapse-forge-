import { useEffect, useState } from "react";
import { getUsers } from "../services/UserService";
import { User } from "../types";

interface UserListProps {
    onLogout: () => void;
}

function UserList({ onLogout }: UserListProps) {

    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        getUsers(token).then(setUsers);
    }, []);

    function handleLogout() {
        localStorage.removeItem("token");
        onLogout();
    }

    return (
        <div className="app-container">
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
