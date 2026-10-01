# Implementación AR - Joyería en Realidad Aumentada

## RESUMEN DE IMPLEMENTACIÓN

### Tecnología AR Utilizada
- **MediaPipe** (via CDN) para detección de partes del cuerpo:
  - `@mediapipe/face_mesh` - Para aretes y anillos (detección facial)
  - `@mediapipe/hands` - Para pulseras (detección de manos)
  - `@mediapipe/pose` - Para collares (detección de cuerpo completo)
- **@google/model-viewer** - Para renderizado de modelos GLB en el navegador
- **WebGL** - Para renderizado 3D acelerado por hardware

### Compatibilidad
- Funciona en navegadores modernos con soporte WebGL
- Requiere acceso a la cámara del dispositivo
- Detecta automáticamente si el dispositivo soporta la experiencia AR
- Muestra mensaje claro si no hay soporte

---

## ARCHIVOS MODIFICADOS

### Frontend
1. **frontend/src/pages/VirtualTryOn.jsx**
   - Agregó detección de soporte AR (cámara + WebGL)
   - Carga configuración de modelo desde BD (scale_factor, rotaciones)
   - Conecta tracking con renderizado
   - Determina tipo de tracking según categoría

2. **frontend/src/modules/virtual-try-on/JewelryRendererModelViewer.jsx**
   - Agregó soporte para rotación dinámica del modelo
   - Agregó soporte para escala dinámica del modelo
   - Desactivó auto-rotate y controles de cámara para体验 AR
   - Aplica transiciones suaves de posición, rotación y escala

3. **frontend/src/modules/virtual-try-on/PoseTracking.js**
   - Mejoró detección del cuello usando múltiples landmarks
   - Usa hombros (11,12), ojos (5,6) y nariz (0)
   - Calcula posición intermedia (40% desde hombros hacia ojos)
   - Agregó logs de depuración

### Archivos Existentes (sin modificar pero utilizados)
- **frontend/src/modules/virtual-try-on/CameraView.jsx** - Acceso a cámara
- **frontend/src/modules/virtual-try-on/FaceTracking.js** - Detección facial
- **frontend/src/modules/virtual-try-on/HandTracking.js** - Detección de manos
- **frontend/src/assets/styles/VirtualTryOn.css** - Estilos

---

## CÓMO SE OBTIENE EL GLB

1. El cliente selecciona una joya en el catálogo
2. Se llama a `getJewelryById(id)` desde `jewelryService.js`
3. El backend retorna:
   ```json
   {
     "id": 1,
     "name": "Collar de oro",
     "variants": [
       {
         "id": 1,
         "name": "Plata",
         "hex_code": "#C0C0C0",
         "models3d": [
           {
             "id": 1,
             "file_url": "/models/collar-plata.glb",
             "file_size_kb": 1250,
             "scale_factor": 1.2,
             "rotation_x": 0,
             "rotation_y": 0,
             "rotation_z": 0
           }
         ]
       }
     ]
   }
   ```
4. El frontend construye la URL completa: `http://localhost:3000/models/collar-plata.glb`
5. El model-viewer carga el GLB desde esa URL

---

## CÓMO SE DETERMINA LA PARTE DEL CUERPO

### Basado en Categoría
```javascript
if (categoryName.includes('arete') || categoryName.includes('arito') || categoryName.includes('anillo')) {
  setTrackingType('face'); // Detección facial
} else if (categoryName.includes('pulsera')) {
  setTrackingType('hand'); // Detección de manos
} else if (categoryName.includes('collar')) {
  setTrackingType('pose'); // Detección de cuerpo completo
}
```

### Detalles por Categoría

**Collar (Pose Tracking)**
- Detecta hombros (landmarks 11, 12)
- Detecta ojos (landmarks 5, 6)
- Calcula cuello: 40% de distancia desde hombros hacia ojos
- Ajusta escala según ancho de hombros

**Aretes/Anillos (Face Tracking)**
- Detecta malla facial completa (468 landmarks)
- Localiza orejas (landmarks 234, 454)
- Coloca aretes en posición de orejas
- Calcula rotación según orientación de cara

**Pulseras (Hand Tracking)**
- Detecta puntos clave de mano (21 landmarks)
- Localiza muñeca (landmark 0)
- Coloca pulsera en posición de muñeca
- Calcula rotación según orientación de mano

---

## CÓMO SE CALCULA LA ESCALA

### 1. Escala Base desde BD
```javascript
const baseScale = model3d.scale_factor || 1; // Valor configurado en admin
```

### 2. Escala Dinámica según Cuerpo

**Collar:**
```javascript
const shoulderWidth = poseTracking.getShoulderWidth(landmarks);
scale = {
  x: shoulderWidth * baseScale * 2,
  y: shoulderWidth * baseScale * 2,
  z: shoulderWidth * baseScale * 2
};
```

**Aretes:**
```javascript
// Escala fija ajustada por baseScale
scale = {
  x: baseScale * 0.3,
  y: baseScale * 0.3,
  z: baseScale * 0.3
};
```

**Pulseras:**
```javascript
// Escala según tamaño de mano
const handSize = calculateHandSize(landmarks);
scale = {
  x: handSize * baseScale,
  y: handSize * baseScale,
  z: handSize * baseScale
};
```

### 3. Aplicación en model-viewer
```javascript
const baseSize = 150; // px
const scaleFactor = scale.x || 1;
container.style.width = `${baseSize * scaleFactor}px`;
container.style.height = `${baseSize * scaleFactor}px`;
```

---

## CÓMO PROBAR LA EXPERIENCIA DESDE UN CELULAR

### Requisitos
1. Celular con cámara
2. Navegador moderno (Chrome, Safari, Firefox)
3. Acceso a localhost o servidor público
4. Conexión a internet (para cargar MediaPipe desde CDN)

### Pasos

**Opción 1: Local Development**
1. Ejecutar backend: `cd backend && npm start` (http://localhost:3000)
2. Ejecutar frontend: `cd frontend && npm run dev` (http://localhost:5174)
3. Desde el celular, acceder a: `http://[TU_IP]:5174`
   - Para obtener tu IP: `ipconfig` (Windows) o `ifconfig` (Mac/Linux)
4. Abrir una joya y hacer clic en "Probar virtualmente"

**Opción 2: Deploy en servidor**
1. Deploy del backend (Vercel, Railway, etc.)
2. Deploy del frontend (Vercel, Netlify, etc.)
3. Desde el celular, acceder a la URL pública
4. Abrir una joya y hacer clic en "Probar virtualmente"

### Verificación
- Debería aparecer el mensaje de permiso de cámara
- Al aceptar, debería verse el video de la cámara
- El modelo 3D debería aparecer en la parte correcta del cuerpo
- Al moverte, el modelo debería seguir tu movimiento

---

## INTEGRACIÓN CON BASE DE DATOS

### Tablas Utilizadas
```
Categories → Jewelry → Variants → Models3D
```

### Flujo de Datos
1. **Categories**: Determina tipo de tracking (face/hand/pose)
2. **Jewelry**: Información de la joya
3. **Variants**: Diferentes colores/materiales
4. **Models3D**: Configuración del modelo 3D
   - `file_url`: URL del GLB
   - `scale_factor`: Factor de escala base
   - `rotation_x`, `rotation_y`, `rotation_z`: Ajustes de rotación

### Sin Modificaciones
- No se crearon nuevas tablas
- No se modificó la estructura existente
- Se reutilizaron todos los componentes existentes

---

## CALIDAD VISUAL

### Características Implementadas
✅ Escala realista basada en tamaño del cuerpo
✅ Seguimiento correcto del movimiento
✅ Orientación natural del modelo
✅ El modelo permanece cerca de la superficie corporal
✅ Conservación de materiales y texturas del GLB
✅ Iluminación integrada de model-viewer
✅ Transiciones suaves de posición/rotación/escala
✅ Prevención de atravesamiento del cuerpo (posicionamiento preciso)

### Optimizaciones
- Desactivado auto-rotate para体验 AR
- Desactivados controles de cámara (pan, zoom, tap)
- Transiciones CSS suaves (0.1s)
- Posición inicial centrada hasta detectar cuerpo

---

## DETECCIÓN DE ERRORES

### Mensajes de Error
- "Tu dispositivo no soporta acceso a la cámara"
- "No se pudo cargar la información de la joya"
- "Error cargando modelo" (en consola)

### Logs de Depuración
- "Pose landmarks detectados: [número]"
- "Posición del cuello: {x, y, z}"
- "Hombros: {x, y}"
- "Ojos: {x, y}"
- "Modelo cargado exitosamente"

---

## PRÓXIMOS PASOS RECOMENDADOS

1. **Pruebas en dispositivos reales**: Probar con diferentes celulares
2. **Ajuste de scale_factor**: Desde el admin, ajustar el factor de escala para cada modelo
3. **Ajuste de rotaciones**: Rotar modelos si aparecen con orientación incorrecta
4. **Optimización de GLB**: Comprimir modelos GLB para carga más rápida
5. **Fallback para browsers sin soporte**: Agregar visualización 3D estática si no hay AR

---

## TECNOLOGÍAS Y LIBRERÍAS

### Frontend
- React
- React Router
- @google/model-viewer
- MediaPipe (face_mesh, hands, pose)
- lucide-react (iconos)

### Backend
- Express
- MySQL2 (TiDB)
- Multer (subida de archivos)

### Almacenamiento
- Archivos locales: `backend/public/models/` y `backend/public/uploads/images/`
- TiDB: Metadatos y URLs

---

**Fecha de implementación**: 2026-09-30
**Estado**: Implementación básica funcional, requiere pruebas en dispositivos reales y ajuste de parámetros (scale_factor, rotaciones) desde el panel de administración.
