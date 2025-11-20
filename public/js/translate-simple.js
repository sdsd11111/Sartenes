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
    console.log('Iniciando carga de Google Translate...');
    
    // Limpiar cualquier instancia previa
    forceCleanGoogle();

    // Asegurarse de que el contenedor exista
    let cont = document.getElementById("google_translate_element");
    if (!cont) {
        cont = document.createElement("div");
        cont.id = "google_translate_element";
        cont.style.display = "none";
        document.body.appendChild(cont);
        console.log('Contenedor de Google Translate creado');
    }

    // Configurar la función de inicialización global
    window.googleTranslateElementInit = () => {
        console.log('googleTranslateElementInit ejecutándose...');
        
        try {
            // Verificar si google.translate está disponible
            if (!window.google || !window.google.translate) {
                console.error('Google Translate no está disponible');
                return;
            }

            // Crear el elemento de traducción
            new google.translate.TranslateElement(
                {
                    pageLanguage: DEFAULT_LANG,
                    includedLanguages: LANGS.join(","),
                    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false
                },
                "google_translate_element"
            );

            console.log('Elemento de Google Translate creado');
            
            // Ocultar elementos no deseados
            hideGoogleElements();
            
            // Aplicar el idioma actual
            const currentLang = getLang();
            console.log('Aplicando idioma:', currentLang);
            applyLang(currentLang);
            
            // Forzar actualización después de un breve retraso
            setTimeout(() => {
                updateUI();
                const select = document.querySelector('.goog-te-combo');
                if (select) {
                    select.value = currentLang;
                    select.dispatchEvent(new Event('change'));
                }
            }, 500);
            
        } catch (error) {
            console.error('Error en googleTranslateElementInit:', error);
        }
    };

    // Cargar el script de Google Translate
    const script = document.createElement("script");
    script.id = "gt-script";
    script.src = `//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&hl=${getLang()}&t=${Date.now()}`;
    script.async = true;
    script.onerror = () => {
        console.error('Error al cargar el script de Google Translate');
        // Reintentar después de un tiempo
        setTimeout(loadGoogle, 2000);
    };
    
    // Agregar el script al documento
    document.head.appendChild(script);
    console.log('Script de Google Translate cargado');
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
    console.log(`=== changeLanguage called with lang: ${lang} ===`);
    
    // No hacer nada si ya está en el idioma solicitado
    if (lang === getLang() && window.google && window.google.translate) {
        console.log('El idioma ya está establecido, actualizando solo la interfaz');
        updateUI();
        return;
    }
    
    // Guardar preferencia
    localStorage.setItem("userLanguage", lang);
    
    // Actualizar la cookie de Google Translate
    const domain = window.location.hostname;
    const cookieValue = `googtrans=/${DEFAULT_LANG}/${lang}; path=/; domain=${domain}; SameSite=Lax`;
    document.cookie = cookieValue;
    console.log('Cookie configurada:', cookieValue);
    
    // Intentar actualizar el selector de Google Translate si está disponible
    const updateGoogleTranslate = () => {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            console.log('Actualizando selector de Google Translate a:', lang);
            select.value = lang;
            select.dispatchEvent(new Event('change'));
            return true;
        }
        return false;
    };
    
    // Si Google Translate está cargado, actualizarlo
    if (window.google && window.google.translate) {
        console.log('Google Translate está cargado, actualizando...');
        if (!updateGoogleTranslate()) {
            console.log('No se encontró el selector de Google Translate, recargando...');
            window.location.reload();
        }
    } else {
        console.log('Google Translate no está cargado, recargando la página...');
        window.location.reload();
    }
    
    // Actualizar la interfaz de usuario
    updateUI();
}

// --- INICIALIZACIÓN ---
function initializeTranslator() {
    console.log('=== INICIALIZANDO TRADUCTOR ===');
    
    // Configurar eventos del menú desplegable
    const setupMenu = () => {
        const languageToggle = document.getElementById("language-toggle");
        if (languageToggle) {
            // Eliminar event listeners antiguos para evitar duplicados
            const newToggle = languageToggle.cloneNode(true);
            languageToggle.parentNode.replaceChild(newToggle, languageToggle);
            
            newToggle.addEventListener("click", (e) => {
                e.stopPropagation();
                const menu = document.querySelector(".language-dropdown");
                if (menu) menu.classList.toggle("hidden");
            });
            
            console.log('Menú de idiomas configurado');
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
            // Eliminar event listeners antiguos
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener("click", (e) => {
                e.preventDefault();
                const lang = newBtn.dataset.lang;
                console.log('Botón de idioma clickeado:', lang);
                changeLanguage(lang);
                const menu = newBtn.closest(".language-dropdown");
                if (menu) menu.classList.add("hidden");
            });
        });
        
        console.log('Eventos de menú configurados');
    };

    // Configurar el menú de idiomas
    setupMenu();
    
    // Verificar si ya hay un script de Google Translate
    if (!document.getElementById('gt-script')) {
        console.log('Cargando Google Translate por primera vez...');
        updateUI();
        loadGoogle();
    } else if (window.google && window.google.translate) {
        console.log('Google Translate ya está cargado, actualizando interfaz...');
        updateUI();
        applyLang(getLang());
    } else {
        console.log('Recargando Google Translate...');
        loadGoogle();
    }
    
    // Verificar periódicamente que el traductor esté funcionando
    const checkTranslator = setInterval(() => {
        if (window.google && window.google.translate) {
            console.log('Google Translate está funcionando correctamente');
            clearInterval(checkTranslator);
            updateUI();
            applyLang(getLang());
        } else {
            console.log('Esperando a que Google Translate se cargue...');
        }
    }, 1000);
    
    // Limpiar el intervalo después de 10 segundos
    setTimeout(() => {
        clearInterval(checkTranslator);
    }, 10000);
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
