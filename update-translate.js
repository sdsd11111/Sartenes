const fs = require('fs');
const path = require('path');

// Google Translate hidden div to add to the head
const googleTranslateDiv = '    <!-- Google Translate Element - Hidden -->\n    <div id="google_translate_element" style="display:none"></div>';

// Google Translate script to add at the end of the body
const googleTranslateScript = `\n    <!-- Google Translate Implementation -->
    <script>
    /* --- CONFIG --- */
    const cookieDomain = "lossartenes.com";
    const defaultSrcLang = "es";

    /* --- Cookie utilities --- */
    function setCookie(name, value, days, domain) {
        let expires = "";
        if (days) {
            const d = new Date();
            d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = ";expires=" + d.toUTCString();
        }
        const domainPart = domain ? ";domain=" + domain : "";
        document.cookie = name + "=" + encodeURIComponent(value) + expires + ";path=/" + domainPart;
    }

    function getCookie(name) {
        const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
        return v ? decodeURIComponent(v.pop()) : "";
    }

    /* --- limpiar restos previos de Google (si los hay) --- */
    function cleanPreviousGoogle() {
        // eliminar iframe del menú
        const frames = document.querySelectorAll("iframe.goog-te-menu-frame, iframe[id^='__google_translate_element']");
        frames.forEach(f => f.remove());

        // eliminar script antiguo
        const scripts = Array.from(document.querySelectorAll("script[src*='translate_a'], script[src*='translate.google']"));
        scripts.forEach(s => s.remove());

        // eliminar globales
        try { delete window.google; } catch(e) { window.google = undefined; }
        window.googleTranslateElementInit = undefined;
        window.googleTranslateLoaded = false;
    }

    /* --- carga la librería de Google Translate y la inicializa --- */
    function loadAndInitTranslate() {
        return new Promise((resolve, reject) => {
            // si ya está
            if (window.google && window.google.translate && window.googleTranslateLoaded) {
                resolve();
                return;
            }

            // crear callback global esperado por google
            window.googleTranslateElementInit = function() {
                try {
                    new google.translate.TranslateElement({
                        pageLanguage: defaultSrcLang,
                        autoDisplay: false
                    }, "google_translate_element");
                    window.googleTranslateLoaded = true;
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };

            const s = document.createElement("script");
            s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
            s.async = true;
            s.defer = true;
            s.onerror = (e) => reject(e);
            document.head.appendChild(s);
        });
    }

    /* --- inicializar: si hay preferencia guardada, fijar cookie antes de cargar --- */
    async function initTranslator() {
        try {
            cleanPreviousGoogle();

            // Si el usuario guardó idioma en localStorage, aplicar cookie googtrans
            const pref = localStorage.getItem("preferred_lang");
            if (pref && pref !== defaultSrcLang) {
                // formato cookie: /SOURCE/TARGET  -> ej: /es/en
                setCookie("googtrans", "/" + defaultSrcLang + "/" + pref, 365, cookieDomain);
                setCookie("googtrans", "/" + defaultSrcLang + "/" + pref, 365); // set sin domain también para compatibilidad
            } else {
                // borrar cookie si es default
                setCookie("googtrans", "/" + defaultSrcLang + "/" + defaultSrcLang, -1, cookieDomain);
                setCookie("googtrans", "/" + defaultSrcLang + "/" + defaultSrcLang, -1);
            }

            await loadAndInitTranslate();

            // Si hay preferencia, forzar refresco visual inmediato
            const prefAfter = localStorage.getItem("preferred_lang");
            if (prefAfter && prefAfter !== defaultSrcLang) {
                const sel = document.querySelector("select.goog-te-combo");
                if (sel) {
                    sel.value = prefAfter;
                    sel.dispatchEvent(new Event("change"));
                } else if (!sessionStorage.getItem("gt_reloaded")) {
                    sessionStorage.setItem("gt_reloaded", "1");
                    location.reload();
                } else {
                    sessionStorage.removeItem("gt_reloaded");
                }
            }
        } catch (err) {
            console.error("Translator init error:", err);
        }
    }

    /* --- función pública para cambiar idioma --- */
    function changeLang(lang) {
        if (!lang) return;
        localStorage.setItem("preferred_lang", lang);

        // ajustar cookie para dominio
        setCookie("googtrans", "/" + defaultSrcLang + "/" + lang, 365, cookieDomain);
        setCookie("googtrans", "/" + defaultSrcLang + "/" + lang, 365);

        // limpiamos y recargamos el traductor
        cleanPreviousGoogle();

        // Intentamos aplicar sin recargar (mejor UX)
        loadAndInitTranslate().then(() => {
            const sel = document.querySelector("select.goog-te-combo");
            if (sel) {
                sel.value = lang;
                sel.dispatchEvent(new Event("change"));
            } else {
                // fallback: recargar una vez para que cookie tome efecto en producción
                location.reload();
            }
        }).catch(() => {
            // en caso de error forzamos recarga
            location.reload();
        });
    }

    /* --- Exponer globalmente el cambio para tus botones del header --- */
    window.changeLang = changeLang;

    /* --- iniciar al cargar --- */
    window.addEventListener("load", initTranslator);
    </script>
`;

// Function to update a single file
function updateFile(filePath) {
    try {
        // Read the file
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if Google Translate is already in the file
        if (content.includes('google_translate_element') && 
            content.includes('function changeLang') && 
            content.includes('function initTranslator')) {
            console.log(`Skipping (already has Google Translate): ${filePath}`);
            return;
        }
        
        // Add Google Translate div to head if not already present
        if (!content.includes('id="google_translate_element"')) {
            content = content.replace('</title>', '</title>\n    ' + googleTranslateDiv);
        }
        
        // Remove any existing Google Translate scripts
        content = content.replace(/<script[^>]*src=["'][^"']*translate[^"']*["'][^>]*>[\s\S]*?<\/script>/g, '');
        content = content.replace(/<div\s+id=["']google_translate_element["'][^>]*>[\s\S]*?<\/div>/g, '');
        
        // Add the new Google Translate script before the closing body tag
        if (content.includes('</body>')) {
            content = content.replace('</body>', googleTranslateScript + '\n</body>');
        } else {
            content += '\n' + googleTranslateScript;
        }
        
        // Write the updated content back to the file
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    } catch (error) {
        console.error(`Error updating ${filePath}:`, error);
    }
}

// Get all HTML files in the menu directory and its subdirectories
function getAllHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Skip node_modules and other non-html directories
            if (file !== 'node_modules' && !file.startsWith('.')) {
                getAllHtmlFiles(filePath, fileList);
            }
        } else if (file.endsWith('.html') && !file.startsWith('_')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Get all HTML files in the menu directory
const menuDir = path.join(__dirname, 'public', 'menu');
const allHtmlFiles = getAllHtmlFiles(menuDir);

// Update all HTML files
allHtmlFiles.forEach(filePath => {
    updateFile(filePath);
});

console.log('Google Translate implementation completed!');
console.log(`Updated ${allHtmlFiles.length} files.`);
