const express = require('express');
const router = express.Router();
const { 
    getCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory 
} = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rutas Públicas
router.get('/', getCategories);

// Rutas Privadas (Panel de Administración)
router.post('/', authMiddleware, createCategory);
router.put('/:id', authMiddleware, updateCategory);
router.delete('/:id', authMiddleware, deleteCategory);

module.exports = router;