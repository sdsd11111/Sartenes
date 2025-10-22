const fs = require('fs');
const path = require('path');

// Directorio donde están las páginas de platos
const platosDir = path.join(__dirname, 'backup_dish_pages');

// Función para actualizar el script de WhatsApp en un archivo HTML
function updateWhatsAppScript(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Verificar si ya tiene el script de WhatsApp
        if (!content.includes('whatsapp-button.js')) {
            // Insertar antes del cierre del body
            const bodyCloseTag = '</body>';
            const bodyCloseIndex = content.lastIndexOf(bodyCloseTag);
            
            if (bodyCloseIndex !== -1) {
                const newContent = content.substring(0, bodyCloseIndex) +
                    '    <!-- Botón de WhatsApp -->\n    <script src="/js/whatsapp-button.js"></script>\n    ' +
                    content.substring(bodyCloseIndex);
                
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log(`Actualizado: ${path.basename(filePath)}`);
            } else {
                console.warn(`No se encontró la etiqueta </body> en ${path.basename(filePath)}`);
            }
        } else {
            console.log(`El archivo ${path.basename(filePath)} ya tiene el script de WhatsApp`);
        }
        
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
            updateWhatsAppScript(filePath);
        });
        
        console.log('\n¡Proceso completado! Se han actualizado los archivos de los platos.');
        
    } catch (error) {
        console.error('Error al leer el directorio de platos:', error.message);
    }
}

// Ejecutar el proceso
processFiles();
