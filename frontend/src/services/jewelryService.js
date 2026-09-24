import axios from 'axios';

const API_URL = 'http://localhost:3000/api/jewelry';

export const getCatalog = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data; 
    } catch (error) {
        console.error("Error conectando con el backend:", error);
        throw error;
    }
};