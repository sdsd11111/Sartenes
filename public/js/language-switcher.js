// Configuración de idiomas soportados
const LANGUAGES = {
    'es': { name: 'Español', flag: '🇪🇸' },
    'en': { name: 'English', flag: '🇬🇧' }
};

// Clase para manejar el cambio de idioma
class LanguageSwitcher {
    constructor() {
        this.currentLang = this.getSavedLanguage();
        this.translateElement = null;
        this.initialized = false;
        this.initialize();
    }

    // Inicializar el selector de idioma
    async initialize() {
        // Cargar Google Translate
        await this.loadGoogleTranslate();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Aplicar el idioma guardado
        this.applyLanguage(this.currentLang);
        this.initialized = true;
    }

    // Cargar Google Translate
    loadGoogleTranslate() {
        return new Promise((resolve, reject) => {
            // Si ya está cargado, resolver inmediatamente
            if (window.google && window.google.translate) {
                console.log('Google Translate ya está cargado');
                resolve();
                return;
            }

            // Eliminar script anterior si existe
            const oldScript = document.querySelector('script[src*="translate.google.com"]');
            if (oldScript) {
                document.head.removeChild(oldScript);
            }

            // Crear y cargar el script
            const script = document.createElement('script');
            script.src = 'https://translate.google.com/translate_a/element.js?cb=onGoogleTranslateLoad';
            script.async = true;
            
            // Configurar función de devolución de llamada global
            window.onGoogleTranslateLoad = () => {
                console.log('Google Translate cargado correctamente');
                this.setupGoogleTranslate();
                resolve();
            };
            
            script.onerror = (error) => {
                console.error('Error al cargar Google Translate:', error);
                reject(error);
            };

            document.head.appendChild(script);
        });
    }

    // Configurar Google Translate
    setupGoogleTranslate() {
        try {
            // Crear el elemento de traducción si no existe
            if (!this.translateElement) {
                const container = document.createElement('div');
                container.id = 'google_translate_element';
                container.style.display = 'none';
                document.body.appendChild(container);
                
                // Inicializar el widget
                new google.translate.TranslateElement({
                    pageLanguage: 'es',
                    includedLanguages: 'es,en',
                    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false
                }, 'google_translate_element');
                
                this.translateElement = container;
                this.hideGoogleElements();
            }
        } catch (error) {
            console.error('Error al configurar Google Translate:', error);
        }
    }

    // Ocultar elementos de Google Translate
    hideGoogleElements() {
        const elements = [
            '.goog-te-gadget',
            '.goog-te-banner-frame',
            '.skiptranslate',
            '.goog-te-gt-bb',
            'iframe[src*="translate"]'
        ];
        
        elements.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (el) el.style.display = 'none';
            });
        });
    }

    // Configurar eventos
    setupEventListeners() {
        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', (e) => {
            const languageMenu = document.querySelector('.language-dropdown');
            const languageButton = document.getElementById('language-toggle');
            
            if (languageMenu && !languageMenu.contains(e.target) && 
                languageButton && !languageButton.contains(e.target)) {
                languageMenu.classList.add('hidden');
            }
        });

        // Toggle del menú de idiomas
        const languageToggle = document.getElementById('language-toggle');
        if (languageToggle) {
            languageToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const languageMenu = document.querySelector('.language-dropdown');
                if (languageMenu) {
                    languageMenu.classList.toggle('hidden');
                }
            });
        }
    }

    // Obtener idioma guardado
    getSavedLanguage() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        const savedLang = localStorage.getItem('userLanguage');
        return urlLang || savedLang || 'es';
    }

    // Cambiar de idioma
    async changeLanguage(lang) {
        if (lang === this.currentLang) {
            this.closeDropdown();
            return;
        }

        console.log('Cambiando a idioma:', lang);
        this.currentLang = lang;
        
        // Guardar preferencia
        localStorage.setItem('userLanguage', lang);
        
        // Actualizar interfaz
        this.updateUI(lang);
        
        // Aplicar traducción
        this.applyLanguage(lang);
        
        // Cerrar el menú
        this.closeDropdown();
    }

    // Aplicar el idioma
    applyLanguage(lang) {
        // Usar Google Translate si está disponible
        if (window.google && window.google.translate) {
            const select = document.querySelector('.goog-te-combo');
            if (select) {
                select.value = lang;
                select.dispatchEvent(new Event('change'));
                console.log('Idioma cambiado usando Google Translate:', lang);
                return;
            }
        }
        
        // Si no se pudo usar Google Translate, recargar la página
        console.log('Recargando página para aplicar el idioma:', lang);
        const url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.location.href = url.toString();
    }

    // Actualizar la interfaz de usuario
    updateUI(lang) {
        // Actualizar checkmarks
        Object.keys(LANGUAGES).forEach(code => {
            const checkElement = document.getElementById(`check-${code}`);
            if (checkElement) {
                checkElement.classList.toggle('hidden', code !== lang);
            }
        });
        
        // Actualizar URL sin recargar la página
        const url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url);
    }

    // Cerrar el menú desplegable
    closeDropdown() {
        const dropdown = document.querySelector('.language-dropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia del selector de idioma
    window.languageSwitcher = new LanguageSwitcher();
    
    // Función global para cambiar el idioma
    window.changeLanguage = (lang) => {
        if (window.languageSwitcher) {
            window.languageSwitcher.changeLanguage(lang);
        }
    };
});
