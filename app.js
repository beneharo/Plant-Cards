let deck = [];
const BUFFER_SIZE = 5; // Mantendremos siempre 5 plantas precargadas

// Elementos DOM
const card = document.getElementById("card");
const img = document.getElementById("plantImage");
const common = document.getElementById("commonName");
const scientific = document.getElementById("scientificName");
const button = document.getElementById("nextBtn");

// 1. Obtener datos de Wikidata (Flora Canaria)
async function fetchCanarianPlant() {
  // Consulta optimizada: pide imagen, etiqueta y descripción científica
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
      foto: b.image.value.replace("http:", "https:") // Asegurar HTTPS
    }));
  } catch (e) { console.error(e); return []; }
}

// 2. Sistema de precarga y buffer
async function ensureBuffer() {
  if (deck.length < BUFFER_SIZE) {
    const newPlants = await fetchCanarianPlant();
    deck = [...deck, ...newPlants.sort(() => Math.random() - 0.5)];
  }
}

// 3. Carga eficiente de imagen con Web Image API
async function loadPlant() {
  await ensureBuffer();
  const plant = deck.shift();
  
  // Pre-renderizamos en memoria antes de mostrar
  const tempImg = new Image();
  tempImg.src = plant.foto;
  
  tempImg.onload = () => {
    img.style.opacity = 0;
    setTimeout(() => {
      img.src = plant.foto;
      common.textContent = plant.nombre_comun;
      scientific.textContent = plant.nombre_cientifico;
      img.style.opacity = 1;
    }, 200);
  };
  
  // Recargar buffer silenciosamente
  ensureBuffer();
}

// Eventos
button.addEventListener("click", loadPlant);

card.addEventListener("pointerup", e => {
  if (e.clientX - startX > 100) loadPlant();
});

// Inicialización
loadPlant();
