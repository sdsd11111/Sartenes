// Configuración de idiomas
const LANGUAGES = {
    'es': { name: 'Español', flag: '🇪🇸' },
    'en': { name: 'English', flag: '🇬🇧' }
};

// Obtener idioma actual
getCurrentLang = function() {
    // 1. Verificar parámetro en la URL
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
    
    // 3. Verificar cookie de Google Translate
    const match = document.cookie.match(/googtrans=([^;]+)/);
    if (match) {
        const lang = match[1].split('/').pop();
        if (lang === 'es' || lang === 'en') {
            return lang;
        }
    }
    
    // 4. Idioma por defecto
    return 'es';
};

// Cambiar idioma
changeLanguage = function(lang) {
    if (lang === getCurrentLang()) return;
    
    console.log('Cambiando a idioma:', lang);
    
    // Guardar preferencia
    localStorage.setItem('userLanguage', lang);
    document.cookie = `googtrans=/es/${lang}; path=/; domain=${window.location.hostname}`;
    
    // Si el widget ya está cargado, usarlo directamente
    const select = document.querySelector('.goog-te-combo');
    if (select) {
        select.value = lang;
        select.dispatchEvent(new Event('change'));
    } else {
        // Si no está cargado, recargar la página con el nuevo idioma
        const url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.location.href = url.toString();
    }
    
    updateUI(lang);
};

// Actualizar interfaz
updateUI = function(lang) {
    // Actualizar checkmarks
    document.querySelectorAll('[data-lang]').forEach(el => {
        const check = el.querySelector('.lang-check');
        if (check) {
            check.classList.toggle('hidden', el.dataset.lang !== lang);
        }
    });
    
    // Actualizar texto del botón
    const languageToggle = document.getElementById('language-toggle');
    if (languageToggle) {
        const langText = lang === 'es' ? 'IDIOMA' : 'LANGUAGE';
        const textSpan = languageToggle.querySelector('span:first-child');
        if (textSpan) {
            textSpan.textContent = langText;
        }
    }
};

// Inicializar Google Translate
function initGoogleTranslate() {
    // Eliminar script anterior si existe
    const oldScript = document.getElementById('google-translate-script');
    if (oldScript) oldScript.remove();
    
    // Eliminar div anterior si existe
    const oldDiv = document.getElementById('google_translate_element');
    if (oldDiv) oldDiv.remove();
    
    // Crear nuevo contenedor
    const div = document.createElement('div');
    div.id = 'google_translate_element';
    div.style.display = 'none';
    document.body.appendChild(div);
    
    // Configurar callback
    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'es',
            includedLanguages: 'es,en',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
        }, 'google_translate_element');
        
        // Aplicar idioma actual después de cargar
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
    };
    
    // Cargar script
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
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
            changeLanguage(lang);
            const menu = this.closest('.language-dropdown');
            if (menu) menu.classList.add('hidden');
        });
    });
    
    // Inicializar Google Translate
    initGoogleTranslate();
    
    // Actualizar interfaz con el idioma actual
    const currentLang = getCurrentLang();
    updateUI(currentLang);
    
    // Ocultar elementos de Google Translate periódicamente
    setInterval(hideGoogleElements, 1000);
});
