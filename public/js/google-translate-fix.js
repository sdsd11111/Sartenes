// Global functions for language management
window.changeLanguage = function(lang) {
  if (!lang) return;
  
  console.log(`=== changeLanguage called with lang: ${lang} ===`);
  
  // Save language preference
  localStorage.setItem('preferredLanguage', lang);
  document.documentElement.lang = lang;
  
  // Try to use Google Translate if available
  const combo = document.querySelector('.goog-te-combo');
  if (combo && combo.value !== lang) {
    try {
      combo.value = lang;
      combo.dispatchEvent(new Event('change'));
      console.log('Changed language via Google Translate combo');
    } catch (e) {
      console.error('Error changing language via Google Translate:', e);
    }
  } else if (!combo) {
    console.warn('Google Translate combo not found! Widget may not have loaded.');
  }
  
  // Update UI
  updateUI(lang);
  
  // Fallback: Set cookie for page reloads
  document.cookie = `googtrans=/es/${lang}; path=/; max-age=31536000`;
  
  // Update URL without page reload
  const url = new URL(window.location.href);
  if (url.searchParams.get('hl') !== lang) {
    url.searchParams.set('hl', lang);
    window.history.replaceState({}, '', url);
  }
};

// Get current language
function getCurrentLang() {
  // Check URL first
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('hl');
  if (urlLang) return urlLang;
  
  // Then check localStorage
  const storedLang = localStorage.getItem('preferredLanguage');
  if (storedLang) return storedLang;
  
  // Default to Spanish
  return 'es';
}

// Update UI elements based on current language
function updateUI(lang) {
  if (!lang) return;
  
  // Update language toggle button text
  const toggleBtn = document.getElementById('language-toggle');
  if (toggleBtn) {
    const text = lang === 'es' ? 'IDIOMA' : 'LANGUAGE';
    const span = toggleBtn.querySelector('span:first-child');
    if (span) span.textContent = text;
  }
  
  // Update language selection checkmarks
  document.querySelectorAll('[data-lang]').forEach(el => {
    const buttonLang = el.getAttribute('data-lang') || el.dataset.lang;
    const check = el.querySelector('.lang-check');
    if (check) {
      check.classList.toggle('hidden', buttonLang !== lang);
    }
  });
  
  console.log(`UI updated to language: ${lang}`);
}

// Hide Google Translate UI elements
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
    '.goog-te-ftab-link',
    '.goog-te-combo',
    '.goog-te-spinner',
    '.goog-te-spinner-pos'
  ];

  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
        el.style.position = 'absolute';
        el.style.width = '1px';
        el.style.height = '1px';
        el.style.overflow = 'hidden';
        el.style.clip = 'rect(0, 0, 0, 0)';
        el.style.whiteSpace = 'nowrap';
      }
    });
  });
}

// Set up language switcher
function setupLanguageSwitcher() {
  // Set up language buttons
  document.querySelectorAll('[data-lang]').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const lang = this.getAttribute('data-lang');
      if (lang) {
        changeLanguage(lang);
        // Close menu after selection
        const menu = document.getElementById('menuLang');
        if (menu) menu.classList.add('hidden');
      }
    });
  });
}

// Initialize when DOM is ready
function initialize() {
  // Set initial language
  const currentLang = getCurrentLang();
  updateUI(currentLang);
  
  // Set up language switcher
  setupLanguageSwitcher();
  
  // Set up menu toggle
  const toggleBtn = document.getElementById('language-toggle');
  const langMenu = document.getElementById('menuLang');
  
  if (toggleBtn && langMenu) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langMenu.classList.toggle('hidden');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!langMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
        langMenu.classList.add('hidden');
      }
    });
  }
  
  // Hide Google elements periodically
  setInterval(hideGoogleElements, 1000);
  
  // Initial hide
  hideGoogleElements();
  
  console.log('Language switcher initialized');
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
