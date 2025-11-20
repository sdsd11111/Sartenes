// -------------------- CONFIG --------------------
const GT_CONFIG = {
    defaultLang: "es",
    supported: ["es", "en"],
    cookieName: "googtrans",
    scriptURL: "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
};

// -------------------- UTILIDADES --------------------
function setCookie(name, value) {
    document.cookie = `${name}=${value};path=/;expires=Fri, 31 Dec 9999 23:59:59 GMT`;
}

function getCurrentLang() {
    return localStorage.getItem("lang") || GT_CONFIG.defaultLang;
}

function setUserLang(lang) {
    localStorage.setItem("lang", lang);
}

// -------------------- CARGAR SCRIPT --------------------
function loadGoogleTranslateScript() {
    return new Promise((resolve) => {
        const existing = document.querySelector(`script[src*="translate_a"]`);
        if (existing) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = GT_CONFIG.scriptURL;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => setTimeout(loadGoogleTranslateScript, 800);

        document.head.appendChild(script);
    });
}

// -------------------- INICIALIZACIÓN --------------------
function initGoogleTranslate() {
    // Eliminar div anterior si existe
    const oldDiv = document.getElementById('google_translate_element');
    if (oldDiv) oldDiv.remove();
    
    // Crear nuevo contenedor
    const div = document.createElement('div');
    div.id = 'google_translate_element';
    div.style.display = 'none';
    document.body.appendChild(div);
    
    // Configurar callback global
    window.googleTranslateElementInit = function() {
        try {
            new google.translate.TranslateElement({
                pageLanguage: 'es',
                includedLanguages: 'es,en',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');
            
            // Aplicar idioma actual
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

// ---------- Robust changeLanguage (retry + cookie + cache-bust reload) ----------
async function robustChangeLanguage(targetLang, opts = {}) {
    const MAX_ATTEMPTS = opts.attempts || 8;
    const ATTEMPT_DELAY = opts.delay || 250; // ms between tries

    if (!targetLang) return;
    console.log('=== changeLanguage called with lang:', targetLang, '===');

    // helper: set googtrans cookie and localStorage
    function setPersistentLang(lang) {
        try {
            localStorage.setItem('lang', lang);
        } catch (e) { /* ignore */ }
        try {
            // set cookie for the current host; max-age large
            document.cookie = 'googtrans=/es/' + lang + ';path=/;max-age=315360000;SameSite=Lax';
        } catch (e) { console.warn('set cookie failed', e); }
    }

    // helper: attempt to use the internal combo
    function tryUseCombo(lang) {
        try {
            const combo = document.querySelector('.goog-te-combo');
            if (!combo) return false;

            // If combo present, set value and dispatch change event
            combo.value = lang;
            const ev = new Event('change', { bubbles: true });
            combo.dispatchEvent(ev);
            console.log('Used .goog-te-combo to change to', lang);
            return true;
        } catch (e) {
            console.warn('tryUseCombo error:', e);
            return false;
        }
    }

    // 1) First attempt: if google.translate loaded, try to change via combo with retries
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        // If google translate hasn't initialized, wait and retry
        if (window.google && window.google.translate) {
            const ok = tryUseCombo(targetLang);
            if (ok) {
                setPersistentLang(targetLang);
                // small delay to allow translation to apply, then try to remove stale iframes
                setTimeout(() => {
                    const iframe = document.querySelector('.goog-te-menu-frame');
                    if (iframe) {
                        // keep it — but if behavior is flaky remove and let page reload/regen
                        // iframe.remove();
                    }
                }, 300);
                return; // success
            } else {
                console.log('combo not found yet; attempt', i+1);
            }
        } else {
            console.log('google.translate not ready; attempt', i+1);
        }
        // wait before next attempt
        await new Promise(r => setTimeout(r, ATTEMPT_DELAY));
    }

    // 2) If we reach here: combo not usable. Use cookie + forced reload with cache-bust
    console.log('Combo not usable after retries — applying cookie + cache-bust reload');
    setPersistentLang(targetLang);

    // remove the old google translate script and iframes to force fresh load on next page
    try {
        const oldS = document.querySelector('script[src*="translate_a/element.js"]');
        if (oldS) oldS.remove();
        const menuFrame = document.querySelector('.goog-te-menu-frame');
        if (menuFrame && menuFrame.parentNode) menuFrame.parentNode.removeChild(menuFrame);
        const banner = document.querySelector('.goog-te-banner-frame');
        if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    } catch (e) { /* ignore */ }

    // Force a "hard" reload-like navigation by adding cache-busting query param
    const url = new URL(window.location.href);
    url.searchParams.set('_glang', targetLang);
    url.searchParams.set('_t', Date.now().toString(36)); // cache-buster
    // Use location.href assign (not reload) to ensure navigation
    window.location.href = url.toString();
}

// Expose it (if your code expects changeLanguage)
window.changeLanguage = function(lang) {
    // small guard: if same as stored, still attempt (some users report widget stale)
    const current = (localStorage.getItem('lang') || 'es');
    console.log('Estado actual del selector:', current, 'Intentando cambiar a:', lang);
    robustChangeLanguage(lang).catch(e => {
        console.error('robustChangeLanguage failed', e);
        // fallback simple cookie+reload
        try {
            document.cookie = 'googtrans=/es/' + lang + ';path=/;max-age=315360000';
            localStorage.setItem('lang', lang);
        } catch(e){}
        // final reload
        const url = new URL(window.location.href);
        url.searchParams.set('_glang', lang);
        url.searchParams.set('_t', Date.now().toString(36));
        window.location.href = url.toString();
    });
};

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
        '.goog-te-ftab-link',
        '.goog-te-combo'
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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Google Translate
    initGoogleTranslate();
    
    // Configurar eventos del menú desplegable
    const languageToggle = document.getElementById('language-toggle');
    if (languageToggle) {
        languageToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const menu = document.getElementById('menuLang');
            if (menu) menu.classList.toggle('hidden');
        });
    }
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function(e) {
        const menu = document.getElementById('menuLang');
        const button = document.getElementById('language-toggle');
        if (menu && !menu.contains(e.target) && button && !button.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
    
    // Configurar eventos de los botones de idioma
    document.querySelectorAll('[data-lang]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.getAttribute('data-lang') || this.dataset.lang;
            if (lang) {
                changeLanguage(lang);
                // Cerrar el menú después de seleccionar un idioma
                const menu = document.getElementById('menuLang');
                if (menu) menu.classList.add('hidden');
            }
        });
    });
    
    // Actualizar la interfaz con el idioma actual
    updateUI(getCurrentLang());
});

// Ejecutar hideGoogleElements periódicamente para asegurar que los elementos de Google Translate permanezcan ocultos
setInterval(hideGoogleElements, 1000);
