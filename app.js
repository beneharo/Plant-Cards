let deck = [];
let startX = 0;
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
    if (!data.results?.bindings) return [];
    
    return data.results.bindings.map(b => ({
      nombre_comun: b.itemLabel?.value || "Nombre desconocido",
      nombre_cientifico: b.scientificName?.value || "N/A",
      foto: b.image?.value.replace("http:", "https:")
    }));
  } catch (e) { 
    console.error("Error en conexión:", e); 
    return []; 
  }
}

async function ensureBuffer() {
  if (deck.length === 0) {
    const newPlants = await fetchCanarianPlant();
    if (newPlants.length > 0) {
      deck = [...newPlants.sort(() => Math.random() - 0.5)];
    }
  }
}

async function loadPlant() {
  // 1. Asegurar que tenemos datos
  await ensureBuffer();
  
  // 2. Si después de intentar cargar, deck sigue vacío, salimos
  if (deck.length === 0) {
    console.warn("No se pudieron cargar datos de la API.");
    return;
  }

  const plant = deck.shift();
  
  // 3. Validación extra: asegurar que la planta tiene foto
  if (!plant.foto) {
    console.warn("Planta sin foto, saltando...");
    loadPlant();
    return;
  }

  img.style.opacity = 0;
  
  const tempImg = new Image();
  tempImg.src = plant.foto;
  
  tempImg.onload = () => {
    img.src = plant.foto;
    common.textContent = plant.nombre_comun;
    scientific.textContent = plant.nombre_cientifico;
    img.style.opacity = 1;
  };
  
  tempImg.onerror = () => {
    console.warn("Imagen rota, intentando siguiente...");
    loadPlant();
  };
  
  ensureBuffer();
}

// Eventos
button.addEventListener("click", loadPlant);
card.addEventListener("pointerdown", e => startX = e.clientX);
card.addEventListener("pointerup", e => {
  if (startX - e.clientX > 100) loadPlant();
});

// Inicialización
loadPlant();
