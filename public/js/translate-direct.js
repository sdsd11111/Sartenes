// Función para forzar la recarga del traductor
function forceLoadGoogleTranslate() {
    // 1. Limpiar cualquier instancia anterior
    const oldScript = document.querySelector('script[src*="translate.google.com"]');
    if (oldScript) document.head.removeChild(oldScript);
    
    const oldDiv = document.getElementById('google_translate_element');
    if (oldDiv) document.body.removeChild(oldDiv);
    
    // 2. Crear nuevo contenedor
    const div = document.createElement('div');
    div.id = 'google_translate_element';
    div.style.display = 'none';
    document.body.appendChild(div);
    
    // 3. Forzar recarga sin caché
    const timestamp = new Date().getTime();
    const script = document.createElement('script');
    script.src = `https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&_=${timestamp}`;
    
    // 4. Configurar callback
    window.googleTranslateElementInit = function() {
        try {
            new google.translate.TranslateElement({
                pageLanguage: 'es',
                includedLanguages: 'es,en',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');
            
            // Aplicar idioma guardado
            const lang = getCurrentLang();
            if (lang !== 'es') {
                setTimeout(() => {
                    const select = document.querySelector('.goog-te-combo');
                    if (select) {
                        select.value = lang;
                        select.dispatchEvent(new Event('change'));
                    }
                }, 500);
            }
            
            // Ocultar elementos de Google
            hideGoogleElements();
            setInterval(hideGoogleElements, 1000);
            
        } catch (error) {
            console.error('Error al cargar Google Translate:', error);
            // Reintentar después de 1 segundo
            setTimeout(forceLoadGoogleTranslate, 1000);
        }
    };
    
    // 5. Manejar errores de carga
    script.onerror = function() {
        console.error('Error al cargar el script de Google Translate');
        setTimeout(forceLoadGoogleTranslate, 2000);
    };
    
    // 6. Cargar el script
    document.head.appendChild(script);
}

// Función para obtener el idioma actual
function getCurrentLang() {
    // 1. Verificar localStorage
    const savedLang = localStorage.getItem('userLanguage');
    if (savedLang) return savedLang;
    
    // 2. Verificar cookie de Google
    const match = document.cookie.match(/googtrans=([^;]+)/);
    if (match) {
        const parts = match[1].split('/');
        if (parts.length > 2) return parts[2];
    }
    
    // 3. Verificar URL
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('lang') || 'es';
}

// Función para cambiar el idioma
function changeLanguage(lang) {
    if (lang === getCurrentLang()) return;
    
    console.log('Cambiando a idioma:', lang);
    
    // Guardar preferencia
    localStorage.setItem('userLanguage', lang);
    document.cookie = `googtrans=/es/${lang}; path=/; domain=${window.location.hostname}`;
    
    // Actualizar URL
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
    
    // Forzar recarga del traductor
    forceLoadGoogleTranslate();
}

// Ocultar elementos de Google Translate
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
        '.goog-te-ftab-link'
    ];
    
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (el) {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
            }
        });
    });
}

// Actualizar la interfaz de usuario
function updateUI(lang) {
    // Actualizar checkmarks
    document.querySelectorAll('[data-lang]').forEach(el => {
        const check = el.querySelector('.lang-check');
        if (check) {
            check.classList.toggle('hidden', el.dataset.lang !== lang);
        }
    });
    
    // Actualizar texto del botón
    const button = document.getElementById('language-toggle');
    if (button) {
        const text = lang === 'es' ? 'IDIOMA' : 'LANGUAGE';
        const span = button.querySelector('span:first-child');
        if (span) span.textContent = text;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Configurar eventos del menú desplegable
    const languageToggle = document.getElementById('language-toggle');
    if (languageToggle) {
        languageToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const menu = document.querySelector('.language-dropdown');
            if (menu) menu.classList.toggle('hidden');
        });
    }
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function(e) {
        const menu = document.querySelector('.language-dropdown');
        const button = document.getElementById('language-toggle');
        if (menu && !menu.contains(e.target) && button && !button.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
    
    // Configurar eventos de los botones de idioma
    document.querySelectorAll('[data-lang]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.dataset.lang;
            changeLanguage(lang);
            const menu = this.closest('.language-dropdown');
            if (menu) menu.classList.add('hidden');
        });
    });
    
    // Inicializar Google Translate
    forceLoadGoogleTranslate();
    
    // Actualizar interfaz con el idioma actual
    updateUI(getCurrentLang());
    
    // Forzar actualización periódica
    setInterval(() => {
        updateUI(getCurrentLang());
        hideGoogleElements();
    }, 1000);
});

// Hacer las funciones disponibles globalmente
window.changeLanguage = changeLanguage;
