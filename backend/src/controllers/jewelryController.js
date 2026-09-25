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
        const [jewelryRows] = await pool.query('SELECT * FROM Jewelry WHERE id = ?', [req.params.id]);
        if (jewelryRows.length === 0) return res.status(404).json({ error: 'Joya no encontrada' });
        
        const jewelry = jewelryRows[0];
        
        // Obtener variantes de la joya
        const [variantRows] = await pool.query(
            'SELECT * FROM Variants WHERE jewelry_id = ? AND is_active = 1',
            [req.params.id]
        );
        
        // Para cada variante, obtener sus modelos 3D
        const variantsWithModels = await Promise.all(
            variantRows.map(async (variant) => {
                const [modelRows] = await pool.query(
                    'SELECT * FROM Models3D WHERE variant_id = ?',
                    [variant.id]
                );
                return {
                    ...variant,
                    models3d: modelRows
                };
            })
        );
        
        res.json({
            ...jewelry,
            variants: variantsWithModels
        });
    } catch (error) {
        console.error('Error al obtener la joya:', error);
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