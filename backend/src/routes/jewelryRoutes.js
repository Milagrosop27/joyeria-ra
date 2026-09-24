const express = require('express');
const router = express.Router();
const { 
    getJewelryCatalog, 
    getJewelryById, 
    createJewelry, 
    updateJewelry, 
    deactivateJewelry 
} = require('../controllers/jewelryController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rutas Públicas (Catálogo del cliente)
router.get('/', getJewelryCatalog);
router.get('/:id', getJewelryById);

// Rutas Privadas (Panel de Administración)
router.post('/', authMiddleware, createJewelry);
router.put('/:id', authMiddleware, updateJewelry);
router.patch('/:id/deactivate', authMiddleware, deactivateJewelry);

module.exports = router;