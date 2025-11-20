// Función para cargar componentes
async function loadComponent(elementId, path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Error al cargar ${path}: ${response.status}`);
        }
        const html = await response.text();
        const element = document.getElementById(elementId);
        
        if (!element) {
            console.error(`Elemento con ID ${elementId} no encontrado`);
            return;
        }

        // Crear un contenedor temporal
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Extraer y ejecutar los scripts
        const scripts = temp.querySelectorAll('script');
        const scriptsToExecute = [];

        // Procesar todos los scripts
        for (const script of scripts) {
            const newScript = document.createElement('script');
            
            // Copiar atributos
            Array.from(script.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            
            // Si es un script externo, configurar para cargarlo
            if (script.src) {
                newScript.src = script.src;
                // Añadir timestamp para evitar caché
                if (!newScript.src.includes('?')) {
                    newScript.src += '?' + Date.now();
                }
                
                // Hacer que los scripts se carguen en orden
                const loadPromise = new Promise((resolve) => {
                    newScript.onload = resolve;
                    newScript.onerror = () => {
                        console.error(`Error cargando script: ${script.src}`);
                        resolve(); // Continuar aunque falle
                    };
                });
                
                scriptsToExecute.push(loadPromise);
            } else {
                newScript.textContent = script.textContent;
            }
            
            // Reemplazar el script en el HTML
            script.parentNode.replaceChild(newScript, script);
        }

        // Actualizar el contenido del elemento
        element.innerHTML = temp.innerHTML;

        // Inicializar el menú móvil después de cargar el header
        if (elementId === 'header-container') {
            // Esperar a que los scripts se carguen antes de inicializar
            await Promise.all(scriptsToExecute);
            
            // Inicializar menú móvil
            if (typeof initMobileMenu === 'function') {
                initMobileMenu();
            } else {
                console.warn('initMobileMenu no está definido');
            }
            
            // Cargar el traductor si está disponible
            if (typeof loadTranslationScript === 'function') {
                loadTranslationScript();
            } else if (typeof loadGoogleTranslate === 'function') {
                loadGoogleTranslate();
            } else {
                console.warn('No se encontró la función de carga del traductor');
            }
        }
    } catch (error) {
        console.error('Error al cargar el componente:', error);
    }
}

// Función para cargar el script de traducción
function loadTranslationScript() {
    return new Promise((resolve) => {
        // Verificar si ya está cargado
        if (window.googleTranslateInitialized) {
            console.log('Google Translate ya está inicializado');
            resolve();
            return;
        }
        
        // Verificar si el script ya está en el DOM
        const existingScript = document.querySelector('script[src*="translate-loader.js"]');
        if (existingScript) {
            console.log('Script de traducción ya cargado');
            // Esperar un momento para que el script se ejecute
            setTimeout(() => {
                window.googleTranslateInitialized = true;
                resolve();
            }, 100);
            return;
        }
        
        // Cargar el script de traducción
        const script = document.createElement('script');
        script.src = '/js/translate-loader.js?' + Date.now();
        script.async = true;
        
        script.onload = () => {
            console.log('Script de traducción cargado correctamente');
            window.googleTranslateInitialized = true;
            
            // Esperar un momento para que el widget se inicialice
            setTimeout(() => {
                // Forzar la actualización de la interfaz
                if (typeof updateLanguageUI === 'function') {
                    updateLanguageUI(getCurrentLang?.() || 'es');
                }
                resolve();
            }, 500);
        };
        
        script.onerror = (error) => {
            console.error('Error al cargar el script de traducción:', error);
            // Reintentar después de un retraso
            setTimeout(() => {
                loadTranslationScript().then(resolve);
            }, 2000);
        };
        
        // Agregar el script al final del body
        document.body.appendChild(script);
    });
}

// Hacer la función disponible globalmente
window.loadTranslationScript = loadTranslationScript;

// Función para inicializar el menú móvil
function initMobileMenu() {
    // Toggle del menú móvil
    const menuToggle = document.getElementById('menuToggle');
    const closeMenu = document.getElementById('closeMenu');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const menuDropdownBtns = document.querySelectorAll('.menu-category-btn');

    if (menuToggle && sidebar && sidebarOverlay) {
        // Abrir menú
        menuToggle.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
            sidebarOverlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });

        // Cerrar menú
        const closeSidebar = () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        };

        closeMenu?.addEventListener('click', closeSidebar);
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Manejar menús desplegables
    menuDropdownBtns.forEach(button => {
        button.addEventListener('click', function() {
            const submenu = this.nextElementSibling;
            const icon = this.querySelector('i');
            
            if (submenu && submenu.classList.contains('menu-subcategory')) {
                // Cerrar otros submenús abiertos
                document.querySelectorAll('.menu-subcategory').forEach(item => {
                    if (item !== submenu) {
                        item.classList.add('hidden');
                        const btn = item.previousElementSibling;
                        if (btn) {
                            const ico = btn.querySelector('i');
                            if (ico) ico.style.transform = 'rotate(0deg)';
                        }
                    }
                });

                // Alternar el submenú actual
                submenu.classList.toggle('hidden');
                
                // Rotar el ícono
                if (icon) {
                    icon.style.transition = 'transform 0.3s ease';
                    if (submenu.classList.contains('hidden')) {
                        icon.style.transform = 'rotate(0deg)';
                    } else {
                        icon.style.transform = 'rotate(180deg)';
                    }
                }
            }
        });
    });

    // Cerrar menú al hacer clic en un enlace del menú
    document.querySelectorAll('#sidebar a').forEach(link => {
        link.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        });
    });
}

// Cargar componentes cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Cargar header
    loadComponent('header-container', '/components/header.html');
    
    // Cargar footer
    loadComponent('footer-container', '/components/footer.html');
    
    // Añadir clase al body cuando se carga la página
    document.body.classList.add('bg-gray-50');
});

// Manejar el scroll para el header fijo
let lastScroll = 0;
const header = document.querySelector('header');

if (header) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.classList.remove('shadow-md');
            return;
        }
        
        if (currentScroll > lastScroll && currentScroll > header.offsetHeight) {
            // Scroll hacia abajo
            header.classList.add('-translate-y-full');
            header.classList.remove('shadow-md');
        } else {
            // Scroll hacia arriba
            header.classList.remove('-translate-y-full');
            header.classList.add('shadow-md');
        }
        
        lastScroll = currentScroll;
    });
}
