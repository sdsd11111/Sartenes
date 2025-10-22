const fs = require('fs');
const path = require('path');

// Ruta al archivo footer.html
const footerPath = path.join(__dirname, 'public', 'components', 'footer.html');

try {
    // Leer el contenido del archivo
    let content = fs.readFileSync(footerPath, 'utf8');
    
    // Contar cuántos botones de WhatsApp hay
    const whatsappButtonsCount = (content.match(/whatsapp-float/g) || []).length;
    
    if (whatsappButtonsCount > 0) {
        // Eliminar el botón de WhatsApp del footer
        const newContent = content.replace(
            /<!-- WhatsApp Button -->[\s\S]*?<\/a>\s*\n\s*<!-- WhatsApp Button Animation -->[\s\S]*?<\/style>\s*\n/g, 
            ''
        );
        
        // Escribir el contenido actualizado
        fs.writeFileSync(footerPath, newContent, 'utf8');
        console.log('✅ Se eliminó el botón de WhatsApp duplicado del footer.');
    } else {
        console.log('ℹ️ No se encontró el botón de WhatsApp en el footer.');
    }
    
} catch (error) {
    console.error('❌ Error al procesar el archivo footer.html:', error.message);
}

// Verificar si hay un botón de WhatsApp en las páginas de platos
const platosDir = path.join(__dirname, 'public', 'menu', 'platos');

try {
    const files = fs.readdirSync(platosDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`\nVerificando ${htmlFiles.length} archivos de platos...`);
    
    let updatedFiles = 0;
    
    htmlFiles.forEach(file => {
        const filePath = path.join(platosDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Verificar si el archivo ya tiene el botón de WhatsApp
        if (content.includes('whatsapp-order-button')) {
            // Asegurarse de que solo hay un botón
            const buttonCount = (content.match(/whatsapp-order-button/g) || []).length;
            if (buttonCount > 1) {
                // Mantener solo el primer botón
                const newContent = content.replace(
                    /(<a[^>]*?id="whatsapp-order-button"[\s\S]*?<\/a>\s*<script>[\s\S]*?<\/script>\s*)(?=<a[^>]*?id="whatsapp-order-button")/g, 
                    ''
                );
                fs.writeFileSync(filePath, newContent, 'utf8');
                updatedFiles++;
            }
        }
    });
    
    if (updatedFiles > 0) {
        console.log(`✅ Se actualizaron ${updatedFiles} archivos para eliminar botones duplicados.`);
    } else {
        console.log('ℹ️ No se encontraron botones duplicados en las páginas de platos.');
    }
    
} catch (error) {
    console.error('❌ Error al verificar los archivos de platos:', error.message);
}

console.log('\nProceso completado. Por favor, verifica que solo haya un botón de WhatsApp por página.');
