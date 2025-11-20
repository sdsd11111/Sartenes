// --- CONFIG ---
const LANGS = ["es", "en"];
const DEFAULT_LANG = "es";

// --- OBTENER IDIOMA ---
function getLang() {
    // 1. Verificar parámetro en la URL
    const param = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(param)) return param;

    // 2. Verificar localStorage
    const saved = localStorage.getItem("userLanguage");
    if (LANGS.includes(saved)) return saved;

    // 3. Idioma por defecto
    return DEFAULT_LANG;
}

// --- APLICAR IDIOMA ---
function applyLang(lang) {
    // Guardar preferencia
    localStorage.setItem("userLanguage", lang);

    // Escribir cookie ANTES de cargar Google
    document.cookie = `googtrans=/${DEFAULT_LANG}/${lang}; path=/; domain=${window.location.hostname}`;

    // Actualizar la interfaz
    updateUI();
    
    // Activar el selector cuando exista
    const interval = setInterval(() => {
        const sel = document.querySelector(".goog-te-combo");
        if (!sel) return;
        
        if (sel.value !== lang) {
            sel.value = lang;
            sel.dispatchEvent(new Event("change"));
        }
        clearInterval(interval);
    }, 150);
}

// --- ELIMINAR INSTANCIAS PASADAS ---
function forceCleanGoogle() {
    // eliminar iframes
    document.querySelectorAll("iframe").forEach(i => i.remove());

    // eliminar divs creados por google
    document.querySelectorAll("[id^=':']").forEach(e => e.remove());
    document.querySelectorAll(".skiptranslate").forEach(e => e.remove());

    // borrar gadget si existe
    const el = document.getElementById("google_translate_element");
    if (el) el.innerHTML = "";

    // borrar script previo
    const oldScript = document.getElementById("gt-script");
    if (oldScript) oldScript.remove();

    // borrar función global
    delete window.googleTranslateElementInit;
}

// --- CARGAR GOOGLE TRANSLATE ---
function loadGoogle() {
    forceCleanGoogle();

    // recrear contenedor limpio
    let cont = document.getElementById("google_translate_element");
    if (!cont) {
        cont = document.createElement("div");
        cont.id = "google_translate_element";
        cont.style.display = "none";
        document.body.appendChild(cont);
    }

    window.googleTranslateElementInit = () => {
        new google.translate.TranslateElement(
            {
                pageLanguage: DEFAULT_LANG,
                includedLanguages: LANGS.join(","),
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            },
            "google_translate_element"
        );

        // Ocultar elementos de Google Translate
        hideGoogleElements();
        
        // Aplicar idioma actual
        applyLang(getLang());
    };

    const s = document.createElement("script");
    s.id = "gt-script";
    s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.head.appendChild(s);
}

// --- OCULTAR ELEMENTOS DE GOOGLE TRANSLATE ---
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

// --- ACTUALIZAR INTERFAZ ---
function updateUI() {
    const lang = getLang();

    // Actualizar checkmarks
    document.querySelectorAll("[data-lang]").forEach(btn => {
        const check = btn.querySelector(".lang-check");
        if (check) {
            check.classList.toggle("hidden", btn.dataset.lang !== lang);
        }
    });

    // Actualizar texto del botón
    const toggle = document.getElementById("language-toggle");
    if (toggle) {
        const textSpan = toggle.querySelector("span:first-child");
        if (textSpan) {
            textSpan.textContent = lang === "es" ? "IDIOMA" : "LANGUAGE";
        }
    }
}

// --- CAMBIAR IDIOMA ---
function changeLanguage(lang) {
    // Guardar el idioma en localStorage
    localStorage.setItem("userLanguage", lang);
    
    // Actualizar la cookie de Google Translate
    document.cookie = `googtrans=/${DEFAULT_LANG}/${lang}; path=/; domain=${window.location.hostname}`;
    
    // Si ya está cargado Google Translate, forzar la actualización
    if (window.google && window.google.translate) {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = lang;
            select.dispatchEvent(new Event('change'));
        } else {
            // Si no hay selector, recargar la página
            window.location.reload();
        }
    } else {
        // Si no está cargado Google Translate, recargar la página
        window.location.reload();
    }
    
    // Actualizar la interfaz
    updateUI();
}

// --- INICIALIZACIÓN ---
function initializeTranslator() {
    // Configurar eventos del menú desplegable
    const languageToggle = document.getElementById("language-toggle");
    if (languageToggle) {
        languageToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            const menu = document.querySelector(".language-dropdown");
            if (menu) menu.classList.toggle("hidden");
        });
    }

    // Cerrar menú al hacer clic fuera
    document.addEventListener("click", (e) => {
        const menu = document.querySelector(".language-dropdown");
        const button = document.getElementById("language-toggle");
        
        if (menu && !menu.contains(e.target) && button && !button.contains(e.target)) {
            menu.classList.add("hidden");
        }
    });

    // Configurar eventos de los botones de idioma
    document.querySelectorAll("[data-lang]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const lang = btn.dataset.lang;
            changeLanguage(lang);
            const menu = btn.closest(".language-dropdown");
            if (menu) menu.classList.add("hidden");
        });
    });

    // Verificar si ya hay un script de Google Translate
    if (!document.getElementById('gt-script')) {
        // Inicializar
        updateUI();
        loadGoogle();
    } else if (window.google && window.google.translate) {
        // Si ya está cargado, solo actualizar la interfaz
        updateUI();
        applyLang(getLang());
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", initializeTranslator);

// Forzar recarga si se carga desde caché
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        window.location.reload();
    }
});

// Ocultar elementos de Google Translate periódicamente
setInterval(hideGoogleElements, 1000);

// Hacer funciones disponibles globalmente
window.changeLanguage = changeLanguage;
