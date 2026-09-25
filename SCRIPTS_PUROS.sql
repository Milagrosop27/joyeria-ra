-- LIMPIEZA DE TABLAS (ejecutar en orden inverso por foreign keys)
DELETE FROM Models3D;
DELETE FROM Variants;
DELETE FROM Jewelry;
DELETE FROM Categories;

-- Paso 1: Insertar categorías (SIN tracking_type - el frontend lo determinará por nombre)
INSERT INTO Categories (name, description, created_at) VALUES
('Aretes', 'Aretes para probar con detección facial', NOW()),
('Pulseras', 'Pulseras para probar con detección de manos', NOW()),
('Collares', 'Collares para probar con detección corporal', NOW());

-- Paso 2: Insertar joyas (usando IDs de categorías que se generarán)
INSERT INTO Jewelry (unique_id, name, category_id, price, short_description, is_active, created_at, updated_at) VALUES
('ARET001', 'Aretes Elegantes', (SELECT id FROM Categories WHERE name = 'Aretes' LIMIT 1), 150.00, 'Aretes dorados con diseño clásico', 1, NOW(), NOW()),
('ARET002', 'Aretes Modernos', (SELECT id FROM Categories WHERE name = 'Aretes' LIMIT 1), 180.00, 'Aretes plateados con diseño contemporáneo', 1, NOW(), NOW()),
('PULS001', 'Pulsera Clásica', (SELECT id FROM Categories WHERE name = 'Pulseras' LIMIT 1), 250.00, 'Pulsera dorada elegante', 1, NOW(), NOW()),
('COLL001', 'Collar Elegance', (SELECT id FROM Categories WHERE name = 'Collares' LIMIT 1), 350.00, 'Collar dorado con diseño sofisticado', 1, NOW(), NOW()),
('COLL002', 'Collar Moderno', (SELECT id FROM Categories WHERE name = 'Collares' LIMIT 1), 400.00, 'Collar plateado contemporáneo', 1, NOW(), NOW()),
('COLL003', 'Collar Clásico', (SELECT id FROM Categories WHERE name = 'Collares' LIMIT 1), 300.00, 'Collar oro rosa tradicional', 1, NOW(), NOW());

-- Paso 3: Insertar variantes
INSERT INTO Variants (jewelry_id, name, hex_code, is_active, created_at) VALUES
((SELECT id FROM Jewelry WHERE unique_id = 'ARET001' LIMIT 1), 'Dorado', '#FFD700', 1, NOW()),
((SELECT id FROM Jewelry WHERE unique_id = 'ARET002' LIMIT 1), 'Plateado', '#C0C0C0', 1, NOW()),
((SELECT id FROM Jewelry WHERE unique_id = 'PULS001' LIMIT 1), 'Dorado', '#FFD700', 1, NOW()),
((SELECT id FROM Jewelry WHERE unique_id = 'COLL001' LIMIT 1), 'Dorado', '#FFD700', 1, NOW()),
((SELECT id FROM Jewelry WHERE unique_id = 'COLL002' LIMIT 1), 'Plateado', '#C0C0C0', 1, NOW()),
((SELECT id FROM Jewelry WHERE unique_id = 'COLL003' LIMIT 1), 'Oro Rosa', '#B76E79', 1, NOW());

-- Paso 4: Insertar modelos 3D
INSERT INTO Models3D (variant_id, file_url, file_size_kb, scale_factor, rotation_x, rotation_y, rotation_z, created_at) VALUES
((SELECT id FROM Variants WHERE name = 'Dorado' LIMIT 1), 'http://localhost:3000/models/Aretes1.glb', 2994, 1.0, 0, 0, 0, NOW()),
((SELECT id FROM Variants WHERE name = 'Plateado' LIMIT 1), 'http://localhost:3000/models/Aretes2.glb', 1708, 1.0, 0, 0, 0, NOW()),
((SELECT id FROM Variants WHERE name = 'Dorado' LIMIT 1 OFFSET 1), 'http://localhost:3000/models/Pulsera1.glb', 4483, 1.0, 0, 0, 0, NOW()),
((SELECT id FROM Variants WHERE name = 'Dorado' LIMIT 1 OFFSET 2), 'http://localhost:3000/models/Collar1.glb', 4581, 1.0, 0, 0, 0, NOW()),
((SELECT id FROM Variants WHERE name = 'Plateado' LIMIT 1 OFFSET 1), 'http://localhost:3000/models/Collar2.glb', 5374, 1.0, 0, 0, 0, NOW()),
((SELECT id FROM Variants WHERE name = 'Oro Rosa' LIMIT 1), 'http://localhost:3000/models/Collar3.glb', 4125, 1.0, 0, 0, 0, NOW());
