// ─────────────────────────────────────────────
//  ESTADO GLOBAL
// ─────────────────────────────────────────────
let deck     = [];
let seen     = new Set();   // nombres científicos ya mostrados
let startX   = 0;
let isLoading = false;

const card       = document.getElementById("card");
const img        = document.getElementById("plantImage");
const common     = document.getElementById("commonName");
const scientific = document.getElementById("scientificName");
const button     = document.getElementById("nextBtn");

// ─────────────────────────────────────────────
//  FUENTE 1: WIKIDATA
//  - Busca plantas endémicas/nativas de Canarias
//    usando tres propiedades distintas para ampliar
//    el catálogo (P183 = nativa de, P9714 = rango
//    nativo, P131 = ubicación administrativa).
//  - ORDER BY RAND() garantiza resultados distintos
//    en cada llamada → sin caché de resultados.
// ─────────────────────────────────────────────
async function getWikidata() {
    const sparql = `
    SELECT DISTINCT ?item ?itemLabel ?sciName ?image WHERE {
      ?item wdt:P31 wd:Q756 ;
            wdt:P225 ?sciName ;
            wdt:P18  ?image .
      {
        { ?item wdt:P183  wd:Q40188   }   # endémica de Canarias
        UNION
        { ?item wdt:P183  wd:Q2367225 }   # endémica de Macaronesia
        UNION
        { ?item wdt:P9714 wd:Q40188   }   # rango nativo: Canarias
        UNION
        { ?item wdt:P131  wd:Q40188   }   # ubicada en Canarias
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    ORDER BY RAND()
    LIMIT 60`;

    const url = "https://query.wikidata.org/sparql?query="
        + encodeURIComponent(sparql) + "&format=json";

    try {
        const res = await fetch(url, {
            headers: { "Accept": "application/sparql-results+json" },
            cache: "no-store"   // evita que el navegador devuelva la respuesta cacheada
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.results.bindings
            .filter(b => b.image && b.sciName)
            .map(b => ({
                common: b.itemLabel.value,
                sci:    b.sciName.value,
                img:    b.image.value.replace("http://", "https://"),
                source: "Wikimedia"
            }));
    } catch (e) {
        console.warn("Wikidata error:", e);
        return [];
    }
}

// ─────────────────────────────────────────────
//  FUENTE 2: iNATURALIST
//  - place_id 7155  = Islas Canarias
//  - taxon_id 47126 = Plantae
//  - Página aleatoria entre 1 y 8 → hasta ~400
//    especies distintas en rotación.
// ─────────────────────────────────────────────
async function getINaturalist() {
    const page = Math.floor(Math.random() * 8) + 1;
    const url  = "https://api.inaturalist.org/v1/observations/species_counts"
        + `?place_id=7155&taxon_id=47126&per_page=50&page=${page}`;

    try {
        const res  = await fetch(url, { cache: "no-store" });
        if (!res.ok) return [];
        const data = await res.json();
        return data.results
            .filter(r => r.taxon.default_photo?.medium_url)
            .map(r => ({
                common: r.taxon.preferred_common_name || r.taxon.name,
                sci:    r.taxon.name,
                img:    r.taxon.default_photo.medium_url,
                source: "iNaturalist"
            }));
    } catch (e) {
        console.warn("iNaturalist error:", e);
        return [];
    }
}

// ─────────────────────────────────────────────
//  CARGA Y MEZCLA
// ─────────────────────────────────────────────
async function loadNewDeck() {
    if (isLoading) return;
    isLoading = true;

    common.textContent     = "Buscando flores…";
    scientific.textContent = "Consultando Wikimedia e iNaturalist…";

    // Ambas peticiones en paralelo
    const [wikiPlants, iNatPlants] = await Promise.all([
        getWikidata(),
        getINaturalist()
    ]);

    // Combinar, deduplicar por nombre científico y mezclar
    const combined = [...wikiPlants, ...iNatPlants];
    const unique   = Array.from(
        new Map(combined.map(p => [p.sci, p])).values()
    );
    deck = unique.sort(() => Math.random() - 0.5);

    isLoading = false;

    if (deck.length === 0) {
        common.textContent     = "Sin conexión";
        scientific.textContent = "Reintentando en 5 s…";
        setTimeout(loadNewDeck, 5000);
    } else {
        renderNextPlant();
    }
}

// ─────────────────────────────────────────────
//  RENDERIZADO DE CARTA
//  - Filtra las ya vistas (Set `seen`).
//  - Cuando se agotan las plantas frescas limpia
//    el historial y recarga un deck nuevo.
//  - Añade cachebuster a la URL de imagen para
//    que el navegador no sirva una copia cacheada.
// ─────────────────────────────────────────────
function renderNextPlant() {
    // Solo plantas que no hemos mostrado todavía
    const fresh = deck.filter(p => !seen.has(p.sci));

    if (fresh.length === 0) {
        // Agotamos la variedad disponible → resetear y recargar
        seen.clear();
        loadNewDeck();
        return;
    }

    // Elegir una al azar entre las frescas
    const idx   = Math.floor(Math.random() * fresh.length);
    const plant = fresh[idx];

    // Marcar como vista y retirar del deck
    seen.add(plant.sci);
    deck = deck.filter(p => p !== plant);

    // Cachebuster: añade ?_cb=<timestamp> para forzar nueva petición
    const separator = plant.img.includes("?") ? "&" : "?";
    const imgUrl    = plant.img + separator + "_cb=" + Date.now();

    img.style.opacity = 0;

    const tempImg = new Image();
    tempImg.src = imgUrl;

    tempImg.onload = () => {
        img.src               = imgUrl;
        common.textContent    = plant.common;
        scientific.textContent = plant.sci;
        img.style.opacity     = 1;
        card.classList.remove("flipped");
    };

    // Si la imagen falla, pasar a la siguiente sin mostrar nada roto
    tempImg.onerror = () => renderNextPlant();
}

// ─────────────────────────────────────────────
//  EVENTOS
// ─────────────────────────────────────────────
button.addEventListener("click", () => {
    if (!isLoading) renderNextPlant();
});

card.addEventListener("pointerdown", e => {
    startX = e.clientX;
});

card.addEventListener("pointerup", e => {
    const delta = Math.abs(startX - e.clientX);
    if (delta > 50) {
        renderNextPlant();           // swipe → siguiente planta
    } else {
        card.classList.toggle("flipped");  // tap → girar carta
    }
});

// ─────────────────────────────────────────────
//  ARRANCAR
// ─────────────────────────────────────────────
loadNewDeck();
