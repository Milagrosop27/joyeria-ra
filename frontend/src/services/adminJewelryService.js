import axios from 'axios';

const API_URL = 'http://localhost:3000/api/jewelry';

export const getAdminJewelry = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error al obtener joyas:", error);
        throw error;
    }
};

export const createJewelry = async (formData, token) => {
    try {
        const response = await axios.post(API_URL, formData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error al crear joya:", error);
        throw error;
    }
};

export const updateJewelry = async (id, formData, token) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, formData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error al actualizar joya:", error);
        throw error;
    }
};

export const deleteJewelry = async (id, token) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Error al eliminar joya:", error);
        throw error;
    }
};
