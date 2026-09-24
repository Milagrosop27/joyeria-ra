import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth';

export const loginAdmin = async (credentials) => {
    try {
        // credentials será un objeto con { email, password }
        const response = await axios.post(`${API_URL}/login`, credentials);
        
        // Si el backend responde con el token, lo guardamos en el navegador
        if (response.data.token) {
            localStorage.setItem('adminToken', response.data.token);
        }
        
        return response.data;
    } catch (error) {
        console.error("Error en la autenticación:", error);
        throw error;
    }
};

export const logoutAdmin = () => {
    // Para cerrar sesión, simplemente eliminamos el token del navegador
    localStorage.removeItem('adminToken');
};