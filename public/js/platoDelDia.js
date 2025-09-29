document.addEventListener('DOMContentLoaded', function() {
    const heroSection = document.getElementById('hero-plato-del-dia');
    const platosContainer = document.getElementById('platos-dinamicos-container');
    
    // Usar URL relativa para la API
    const API_URL = '/api/platos/activos';
    let platosData = [];
    let currentPlatoIndex = 0;
    let slideInterval;
    
    // Imagen por defecto si no hay imagen del plato
    const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80';

    // Función para formatear la URL de la imagen
    function formatImageUrl(url) {
        if (!url) return DEFAULT_IMAGE;
        // Si ya es una URL completa, devolverla tal cual
        if (url.startsWith('http')) return url;
        // Si es una ruta local, asegurarse de que empiece con /
        return url.startsWith('/') ? url : `/${url}`;
    }
    
    // Función para actualizar el fondo del hero
    function updateHeroBackground(imageUrl) {
        const url = formatImageUrl(imageUrl || DEFAULT_IMAGE);
        // Añadir overlay oscuro (negro al 55% de opacidad)
        heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.6)), url('${url}')`;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';
        heroSection.style.backgroundRepeat = 'no-repeat';
        heroSection.style.transition = 'background-image 0.8s ease-in-out';
        
        // Asegurar que el texto sea legible
        const textElements = heroSection.querySelectorAll('h1, h2, p, .text-white');
        textElements.forEach(el => {
            el.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)';
        });
    }

    // Función para mostrar un plato específico
    function showPlato(index) {
        if (platosData.length === 0) return;
        
        // Asegurarse de que el índice esté dentro de los límites
        currentPlatoIndex = (index + platosData.length) % platosData.length;
        
        const plato = platosData[currentPlatoIndex];
        if (!plato) return;

        // Actualizar el fondo con la imagen del plato
        updateHeroBackground(plato.imagen_url);
        
        // Formatear el valor a 2 decimales
        const valorFormateado = plato.valor ? parseFloat(plato.valor).toFixed(2) : '0.00';
        
        // Actualizar el contenido del plato
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
    window.navegarPlato = function(direction) {
        const newIndex = (currentPlatoIndex + direction + platosData.length) % platosData.length;
        showPlato(newIndex);
        resetAutoSlide();
    };

    // Función para ir a un plato específico
    window.irAPlato = function(index) {
        showPlato(index);
        resetAutoSlide();
    };

    // Función para iniciar el carrusel automático
    function startAutoSlide() {
        stopAutoSlide();
        if (platosData.length > 1) {
            slideInterval = setInterval(() => {
                navegarPlato(1);
            }, 8000); // Cambiar de plato cada 8 segundos
        }
    }

    // Función para detener el carrusel automático
    function stopAutoSlide() {
        if (slideInterval) {
            clearInterval(slideInterval);
        }
    }

    // Función para reiniciar el temporizador de cambio automático
    function resetAutoSlide() {
        stopAutoSlide();
        if (platosData.length > 1) {
            startAutoSlide();
        }
    }

    // Función para renderizar los platos
    function renderPlatos(platos) {
        platosData = platos;
        
        if (!platos || platos.length === 0) {
            // No hay platos activos disponibles
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
            return;
        }

        // Mostrar el primer plato
        showPlato(0);
        
        // Iniciar el carrusel automático si hay más de un plato
        if (platos.length > 1) {
            startAutoSlide();
        }
    }

    // Función para obtener los platos de la API
    async function fetchPlatos() {
        try {
            console.log('🔍 Solicitando platos activos a:', API_URL);
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al cargar los platos del día');
            }
            
            const result = await response.json();
            console.log('📦 Respuesta de la API:', result);
            
            // Verificar si la respuesta tiene el formato esperado
            if (!result.success) {
                throw new Error(result.message || 'Error en la respuesta del servidor');
            }
            
            // Verificar si hay datos en la respuesta
            if (!result.data || !Array.isArray(result.data)) {
                console.warn('⚠️ No se encontraron platos activos');
                renderPlatos([]);
                return;
            }
            
            console.log(`✅ Se encontraron ${result.data.length} platos activos`);
            renderPlatos(result.data);
            
        } catch (error) {
            console.error('Error al cargar los platos:', error);
            
            // Mostrar mensaje de error en el contenedor
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
                                <p class="font-bold">¡Ups! Algo salió mal</p>
                                <p class="text-sm">No pudimos cargar los platos del día. Por favor, intenta de nuevo más tarde.</p>
                                <p class="text-xs mt-1 text-red-600">${error.message}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Inicializar solo si el contenedor existe
    if (platosContainer) {
        fetchPlatos();
        
        // Actualizar los platos cada 5 minutos (opcional)
        setInterval(fetchPlatos, 5 * 60 * 1000);
        
        // Limpiar el intervalo cuando la pestaña no está activa
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoSlide();
            } else if (platosData.length > 1) {
                startAutoSlide();
            }
        });
    } else {
        console.error('No se encontró el contenedor de platos');
    }
});
