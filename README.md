# Plataforma Web de Visualización de Joyería (Realidad Aumentada)

Este repositorio contiene la base estructural del proyecto, dividida en una interfaz frontend (React/Vite) y una API backend (Node.js/Express) conectada a TiDB Cloud.

### 📌 Avance Actual (Base Estable)
* **Backend y Base de Datos:** Arquitectura modular operativa (Rutas, Controladores y Modelos). Conexión exitosa a TiDB Cloud.
* **Seguridad (Admin):** Middleware de autenticación con JWT configurado y ruta de inicio de sesión lista.
* **Frontend Cliente:** Diseño minimalista completado para el Catálogo y los Detalles de la Joya, consumiendo datos reales de la API.
* **Pendiente:** Integración de cámara/Three.js (Integrante 1) y Panel Administrativo (Integrante 3).

### 🚀 Instalación y Configuración local

**1. Clonar el repositorio**
```bash
git clone <URL_DEL_REPOSITORIO>
cd joyeria-ra

**2. Levantar el Backend (Puerto 3000)**
Abre una terminal y ejecuta:

```bash
cd backend
npm install
npm run dev

**3. Levantar el Frontend (Puerto 5173)**
Abre una segunda terminal en la raíz del proyecto y ejecuta:

```bash
cd frontend
npm install
npm run dev
