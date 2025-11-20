// Simple Google Translate Implementation

// Limpiar cookies de Google Translate
function clearGoogleCookies() {
    const domain = window.location.hostname;
    const cookies = [
        `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,
        `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${domain}; path=/;`,
        `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${domain}; path=/;`
    ];
    
    cookies.forEach(cookie => {
        document.cookie = cookie;
    });
    
    // Limpiar localStorage
    localStorage.removeItem('googtrans');
    sessionStorage.removeItem('googtrans');
}

// Obtener idioma actual
function getCurrentLang() {
    // 1. Verificar URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && (urlLang === 'es' || urlLang === 'en')) {
        return urlLang;
    }
    
    // 2. Verificar localStorage
    const savedLang = localStorage.getItem('userLanguage');
    if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
        return savedLang;
    }
    
    // 3. Valor por defecto
    return 'es';
}

// Actualizar interfaz de usuario
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

// Cambiar idioma
function changeLanguage(lang) {
    if (lang === getCurrentLang()) return;
    
    console.log('Cambiando a idioma:', lang);
    
    // Guardar preferencia
    localStorage.setItem('userLanguage', lang);
    
    // Actualizar URL
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    
    // Usar Google Translate si está disponible
    const select = document.querySelector('.goog-te-combo');
    if (select) {
        select.value = lang;
        select.dispatchEvent(new Event('change'));
        window.history.replaceState({}, '', url);
        updateUI(lang);
    } else {
        // Si no está disponible, recargar la página
        window.location.href = url.toString();
    }
}

// Ocultar elementos de Google Translate
function hideGoogleElements() {
    const elements = [
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
    
    elements.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (el) {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
            }
        });
    });
}

// Inicializar Google Translate
function initGoogleTranslate() {
    // Limpiar cualquier instancia anterior
    const oldScript = document.querySelector('script[src*="translate.google.com"]');
    if (oldScript) oldScript.remove();
    
    // Crear nuevo contenedor
    const div = document.createElement('div');
    div.id = 'google_translate_element';
    div.style.display = 'none';
    document.body.appendChild(div);
    
    // Configurar callback
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
                const select = document.querySelector('.goog-te-combo');
                if (select) {
                    select.value = lang;
                    select.dispatchEvent(new Event('change'));
                }
            }
            
            // Ocultar elementos de Google Translate
            hideGoogleElements();
            setInterval(hideGoogleElements, 1000);
            
        } catch (error) {
            console.error('Error al inicializar Google Translate:', error);
            // Reintentar después de un tiempo
            setTimeout(initGoogleTranslate, 1000);
        }
    };
    
    // Cargar script con parámetro de caché único
    const script = document.createElement('script');
    script.src = `https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&_=${Date.now()}`;
    script.async = true;
    script.onerror = function() {
        console.error('Error al cargar Google Translate');
        setTimeout(initGoogleTranslate, 2000);
    };
    
    document.head.appendChild(script);
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
    
    // Limpiar cookies y cargar Google Translate
    clearGoogleCookies();
    
    // Inicializar interfaz
    updateUI(getCurrentLang());
    
    // Cargar Google Translate después de un pequeño retraso
    setTimeout(initGoogleTranslate, 100);
});

// Hacer funciones disponibles globalmente
window.changeLanguage = changeLanguage;
