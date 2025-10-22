const fs = require('fs');
const path = require('path');

// Directorio donde están las páginas de platos
const platosDir = path.join(__dirname, 'backup_dish_pages');

// Función para agregar el script de WhatsApp a un archivo HTML
function addWhatsAppScript(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Verificar si ya tiene el script de WhatsApp
        if (content.includes('whatsapp-button.js')) {
            console.log(`El archivo ${path.basename(filePath)} ya tiene el script de WhatsApp`);
            return;
        }
        
        // Buscar la etiqueta de cierre </body>
        const bodyCloseTag = '</body>';
        const bodyCloseIndex = content.lastIndexOf(bodyCloseTag);
        
        if (bodyCloseIndex === -1) {
            console.warn(`No se encontró la etiqueta </body> en ${path.basename(filePath)}`);
            return;
        }
        
        // Insertar el script antes del cierre del body
        const newContent = content.substring(0, bodyCloseIndex) +
            '    <!-- Botón de WhatsApp -->\n    <script src="/js/whatsapp-button.js"></script>\n    ' +
            content.substring(bodyCloseIndex);
        
        // Escribir el archivo actualizado
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Actualizado: ${path.basename(filePath)}`);
        
    } catch (error) {
        console.error(`Error procesando ${filePath}:`, error.message);
    }
}

// Procesar todos los archivos HTML en el directorio de platos
function processFiles() {
    try {
        const files = fs.readdirSync(platosDir);
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        
        console.log(`\nProcesando ${htmlFiles.length} archivos...\n`);
        
        htmlFiles.forEach(file => {
            const filePath = path.join(platosDir, file);
            addWhatsAppScript(filePath);
        });
        
        console.log('\n¡Proceso completado! Se han actualizado los archivos de los platos.');
        console.log('No olvides copiar el archivo js/whatsapp-button.js a tu servidor de producción.');
        
    } catch (error) {
        console.error('Error al leer el directorio de platos:', error.message);
    }
}

// Ejecutar el proceso
processFiles();
