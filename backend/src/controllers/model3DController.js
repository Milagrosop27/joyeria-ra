const Model3D = require('../models/Model3D'); // Conexión a TiDB Cloud

exports.uploadModel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo GLB' });
        }

        const { variant_id } = req.body;
        // Se genera la referencia en texto que se guardará en la base de datos
        const filePath = `/uploads/models/${req.file.filename}`; 

        // Almacenar la información estructurada en TiDB Cloud
        const newModel = await Model3D.create({
            variant_id: variant_id,
            file_url: filePath,
            format: 'GLB'
        });

        res.status(201).json({
            message: 'Modelo 3D cargado y referenciado exitosamente',
            data: newModel
        });
    } catch (error) {
        console.error('Error al subir modelo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};