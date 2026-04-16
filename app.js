let plants = [];
let deck = [];
let currentIndex = 0;

// DOM
const card = document.getElementById("card");
const img = document.getElementById("plantImage");
const common = document.getElementById("commonName");
const scientific = document.getElementById("scientificName");
const button = document.getElementById("nextBtn");

// estado swipe
let startX = 0;

// 🧠 CACHE de imágenes (evita recargas)
const imageCache = new Map();

// 📦 1. LOAD CSV (rápido, sin overhead)
fetch("plants.csv")
  .then(res => res.text())
  .then(text => {
    plants = parseCSV(text);

    // 🔥 2. shuffle deck inicial
    deck = shuffle([...plants]);

    // 🔥 3. preload inicial (primer bloque)
    preloadBatch(0, 15);

    showPlant();
  });

// ⚡ CSV parser ultra ligero
function parseCSV(text) {
  const lines = text.split("\n");
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const parts = line.split(",");
    if (parts.length < 3) continue;

    result.push({
      foto: parts[0],
      nombre_comun: parts[1],
      nombre_cientifico: parts[2]
    });
  }

  return result;
}

// 🔀 shuffle tipo Fisher-Yates (MUY importante para rendimiento)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 🖼️ preload inteligente
function preloadImage(url) {
  if (imageCache.has(url)) return;

  const im = new Image();
  im.src = url;
  imageCache.set(url, im);
}

// 📦 preload por lotes (4. mejora clave)
function preloadBatch(start, size) {
  for (let i = start; i < start + size && i < deck.length; i++) {
    preloadImage(deck[i].foto);
  }
}

// 🎴 mostrar planta actual
function showPlant() {
  if (currentIndex >= deck.length) {
    deck = shuffle([...plants]);
    currentIndex = 0;
  }

  const plant = deck[currentIndex];

  // preload siguiente lote automáticamente
  preloadBatch(currentIndex + 1, 10);

  loadPlant(plant);
}

// 🖼️ carga optimizada
function loadPlant(plant) {
  const url = plant.foto;

  img.style.opacity = 0;

  const cached = imageCache.get(url);

  if (cached && cached.complete) {
    applyPlant(plant);
  } else {
    const temp = new Image();

    temp.onload = () => {
      imageCache.set(url, temp);
      applyPlant(plant);
    };

    temp.src = url;
  }
}

// 🧠 render mínimo (evita reflows)
function applyPlant(plant) {
  img.src = plant.foto;
  common.textContent = plant.nombre_comun;
  scientific.textContent = plant.nombre_cientifico;

  requestAnimationFrame(() => {
    img.style.opacity = 1;
  });

  card.classList.remove("flipped");
}

// 👉 siguiente carta
function nextPlant() {
  currentIndex++;
  showPlant();
}

// 👆 flip
card.addEventListener("click", () => {
  card.classList.toggle("flipped");
});

// 👉 swipe (robusto iOS)
card.addEventListener("pointerdown", e => {
  startX = e.clientX;
});

card.addEventListener("pointerup", e => {
  if (e.clientX - startX > 100) {
    nextPlant();
  }
});

// 🔘 botón
button.addEventListener("click", nextPlant);
