const express = require('express');
const cors = require('cors');

// Importar las rutas
const jewelryRoutes = require('./routes/jewelryRoutes');
const authRoutes = require('./routes/authRoutes'); 
const categoryRoutes = require('./routes/categoryRoutes');
const variantRoutes = require('./routes/variantRoutes');
const model3DRoutes = require('./routes/model3DRoutes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

// Declaración de los endpoints
app.use('/api/jewelry', jewelryRoutes);
app.use('/api/auth', authRoutes); 
app.use('/api/categories', categoryRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/models3d', model3DRoutes);

module.exports = app;