const pool = require('../config/database');

const getJewelryCatalog = async (req, res) => {
    try {
        // Obtenemos solo las joyas activas para el catálogo del cliente
        const [rows] = await pool.query('SELECT * FROM Jewelry WHERE is_active = 1');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el catálogo' });
    }
};

const getJewelryById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Jewelry WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Joya no encontrada' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la joya' });
    }
};

const createJewelry = async (req, res) => {
    res.status(201).json({ message: 'Joya creada (Lógica pendiente)' });
};

const updateJewelry = async (req, res) => {
    res.json({ message: 'Joya actualizada (Lógica pendiente)' });
};

const deactivateJewelry = async (req, res) => {
    res.json({ message: 'Joya desactivada (Lógica pendiente)' });
};

// Exportamos exactamente los mismos nombres que estás importando en jewelryRoutes.js
module.exports = {
    getJewelryCatalog,
    getJewelryById,
    createJewelry,
    updateJewelry,
    deactivateJewelry
};