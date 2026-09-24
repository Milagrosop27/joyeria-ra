import axios from 'axios';
const API_URL = 'http://localhost:3000/api/models3d';

export const getModel3DByVariant = async (variantId) => {
    try {
        const response = await axios.get(`${API_URL}/variant/${variantId}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener modelo 3D:", error);
        throw error;
    }
};