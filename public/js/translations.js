// Traducciones para la aplicación
const translations = {
    es: {
        // Navegación
        inicio: "Inicio",
        menu: "Menú",
        galeria: "Galería",
        contacto: "Contacto",
        // Botones
        ver_mas: "Ver más",
        pedir_ahora: "Pedir ahora",
        // Otros textos
        bienvenido: "Bienvenido a Los Sartenes",
        // Botones de idioma
        idioma_es: "Español",
        idioma_en: "Inglés"
    },
    en: {
        // Navegación
        inicio: "Home",
        menu: "Menu",
        galeria: "Gallery",
        contacto: "Contact",
        // Botones
        ver_mas: "See more",
        pedir_ahora: "Order now",
        // Otros textos
        bienvenido: "Welcome to Los Sartenes",
        // Botones de idioma
        idioma_es: "Spanish",
        idioma_en: "English"
    }
};

// Función para cambiar el idioma
function cambiarIdioma(lang) {
    // Guardar preferencia
    localStorage.setItem('userLanguage', lang);
    
    // Actualizar el atributo lang del HTML
    document.documentElement.lang = lang;
    
    // Recargar la página para aplicar los cambios
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.location.href = url.toString();
}

// Función para traducir la página
function traducirPagina() {
    const lang = localStorage.getItem('userLanguage') || 'es';
    const elements = document.querySelectorAll('[data-translate]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Actualizar botones de idioma
    const btnEs = document.getElementById('lang-es');
    const btnEn = document.getElementById('lang-en');
    
    if (btnEs) {
        btnEs.textContent = translations[lang].idioma_es;
        btnEs.style.display = lang === 'es' ? 'none' : 'inline-block';
    }
    
    if (btnEn) {
        btnEn.textContent = translations[lang].idioma_en;
        btnEn.style.display = lang === 'en' ? 'none' : 'inline-block';
    }
}

// Inicializar traducción cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Obtener idioma de la URL o localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    
    if (urlLang) {
        localStorage.setItem('userLanguage', urlLang);
    }
    
    // Aplicar traducciones
    traducirPagina();
});

// Hacer las funciones accesibles globalmente
window.cambiarIdioma = cambiarIdioma;
