require('dotenv').config();
const app = require('./app');
const pool = require('./config/database'); // Importamos la conexión para que se ejecute la prueba

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});