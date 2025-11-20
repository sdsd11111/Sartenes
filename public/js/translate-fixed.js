// translate-fixed.js
function getCurrentLang() {
    // Primero verificar localStorage
    const savedLang = localStorage.getItem('userLanguage');
    if (savedLang) return savedLang;
    
    // Luego verificar la cookie de Google Translate
    const match = document.cookie.match(/googtrans=([^;]+)/);
    if (match) {
        const lang = match[1].split('/').pop();
        if (lang && (lang === 'es' || lang === 'en')) {
            return lang;
        }
    }
    return 'es'; // Idioma por defecto
}

function updateButtonUI() {
    const currentLang = getCurrentLang();
    const languageToggle = document.getElementById('language-toggle');
    if (!languageToggle) return;

    // Actualizar el texto del botón
    const langText = currentLang === 'es' ? 'IDIOMA' : 'LANGUAGE';
    const textSpan = languageToggle.querySelector('span:first-child');
    if (textSpan) {
        textSpan.textContent = langText;
    }

    // Actualizar checkmarks en el menú desplegable
    document.querySelectorAll('[data-lang]').forEach(el => {
        const check = el.querySelector('.lang-check');
        if (check) {
            check.classList.toggle('hidden', el.dataset.lang !== currentLang);
        }
    });
}

function setLanguage(lang) {
    if (lang === getCurrentLang()) return;
    
    console.log('Cambiando a idioma:', lang);
    
    // Guardar preferencia
    localStorage.setItem('userLanguage', lang);
    document.cookie = `googtrans=/es/${lang}; path=/; domain=${window.location.hostname};`;
    
    // Actualizar URL sin recargar
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
    
    // Forzar el cambio en Google Translate
    const select = document.querySelector('.goog-te-combo');
    if (select) {
        select.value = lang;
        select.dispatchEvent(new Event('change'));
        console.log('Idioma cambiado usando Google Translate:', lang);
    } else {
        // Si no está el selector, recargar la página
        console.log('Recargando página para aplicar el idioma:', lang);
        window.location.href = url.toString();
        return;
    }
    
    updateButtonUI();
}

function loadGoogleTranslate(forceReload = false) {
    // Limpiar cualquier instancia anterior
    if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        if (forceReload) {
            // Forzar recarga completa de la página si es necesario
            window.location.reload(true);
            return;
        }
    }
    
    // Eliminar script anterior si existe
    const oldScript = document.querySelector('script[src*="translate.google.com"]');
    if (oldScript) {
        oldScript.remove();
    }
    
    // Eliminar el div anterior si existe
    const oldDiv = document.getElementById('google_translate_element');
    if (oldDiv) {
        oldDiv.remove();
    }
    
    // Crear nuevo contenedor
    const div = document.createElement('div');
    div.id = 'google_translate_element';
    div.style.display = 'none';
    document.body.appendChild(div);
    
    // Configuración de Google Translate
    window.googleTranslateElementInit = function() {
        // Verificar si el widget ya está inicializado
        if (window.googleTranslateInitialized) {
            console.log('Google Translate ya está inicializado');
            return;
        }
        
        if (!window.google || !window.google.translate) {
            console.error('Google Translate no se cargó correctamente');
            // Reintentar después de un tiempo con un timestamp único
            setTimeout(() => loadGoogleTranslate(true), 1000);
            return;
        }
        
        try {
            // Forzar la recarga del widget
            if (window.googleTranslateWidget) {
                try {
                    window.googleTranslateWidget.clear();
                } catch (e) {
                    console.log('No se pudo limpiar el widget anterior');
                }
            }
            
            // Inicializar con un timestamp único para evitar caché
            window.googleTranslateWidget = new google.translate.TranslateElement({
                pageLanguage: 'es',
                includedLanguages: 'es,en',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');
            
            window.googleTranslateInitialized = true;
            console.log('Google Translate inicializado correctamente');
            
            // Aplicar el idioma guardado después de la inicialización
            const lang = getCurrentLang();
            if (lang !== 'es') {
                // Usar un timeout más largo para asegurar que el widget esté listo
                setTimeout(() => {
                    setLanguage(lang);
                    // Forzar actualización de la interfaz
                    updateButtonUI();
                }, 1000);
            }
            
            // Ocultar elementos de Google Translate
            hideGoogleElements();
            
            // Forzar la actualización periódica
            setInterval(hideGoogleElements, 1000);
            
        } catch (error) {
            console.error('Error al inicializar Google Translate:', error);
            // Reintentar con recarga forzada
            setTimeout(() => loadGoogleTranslate(true), 1500);
        }
    };
    
    // Cargar el script de Google Translate con un parámetro de caché único
    const timestamp = new Date().getTime();
    const script = document.createElement('script');
    script.src = `https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&_=${timestamp}`;
    script.async = true;
    script.onerror = function() {
        console.error('Error al cargar el script de Google Translate');
        // Reintentar con recarga forzada
        setTimeout(() => loadGoogleTranslate(true), 2000);
    };
    
    // Agregar el script al documento
    document.head.appendChild(script);
    
    // Forzar la recarga si no se ha inicializado después de 3 segundos
    setTimeout(() => {
        if (!window.googleTranslateInitialized) {
            console.log('Forzando recarga del traductor...');
            loadGoogleTranslate(true);
        }
    }, 3000);
}

function hideGoogleElements() {
    const selectors = [
        '.goog-te-gadget',
        '.goog-te-banner-frame',
        '.skiptranslate',
        '.goog-te-gt-bb',
        'iframe[src*="translate"]',
        '.goog-te-balloon-frame',
        '.goog-te-menu-value',
        '.goog-te-menu2',
        '.goog-te-ftab',
        '.goog-te-ftab-link',
        '.goog-te-menu-value'
    ];
    
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (el) {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.style.opacity = '0';
                el.style.position = 'absolute';
                el.style.width = '1px';
                el.style.height = '1px';
                el.style.overflow = 'hidden';
                el.style.clip = 'rect(0, 0, 0, 0)';
                el.style.whiteSpace = 'nowrap';
            }
        });
    });
}

// Inicialización cuando el DOM esté listo
function initializeTranslator() {
    // Verificar si ya está inicializado
    if (window.translatorInitialized) return;
    
    console.log('Inicializando traductor...');
    
    // Cargar Google Translate
    loadGoogleTranslate();
    
    // Configurar eventos del botón de idioma
    const languageToggle = document.getElementById('language-toggle');
    if (languageToggle) {
        languageToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const languageMenu = document.querySelector('.language-dropdown');
            if (languageMenu) {
                languageMenu.classList.toggle('hidden');
            }
        });
    }
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function(e) {
        const languageMenu = document.querySelector('.language-dropdown');
        const languageButton = document.getElementById('language-toggle');
        
        if (languageMenu && !languageMenu.contains(e.target) && 
            languageButton && !languageButton.contains(e.target)) {
            languageMenu.classList.add('hidden');
        }
    });
    
    // Configurar eventos de los botones de idioma
    document.querySelectorAll('[data-lang]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.dataset.lang;
            setLanguage(lang);
            const languageMenu = this.closest('.language-dropdown');
            if (languageMenu) {
                languageMenu.classList.add('hidden');
            }
        });
    });
    
    // Actualizar la interfaz
    updateButtonUI();
    
    // Marcar como inicializado
    window.translatorInitialized = true;
    
    // Verificar estado después de un tiempo
    setTimeout(() => {
        if (!window.googleTranslateInitialized) {
            console.log('Reintentando inicialización del traductor...');
            loadGoogleTranslate(true);
        }
    }, 2000);
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTranslator);
} else {
    // DOM ya está listo
    initializeTranslator();
}

// Manejar el evento de visibilidad de la página
let hidden, visibilityChange;
if (typeof document.hidden !== 'undefined') {
    hidden = 'hidden';
    visibilityChange = 'visibilitychange';
} else if (typeof document.msHidden !== 'undefined') {
    hidden = 'msHidden';
    visibilityChange = 'msvisibilitychange';
} else if (typeof document.webkitHidden !== 'undefined') {
    hidden = 'webkitHidden';
    visibilityChange = 'webkitvisibilitychange';
}

if (typeof document.addEventListener !== 'undefined' && typeof hidden !== 'undefined') {
    document.addEventListener(visibilityChange, function() {
        if (!document[hidden]) {
            // La página se ha vuelto visible, verificar el traductor
            if (!window.googleTranslateInitialized) {
                console.log('Página visible, verificando traductor...');
                loadGoogleTranslate(true);
            }
        }
    }, false);
}

// Hacer las funciones disponibles globalmente
window.changeLanguage = setLanguage;
window.reloadTranslator = loadGoogleTranslate;
