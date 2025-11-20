// Función para cargar componentes
async function loadComponent(elementId, path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Error al cargar ${path}: ${response.status}`);
        }
        const html = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            // Usar DOMParser para parsear el HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Reemplazar el contenido del elemento
            element.innerHTML = doc.body.innerHTML;
            
            // Procesar y ejecutar los scripts
            const scripts = Array.from(doc.scripts);
            for (const oldScript of scripts) {
                const newScript = document.createElement('script');
                
                // Copiar atributos
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                
                // Si es un script externo, cargarlo
                if (oldScript.src) {
                    newScript.src = oldScript.src;
                    // Añadir timestamp para evitar caché
                    if (!newScript.src.includes('?')) {
                        newScript.src += '?' + new Date().getTime();
                    }
                } else {
                    newScript.textContent = oldScript.textContent;
                }
                
                // Reemplazar el script antiguo con el nuevo
                if (oldScript.parentNode) {
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                } else {
                    // Si no tiene parentNode, agregarlo al final del body
                    document.body.appendChild(newScript);
                }
            }
            
            // Inicializar el menú móvil después de cargar el header
            if (elementId === 'header-container') {
                initMobileMenu();
                
                // Cargar el script de traducción después de que el header esté en el DOM
                loadTranslationScript();
            }
        }
    } catch (error) {
        console.error('Error al cargar el componente:', error);
    }
}

// Función para cargar el script de traducción
export function loadTranslationScript() {
    return new Promise((resolve, reject) => {
        // Verificar si ya está cargado
        if (window.translationScriptLoaded) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = '/js/translate-simple.js?' + new Date().getTime();
        script.onload = () => {
            window.translationScriptLoaded = true;
            resolve();
        };
        script.onerror = (error) => {
            console.error('Error al cargar el script de traducción:', error);
            reject(error);
        };
        
        // Agregar el script al final del body
        document.body.appendChild(script);
    });
}

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
