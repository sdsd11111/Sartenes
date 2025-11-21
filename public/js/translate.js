function loadGoogleTranslate() {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.translate) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;

        script.onload = resolve;
        script.onerror = reject;

        document.body.appendChild(script);
    });
}

function googleTranslateElementInit() {
    if (!window.googleTranslateLoaded) {
        new google.translate.TranslateElement({
            pageLanguage: "es",
            includedLanguages: "en,es",
            autoDisplay: false
        }, "google_translate_element");

        window.googleTranslateLoaded = true;
    }
}

// Initialize on page load
window.addEventListener("load", async () => {
    try {
        await loadGoogleTranslate();
        // Set default language to Spanish
        setTimeout(() => changeLang('es'), 1000);
    } catch (e) {
        console.error("Error loading Google Translate:", e);
    }
});

// Function to change language
function changeLang(lang) {
    const select = document.querySelector("select.goog-te-combo");
    if (!select) {
        console.log("Google Translate not loaded yet, retrying...");
        // Try to initialize again if not loaded
        if (window.google && window.google.translate) {
            googleTranslateElementInit();
            // Try again after a short delay
            setTimeout(() => changeLang(lang), 500);
        }
        return;
    }

    select.value = lang;
    select.dispatchEvent(new Event("change"));
    
    // Update URL with language parameter for persistence
    const url = new URL(window.location.href);
    url.searchParams.set('hl', lang);
    window.history.replaceState({}, '', url);
}
