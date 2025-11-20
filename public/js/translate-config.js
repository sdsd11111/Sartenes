// Configuración global del traductor
window.translatorConfig = {
    currentLang: 'es',
    isInitialized: false,
    googleTranslateElement: null,
    
    // Inicializar el traductor
    init: function() {
        if (this.isInitialized) return;
        
        // Verificar si ya existe el elemento
        let element = document.getElementById('google_translate_element');
        if (!element) {
            element = document.createElement('div');
            element.id = 'google_translate_element';
            element.style.display = 'none';
            document.body.appendChild(element);
        }
        
        // Inicializar Google Translate
        if (window.google && window.google.translate) {
            this.googleTranslateElement = new google.translate.TranslateElement({
                pageLanguage: 'es',
                includedLanguages: 'es,en',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');
            
            this.isInitialized = true;
            this.hideGoogleElements();
            this.loadSavedLanguage();
        }
    },
    
    // Cambiar el idioma
    changeLanguage: function(lang) {
        if (lang === this.currentLang) return;
        
        // Guardar preferencia
        this.currentLang = lang;
        localStorage.setItem('userLanguage', lang);
        
        // Actualizar URL sin recargar
        const url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url);
        
        // Aplicar traducción
        this.applyTranslation(lang);
        
        // Actualizar interfaz
        this.updateUI(lang);
    },
    
    // Aplicar traducción
    applyTranslation: function(lang) {
        if (window.google && google.translate) {
            const select = document.querySelector('.goog-te-combo');
            if (select) {
                select.value = lang;
                select.dispatchEvent(new Event('change'));
            } else {
                // Si no está el selector, recargar la página
                window.location.search = `?lang=${lang}`;
            }
        }
    },
    
    // Cargar idioma guardado
    loadSavedLanguage: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        const savedLang = localStorage.getItem('userLanguage');
        const lang = urlLang || savedLang || 'es';
        
        if (lang !== 'es') {
            this.changeLanguage(lang);
        }
    },
    
    // Actualizar la interfaz
    updateUI: function(lang) {
        // Actualizar checkmarks
        document.querySelectorAll('[data-lang]').forEach(el => {
            const check = el.querySelector('.lang-check');
            if (check) {
                check.classList.toggle('hidden', el.dataset.lang !== lang);
            }
        });
    },
    
    // Ocultar elementos de Google Translate
    hideGoogleElements: function() {
        const hideElements = () => {
            const selectors = [
                '.goog-te-gadget',
                '.goog-te-banner-frame',
                '.skiptranslate',
                'iframe[src*="translate"]'
            ];
            
            selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => {
                    if (el) el.style.display = 'none';
                });
            });
        };
        
        // Ejecutar ahora y cada segundo por si se añaden elementos dinámicamente
        hideElements();
        setInterval(hideElements, 1000);
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Cargar el script de Google Translate
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=onGoogleTranslateLoad';
    script.async = true;
    document.head.appendChild(script);
});

// Función de callback para cuando se carga Google Translate
window.onGoogleTranslateLoad = function() {
    window.translatorConfig.init();
};
