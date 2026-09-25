-- Agregar campo de imagen a la tabla Jewelry
ALTER TABLE Jewelry ADD COLUMN image_url VARCHAR(500) NULL AFTER short_description;

-- Actualizar joyas con URLs de imágenes de ejemplo
UPDATE Jewelry SET image_url = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop' WHERE unique_id = 'ARET001';
UPDATE Jewelry SET image_url = 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=400&h=400&fit=crop' WHERE unique_id = 'ARET002';
UPDATE Jewelry SET image_url = 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop' WHERE unique_id = 'PULS001';
UPDATE Jewelry SET image_url = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop' WHERE unique_id = 'COLL001';
UPDATE Jewelry SET image_url = 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop' WHERE unique_id = 'COLL002';
UPDATE Jewelry SET image_url = 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop' WHERE unique_id = 'COLL003';
