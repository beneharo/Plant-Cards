let deck = [];
let startX = 0; // 👈 RESTAURADA: Necesaria para el swipe
const BUFFER_SIZE = 5;

const card = document.getElementById("card");
const img = document.getElementById("plantImage");
const common = document.getElementById("commonName");
const scientific = document.getElementById("scientificName");
const button = document.getElementById("nextBtn");

async function fetchCanarianPlant() {
  const sparql = `
    SELECT ?item ?itemLabel ?scientificName ?image WHERE {
      ?item wdt:P31 wd:Q756; wdt:P131 wd:Q40188.
      ?item wdt:P225 ?scientificName.
      ?item wdt:P18 ?image.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
    } LIMIT 50
  `;
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.results.bindings.map(b => ({
      nombre_comun: b.itemLabel.value,
      nombre_cientifico: b.scientificName.value,
      foto: b.image.value.replace("http:", "https:") 
    }));
  } catch (e) { console.error("Error fetching:", e); return []; }
}

async function ensureBuffer() {
  if (deck.length < BUFFER_SIZE) {
    const newPlants = await fetchCanarianPlant();
    // Mezclamos y añadimos al deck
    deck = [...deck, ...newPlants.sort(() => Math.random() - 0.5)];
  }
}

async function loadPlant() {
  await ensureBuffer();
  
  // 🛡️ PROTECCIÓN: Si el deck sigue vacío, no intentamos acceder a propiedades
  if (deck.length === 0) {
    console.warn("No hay plantas disponibles en el buffer.");
    return;
  }

  const plant = deck.shift();
  
  img.style.opacity = 0;
  
  const tempImg = new Image();
  tempImg.src = plant.foto;
  
  tempImg.onload = () => {
    img.src = plant.foto;
    common.textContent = plant.nombre_comun;
    scientific.textContent = plant.nombre_cientifico;
    img.style.opacity = 1;
  };
  
  ensureBuffer();
}

// Eventos
button.addEventListener("click", loadPlant);

card.addEventListener("pointerdown", e => {
  startX = e.clientX;
});

card.addEventListener("pointerup", e => {
  if (startX - e.clientX > 100) { // Swipe izquierda
    loadPlant();
  }
});

// Inicialización
loadPlant();
