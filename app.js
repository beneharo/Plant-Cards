// Configuración y Estado
let deck = [];
let startX = 0;
let isFetching = false;

const card = document.getElementById("card");
const img = document.getElementById("plantImage");
const common = document.getElementById("commonName");
const scientific = document.getElementById("scientificName");
const button = document.getElementById("nextBtn");

/**
 * 1. Obtiene plantas de Wikidata. 
 * Filtra por: Taxon de planta, ubicada en Canarias (recursivo), con imagen y nombre científico.
 */
async function fetchPlantsFromWikidata() {
    if (isFetching) return [];
    isFetching = true;

    const sparql = `
    SELECT DISTINCT ?item ?itemLabel ?sciName ?image WHERE {
      ?item wdt:P31 wd:Q756 ;                 # Es una planta
            wdt:P131* wd:Q40188 ;             # Ubicada en Islas Canarias (recursivo)
            wdt:P225 ?sciName ;               # Tiene nombre científico
            wdt:P18 ?image .                  # Tiene imagen
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    } LIMIT 150`;

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;

    try {
        const res = await fetch(url, { headers: { 'Accept': 'application/sparql-results+json' } });
        const data = await res.json();
        isFetching = false;
        
        // Mapeamos y mezclamos aleatoriamente
        return data.results.bindings.map(b => ({
            nombre_comun: b.itemLabel.value,
            nombre_cientifico: b.sciName.value,
            foto: b.image.value.replace("http://", "https://")
        })).sort(() => Math.random() - 0.5);
    } catch (e) {
        console.error("Error en la API de Wikidata:", e);
        isFetching = false;
        return [];
    }
}

/**
 * 2. Gestiona el mazo (deck) para que nunca esté vacío.
 */
async function getNextPlant() {
    if (deck.length === 0) {
        // Si el mazo está vacío, esperamos a que el fetch termine
        common.textContent = "Buscando flora canaria...";
        deck = await fetchPlantsFromWikidata();
    }
    
    if (deck.length === 0) return null;

    // Si quedan pocas plantas, cargamos más en segundo plano (background)
    if (deck.length < 5 && !isFetching) {
        fetchPlantsFromWikidata().then(newItems => {
            deck = [...deck, ...newItems];
        });
    }

    return deck.shift();
}

/**
 * 3. Renderizado optimizado con pre-carga de imagen.
 */
async function loadPlant() {
    const plant = await getNextPlant();

    if (!plant) {
        common.textContent = "Error de conexión";
        scientific.textContent = "Inténtalo de nuevo en unos segundos.";
        return;
    }

    // Efecto visual de carga
    img.style.opacity = 0;

    const tempImg = new Image();
    tempImg.src = plant.foto;

    // Solo actualizamos el DOM cuando la imagen esté lista en memoria
    tempImg.onload = () => {
        img.src = plant.foto;
        common.textContent = plant.nombre_comun;
        scientific.textContent = plant.nombre_cientifico;
        
        requestAnimationFrame(() => {
            img.style.opacity = 1;
        });
        
        card.classList.remove("flipped");
    };

    // Si la imagen falla (link roto en Commons), pasamos a la siguiente automáticamente
    tempImg.onerror = () => {
        console.warn("Imagen rota para:", plant.nombre_cientifico, "saltando...");
        loadPlant();
    };
}

// 4. Controladores de Eventos (Fix startX y Swipe)
button.addEventListener("click", loadPlant);

card.addEventListener("pointerdown", e => {
    startX = e.clientX;
});

card.addEventListener("pointerup", e => {
    const endX = e.clientX;
    const diff = startX - endX;

    // Swipe de al menos 100px
    if (Math.abs(diff) > 100) {
        loadPlant();
    } else {
        // Si es un toque corto, giramos la carta
        card.classList.toggle("flipped");
    }
});

// Inicialización
loadPlant();
