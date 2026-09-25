const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
    getJewelryCatalog, 
    getJewelryById, 
    createJewelry, 
    updateJewelry, 
    deactivateJewelry,
    deleteJewelry
} = require('../controllers/jewelryController');
const authMiddleware = require('../middlewares/authMiddleware');

// Configuración de multer para subir archivos .glb
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/models/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['.glb', '.gltf'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos .glb o .gltf'));
        }
    }
});

// Rutas Públicas (Catálogo del cliente)
router.get('/', getJewelryCatalog);
router.get('/:id', getJewelryById);

// Rutas Privadas (Panel de Administración)
router.post('/', authMiddleware, upload.single('model_file'), createJewelry);
router.put('/:id', authMiddleware, upload.single('model_file'), updateJewelry);
router.patch('/:id/deactivate', authMiddleware, deactivateJewelry);
router.delete('/:id', authMiddleware, deleteJewelry);

module.exports = router;