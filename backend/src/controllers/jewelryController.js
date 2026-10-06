const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para subir imágenes (en memoria para guardar como BLOB en BD)
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
    }
});

// Middleware para manejar archivos opcionales
const uploadOptional = upload.any();

// Configuración de multer para subir archivos GLB
const glbStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'public/models/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadGLB = multer({
    storage: glbStorage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB límite para archivos GLB
    },
    fileFilter: (req, file, cb) => {
        console.log('Archivo recibido:', file.originalname, 'mimetype:', file.mimetype);
        const extname = path.extname(file.originalname).toLowerCase() === '.glb';
        if (extname) {
            return cb(null, true);
        }
        console.log('Extensión rechazada:', path.extname(file.originalname));
        cb(new Error('Solo se permiten archivos .glb'));
    }
});

const getJewelryCatalog = async (req, res) => {
    try {
        // Obtenemos solo las joyas activas para el catálogo del cliente
        const [rows] = await pool.query('SELECT * FROM Jewelry WHERE is_active = 1');

        // Convertir image_data (BLOB) a base64 para cada joya
        const rowsWithBase64 = rows.map(jewelry => {
            if (jewelry.image_data) {
                const base64 = jewelry.image_data.toString('base64');
                // Determinar el tipo MIME basado en los datos o usar jpeg por defecto
                const mimeType = 'image/jpeg';
                jewelry.image_url = `data:${mimeType};base64,${base64}`;
                delete jewelry.image_data;
            }
            return jewelry;
        });

        res.json(rowsWithBase64);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el catálogo' });
    }
};

const getJewelryById = async (req, res) => {
    try {
        const [jewelryRows] = await pool.query('SELECT * FROM Jewelry WHERE id = ?', [req.params.id]);
        if (jewelryRows.length === 0) return res.status(404).json({ error: 'Joya no encontrada' });

        const jewelry = jewelryRows[0];

        // Convertir image_data (BLOB) a base64
        if (jewelry.image_data) {
            const base64 = jewelry.image_data.toString('base64');
            const mimeType = 'image/jpeg';
            jewelry.image_url = `data:${mimeType};base64,${base64}`;
            delete jewelry.image_data;
        }

        // Obtener modelos 3D directamente de la joya
        const [modelRows] = await pool.query(
            'SELECT * FROM Models3D WHERE jewelry_id = ?',
            [req.params.id]
        );

        res.json({
            ...jewelry,
            models3d: modelRows
        });
    } catch (error) {
        console.error('Error al obtener la joya:', error);
        res.status(500).json({ error: 'Error al obtener la joya' });
    }
};

const uploadGLBFile = async (req, res) => {
    try {
        console.log('uploadGLBFile llamado, req.file:', req.file);
        if (!req.file) {
            console.log('Error: No se recibió ningún archivo');
            return res.status(400).json({ error: 'No se recibió ningún archivo GLB' });
        }

        const fileUrl = `/models/${req.file.filename}`;
        const fileSizeKB = Math.round(req.file.size / 1024);

        console.log('Archivo subido exitosamente:', fileUrl, 'tamaño:', fileSizeKB, 'KB');

        res.status(200).json({
            message: 'Archivo GLB subido exitosamente',
            file_url: fileUrl,
            file_size_kb: fileSizeKB
        });
    } catch (error) {
        console.error('Error al subir GLB:', error);
        res.status(500).json({ error: 'Error al subir el archivo GLB' });
    }
};

const createJewelry = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { name, category_id, price, short_description, glb_file, file_size_kb } = req.body;

        // Validar campos requeridos
        if (!name || !category_id || !price || !glb_file) {
            await connection.rollback();
            return res.status(400).json({ error: 'Faltan campos requeridos: name, category_id, price, glb_file' });
        }

        // Subir imagen si se proporciona (como BLOB en BD)
        let image_data = null;
        if (req.file) {
            image_data = req.file.buffer;
        }

        // Generar unique_id para la joya
        const unique_id = 'JEW-' + Date.now();

        // Insertar joya
        const [jewelryResult] = await connection.query(
            'INSERT INTO Jewelry (unique_id, name, category_id, price, short_description, image_data, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [unique_id, name, category_id, price, short_description, image_data]
        );

        const jewelry_id = jewelryResult.insertId;

        // Insertar modelo 3D directamente (sin variante)
        const [modelResult] = await connection.query(
            'INSERT INTO Models3D (jewelry_id, file_url, file_size_kb, scale_factor, rotation_x, rotation_y, rotation_z) VALUES (?, ?, ?, 1, 0, 0, 0)',
            [jewelry_id, glb_file, file_size_kb || 0]
        );

        await connection.commit();

        res.status(201).json({
            message: 'Joya registrada exitosamente',
            jewelry_id,
            unique_id,
            model_url: glb_file
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al crear joya:', error);
        res.status(500).json({ error: 'Error al crear la joya' });
    } finally {
        connection.release();
    }
};

const updateJewelry = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { name, category_id, price, short_description, is_active } = req.body;

        console.log('Actualizando joya ID:', id);
        console.log('Datos recibidos:', { name, category_id, price, short_description, is_active });
        console.log('Archivo recibido:', req.file);

        // Validar campos requeridos
        if (!name || !category_id || !price) {
            await connection.rollback();
            return res.status(400).json({ error: 'Faltan campos requeridos: name, category_id, price' });
        }

        // Actualizar joya
        await connection.query(
            'UPDATE Jewelry SET name = ?, category_id = ?, price = ?, short_description = ?, is_active = ? WHERE id = ?',
            [name, category_id, price, short_description, is_active !== undefined ? is_active : 1, id]
        );

        // Si se sube una nueva imagen, actualizar como BLOB
        if (req.file) {
            const image_data = req.file.buffer;
            await connection.query(
                'UPDATE Jewelry SET image_data = ? WHERE id = ?',
                [image_data, id]
            );
        }

        await connection.commit();

        res.status(200).json({ message: 'Joya actualizada exitosamente' });

    } catch (error) {
        await connection.rollback();
        console.error('Error al actualizar joya:', error);
        res.status(500).json({ error: 'Error al actualizar la joya', details: error.message });
    } finally {
        connection.release();
    }
};

const deactivateJewelry = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { id } = req.params;

        await connection.query(
            'UPDATE Jewelry SET is_active = 0 WHERE id = ?',
            [id]
        );

        res.status(200).json({ message: 'Joya desactivada exitosamente' });

    } catch (error) {
        console.error('Error al desactivar joya:', error);
        res.status(500).json({ error: 'Error al desactivar la joya' });
    } finally {
        connection.release();
    }
};

// Exportamos exactamente los mismos nombres que estás importando en jewelryRoutes.js
module.exports = {
    getJewelryCatalog,
    getJewelryById,
    createJewelry,
    updateJewelry,
    deactivateJewelry,
    upload,
    uploadOptional,
    uploadGLB,
    uploadGLBFile
};