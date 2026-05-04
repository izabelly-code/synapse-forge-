import { User } from '../types';

const API_URL = "http://localhost:8081/users";

export async function getUsers(token: string | null): Promise<User[]> {
    const response = await fetch(API_URL, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return await response.json();
}

export async function searchUsersByName(nome: string, token: string | null): Promise<User[]> {
    if (!nome.trim()) {
        return [];
    }
    
    try {
        const response = await fetch(`${API_URL}/search?nome=${encodeURIComponent(nome)}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            return [];
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
    }
}

export async function getUserById(id: string, token: string | null): Promise<User | null> {
    if (!id) {
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar usuário por ID:', error);
        return null;
    }
}
