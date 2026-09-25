const pool = require('../config/database');

const getCategories = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Categories');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener categorías" });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Categories (name, description) VALUES (?, ?)',
            [name, description]
        );
        res.status(201).json({ id: result.insertId, name, description });
    } catch (error) {
        res.status(500).json({ error: "Error al crear categoría" });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        await pool.query(
            'UPDATE Categories SET name = ?, description = ? WHERE id = ?',
            [name, description, id]
        );
        res.json({ id, name, description });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar categoría" });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Categories WHERE id = ?', [id]);
        res.json({ message: "Categoría eliminada" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar categoría" });
    }
};

module.exports = { 
    getCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory 
};