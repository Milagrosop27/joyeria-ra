const pool = require('../config/database');

const getCategories = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Categories');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener categorías" });
    }
};

module.exports = { getCategories };