# Sistema de Gestión de Menú - Los Sartenes

Sistema de gestión de menú para el restaurante Los Sartenes que incluye un panel de administración para gestionar los platos del día y una API RESTful para consumir los platos activos.

## Características

- Panel de administración para gestionar los platos del día
- API RESTful para consumir los platos activos
- Base de datos MySQL para almacenar la información de los platos
- Interfaz intuitiva y fácil de usar

## Requisitos Previos

- Node.js (v14 o superior)
- MySQL Server (5.7 o superior)
- NPM (viene con Node.js)

## Instalación

1. Clonar el repositorio:
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd los-sartenes
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar la base de datos:
   - Crear una base de datos MySQL llamada `sartenes_db` (o el nombre que prefieras)
   - Configurar las credenciales en el archivo `.env` (ver sección de configuración)
   - Ejecutar las migraciones:
     ```bash
     npm run migrate
     ```
     O manualmente importa el archivo `database/migrations/001_create_platos_del_dia.sql` en tu gestor de MySQL

## Configuración

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=sartenes_db
PORT=3000
```

## Uso

1. Iniciar el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   O en producción:
   ```bash
   npm start
   ```

2. Acceder al panel de administración:
   ```
   http://localhost:3000/admin
   ```

3. La API estará disponible en:
   ```
   GET    /api/platos-activos    - Obtener todos los platos activos
   GET    /api/platos            - Obtener todos los platos (admin)
   POST   /api/platos            - Crear un nuevo plato (admin)
   PUT    /api/platos/:id        - Actualizar un plato (admin)
   DELETE /api/platos/:id        - Eliminar un plato (admin)
   POST   /api/platos/:id/toggle - Cambiar estado activo/inactivo (admin)
   ```

## Estructura del Proyecto

```
.
├── config/               # Configuraciones
│   └── db.js            # Configuración de la base de datos
├── database/
│   └── migrations/      # Migraciones de la base de datos
│       └── 001_create_platos_del_dia.sql
├── models/              # Modelos de datos
│   └── PlatoDelDia.js
├── public/              # Archivos estáticos
├── routes/              # Rutas de la API
│   └── api/
│       └── platos.js
├── admin/               # Panel de administración
│   └── index.html
├── .env                 # Variables de entorno (crear manualmente)
├── package.json         # Dependencias y scripts
└── server.js            # Punto de entrada de la aplicación
```

## Desarrollo

- **Modo desarrollo con recarga automática**:
  ```bash
  npm run dev
  ```

- **Crear una nueva migración**:
  Crea un nuevo archivo SQL en `database/migrations/` con el siguiente formato:
  `002_descriptive_migration_name.sql`

## Despliegue

Para producción, se recomienda:

1. Configurar un servidor web como Nginx o Apache como proxy inverso
2. Usar PM2 para gestionar el proceso de Node.js:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "los-sartenes"
   pm2 save
   pm2 startup
   ```

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

Desarrollado para Los Sartenes © 2025
