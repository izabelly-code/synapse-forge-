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
