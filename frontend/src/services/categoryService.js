import axios from 'axios';
const API_URL = 'http://localhost:3000/api/categories';

export const getCategories = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        throw error;
    }
};