// Obtener el nombre del plato de la página actual
function getDishName() {
    // Primero intentamos obtener del título de la página
    let dishName = document.title.split('|')[0].trim();
    
    // Si el título es muy largo o no parece un nombre de plato, intentamos obtenerlo del h1
    if (dishName.length > 50 || !dishName || dishName.includes('Los Sartenes')) {
        const h1 = document.querySelector('h1');
        if (h1) {
            dishName = h1.textContent.trim();
        } else {
            // Si no encontramos un h1, usamos el nombre del archivo
            const pathParts = window.location.pathname.split('/');
            const fileName = pathParts[pathParts.length - 1].replace('.html', '');
            dishName = fileName.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }
    }
    
    // Limpiar el nombre del plato
    return dishName.replace('Los Sartenes', '')
                  .replace('|', '')
                  .replace('Restaurante', '')
                  .replace('Menú', '')
                  .replace(/\s+/g, ' ')
                  .trim();
}

// Función para actualizar el enlace de WhatsApp
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en una página de plato específico
    const isDishPage = window.location.pathname.includes('/menu/platos/') || 
                      window.location.pathname.includes('backup_dish_pages/');
    
    if (!isDishPage) return;

    // Obtener el botón de WhatsApp existente o crear uno nuevo
    let whatsappButton = document.querySelector('.whatsapp-float');
    
    if (!whatsappButton) {
        // Si no existe, crear un nuevo botón
        whatsappButton = document.createElement('a');
        whatsappButton.className = 'fixed bottom-8 right-8 bg-[#25D366] text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg hover:bg-[#128C7E] transition-all duration-300 z-40 whatsapp-float';
        whatsappButton.setAttribute('target', '_blank');
        whatsappButton.setAttribute('rel', 'noopener noreferrer');
        whatsappButton.setAttribute('aria-label', 'Pedir por WhatsApp');
        whatsappButton.innerHTML = '<i class="fab fa-whatsapp"></i>';
        document.body.appendChild(whatsappButton);
    }

    // Actualizar el enlace de WhatsApp
    function updateWhatsAppLink() {
        const dishName = getDishName();
        const phoneNumber = '593963487768';
        const message = `¡Hola Los Sartenes! 👋\n\nMe gustaría pedir el plato: *${dishName}* que vi en su menú.\n\n¿Podrían darme más información?`;
        whatsappButton.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    }

    // Actualizar el enlace cuando se cargue la página
    updateWhatsAppLink();

    // Añadir estilos si no existen
    if (!document.getElementById('whatsapp-button-styles')) {
        const style = document.createElement('style');
        style.id = 'whatsapp-button-styles';
        style.textContent = `
            .whatsapp-float {
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            @media (max-width: 768px) {
                .whatsapp-float {
                    width: 50px;
                    height: 50px;
                    font-size: 1.5rem;
                    bottom: 20px;
                    right: 20px;
                }
            }
        `;
        document.head.appendChild(style);
    }
});
