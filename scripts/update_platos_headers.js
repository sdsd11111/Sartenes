const fs = require('fs');
const path = require('path');

// Plantilla del encabezado con placeholders
const headerTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{{description}}">
    <meta name="keywords" content="{{keywords}}">
    <meta name="author" content="Restaurante Los Sartenes">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://tudominio.com/menu/platos/{{fileName}}">
    <meta property="og:title" content="{{title}} | Los Sartenes">
    <meta property="og:description" content="{{description}}">
    <meta property="og:image" content="https://tudominio.com/images/platos/{{imageName}}.webp">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://tudominio.com/menu/platos/{{fileName}}">
    <meta property="twitter:title" content="{{title}} | Los Sartenes">
    <meta property="twitter:description" content="{{description}}">
    <meta property="twitter:image" content="https://tudominio.com/images/platos/{{imageName}}.webp">

    <!-- Favicon -->
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#2E8B57">
    <meta name="msapplication-TileColor" content="#2E8B57">
    <meta name="theme-color" content="#ffffff">
    <link rel="icon" type="image/x-icon" href="/images/favicon.ico">
    
    <title>{{title}} | Los Sartenes</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Open+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/styles.css">
    <style>
        body { font-family: 'Open Sans', sans-serif; padding-top: 0; }
        .font-playfair { font-family: 'Playfair Display', serif; }
        main { min-height: calc(100vh - 16rem); padding: 2rem 0; }
    </style>`;

// Directorio de los platos
const platosDir = path.join(__dirname, '..', 'public', 'menu', 'platos');

// Obtener todos los archivos HTML de platos
try {
    const files = fs.readdirSync(platosDir).filter(file => 
        file.endsWith('.html') && file !== '_template.html'
    );

    console.log(`\nIniciando actualización de ${files.length} platos...\n`);

    files.forEach((file, index) => {
        try {
            const filePath = path.join(platosDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Extraer el título del plato del contenido existente
            const titleMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
            if (!titleMatch) {
                console.log(`⚠️  No se pudo encontrar el título en ${file}`);
                return;
            }
            
            const title = titleMatch[1].trim();
            const fileName = path.basename(file, '.html');
            const imageName = fileName.replace(/_/g, ' ').toLowerCase();
            
            // Generar descripción y palabras clave basadas en el título
            const description = `Disfruta de nuestro delicioso ${title} en Los Sartenes, preparado con los mejores ingredientes y un toque especial de nuestro chef.`;
            const keywords = `${title.toLowerCase()}, plato principal, restaurante Los Sartenes, comida en Loja`;
            
            // Reemplazar placeholders en la plantilla
            let newHeader = headerTemplate
                .replace(/\{\{title\}\}/g, title)
                .replace(/\{\{description\}\}/g, description)
                .replace(/\{\{keywords\}\}/g, keywords)
                .replace(/\{\{fileName\}\}/g, file)
                .replace(/\{\{imageName\}\}/g, imageName);
            
            // Mantener el resto del contenido después del cierre de </head>
            const bodyContent = content.split('</head>')[1];
            const newContent = newHeader + '\n</head>' + bodyContent;
            
            // Escribir el archivo actualizado
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`✅  Actualizado: ${file}`);
            
        } catch (error) {
            console.error(`❌  Error procesando ${file}:`, error.message);
        }
    });

    console.log('\n¡Proceso completado!');
    
} catch (error) {
    console.error('❌  Error al leer el directorio de platos:', error.message);
}
