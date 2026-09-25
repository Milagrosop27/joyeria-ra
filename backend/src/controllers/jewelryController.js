const pool = require('../config/database');
const path = require('path');

const getJewelryCatalog = async (req, res) => {
    try {
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
    try {
        const { name, description, short_description, category_id } = req.body;
        const model_file = req.file ? req.file.filename : null;
        
        const [result] = await pool.query(
            'INSERT INTO Jewelry (name, description, short_description, category_id, model_file, is_active) VALUES (?, ?, ?, ?, ?, 1)',
            [name, description, short_description, category_id, model_file]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            name, 
            description, 
            short_description, 
            category_id, 
            model_file 
        });
    } catch (error) {
        console.error('Error creating jewelry:', error);
        res.status(500).json({ error: 'Error al crear joya' });
    }
};

const updateJewelry = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, short_description, category_id } = req.body;
        const model_file = req.file ? req.file.filename : req.body.existing_model_file;
        
        await pool.query(
            'UPDATE Jewelry SET name = ?, description = ?, short_description = ?, category_id = ?, model_file = ? WHERE id = ?',
            [name, description, short_description, category_id, model_file, id]
        );
        
        res.json({ id, name, description, short_description, category_id, model_file });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar joya' });
    }
};

const deactivateJewelry = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE Jewelry SET is_active = 0 WHERE id = ?', [id]);
        res.json({ message: 'Joya desactivada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al desactivar joya' });
    }
};

const deleteJewelry = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Jewelry WHERE id = ?', [id]);
        res.json({ message: 'Joya eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar joya' });
    }
};

module.exports = {
    getJewelryCatalog,
    getJewelryById,
    createJewelry,
    updateJewelry,
    deactivateJewelry,
    deleteJewelry
};