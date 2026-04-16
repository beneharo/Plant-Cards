let plants = [];
let current = null;

// ELEMENTOS
const card = document.getElementById("card");
const img = document.getElementById("plantImage");
const common = document.getElementById("commonName");
const scientific = document.getElementById("scientificName");

let startX = 0;

const button = document.getElementById("nextBtn");

button.addEventListener("click", () => {
  nextPlant();
});

// 📦 CARGAR CSV
fetch("plants.csv")
  .then(res => res.text())
  .then(text => {
    plants = parseCSV(text);
    nextPlant();
  })
  .catch(err => console.error("Error CSV:", err));

function parseCSV(text) {
  const lines = text.trim().split("\n").slice(1);

  return lines.map(line => {
    const [foto, nombre_comun, nombre_cientifico, familia] = line.split(",");

    return {
      foto: foto?.trim(),
      nombre_comun: nombre_comun?.trim(),
      nombre_cientifico: nombre_cientifico?.trim(),
      familia: familia?.trim()
    };
  });
}

// 🖼️ CARGA CON PRELOAD
function loadPlant(plant) {
  const preImg = new Image();

  img.style.opacity = 0;

  preImg.onload = () => {
    img.src = plant.foto;
    common.textContent = plant.nombre_comun;
    scientific.textContent = plant.nombre_cientifico;

    img.style.opacity = 1;

    card.classList.remove("flipped");
  };

  preImg.src = plant.foto;
}

// 🔀 NUEVA PLANTA
function nextPlant() {
  if (!plants.length) return;

  const index = Math.floor(Math.random() * plants.length);
  current = plants[index];

  loadPlant(current);
}

// 👆 FLIP
card.addEventListener("click", () => {
  card.classList.toggle("flipped");
});

// 👉 SWIPE (opcional, mejorado pero NO crítico)
card.addEventListener("pointerdown", (e) => {
  startX = e.clientX;
});

card.addEventListener("pointerup", (e) => {
  const diff = e.clientX - startX;

  if (diff > 100) {
    nextPlant();
  }
});

// 🔘 BOTÓN "OTRA" (la parte importante)
button.addEventListener("click", () => {
  nextPlant();
});

// 🚀 INIT
