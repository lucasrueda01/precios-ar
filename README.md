# PrecioAR - Monorepo

Plataforma de búsqueda y comparación de precios de supermercados en Argentina, utilizando datos abiertos del SEPA (Sistema Electrónico de Publicidad de Precios Argentinos).

Este repositorio está estructurado como un **monorepo** que unifica tanto el frontend como el backend en un único lugar para facilitar el desarrollo, control de versiones y despliegue.

## 📁 Estructura del Proyecto

```text
precioar/
├── backend/       # API REST con FastAPI (Python / SQLAlchemy)
├── frontend/      # Aplicación Web con Next.js (React / Tailwind CSS / TypeScript)
├── package.json   # Scripts útiles de gestión del monorepo
└── .gitignore     # Configuración global de exclusión para Git
```

---

## 🚀 Guía de Inicio Rápido

### 1. Requisitos Prerequisitos
- **Node.js** (v18 o superior) y **npm**
- **Python** (v3.10 o superior) y **pip**

---

### 2. Configuración y Ejecución del Backend (FastAPI)

El backend expone la API REST para buscar productos, consultar precios por sucursal/provincia e ingestar los datos del SEPA.

1. Navegar al directorio raíz o directamente a `backend/`:
   ```bash
   # Opción recomendado desde la raíz con los scripts del monorepo:
   npm run dev:backend
   ```
   *O alternativamente de forma manual:*
   ```bash
   cd backend
   # (Opcional) Crear entorno virtual: python -m venv venv && .\venv\Scripts\activate
   pip install fastapi uvicorn sqlalchemy
   uvicorn main:app --reload
   ```
2. La API estará disponible en `http://localhost:8000`.
3. Documentación interactiva (Swagger UI) disponible en `http://localhost:8000/docs`.

---

### 3. Configuración y Ejecución del Frontend (Next.js)

El frontend es una interfaz moderna construida con Next.js 16, React 19 y Tailwind CSS.

1. Instalar dependencias del frontend:
   ```bash
   cd frontend
   npm install
   ```
2. Iniciar el servidor de desarrollo:
   ```bash
   # Desde la raíz del monorepo:
   npm run dev:frontend
   ```
   *O desde dentro de `frontend/`:*
   ```bash
   npm run dev
   ```
3. La aplicación estará disponible en `http://localhost:3000`.

---

## 🛠️ Scripts del Monorepo (Raíz)

Desde la raíz del proyecto puedes ejecutar los siguientes comandos utilizando npm:

| Comando | Descripción |
| :--- | :--- |
| `npm run dev:frontend` | Inicia el servidor de desarrollo del frontend (Next.js en el puerto 3000). |
| `npm run dev:backend` | Inicia el servidor de desarrollo del backend (FastAPI en el puerto 8000). |
| `npm run build:frontend` | Construye la versión de producción del frontend. |
| `npm run lint:frontend` | Ejecuta el linter en el código del frontend. |

---

## 📚 Tecnologías Utilizadas

- **Backend:** Python, FastAPI, SQLAlchemy, Uvicorn, SQLite/PostgreSQL.
- **Frontend:** TypeScript, Next.js (App Router), React 19, Tailwind CSS v4, Lucide Icons, Recharts.
