const pool = require('../config/database');

const Model3D = {
    create: async (data) => {
        const { variant_id, file_url, format } = data;
        
        // Insertamos la ruta del archivo en la base de datos
        const [result] = await pool.query(
            'INSERT INTO Models3D (variant_id, file_url, format) VALUES (?, ?, ?)',
            [variant_id, file_url, format]
        );
        
        return { id: result.insertId, ...data };
    }
};

module.exports = Model3D;