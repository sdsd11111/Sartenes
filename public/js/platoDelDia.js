// Variables globales
const heroSection = document.getElementById('hero-plato-del-dia');
const platosContainer = document.getElementById('platos-dinamicos-container');
const API_URL = '/api/platos-activos';
let platosData = [];
let currentPlatoIndex = 0;
let slideInterval;

// Imagen por defecto si no hay imagen del plato
const DEFAULT_IMAGE = '/images/hero-bg.jpg';

// Función para formatear la URL de la imagen
function formatImageUrl(url) {
    if (!url || url === 'http://localhost:9000/admin/#') return DEFAULT_IMAGE;
    
    // Si ya es una URL completa, devolverla tal cual
    if (url.startsWith('http')) {
        // Si es una URL localhost, reemplazarla con la ruta correcta
        if (url.includes('localhost:9000')) {
            const fileName = url.split('/').pop();
            return `/images/platos/${fileName}`;
        }
        return url;
    }
    
    // Si ya es una ruta que comienza con /images/, devolverla tal cual
    if (url.startsWith('/images/')) {
        return url;
    }
    
    // Si es solo un nombre de archivo, asumir que está en /images/platos/
    if (!url.startsWith('/')) {
        return `/images/platos/${url}`;
    }
    
    // Para cualquier otro caso, devolver la ruta tal cual
    return url;
}

// Función para actualizar el fondo del hero
function updateHeroBackground(imageUrl) {
    try {
        console.log('🖼️ Intentando cargar imagen:', imageUrl);
        const url = formatImageUrl(imageUrl);
        console.log('🔄 URL formateada:', url);
        
        if (!heroSection) {
            console.warn('❌ No se encontró el elemento heroSection');
            return;
        }
        
        // Crear una nueva imagen para verificar si se puede cargar
        const img = new Image();
        img.onload = function() {
            console.log('✅ Imagen cargada correctamente:', url);
            heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.6)), url('${url}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
            heroSection.style.backgroundRepeat = 'no-repeat';
            heroSection.style.transition = 'background-image 0.8s ease-in-out';
        };
        
        img.onerror = function() {
            console.error('❌ Error al cargar la imagen, usando imagen por defecto');
            heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.6)), url('${DEFAULT_IMAGE}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
            heroSection.style.backgroundRepeat = 'no-repeat';
        };
        
        // Iniciar la carga de la imagen
        img.src = url;
        
    } catch (error) {
        console.error('⚠️ Error en updateHeroBackground:', error);
        if (heroSection) {
            heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.6)), url('${DEFAULT_IMAGE}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
            heroSection.style.backgroundRepeat = 'no-repeat';
        }
    }
}

// Función para mostrar un plato específico
function showPlato(index) {
    console.log('🍽️ Mostrando plato en índice:', index);
    
    if (!platosData || !platosData.length) {
        console.warn('⚠️ No hay datos de platos disponibles');
        return;
    }
    
    if (!platosContainer) {
        console.warn('⚠️ No se encontró el contenedor de platos');
        return;
    }
    
    currentPlatoIndex = (index + platosData.length) % platosData.length;
    const plato = platosData[currentPlatoIndex];
    
    if (!plato) {
        console.error('❌ No se encontró el plato en el índice:', currentPlatoIndex);
        return;
    }
    
    console.log('📋 Mostrando plato:', {
        titulo: plato.titulo,
        imagen_url: plato.imagen_url,
        precio: plato.precio
    });
    
    // Actualizar la imagen de fondo
    updateHeroBackground(plato.imagen_url);
    
    // Formatear el precio
    const valorFormateado = plato.precio ? parseFloat(plato.precio).toFixed(2) : '0.00';
    
    platosContainer.innerHTML = `
        <div class="plato-content text-center max-w-3xl mx-auto px-4 transform transition-all duration-500 ease-in-out">
            <h3 class="text-3xl md:text-5xl font-bold font-playfair text-white mb-4">
                ${plato.titulo || 'Plato del Día'}
            </h3>
            <p class="text-lg md:text-xl text-gray-200 mb-6">
                ${plato.descripcion || 'Deliciosa especialidad del chef preparada con los mejores ingredientes.'}
            </p>
            <p class="text-4xl font-bold text-[#FF8C42] mb-8 animate-pulse">
                $${valorFormateado}
            </p>
            <div class="flex justify-center space-x-4">
                <button onclick="navegarPlato(-1)" class="nav-button bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button onclick="navegarPlato(1)" class="nav-button bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
            <div class="flex justify-center mt-6 space-x-2">
                ${platosData.map((_, i) => `
                    <button onclick="irAPlato(${i})" 
                            class="w-3 h-3 rounded-full ${i === currentPlatoIndex ? 'bg-[#FF8C42] w-6' : 'bg-white bg-opacity-50'}
                                   transition-all duration-300">
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

// Función para navegar entre platos
function navegarPlato(direction) {
    const newIndex = (currentPlatoIndex + direction + platosData.length) % platosData.length;
    showPlato(newIndex);
    resetAutoSlide();
}

// Función para ir a un plato específico
function irAPlato(index) {
    if (index >= 0 && index < platosData.length) {
        showPlato(index);
        resetAutoSlide();
    }
}

// Función para iniciar el carrusel automático
function startAutoSlide() {
    stopAutoSlide();
    if (platosData.length > 1) {
        slideInterval = setInterval(() => {
            const nextIndex = (currentPlatoIndex + 1) % platosData.length;
            showPlato(nextIndex);
        }, 5000); // Cambiar de plato cada 5 segundos
    }
}

// Función para detener el carrusel automático
function stopAutoSlide() {
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
}

// Función para reiniciar el temporizador de cambio automático
function resetAutoSlide() {
    stopAutoSlide();
    if (platosData.length > 1) {
        startAutoSlide();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    
    // Función para obtener los platos de la API
    async function fetchPlatos() {
        try {
            console.log('🔍 Obteniendo platos de:', API_URL);
            const response = await fetch(API_URL, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error en la respuesta del servidor');
            }
            
            const data = await response.json();
            console.log('📦 Platos recibidos:', data);
            
            if (!Array.isArray(data)) {
                console.warn('⚠️ La respuesta no es un arreglo:', data);
                renderPlatos([]);
                return;
            }
            
            console.log(`✅ Se encontraron ${data.length} platos activos`);
            renderPlatos(data);
            return data;
            
        } catch (error) {
            console.error('Error al cargar los platos:', error);
            
            // Mostrar un mensaje de error en la interfaz
            if (platosContainer) {
                platosContainer.innerHTML = `
                    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg max-w-2xl mx-auto" role="alert">
                        <div class="flex">
                            <div class="py-1">
                                <svg class="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
                                </svg>
                            </div>
                            <div>
                                <p class="font-bold">Error al cargar el menú del día</p>
                                <p class="text-sm">${error.message || 'Por favor, intente recargar la página.'}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Función para renderizar los platos
    function renderPlatos(platos) {
        platosData = platos;
        
        if (!platos || platos.length === 0) {
            // No hay platos activos disponibles
            if (platosContainer) {
                platosContainer.innerHTML = `
                    <div class="bg-black bg-opacity-70 p-8 rounded-lg shadow-lg max-w-2xl mx-auto text-center">
                        <h2 class="text-2xl font-bold text-white mb-4">¡Bienvenido a Los Sartenes!</h2>
                        <p class="text-lg text-gray-200 mb-4">
                            Hoy te invitamos a explorar nuestras especialidades de siempre. 
                            ¡El mejor sabor de Loja te espera!
                        </p>
                        <a href="/menu" class="inline-block bg-[#FF8C42] hover:bg-[#E67E22] text-white font-bold py-2 px-6 rounded-full transition duration-300">
                            Ver Menú Completo
                        </a>
                    </div>
                `;
            }
            return;
        }

        // Mostrar el primer plato
        showPlato(0);
        
        // Iniciar el carrusel automático si hay más de un plato
        if (platos.length > 1) {
            startAutoSlide();
        }
    }

    // Inicializar solo si el contenedor existe
    if (platosContainer) {
        fetchPlatos();
        
        // Pausar el carrusel cuando el mouse está sobre él
        platosContainer.addEventListener('mouseenter', stopAutoSlide);
        platosContainer.addEventListener('mouseleave', () => {
            if (platosData.length > 1) {
                startAutoSlide();
            }
        });
        
        // Soporte para navegación con teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                navegarPlato(-1);
            } else if (e.key === 'ArrowRight') {
                navegarPlato(1);
            }
        });
    }
});