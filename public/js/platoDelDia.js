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
function formatImageUrl(url, plato) {
    console.log('🖼️ Formateando URL de imagen:', { url, plato });
    
    // Si el plato tiene una URL completa, usarla directamente
    if (plato && plato.imagen_url_completa) {
        // Asegurarse de que la URL sea accesible
        let imageUrl = plato.imagen_url_completa;
        
        // Si la URL de Supabase tiene doble 'platos/platos/', corregirla
        if (imageUrl.includes('/platos/platos/')) {
            imageUrl = imageUrl.replace('/platos/platos/', '/platos/');
            console.log('🔄 URL corregida (doble platos):', imageUrl);
        }
        
        // Si la URL no comienza con http, agregar el dominio de Supabase
        if (!imageUrl.startsWith('http') && !imageUrl.startsWith('//')) {
            imageUrl = `https://slsdowttijjlwdexzkum.supabase.co/storage/v1/object/public/platos/${imageUrl}`;
            console.log('🔗 URL convertida a Supabase:', imageUrl);
        }
        
        console.log('✅ Usando imagen_url_completa:', imageUrl);
        return imageUrl;
    }
    
    // Si no hay URL, devolver cadena vacía
    if (!url) {
        console.warn('⚠️ No se proporcionó URL de imagen');
        return '';
    }
    
    // Si la URL ya es completa, devolverla tal cual
    if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) {
        console.log('🔗 URL ya es completa:', url);
        return url;
    }
    
    // Para cualquier otro caso, construir la URL completa de Supabase
    const filename = url.split('/').pop();
    const supabaseUrl = `https://slsdowttijjlwdexzkum.supabase.co/storage/v1/object/public/platos/${filename}`;
    console.log('📂 Construyendo URL de Supabase:', supabaseUrl);
    return supabaseUrl;
}

// Función para actualizar el fondo del hero
function updateHeroBackground(imageUrl) {
    try {
        console.log('🖼️ Intentando cargar imagen para el plato:', imageUrl);
        const plato = platosData[currentPlatoIndex];
        const url = formatImageUrl(imageUrl, plato);
        console.log('🔄 URL formateada:', url);
        
        if (!heroSection) {
            console.warn('❌ No se encontró el elemento heroSection');
            return;
        }
        
        // Crear una nueva imagen para verificar si se puede cargar
        const img = new Image();
        img.onload = function() {
            console.log('✅ Imagen cargada correctamente:', url);
            heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${url}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
            heroSection.style.backgroundRepeat = 'no-repeat';
            heroSection.style.transition = 'background-image 0.8s ease-in-out';
        };
        
        img.onerror = function() {
            console.error('❌ Error al cargar la imagen, usando imagen por defecto');
            heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${DEFAULT_IMAGE}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
            heroSection.style.backgroundRepeat = 'no-repeat';
        };
        
        // Iniciar la carga de la imagen
        img.src = url;
        
    } catch (error) {
        console.error('⚠️ Error en updateHeroBackground:', error);
        if (heroSection) {
            heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${DEFAULT_IMAGE}')`;
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
    
    currentPlatoIndex = (index + platosData.length) % platosData.length;
    const plato = platosData[currentPlatoIndex];
    
    console.log('📌 Mostrando plato:', plato);
    
    // Usar directamente la URL completa de la imagen del plato
    let imageUrl = plato.imagen_url_completa || plato.imagen_url;
    
    console.log('🔍 Datos del plato:', {
        id: plato.id,
        titulo: plato.titulo,
        imagen_url: plato.imagen_url,
        imagen_url_completa: plato.imagen_url_completa,
        imageUrlSeleccionada: imageUrl
    });
    
    // Actualizar el fondo del hero con la URL de la imagen
    if (imageUrl) {
        console.log('🔄 Actualizando fondo del hero con URL:', imageUrl);
        
        // Crear una nueva imagen para verificar si la URL es accesible
        const img = new Image();
        img.onload = function() {
            console.log('✅ La imagen se cargó correctamente');
            heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.6)), url('${imageUrl}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
            heroSection.style.backgroundRepeat = 'no-repeat';
        };
        
        img.onerror = function() {
            console.error('❌ No se pudo cargar la imagen:', imageUrl);
            // Usar una imagen por defecto si la URL no es accesible
            heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.6)), url('/images/hero-bg.jpg')`;
        };
        
        // Establecer la fuente de la imagen para iniciar la carga
        img.src = imageUrl;
        
        // Forzar la actualización del fondo inmediatamente
        heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.6)), url('${imageUrl}')`;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';
        heroSection.style.backgroundRepeat = 'no-repeat';
    } else {
        console.warn('⚠️ No se encontró URL de imagen para el plato');
        heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.6)), url('/images/hero-bg.jpg')`;
    }
    
    // Función para formatear el precio
    const formatPrice = (value) => {
        console.log('🔢 Formateando precio:', value);
        
        // Si el valor es 0, devolver $0.00
        if (value === 0 || value === '0' || value === '0.00') {
            console.log('🔢 Precio es cero, mostrando $0.00');
            return '$0.00';
        }
        
        // Si el valor es undefined, null o string vacío, devolver cadena vacía
        if (value === undefined || value === null || value === '') {
            console.log('🔍 Valor no válido para formatear');
            return '';
        }
        
        // Si el valor ya está formateado como moneda, devolverlo tal cual
        if (typeof value === 'string' && value.startsWith('$')) {
            console.log('💰 Valor ya formateado:', value);
            return value;
        }
        
        // Convertir a número
        let num;
        if (typeof value === 'number') {
            num = value;
        } else if (typeof value === 'string') {
            // Eliminar cualquier caracter que no sea número, punto o coma
            const cleanValue = value.replace(/[^0-9.,]/g, '');
            // Reemplazar coma por punto para el parseo
            num = parseFloat(cleanValue.replace(',', '.'));
        } else {
            console.log('⚠️ Tipo de valor no soportado:', typeof value, value);
            return '';
        }
        
        if (isNaN(num)) {
            console.log('⚠️ No se pudo convertir a número:', value);
            return '';
        }
        
        // Formatear a 2 decimales y agregar símbolo de moneda
        const formatted = `$${num.toFixed(2).replace(/\.?0+$/, '')}`;
        console.log('✅ Precio formateado:', formatted);
        return formatted;
    };
    
    // Obtener el precio, priorizando 'precio' sobre 'valor_formateado' y luego 'valor'
    let precioAMostrar = '';
    
    if (plato.precio !== undefined && plato.precio !== null) {
        precioAMostrar = plato.precio;
    } else if (plato.valor_formateado) {
        // Extraer el valor numérico de valor_formateado
        const valorNumerico = plato.valor_formateado.replace(/[^0-9.,]/g, '').replace(',', '.');
        precioAMostrar = parseFloat(valorNumerico) || 0;
    } else if (plato.valor !== undefined && plato.valor !== null) {
        precioAMostrar = plato.valor;
    }
    
    // Formatear el precio para mostrar
    let valorMostrar = formatPrice(precioAMostrar);
    
    // Depuración detallada
    console.log('📋 Datos del plato:', {
        id: plato.id,
        titulo: plato.titulo,
        descripcion: plato.descripcion,
        precio: plato.precio,
        valor: plato.valor,
        valor_formateado: plato.valor_formateado,
        precioAMostrar: precioAMostrar,
        valorMostrado: valorMostrar,
        'Tipo de precio': typeof plato.precio,
        'Tipo de valor': typeof plato.valor,
        'Tipo de precioAMostrar': typeof precioAMostrar,
        'Plato completo': JSON.parse(JSON.stringify(plato)) // Para evitar referencias circulares
    });
    
    // Asegurarse de que el precio se muestre aunque sea 0
    if (valorMostrar === '' && (precioAMostrar === 0 || plato.precio === 0 || plato.valor === 0)) {
        console.log('🔵 Mostrando precio cero');
        valorMostrar = '$0.00';
    }
    
    platosContainer.innerHTML = `
        <div class="plato-content text-center max-w-3xl mx-auto px-4 transform transition-all duration-500 ease-in-out">
            <h3 class="text-3xl md:text-5xl font-bold font-playfair text-white mb-4">
                ${plato.titulo || 'Plato del Día'}
            </h3>
            <p class="text-lg md:text-xl text-gray-200 mb-6">
                ${plato.descripcion || 'Deliciosa especialidad del chef preparada con los mejores ingredientes.'}
            </p>
            <p class="text-4xl font-bold text-[#FF8C42] mb-8 animate-pulse">
                ${valorMostrar}
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
    
    // Función para normalizar los datos del plato
    function normalizePlato(plato) {
        // Crear un nuevo objeto para evitar modificar el original
        const normalized = { ...plato };
        
        // Si el plato tiene 'valor' pero no 'precio', copiar el valor a precio
        if (normalized.valor !== undefined && normalized.precio === undefined) {
            console.log(`🔧 Normalizando plato ${normalized.id}: copiando valor (${normalized.valor}) a precio`);
            normalized.precio = normalized.valor;
        }
        
        console.log('🔍 Plato normalizado:', {
            id: normalized.id,
            titulo: normalized.titulo,
            precio: normalized.precio,
            valor: normalized.valor
        });
        
        return normalized;
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
            
            let data = await response.json();
            console.log('📦 Platos recibidos:', data);
            
            if (!Array.isArray(data)) {
                console.warn('⚠️ La respuesta no es un arreglo:', data);
                renderPlatos([]);
                return;
            }
            
            // Normalizar los datos antes de renderizarlos
            data = data.map(normalizePlato);
            
            // Verificar las URLs de las imágenes
            console.log('🔍 URLs de imágenes en la respuesta:');
            data.forEach((plato, index) => {
                console.log(`  Plato ${index + 1} (${plato.titulo}):`);
                console.log(`    - imagen_url: ${plato.imagen_url}`);
                console.log(`    - imagen_url_completa: ${plato.imagen_url_completa}`);
            });
            
            console.log(`✅ Se encontraron ${data.length} platos activos`, data);
            
            // Guardar los datos para uso posterior
            platosData = data;
            
            // Mostrar el primer plato si hay datos
            if (platosData.length > 0) {
                showPlato(0);
            }
            
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

    // Función para normalizar los datos del plato
    function normalizePlato(plato) {
        // Crear una copia del plato para no modificar el original directamente
        const normalized = { ...plato };
        
        // Asegurarse de que el precio y el valor sean números
        const parseNumber = (value) => {
            if (value === undefined || value === null) return undefined;
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
                // Si ya es un string con formato de moneda, limpiarlo
                if (value.startsWith('$')) {
                    value = value.substring(1);
                }
                // Eliminar cualquier caracter que no sea número, punto o coma
                const cleanValue = value.replace(/[^0-9.,]/g, '').replace(',', '.');
                const num = parseFloat(cleanValue);
                return isNaN(num) ? undefined : num;
            }
            return undefined;
        };
        
        // Procesar precio y valor
        const precio = parseNumber(plato.precio);
        const valor = parseNumber(plato.valor);
        const valorFormateado = plato.valor_formateado || '';
        
        // Si tenemos valor_formateado, intentar extraer el valor numérico
        let valorDeFormateado = null;
        if (valorFormateado && typeof valorFormateado === 'string' && valorFormateado.startsWith('$')) {
            const valorLimpio = valorFormateado.replace(/[^0-9.,]/g, '').replace(',', '.');
            valorDeFormateado = parseFloat(valorLimpio);
            if (isNaN(valorDeFormateado)) valorDeFormateado = null;
        }
        
        // Asignar valores normalizados
        // Prioridad: 1. precio, 2. valor, 3. valor_formateado, 4. 0
        normalized.precio = precio !== undefined ? precio : 
                          (valor !== undefined ? valor : 
                          (valorDeFormateado !== null ? valorDeFormateado : 0));
                          
        normalized.valor = valor !== undefined ? valor : 
                         (precio !== undefined ? precio : 
                         (valorDeFormateado !== null ? valorDeFormateado : 0));
        
        // Si el precio es 0 pero tenemos un valor en valor_formateado, usarlo
        if (normalized.precio === 0 && valorDeFormateado !== null) {
            normalized.precio = valorDeFormateado;
            normalized.valor = valorDeFormateado;
        }
        
        // Asegurarse de que el precio sea un número válido
        if (isNaN(normalized.precio)) {
            console.warn(`⚠️ Precio no válido para el plato ${plato.id || 'desconocido'}:`, plato.precio);
            normalized.precio = 0;
            normalized.valor = 0;
        }
        
        // Agregar el valor formateado si no existe
        if (!normalized.valor_formateado && normalized.precio !== undefined) {
            normalized.valor_formateado = `$${normalized.precio.toFixed(2).replace(/\.?0+$/, '')}`;
        }
        
        console.log('🔍 Plato normalizado:', {
            id: normalized.id,
            titulo: normalized.titulo,
            precio: normalized.precio,
            valor: normalized.valor,
            valor_formateado: normalized.valor_formateado,
            tipoPrecio: typeof normalized.precio,
            tipoValor: typeof normalized.valor,
            originalPrecio: plato.precio,
            originalValor: plato.valor,
            valorFormateadoOriginal: plato.valor_formateado
        });
        
        return normalized;
    }

    // Función para renderizar los platos
    function renderPlatos(platos) {
        if (!platosContainer) return;
        
        console.log('🎨 Renderizando platos:', platos);
        
        if (!platos || platos.length === 0) {
            platosContainer.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-white text-lg">No hay platos disponibles en este momento.</p>
                </div>
            `;
            return;
        }
        
        // Normalizar los datos de los platos
        platosData = platos.map(normalizePlato);
        
        console.log('📊 Platos normalizados:', platosData);
        
        // Mostrar el primer plato si hay datos
        if (platosData.length > 0) {
            console.log('🔄 Mostrando el primer plato de la lista');
            showPlato(0);
        }
        
        // Si hay más de un plato, iniciar el carrusel
        if (platosData.length > 1) {
            startAutoSlide();
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