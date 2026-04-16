let plants = [];
let current = null;

// ELEMENTOS
const card = document.getElementById("card");
const img = document.getElementById("plantImage");
const common = document.getElementById("commonName");
const scientific = document.getElementById("scientificName");

let startX = 0;

// 🔥 CARGA CSV (más robusto)
fetch("plants.csv")
  .then(res => res.text())
  .then(text => {
    plants = parseCSV(text);
    nextPlant();
  })
  .catch(err => {
    console.error("Error cargando CSV:", err);
  });

/**
 * 🧠 Parser simple de CSV (sin librerías)
 */
function parseCSV(text) {
  const lines = text.trim().split("\n").slice(1);

  return lines.map(line => {
    const [foto, nombre_comun, nombre_cientifico] = line.split(",");

    return {
      foto: foto.trim(),
      nombre_comun: nombre_comun.trim(),
      nombre_cientifico: nombre_cientifico.trim()
    };
  });
}

/**
 * 🖼️ CARGAR PLANTA CON PRELOAD (clave)
 */
function loadPlant(plant) {
  const preImg = new Image();

  // ocultar mientras carga
  img.style.opacity = 0;

  preImg.onload = () => {
    img.src = plant.foto;
    common.textContent = plant.nombre_comun;
    scientific.textContent = plant.nombre_cientifico;

    // mostrar SOLO cuando está lista
    img.style.opacity = 1;

    card.classList.remove("flipped");
  };

  preImg.src = plant.foto;
}

/**
 * 🔀 PLANTA ALEATORIA
 */
function nextPlant() {
  if (!plants.length) return;

  const index = Math.floor(Math.random() * plants.length);
  current = plants[index];

  loadPlant(current);
}

/**
 * 👆 FLIP al tocar
 */
card.addEventListener("click", () => {
  card.classList.toggle("flipped");
});

/**
 * 👉 SWIPE DERECHO (pointer events = iOS OK)
 */
card.addEventListener("pointerdown", (e) => {
  startX = e.clientX;
});

card.addEventListener("pointerup", (e) => {
  const diff = e.clientX - startX;

  // swipe derecha
  if (diff > 80) {
    nextPlant();
  }
});
