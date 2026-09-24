const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Buscar al administrador en la base de datos
        const [users] = await pool.query('SELECT * FROM Admins WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const admin = users[0];

        // 2. Verificar la contraseña (soporta texto plano temporalmente para facilitar tus pruebas de desarrollo)
        const isValidPassword = admin.password_hash.startsWith('$2') 
            ? await bcrypt.compare(password, admin.password_hash) 
            : password === admin.password_hash;

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 3. Generar el Token de sesión
        const token = jwt.sign(
            { id: admin.id, email: admin.email },
            process.env.JWT_SECRET || 'clave_secreta_joyeria',
            { expiresIn: '8h' }
        );

        res.json({ 
            message: 'Autenticación exitosa', 
            token: token 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { login };