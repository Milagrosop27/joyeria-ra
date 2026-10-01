import axios from 'axios';

const API_URL = 'http://localhost:3000/api/jewelry';

const getAuthHeader = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getCatalog = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data; 
    } catch (error) {
        console.error("Error conectando con el backend:", error);
        throw error;
    }
};

export const getJewelryById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error obteniendo joya por ID:", error);
        throw error;
    }
};

export const uploadGLB = async (file) => {
    try {
        const formData = new FormData();
        formData.append('glbFile', file);
        
        const response = await axios.post(`${API_URL}/upload-glb`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error("Error subiendo archivo GLB:", error);
        throw error;
    }
};

export const createJewelry = async (jewelryData, imageFile) => {
    try {
        const formData = new FormData();

        // Agregar campos de texto
        Object.keys(jewelryData).forEach(key => {
            formData.append(key, jewelryData[key]);
        });

        // Agregar imagen si existe
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const response = await axios.post(API_URL, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    } catch (error) {
        console.error("Error creando joya:", error);
        throw error;
    }
};

export const updateJewelry = async (id, jewelryData, imageFile) => {
    try {
        const formData = new FormData();

        // Agregar campos de texto
        Object.keys(jewelryData).forEach(key => {
            formData.append(key, jewelryData[key]);
        });

        // Agregar imagen si existe
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const response = await axios.put(`${API_URL}/${id}`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    } catch (error) {
        console.error("Error actualizando joya:", error);
        throw error;
    }
};

export const deactivateJewelry = async (id) => {
    try {
        const response = await axios.patch(`${API_URL}/${id}/deactivate`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error("Error desactivando joya:", error);
        throw error;
    }
};