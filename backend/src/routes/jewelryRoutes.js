const express = require('express');
const router = express.Router();
const {
    getJewelryCatalog,
    getJewelryById,
    createJewelry,
    updateJewelry,
    deactivateJewelry,
    upload,
    uploadOptional,
    uploadGLB,
    uploadGLBFile
} = require('../controllers/jewelryController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rutas Públicas (Catálogo del cliente)
router.get('/', getJewelryCatalog);
router.get('/:id', getJewelryById);

// Rutas Privadas (Panel de Administración)
router.post('/upload-glb', authMiddleware, uploadGLB.single('glbFile'), uploadGLBFile);
router.post('/', authMiddleware, upload.single('image'), createJewelry);
router.put('/:id', authMiddleware, upload.single('image'), updateJewelry);
router.patch('/:id/deactivate', authMiddleware, deactivateJewelry);

module.exports = router;