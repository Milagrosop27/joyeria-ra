const express = require('express');
const router = express.Router();
const multer = require('multer');
const model3DController = require('../controllers/model3DController');
const authMiddleware = require('../middlewares/authMiddleware'); // Proteger la ruta

// Configuración para guardar el archivo en disco
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/models/'); // El archivo se guardará aquí
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Ruta POST protegida para que el administrador registre el modelo
router.post('/upload', authMiddleware, upload.single('modelFile'), model3DController.uploadModel);

module.exports = router;