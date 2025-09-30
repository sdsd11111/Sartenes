document.addEventListener('DOMContentLoaded', function() {
    const heroSection = document.getElementById('hero-plato-del-dia');
    const platosContainer = document.getElementById('platos-dinamicos-container');
    
    // URL para la API
    const API_URL = '/api/platos-activos';
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