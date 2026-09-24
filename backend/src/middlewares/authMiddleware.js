const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. Extraer el token de los encabezados de la petición
    const token = req.header('Authorization');

    // 2. Si no hay token, se bloquea el acceso
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Se requiere autenticación del administrador.' });
    }

    try {
        // 3. Limpiar el string y verificar su validez (usamos una clave temporal si no hay .env configurado aún)
        const tokenLimpio = token.replace('Bearer ', '');
        const verified = jwt.verify(tokenLimpio, process.env.JWT_SECRET || 'clave_secreta_joyeria');
        
        req.admin = verified; // Guardamos los datos del admin en la petición
        
        next(); // 4. El token es válido, permitimos que el código continúe hacia el controlador
    } catch (error) {
        res.status(400).json({ error: 'Token inválido o expirado.' });
    }
};

module.exports = authMiddleware;