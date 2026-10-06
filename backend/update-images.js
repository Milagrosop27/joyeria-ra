const pool = require('./src/config/database');

async function updateImages() {
    try {
        console.log('Actualizando imágenes de aretes...');
        
        // Actualizar arete 60007
        await pool.query(
            'UPDATE Jewelry SET image_url = ? WHERE id = ?',
            ['/uploads/images/aretemoderno.jpg', 60007]
        );
        console.log('Arete 60007 actualizado');
        
        // Actualizar arete 60008
        await pool.query(
            'UPDATE Jewelry SET image_url = ? WHERE id = ?',
            ['/uploads/images/aretemoderno.jpg', 60008]
        );
        console.log('Arete 60008 actualizado');
        
        console.log('¡Actualización completada!');
        process.exit(0);
    } catch (error) {
        console.error('Error actualizando imágenes:', error);
        process.exit(1);
    }
}

updateImages();
