// Función para limpiar cookies de Google Translate
function clearGoogleTranslateCookies() {
    const domain = window.location.hostname;
    const cookies = [
        `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,
        `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${domain}; path=/;`,
        `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${domain}; path=/;`,
        `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${domain.split('.').slice(-2).join('.')}; path=/;`
    ];
    
    cookies.forEach(cookie => {
        document.cookie = cookie;
    });
    
    // Limpiar localStorage y sessionStorage
    localStorage.removeItem('googtrans');
    sessionStorage.removeItem('googtrans');
}

// Cargar Google Translate de manera controlada
function loadGoogleTranslate() {
    // 1. Limpiar cualquier instancia anterior
    const oldScript = document.getElementById('google-translate-script');
    if (oldScript) oldScript.remove();
    
    const oldDiv = document.getElementById('google_translate_element');
    if (oldDiv) oldDiv.remove();
    
    // 2. Crear nuevo contenedor
    const div = document.createElement('div');
    div.id = 'google_translate_element';
    div.style.display = 'none';
    document.body.appendChild(div);
    
    // 3. Configurar callback global
    window.googleTranslateElementInit = function() {
        try {
            new google.translate.TranslateElement({
                pageLanguage: 'es',
                includedLanguages: 'es,en',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');
            
            // Ocultar elementos de Google Translate
            hideGoogleElements();
            setInterval(hideGoogleElements, 1000);
            
            console.log('Google Translate inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar Google Translate:', error);
            // Reintentar después de un tiempo
            setTimeout(loadGoogleTranslate, 1000);
        }
    };
    
    // 4. Cargar script con parámetro de caché único
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = `https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&_=${Date.now()}`;
    script.async = true;
    script.onerror = function() {
        console.error('Error al cargar Google Translate');
        setTimeout(loadGoogleTranslate, 2000);
    };
    
    // 5. Insertar el script
    document.head.appendChild(script);
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

// Función para cambiar de idioma
function changeLanguage(lang) {
    // Guardar preferencia
    localStorage.setItem('userLanguage', lang);
    
    // Actualizar URL
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
    
    // Si el widget está cargado, usarlo directamente
    const select = document.querySelector('.goog-te-combo');
    if (select) {
        select.value = lang;
        select.dispatchEvent(new Event('change'));
    } else {
        // Si no está cargado, recargar la página
        window.location.href = url.toString();
    }
    
    updateUI(lang);
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
    
    // Limpiar cookies y cargar Google Translate
    clearGoogleTranslateCookies();
    
    // Cargar Google Translate después de un pequeño retraso
    setTimeout(loadGoogleTranslate, 100);
    
    // Actualizar interfaz con el idioma guardado
    const savedLang = localStorage.getItem('userLanguage') || 'es';
    updateUI(savedLang);
    
    // Forzar actualización periódica
    setInterval(() => {
        hideGoogleElements();
    }, 1000);
});

// Hacer funciones disponibles globalmente
window.changeLanguage = changeLanguage;
