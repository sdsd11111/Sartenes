// Cargar Google Translate
function loadGoogleTranslate() {
  // Eliminar script anterior si existe
  const old = document.getElementById("google-translate-script");
  if (old) old.remove();

  // Configuración del widget
  window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement(
      {
        pageLanguage: "es",
        includedLanguages: "es,en",
        autoDisplay: false,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
      },
      "google_translate_element"
    );
    
    // Ocultar elementos de Google Translate
    hideGoogleElements();
    setInterval(hideGoogleElements, 1000);
  };

  // Cargar script de Google Translate
  const s = document.createElement("script");
  s.id = "google-translate-script";
  s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  document.body.appendChild(s);
}

// Obtener idioma actual
function getCurrentLang() {
  const match = document.cookie.match(/googtrans=\/[a-z]{2}\/([a-z]{2})/);
  return match ? match[1] : "es";
}

// Actualizar interfaz de usuario
function updateUI() {
  const currentLang = getCurrentLang();
  
  // Actualizar checkmarks
  document.querySelectorAll('[data-lang]').forEach(el => {
    const check = el.querySelector('.lang-check');
    if (check) {
      check.classList.toggle('hidden', el.dataset.lang !== currentLang);
    }
  });
  
  // Actualizar texto del botón
  const button = document.getElementById('language-toggle');
  if (button) {
    const text = currentLang === 'es' ? 'IDIOMA' : 'LANGUAGE';
    const span = button.querySelector('span:first-child');
    if (span) span.textContent = text;
  }
}

// Cambiar idioma
function changeLanguage(lang) {
  const combo = document.querySelector(".goog-te-combo");
  
  if (combo) {
    combo.value = lang;
    combo.dispatchEvent(new Event("change"));
    document.cookie = `googtrans=/es/${lang}; path=/;`;
    document.cookie = `googtrans=/es/${lang}; path=/; domain=${window.location.hostname};`;
    updateUI();
  } else {
    // Si no está el combo, recargar la página
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
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
  
  // Inicializar interfaz
  updateUI();
  
  // Cargar Google Translate después de un pequeño retraso
  setTimeout(loadGoogleTranslate, 100);
});

// Hacer funciones disponibles globalmente
window.changeLanguage = changeLanguage;
