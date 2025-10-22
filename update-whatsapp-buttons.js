const fs = require('fs');
const path = require('path');

// Directorio donde están las páginas de platos
const platosDir = path.join(__dirname, 'backup_dish_pages');

// Plantilla del botón de WhatsApp
const whatsappButtonHTML = `
    <!-- Botón de WhatsApp -->
    <a href="#" id="whatsapp-order-button" class="fixed bottom-8 right-8 bg-[#25D366] text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg hover:bg-[#128C7E] transition-all duration-300 z-40" target="_blank" rel="noopener noreferrer" aria-label="Pedir por WhatsApp">
        <i class="fab fa-whatsapp"></i>
    </a>

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const button = document.getElementById('whatsapp-order-button');
        const dishName = document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : 'este plato';
        const phoneNumber = '593963487768';
        const message = '¡Hola Los Sartenes! 👋\\n\\nMe gustaría pedir el plato: *' + dishName + '* que vi en su menú.\\n\\n¿Podrían darme más información?';
        button.href = 'https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message);
    });
    </script>
`;

// Función para actualizar un archivo HTML
function updateFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Verificar si ya tiene el botón de WhatsApp
        if (content.includes('whatsapp-order-button')) {
            console.log(`El archivo ${path.basename(filePath)} ya tiene el botón de WhatsApp`);
            return;
        }
        
        // Insertar antes del cierre del body
        const bodyCloseTag = '</body>';
        const bodyCloseIndex = content.lastIndexOf(bodyCloseTag);
        
        if (bodyCloseIndex !== -1) {
            const newContent = content.substring(0, bodyCloseIndex) +
                whatsappButtonHTML +
                '\n    ' + bodyCloseTag + content.substring(bodyCloseIndex + bodyCloseTag.length);
            
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Actualizado: ${path.basename(filePath)}`);
        } else {
            console.warn(`No se encontró la etiqueta </body> en ${path.basename(filePath)}`);
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
            updateFile(filePath);
        });
        
        console.log('\n¡Proceso completado! Se han actualizado los archivos de los platos.');
        console.log('El botón de WhatsApp ahora mostrará el nombre del plato en el mensaje.');
        
    } catch (error) {
        console.error('Error al leer el directorio de platos:', error.message);
    }
}

// Ejecutar el proceso
processFiles();
