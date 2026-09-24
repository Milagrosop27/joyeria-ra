const pool = require('../config/database');

const getVariantsByJewelry = async (req, res) => {
    const { jewelry_id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM Variants WHERE jewelry_id = ? AND is_active = true', [jewelry_id]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener variantes" });
    }
};

module.exports = { getVariantsByJewelry };