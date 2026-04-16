let deck = [];
let startX = 0;
let isLoading = false;

const card = document.getElementById("card");
const img = document.getElementById("plantImage");
const common = document.getElementById("commonName");
const scientific = document.getElementById("scientificName");
const button = document.getElementById("nextBtn");

/**
 * FUENTE 1: WIKIDATA (Wikimedia)
 */
async function getWikidata() {
    const sparql = `
    SELECT DISTINCT ?item ?itemLabel ?sciName ?image WHERE {
      ?item wdt:P31 wd:Q756 ; wdt:P131 wd:Q40188 ; wdt:P225 ?sciName ; wdt:P18 ?image .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    } LIMIT 50`;
    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(sparql) + "&format=json";
    
    try {
        const res = await fetch(url, { headers: { "Accept": "application/sparql-results+json" } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.results.bindings.map(b => ({
            common: b.itemLabel.value,
            sci: b.sciName.value,
            img: b.image.value.replace("http://", "https://"),
            source: "Wikimedia"
        }));
    } catch { return []; }
}

/**
 * FUENTE 2: iNATURALIST
 * Trae las especies más observadas en Canarias (ID lugar: 7155)
 */
async function getINaturalist() {
    // place_id 7155 = Islas Canarias, taxon_id 47126 = Plantas
    const url = "https://api.inaturalist.org/v1/observations/species_counts?place_id=7155&taxon_id=47126&per_page=50";
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        return data.results.map(r => ({
            common: r.taxon.preferred_common_name || r.taxon.name,
            sci: r.taxon.name,
            img: r.taxon.default_photo.medium_url,
            source: "iNaturalist"
        }));
    } catch { return []; }
}

/**
 * CARGA Y MEZCLA
 */
async function loadNewDeck() {
    if (isLoading) return;
    isLoading = true;
    
    common.textContent = "Buscando flores...";
    scientific.textContent = "Consultando Wikimedia e iNaturalist...";

    // Lanzamos ambas peticiones al mismo tiempo (más rápido)
    const [wikiPlants, iNatPlants] = await Promise.all([getWikidata(), getINaturalist()]);
    
    deck = [...wikiPlants, ...iNatPlants].sort(() => Math.random() - 0.5);
    
    isLoading = false;

    if (deck.length === 0) {
        common.textContent = "Sin conexión";
        scientific.textContent = "Reintentando...";
        setTimeout(loadNewDeck, 5000);
    } else {
        renderNextPlant();
    }
}

function renderNextPlant() {
    if (deck.length === 0) {
        loadNewDeck();
        return;
    }

    const plant = deck.shift();
    img.style.opacity = 0;

    const tempImg = new Image();
    tempImg.src = plant.img;

    tempImg.onload = () => {
        img.src = plant.img;
        common.textContent = plant.common;
        scientific.textContent = plant.sci;
        // Tip: Puedes añadir un pequeño badge que diga la fuente (plant.source)
        img.style.opacity = 1;
        card.classList.remove("flipped");
    };

    tempImg.onerror = () => renderNextPlant();
}

// Eventos
button.addEventListener("click", () => !isLoading && renderNextPlant());
card.addEventListener("pointerdown", e => startX = e.clientX);
card.addEventListener("pointerup", e => {
    if (Math.abs(startX - e.clientX) > 50) renderNextPlant();
    else card.classList.toggle("flipped");
});

// Arrancar
loadNewDeck();
