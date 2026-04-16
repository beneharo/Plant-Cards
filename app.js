/**
 * ESTADO GLOBAL
 */
let deck = [];
let startX = 0;
let isLoading = false;

// Referencias al DOM
const card = document.getElementById("card");
const img = document.getElementById("plantImage");
const common = document.getElementById("commonName");
const scientific = document.getElementById("scientificName");
const button = document.getElementById("nextBtn");

/**
 * 1. BUSCAR DATOS EN WIKIDATA
 * Trae plantas que tengan imagen y estén en Canarias.
 */
async function fetchPlants() {
    if (isLoading) return;
    isLoading = true;
    
    // Cambiamos el texto para dar feedback al usuario
    common.textContent = "Buscando en el monte...";
    scientific.textContent = "Conectando con Wikidata...";

    const sparql = `
    SELECT DISTINCT ?item ?itemLabel ?sciName ?image WHERE {
      ?item wdt:P31 wd:Q756 .                # Es una planta
      ?item wdt:P131* wd:Q40188 .            # En Islas Canarias
      ?item wdt:P225 ?sciName .              # Nombre científico
      ?item wdt:P18 ?image .                 # Tiene foto
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    } LIMIT 100`;

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const results = data.results.bindings;

        if (results.length === 0) throw new Error("No se encontraron plantas");

        // Mezclamos los resultados aleatoriamente
        deck = results.map(b => ({
            nombre_comun: b.itemLabel.value,
            nombre_cientifico: b.sciName.value,
            foto: b.image.value.replace("http://", "https://")
        })).sort(() => Math.random() - 0.5);

        isLoading = false;
        renderNextPlant(); // Una vez cargado, mostramos la primera

    } catch (error) {
        console.error("Fallo en la API:", error);
        common.textContent = "Error de conexión";
        scientific.textContent = "Reintentando en 3 segundos...";
        isLoading = false;
        setTimeout(fetchPlants, 3000);
    }
}

/**
 * 2. MOSTRAR LA SIGUIENTE PLANTA
 */
function renderNextPlant() {
    if (deck.length === 0) {
        fetchPlants();
        return;
    }

    const plant = deck.shift();

    // Iniciamos transición de salida
    img.style.opacity = 0;

    // Pre-carga de imagen para evitar parpadeos
    const tempImg = new Image();
    tempImg.src = plant.foto;

    tempImg.onload = () => {
        img.src = plant.foto;
        common.textContent = plant.nombre_comun;
        scientific.textContent = plant.nombre_cientifico;
        
        // Animación de entrada
        requestAnimationFrame(() => {
            img.style.opacity = 1;
        });
        card.classList.remove("flipped");
    };

    tempImg.onerror = () => {
        console.warn("Imagen no disponible, saltando...");
        renderNextPlant();
    };
}

/**
 * 3. EVENTOS (Botón y Swipe)
 */
button.addEventListener("click", renderNextPlant);

card.addEventListener("pointerdown", e => {
    startX = e.clientX;
});

card.addEventListener("pointerup", e => {
    const endX = e.clientX;
    const diff = startX - endX;

    if (Math.abs(diff) > 50) { // Umbral de swipe 50px
        renderNextPlant();
    } else {
        card.classList.toggle("flipped");
    }
});

// 4. ARRANCAR LA APP
fetchPlants();
