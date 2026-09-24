import axios from 'axios';
const API_URL = 'http://localhost:3000/api/variants';

export const getVariantsByJewelry = async (jewelryId) => {
    try {
        const response = await axios.get(`${API_URL}/jewelry/${jewelryId}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener variantes:", error);
        throw error;
    }
};