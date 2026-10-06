# REPORTE TÉCNICO COMPLETO - JOYERÍA RA
## Plataforma de Comercio Electrónico con Realidad Aumentada

---

## 1. INTRODUCCIÓN

### 1.1 Descripción del Proyecto
Joyería RA es una plataforma de comercio electrónico especializada en joyería que incorpora tecnología de Realidad Aumentada (RA) para permitir a los usuarios probar virtualmente las piezas de joyería. El sistema cuenta con un frontend para usuarios finales y un panel de administración para gestionar el catálogo de productos.

### 1.2 Objetivos Principales
- Catalogar y vender joyas con experiencia de prueba virtual
- Sistema de administración para gestión de productos y categorías
- Integración de modelos 3D para realidad aumentada
- Autenticación segura para administradores
- Arquitectura cliente-servidor moderna y escalable

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Arquitectura General
El proyecto sigue una arquitectura cliente-servidor con separación de responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Usuario    │  │   Catálogo   │  │  Detalles    │      │
│  │   Público    │  │   Público    │  │  Producto    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Admin      │  │   Joyas      │  │  Categorías  │      │
│  │   Dashboard  │  │   Admin      │  │   Admin      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │ HTTP/REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │   Jewelry    │  │  Categories  │      │
│  │  Controller  │  │  Controller  │  │  Controller  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │   Jewelry    │  │  Categories  │      │
│  │    Routes    │  │    Routes    │  │    Routes    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │ MySQL/TiDB
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Admins     │  │   Jewelry    │  │  Categories  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Tecnologías Principales

#### FRONTEND
- **React 19.2.8**: Framework JavaScript para construcción de interfaces de usuario
- **React Router DOM 7.18.4**: Enrutamiento para aplicaciones React
- **Vite 8.3.0**: Herramienta de construcción y desarrollo rápido
- **Axios 1.20.0**: Cliente HTTP para realizar peticiones API

#### BACKEND
- **Node.js**: Entorno de ejecución JavaScript del lado del servidor
- **Express 4.19.2**: Framework web para Node.js
- **MySQL2 3.9.7**: Driver MySQL para Node.js (compatible con TiDB Cloud)
- **JWT (jsonwebtoken 9.0.3)**: Autenticación basada en tokens JSON Web Tokens
- **Bcryptjs 3.0.3**: Encriptación de contraseñas
- **Multer 2.4.0**: Middleware para manejo de uploads de archivos
- **CORS 2.8.5**: Middleware para habilitar Cross-Origin Resource Sharing
- **Dotenv 16.4.5**: Gestión de variables de entorno

---

## 3. ESTRUCTURA DEL PROYECTO

### 3.1 Estructura de Directorios

```
joyeria-ra/
├── package.json                      # Scripts para ejecutar backend+frontend juntos
├── backend/                          # Servidor Node.js
│   ├── src/
│   │   ├── app.js                    # Configuración principal Express
│   │   ├── server.js                 # Punto de entrada del servidor
│   │   ├── config/
│   │   │   └── database.js           # Configuración conexión MySQL/TiDB
│   │   ├── controllers/              # Lógica de negocio
│   │   │   ├── authController.js     # Autenticación administradores
│   │   │   ├── categoryController.js # Gestión categorías
│   │   │   └── jewelryController.js  # Gestión joyas (incluye modelos 3D)
│   │   ├── middlewares/              # Middleware personalizados
│   │   │   └── authMiddleware.js     # Verificación JWT
│   │   └── routes/                    # Definición de rutas API
│   │       ├── authRoutes.js          # Rutas autenticación
│   │       ├── categoryRoutes.js      # Rutas categorías
│   │       └── jewelryRoutes.js       # Rutas joyas (incluye modelos 3D)
│   ├── .env                           # Variables de entorno
│   ├── package.json                   # Dependencias backend
│   └── package-lock.json
├── frontend/                         # Aplicación React
│   ├── public/                        # Archivos estáticos
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/                    # Recursos estáticos
│   │   │   ├── images/
│   │   │   │   └── logo.jpg
│   │   │   └── styles/                # Estilos CSS
│   │   │       ├── Catalog.css
│   │   │       ├── Home.css
│   │   │       ├── ProductDetails.css
│   │   │       └── VirtualTryOn.css       # Estilos probador virtual
│   │   │       └── admin/             # Estilos panel admin
│   │   │           ├── AdminCategories.css
│   │   │           ├── AdminDashboard.css
│   │   │           ├── AdminJewelry.css
│   │   │           └── AdminLogin.css
│   │   ├── components/                # Componentes React
│   │   │   └── PrivateRoute.jsx       # Ruta protegida
│   │   ├── modules/                   # Módulos especializados
│   │   │   └── virtual-try-on/        # Módulos de realidad aumentada
│   │   │       ├── CameraView.jsx
│   │   │       ├── JewelryRendererModelViewer.jsx
│   │   │       ├── NeckOccluder.jsx
│   │   │       ├── YOLOTracking.js
│   │   │       ├── FaceTracking.js
│   │   │       ├── HandTracking.js
│   │   │       └── PoseTracking.js
│   │   ├── pages/                     # Páginas de la aplicación
│   │   │   ├── Home.jsx               # Página inicio
│   │   │   ├── Catalog.jsx            # Catálogo público
│   │   │   ├── ProductDetails.jsx     # Detalles producto
│   │   │   ├── VirtualTryOn.jsx        # Probador virtual RA
│   │   │   └── admin/                 # Panel administración
│   │   │       ├── AdminDashboard.jsx  # Dashboard principal
│   │   │       ├── AdminJewelry.jsx    # Gestión joyas
│   │   │       ├── AdminCategories.jsx # Gestión categorías
│   │   │       └── AdminLogin.jsx      # Login administrador
│   │   ├── services/                  # Servicios API
│   │   │   ├── authService.js         # Servicio autenticación
│   │   │   ├── categoryService.js     # Servicio categorías
│   │   │   ├── jewelryService.js      # Servicio joyas
│   │   │   └── categoryService.js     # Servicio categorías
│   │   ├── App.jsx                    # Componente principal
│   │   ├── main.jsx                   # Punto de entrada React
│   │   └── index.css                  # Estilos globales
│   ├── index.html                     # HTML principal
│   ├── package.json                   # Dependencias frontend
│   ├── package-lock.json
│   └── vite.config.js                 # Configuración Vite
└── README.md                          # Documentación del proyecto
```

---

## 4. LIBRERÍAS Y DEPENDENCIAS

### 4.1 Backend (Node.js/Express)

#### Dependencias de Producción
| Librería | Versión | Descripción | Uso en el Proyecto |
|----------|---------|-------------|-------------------|
| **express** | 4.19.2 | Framework web minimalista | Servidor HTTP, routing, middleware |
| **mysql2** | 3.9.7 | Driver MySQL para Node.js | Conexión a base de datos MySQL/TiDB |
| **bcryptjs** | 3.0.3 | Encriptación de contraseñas | Hash de contraseñas de administradores |
| **jsonwebtoken** | 9.0.3 | Generación y verificación JWT | Tokens de autenticación |
| **cors** | 2.8.5 | Middleware CORS | Habilita peticiones cross-origin |
| **multer** | 2.4.0 | Middleware para uploads | Subida de archivos 3D (.glb) |
| **dotenv** | 16.4.5 | Carga variables de entorno | Gestión de configuración sensible |

#### Dependencias de Desarrollo
| Librería | Versión | Descripción |
|----------|---------|-------------|
| **nodemon** | 3.1.0 | Reinicio automático del servidor en desarrollo |

### 4.2 Frontend (React/Vite)

#### Dependencias de Producción
| Librería | Versión | Descripción | Uso en el Proyecto |
|----------|---------|-------------|-------------------|
| **react** | 19.2.8 | Biblioteca JavaScript para UI | Construcción de componentes |
| **react-dom** | 19.2.8 | Renderer React para DOM | Renderizado en navegador |
| **react-router-dom** | 7.18.4 | Enrutamiento para React | Navegación entre páginas |
| **axios** | 1.20.0 | Cliente HTTP | Comunicación con API backend |
| **@google/model-viewer** | 4.3.1 | Visor de modelos 3D | Renderizado de modelos GLB en el navegador |
| **@mediapipe/face_mesh** | 0.4.1633559619 | Detección facial MediaPipe | Tracking de cara para aretes/anillos |
| **@mediapipe/hands** | 0.4.1675469240 | Detección de manos MediaPipe | Tracking de manos para pulseras |
| **@mediapipe/pose** | 0.5.1675469404 | Detección de cuerpo MediaPipe | Tracking de cuerpo para collares |
| **@mediapipe/tasks-vision** | 1.0.1 | Tareas de visión MediaPipe | Funciones adicionales de visión |
| **face-api.js** | 0.22.2 | API de detección facial | Detección facial alternativa |
| **lucide-react** | 1.49.0 | Iconos React | Iconos de la interfaz |
| **three** | 0.183.0 | Librería 3D | Renderizado 3D (dependencia de model-viewer) |

#### Dependencias de Desarrollo
| Librería | Versión | Descripción |
|----------|---------|-------------|
| **vite** | 8.3.0 | Herramienta de construcción | Servidor de desarrollo y build |
| **@vitejs/plugin-react** | 6.1.1 | Plugin React para Vite | Soporte JSX en Vite |
| **@types/react** | 19.2.18 | Typescript definitions React | Tipado React |
| **@types/react-dom** | 19.2.7 | Typescript definitions React-DOM | Tipado React-DOM |
| **oxlint** | 1.81.0 | Linter JavaScript | Análisis de código |

---

## 5. BASE DE DATOS

### 5.1 Sistema de Base de Datos
- **Motor**: MySQL (compatible con TiDB Cloud)
- **Conexión**: Pool de conexiones con MySQL2
- **Configuración SSL**: Habilitada para conexiones seguras a TiDB Cloud

### 5.2 Tablas Principales

#### Tabla: Admins
```sql
- id: INT (Primary Key, Auto Increment)
- email: VARCHAR (Unique)
- password_hash: VARCHAR
- created_at: TIMESTAMP
```
**Propósito**: Almacenar credenciales de administradores del sistema.

#### Tabla: Categories
```sql
- id: INT (Primary Key, Auto Increment)
- name: VARCHAR
- description: TEXT
- created_at: TIMESTAMP
```
**Propósito**: Clasificación de joyas por categorías (collares, pulseras, aretes, etc.).

#### Tabla: Jewelry
```sql
- id: INT (Primary Key, Auto Increment)
- unique_id: VARCHAR (Unique identifier)
- name: VARCHAR
- description: TEXT
- short_description: VARCHAR
- category_id: INT (Foreign Key → Categories.id)
- price: DECIMAL
- image_data: BLOB (imagen en base64)
- is_active: BOOLEAN (default: 1)
- created_at: TIMESTAMP
```
**Propósito**: Catálogo de joyas con información, imágenes y modelos 3D asociados.

#### Tabla: Models3D
```sql
- id: INT (Primary Key, Auto Increment)
- jewelry_id: INT (Foreign Key → Jewelry.id)
- file_url: VARCHAR (URL del archivo .glb)
- file_size_kb: INT
- scale_factor: DECIMAL (factor de escala para RA)
- rotation_x: DECIMAL (rotación X para RA)
- rotation_y: DECIMAL (rotación Y para RA)
- rotation_z: DECIMAL (rotación Z para RA)
- created_at: TIMESTAMP
```
**Propósito**: Gestión detallada de modelos 3D asociados a joyas con configuración para realidad aumentada.

### 5.3 Relaciones
- **Categories** → **Jewelry**: Uno a muchos (una categoría tiene muchas joyas)
- **Jewelry** → **Models3D**: Uno a muchos (una joya puede tener múltiples modelos 3D)
**Nota**: La tabla Variants fue eliminada para simplificar la estructura. Jewelry se conecta directamente con Models3D.

---

## 6. API REST - ENDPOINTS

### 6.1 Autenticación

#### POST /api/auth/login
**Descripción**: Inicio de sesión de administradores
**Autenticación**: No requerida
**Body**:
```json
{
  "email": "admin@joyeria.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "message": "Autenticación exitosa",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 6.2 Categorías

#### GET /api/categories
**Descripción**: Obtener todas las categorías
**Autenticación**: No requerida
**Response**:
```json
[
  {
    "id": 1,
    "name": "Collares",
    "description": "Colección de collares elegantes"
  }
]
```

#### POST /api/categories
**Descripción**: Crear nueva categoría
**Autenticación**: Requerida (JWT)
**Body**:
```json
{
  "name": "Pulseras",
  "description": "Colección de pulseras modernas"
}
```

#### PUT /api/categories/:id
**Descripción**: Actualizar categoría existente
**Autenticación**: Requerida (JWT)
**Body**:
```json
{
  "name": "Pulseras",
  "description": "Descripción actualizada"
}
```

#### DELETE /api/categories/:id
**Descripción**: Eliminar categoría
**Autenticación**: Requerida (JWT)

### 6.3 Joyas (Jewelry)

#### GET /api/jewelry
**Descripción**: Obtener catálogo de joyas activas
**Autenticación**: No requerida
**Response**:
```json
[
  {
    "id": 1,
    "unique_id": "JEW-1234567890",
    "name": "Collar Elegante",
    "description": "Collar de oro con diseño moderno",
    "short_description": "Collar elegante",
    "category_id": 1,
    "price": 150.00,
    "image_url": "data:image/jpeg;base64,...",
    "is_active": 1
  }
]
```

#### GET /api/jewelry/:id
**Descripción**: Obtener joya específica por ID
**Autenticación**: No requerida

#### POST /api/jewelry
**Descripción**: Crear nueva joya
**Autenticación**: Requerida (JWT)
**Content-Type**: multipart/form-data
**Body**:
```json
{
  "name": "Nueva Joya",
  "description": "Descripción completa",
  "short_description": "Descripción corta",
  "category_id": 1,
  "price": 150.00,
  "glb_file": "/models/archivo.glb",
  "file_size_kb": 1250,
  "image": File (opcional)
}
```

#### PUT /api/jewelry/:id
**Descripción**: Actualizar joya existente
**Autenticación**: Requerida (JWT)
**Content-Type**: multipart/form-data

#### PATCH /api/jewelry/:id/deactivate
**Descripción**: Desactivar joya (soft delete)
**Autenticación**: Requerida (JWT)

#### DELETE /api/jewelry/:id
**Descripción**: Eliminar joya permanentemente
**Autenticación**: Requerida (JWT)

#### POST /api/jewelry/upload-glb
**Descripción**: Subir archivo GLB
**Autenticación**: Requerida (JWT)
**Content-Type**: multipart/form-data
**Body**: File (.glb)
**Response**:
```json
{
  "message": "Archivo GLB subido exitosamente",
  "file_url": "/models/timestamp-random.glb",
  "file_size_kb": 1250
}
```

---

## 7. FRONTEND - COMPONENTES Y PÁGINAS

### 7.1 Estructura de Rutas

#### Rutas Públicas (Usuario)
- `/` - **Home**: Página de inicio con logo y llamada a la acción
- `/catalogo` - **Catalog**: Catálogo de joyas con filtros por categoría
- `/joya/:id` - **ProductDetails**: Detalles específicos de una joya
- `/probador/:id` - **VirtualTryOn**: Probador virtual de realidad aumentada

#### Rutas Privadas (Administrador)
- `/admin/login` - **AdminLogin**: Formulario de login administradores
- `/admin` - **AdminDashboard**: Panel principal de administración
- `/admin/joyas` - **AdminJewelry**: Gestión CRUD de joyas
- `/admin/categorias` - **AdminCategories**: Gestión CRUD de categorías

### 7.2 Componentes Principales

#### App.jsx
**Propósito**: Componente principal que define el enrutamiento de la aplicación
**Funcionalidades**:
- Configuración de React Router
- Definición de rutas públicas y privadas
- Implementación de rutas protegidas con PrivateRoute

#### PrivateRoute.jsx
**Propósito**: Componente de protección de rutas administrativas
**Funcionalidades**:
- Verificación de token JWT en localStorage
- Redirección a login si no hay autenticación
- Renderizado de children si autenticación es válida

### 7.3 Páginas del Usuario

#### Home.jsx
**Propósito**: Página de inicio de la aplicación
**Componentes**:
- Logo de Joyería RA
- Título principal
- Botón de navegación al catálogo
**Estilos**: Home.css

#### Catalog.jsx
**Propósito**: Catálogo público de joyas con filtros
**Funcionalidades**:
- Carga de joyas y categorías desde API
- Filtrado por categorías
- Grid de productos con tarjetas
- Enlaces a detalles y probador virtual
**Servicios**: jewelryService.js, categoryService.js
**Estilos**: Catalog.css

#### ProductDetails.jsx
**Propósito**: Página de detalles de producto específico
**Funcionalidades**:
- Carga de detalles de joya por ID
- Visualización de información completa
- Enlace al probador virtual
**Estilos**: ProductDetails.css

#### VirtualTryOn.jsx
**Propósito**: Probador virtual de realidad aumentada
**Funcionalidades**:
- Acceso a cámara del dispositivo
- Detección de partes del cuerpo según categoría (face/hand/pose)
- Renderizado de modelos 3D en tiempo real
- Ajuste dinámico de escala y rotación
- Precarga de modelos para cambio rápido
- Visualización de imágenes de joyas en selector
**Módulos**: CameraView, JewelryRendererModelViewer, FaceTracking, HandTracking, PoseTracking
**Estilos**: VirtualTryOn.css

### 7.4 Páginas de Administración

#### AdminLogin.jsx
**Propósito**: Formulario de autenticación para administradores
**Funcionalidades**:
- Formulario de email y contraseña
- Llamada a API de autenticación
- Almacenamiento de token JWT
- Redirección al dashboard
**Servicios**: authService.js
**Estilos**: AdminLogin.css

#### AdminDashboard.jsx
**Propósito**: Panel principal de administración
**Funcionalidades**:
- Navegación a secciones de administración
- Enlaces a gestión de joyas y categorías
- Botón de cierre de sesión
**Estilos**: AdminDashboard.css

#### AdminJewelry.jsx
**Propósito**: Gestión completa de joyas (CRUD)
**Funcionalidades**:
- Listado de joyas existentes
- Formulario de creación/edición
- Subida de archivos 3D (.glb)
- Selector de categorías
- Eliminación de joyas
**Servicios**: adminJewelryService.js, categoryService.js
**Estilos**: AdminJewelry.css

#### AdminCategories.jsx
**Propósito**: Gestión de categorías (CRUD)
**Funcionalidades**:
- Listado de categorías
- Formulario de creación/edición
- Eliminación de categorías
**Servicios**: categoryService.js
**Estilos**: AdminCategories.css

### 7.5 Servicios API

#### authService.js
**Función**: Comunicación con endpoints de autenticación
**Métodos**: login (POST /api/auth/login)

#### categoryService.js
**Función**: Comunicación con endpoints de categorías
**Métodos**: getCategories (GET /api/categories)

#### jewelryService.js
**Función**: Comunicación con endpoints públicos de joyas
**Métodos**: getCatalog (GET /api/jewelry)

#### adminJewelryService.js
**Función**: Comunicación con endpoints administrativos de joyas
**Métodos**:
- getAdminJewelry (GET /api/jewelry)
- createJewelry (POST /api/jewelry)
- updateJewelry (PUT /api/jewelry/:id)
- deleteJewelry (DELETE /api/jewelry/:id)
- uploadGLB (POST /api/jewelry/upload-glb)

---

## 8. SEGURIDAD

### 8.1 Autenticación
- **JWT (JSON Web Tokens)**: Tokens con expiración de 8 horas
- **Bcryptjs**: Encriptación de contraseñas con salt rounds
- **Middleware de autenticación**: Verificación de tokens en rutas protegidas

### 8.2 Autorización
- **Rutas públicas**: Catálogo y detalles accesibles sin autenticación
- **Rutas privadas**: Panel de administración requiere token JWT válido
- **Separación de roles**: Solo administradores pueden modificar datos

### 8.3 Seguridad en Archivos
- **Validación de tipos**: Solo se permiten archivos .glb y .gltf
- **Nombres únicos**: Timestamp + random para evitar colisiones
- **Almacenamiento seguro**: Directorio público uploads con control de acceso

### 8.4 Variables de Entorno
- **Configuración sensible**: JWT_SECRET, credenciales BD en .env
- **No commits**: Archivo .env en .gitignore
- **CORS**: Configurado para permitir origen específico

---

## 9. FUNCIONALIDADES ESPECÍFICAS

### 9.1 Realidad Aumentada (Probador Virtual)
- **MediaPipe Tracking**: Detección de partes del cuerpo en tiempo real
  - Face Mesh: Para aretes y anillos (468 landmarks faciales)
  - Hands: Para pulseras (21 landmarks por mano)
  - Pose: Para collares (33 landmarks del cuerpo)
- **@google/model-viewer**: Renderizado de modelos GLB en el navegador
- **Detección automática**: Determina tipo de tracking según categoría de joya
- **Ajuste dinámico**: Escala y rotación se ajustan según tamaño del cuerpo
- **Precarga de modelos**: Carga anticipada para cambio fluido entre joyas
- **Imágenes de joyas**: Visualización de imágenes en el selector inferior

### 9.2 Gestión de Archivos 3D
- **Formatos soportados**: .glb (binary glTF)
- **Multer configuration**: Storage en disco con validación de tipos
- **Ruta de almacenamiento**: backend/public/models/
- **Nomenclatura**: timestamp-random.extension
- **Configuración RA**: Cada modelo tiene scale_factor y rotaciones configurables

### 9.3 Sistema de Categorías
- **Clasificación jerárquica**: Joyas organizadas por categorías
- **Filtrado dinámico**: Catálogo con filtro por categoría en tiempo real
- **Gestión administrativa**: CRUD completo de categorías

### 9.4 Panel de Administración
- **Interfaz intuitiva**: Diseño consistente con el estilo de la marca
- **CRUD completo**: Crear, leer, actualizar, eliminar joyas y categorías
- **Vista previa**: Listado con información resumida de items
- **Formularios dinámicos**: Validación y manejo de estados

### 9.5 Experiencia de Usuario
- **Navegación fluida**: React Router para transiciones sin recarga
- **Carga asíncrona**: Promises y async/await para operaciones API
- **Estados de carga**: Indicadores visuales durante operaciones
- **Manejo de errores**: Mensajes de error descriptivos

---

## 10. FLUJO DE LA APLICACIÓN

### 10.1 Flujo de Usuario Final
1. **Acceso**: Usuario ingresa a la URL principal (/)
2. **Navegación**: Usuario hace clic en "Explorar joyas"
3. **Catálogo**: Sistema carga joyas y categorías desde API con imágenes
4. **Filtrado**: Usuario puede filtrar por categoría específica
5. **Detalles**: Usuario selecciona una joya para ver detalles
6. **Prueba Virtual**: Usuario accede al probador virtual RA
   - Sistema solicita acceso a cámara
   - MediaPipe detecta parte del cuerpo según categoría
   - Modelo 3D se renderiza en tiempo real sobre el cuerpo
   - Usuario puede cambiar entre joyas de la misma categoría

### 10.2 Flujo de Administrador
1. **Login**: Administrador accede a /admin/login
2. **Autenticación**: Sistema valida credenciales y genera JWT
3. **Dashboard**: Administrador accede al panel principal
4. **Gestión Joyas**: CRUD completo de productos con archivos 3D
5. **Gestión Categorías**: CRUD completo de clasificaciones
6. **Logout**: Cierre de sesión eliminando token

### 10.3 Flujo de Datos
1. **Frontend**: Componente React interactúa con servicio API
2. **Servicio**: Axios realiza petición HTTP al backend
3. **Backend**: Express router recibe petición y valida middleware
4. **Controller**: Lógica de negocio procesa la solicitud
5. **Base de Datos**: MySQL/TiDB ejecuta consulta SQL
6. **Respuesta**: Datos retornan en formato JSON a través de la cadena

---

## 11. CONFIGURACIÓN Y DESPLIEGUE

### 11.1 Configuración de Desarrollo

#### Opción 1: Ejecutar Backend y Frontend juntos (Recomendado)
```bash
# Desde la raíz del proyecto
npm run install-all  # Instala todas las dependencias
npm run dev          # Ejecuta backend y frontend simultáneamente
```

#### Opción 2: Ejecutar por separado
```bash
# Backend
cd backend
npm install
npm run dev  # Desarrollo con nodemon
npm start     # Producción

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev   # Desarrollo con Vite
npm run build # Producción
```

### 11.2 Variables de Entorno (Backend)
```env
DB_HOST=tidb.cloud.example.com
DB_USER=usuario
DB_PASSWORD=contraseña
DB_NAME=joyeria_ra
DB_PORT=4000
JWT_SECRET=clave_secreta_super_segura
PORT=3000
```

### 11.3 Puertos de Servicio
- **Frontend**: http://localhost:5174 (Vite dev server)
- **Backend**: http://localhost:3000 (Express server)
- **Base de Datos**: Configurado en .env (TiDB Cloud por defecto)

### 11.4 Scripts Disponibles (Raíz)
- `npm run install-all` - Instala dependencias de backend, frontend y raíz
- `npm run dev` - Ejecuta backend y frontend simultáneamente
- `npm run dev:backend` - Ejecuta solo el backend
- `npm run dev:frontend` - Ejecuta solo el frontend
- `npm run build` - Construye el frontend para producción
- `npm start` - Inicia el backend en modo producción

---

## 12. ESTADO ACTUAL DEL PROYECTO

### 12.1 Funcionalidades Completadas
✅ Sistema de autenticación para administradores
✅ Panel de administración completo
✅ Gestión CRUD de joyas
✅ Gestión CRUD de categorías
✅ Catálogo público con filtros
✅ Página de detalles de productos
✅ Sistema de subida de archivos 3D
✅ Integración con base de datos MySQL/TiDB
✅ Estructura de servicios API organizada
✅ Sistema de rutas protegidas
✅ Diseño responsivo y estilos CSS
✅ Probador virtual de realidad aumentada (MediaPipe)
✅ Tracking facial para aretes/anillos
✅ Tracking de manos para pulseras
✅ Tracking de cuerpo para collares
✅ Renderizado de modelos 3D en tiempo real
✅ Visualización de imágenes de joyas en el probador
✅ Precarga de modelos para cambio fluido
✅ Ejecución unificada de backend y frontend
✅ Simplificación de estructura BD (eliminación de Variants)
✅ Almacenamiento de imágenes como BLOB en base de datos

### 12.2 Funcionalidades Pendientes
⏳ Sistema de carrito de compras
⏳ Pasarela de pagos
⏳ Sistema de reviews/calificaciones
⏳ Gestión de inventario
⏳ Panel de estadísticas y analytics
⏳ Optimización de modelos GLB
⏳ Pruebas en dispositivos móviles reales

### 12.3 Almacenamiento de Archivos
- **Modelos 3D**: backend/public/models/ (archivos .glb)
- **Imágenes**: Base de datos (BLOB convertidos a base64 en API)

---

## 13. CONCLUSIONES Y RECOMENDACIONES

### 13.1 Puntos Fuertes
- **Arquitectura modular**: Separación clara de responsabilidades
- **Escalabilidad**: Estructura preparada para crecimiento
- **Seguridad**: Implementación de JWT y encriptación de contraseñas
- **UX/UI**: Interfaz intuitiva para usuarios y administradores
- **Tecnologías modernas**: React 19, Vite, Express actualizados

### 13.2 Áreas de Mejora
- **Testing**: Implementar pruebas unitarias y de integración
- **Documentación API**: Generar documentación automática (Swagger)
- **Optimización**: Implementar lazy loading y code splitting
- **Error handling**: Mejorar manejo de errores y logging
- **Validación**: Implementar validación de datos más robusta

### 13.3 Recomendaciones Futuras
1. **Implementar Docker**: Para contenerización y despliegue fácil
2. **CI/CD Pipeline**: Automatizar pruebas y despliegues
3. **Monitoring**: Implementar herramientas de monitoreo
4. **Caching**: Redis para caché de sesiones y datos frecuentes
5. **CDN**: Para distribución de archivos estáticos y modelos 3D

---

## 14. REFERENCIAS

### 14.1 Documentación
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [MySQL2 Documentation](https://github.com/sidorares/node-mysql2)
- [Vite Documentation](https://vitejs.dev/)
- [JWT.io](https://jwt.io/)

### 14.2 Recursos de Aprendizaje
- [React Router](https://reactrouter.com/)
- [Axios Documentation](https://axios-http.com/)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)

---

**Fecha del Reporte**: 6 de octubre de 2026
**Versión del Proyecto**: 2.0.0
**Estado**: Implementación de Realidad Aumentada completada, estructura de base de datos simplificada, imágenes integradas en el probador virtual, ejecución unificada de backend/frontend implementada.
