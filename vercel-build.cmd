@echo off
setlocal enabledelayedexpansion

echo  ============================================
echo  🚀 INICIANDO CONSTRUCCION EN VERCEL
echo  ============================================

:: Verificar si estamos en entorno de producción
if "%VERCEL_ENV%"=="production" (
    echo 🔵 MODO: PRODUCCION
) else (
    echo 🟡 MODO: DESARROLLO
)

:: 1. Instalar dependencias
echo.
echo 📦 INSTALANDO DEPENDENCIAS...
echo --------------------------------------------
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error al instalar dependencias
    exit /b 1
)

:: 2. Crear estructura de directorios
echo.
echo 📂 CREANDO ESTRUCTURA DE DIRECTORIOS...
echo --------------------------------------------

:: Directorio principal
if not exist public (
    echo Creando directorio public...
    mkdir public
)

:: Directorios necesarios
for %%d in (
    "public/images/platos"
    "public/admin"
    "public/css"
    "public/js"
    "public/components"
    "public/menu"
) do (
    if not exist "%%~d" (
        echo Creando directorio: %%~d
        mkdir "%%~d"
    )
)

:: 3. Copiar archivos estáticos
echo.
echo 📄 COPIANDO ARCHIVOS ESTATICOS...
echo --------------------------------------------

:: Copiar archivos HTML
if exist "*.html" (
    echo Copiando archivos HTML...
    copy /Y "*.html" "public\" >nul
)

:: Copiar directorios estáticos
for %%d in (
    "components"
    "css"
    "js"
    "images"
    "menu"
) do (
    if exist "%%~d" (
        echo Copiando directorio: %%~d
        xcopy /E /I /Y /Q "%%~d" "public\%%~d" >nul
    )
)

:: 4. Configurar panel de administración
echo.
echo 👨‍💻 CONFIGURANDO PANEL DE ADMINISTRACION...
echo --------------------------------------------

if exist "admin" (
    echo Copiando archivos del panel de administración...
    xcopy /E /I /Y /Q "admin" "public\admin" >nul
)

:: 5. Verificar archivos necesarios
echo.
echo 🔍 VERIFICANDO ARCHIVOS NECESARIOS...
echo --------------------------------------------

set MISSING_FILES=0

for %%f in (
    "public/index.html"
    "public/admin/index.html"
    "server.js"
    "package.json"
) do (
    if not exist "%%~f" (
        echo ❌ Archivo no encontrado: %%~f
        set /a MISSING_FILES+=1
    ) else (
        echo ✅ Archivo encontrado: %%~f
    )
)

if !MISSING_FILES! GTR 0 (
    echo.
    echo ❗ Se encontraron !MISSING_FILES! archivos faltantes
    exit /b 1
)

:: 6. Verificar variables de entorno
echo.
echo 🔐 VERIFICANDO VARIABLES DE ENTORNO...
echo --------------------------------------------

set REQUIRED_ENV_VARS=0

for %%v in (
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
) do (
    if not defined %%~v (
        echo ❌ Variable de entorno no definida: %%~v
        set /a REQUIRED_ENV_VARS+=1
    ) else (
        echo ✅ Variable de entorno definida: %%~v
    )
)

if !REQUIRED_ENV_VARS! GTR 0 (
    echo.
    echo ❗ Faltan !REQUIRED_ENV_VARS! variables de entorno requeridas
    exit /b 1
)

:: 7. Construcción completada
echo.
echo ============================================
echo ✅ CONSTRUCCION COMPLETADA CON EXITO
echo ============================================
echo.
echo 📂 Directorio de salida: %CD%\public
echo 🌍 Entorno: %VERCEL_ENV%
echo 📅 Fecha: %DATE% %TIME%
echo.

exit /b 0
