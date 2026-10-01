const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'public/uploads/images/';
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

const upload = multer({ 
    storage,
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

        const { name, category_id, price, short_description, variant_name, variant_hex_code, glb_file, file_size_kb } = req.body;

        // Validar campos requeridos
        if (!name || !category_id || !price || !variant_name || !variant_hex_code || !glb_file) {
            await connection.rollback();
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Subir imagen si se proporciona
        let image_url = null;
        if (req.file) {
            image_url = `/uploads/images/${req.file.filename}`;
        }

        // Generar unique_id para la joya
        const unique_id = 'JEW-' + Date.now();

        // Insertar joya
        const [jewelryResult] = await connection.query(
            'INSERT INTO Jewelry (unique_id, name, category_id, price, short_description, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [unique_id, name, category_id, price, short_description, image_url]
        );

        const jewelry_id = jewelryResult.insertId;

        // Insertar variante
        const [variantResult] = await connection.query(
            'INSERT INTO Variants (jewelry_id, name, hex_code, is_active) VALUES (?, ?, ?, 1)',
            [jewelry_id, variant_name, variant_hex_code]
        );

        const variant_id = variantResult.insertId;

        // Insertar modelo 3D (valores por defecto para escala y rotación)
        const [modelResult] = await connection.query(
            'INSERT INTO Models3D (variant_id, file_url, file_size_kb, scale_factor, rotation_x, rotation_y, rotation_z) VALUES (?, ?, ?, 1, 0, 0, 0)',
            [variant_id, glb_file, file_size_kb || 0]
        );

        await connection.commit();

        res.status(201).json({
            message: 'Joya registrada exitosamente',
            jewelry_id,
            unique_id,
            image_url,
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

        // Actualizar joya
        await connection.query(
            'UPDATE Jewelry SET name = ?, category_id = ?, price = ?, short_description = ?, is_active = ? WHERE id = ?',
            [name, category_id, price, short_description, is_active !== undefined ? is_active : 1, id]
        );

        // Si se sube una nueva imagen, actualizar la URL
        if (req.file) {
            const image_url = `/uploads/images/${req.file.filename}`;
            await connection.query(
                'UPDATE Jewelry SET image_url = ? WHERE id = ?',
                [image_url, id]
            );
        }

        await connection.commit();

        res.status(200).json({ message: 'Joya actualizada exitosamente' });

    } catch (error) {
        await connection.rollback();
        console.error('Error al actualizar joya:', error);
        res.status(500).json({ error: 'Error al actualizar la joya' });
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
    uploadGLB,
    uploadGLBFile
};