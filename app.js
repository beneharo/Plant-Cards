let plants = [];
let current = null;

const card = document.getElementById("card");
const img = document.getElementById("plantImage");
const common = document.getElementById("commonName");
const scientific = document.getElementById("scientificName");

// Cargar CSV
fetch("plantas.csv")
  .then(res => res.text())
  .then(text => {
    const rows = text.trim().split("\n").slice(1);
    plants = rows.map(r => {
      const [foto, nombre_comun, nombre_cientifico] = r.split(",");
      return { foto, nombre_comun, nombre_cientifico };
    });

    showRandom();
  });

function showRandom() {
  const index = Math.floor(Math.random() * plants.length);
  current = plants[index];

  // Esperar a que la imagen se cargue completamente
  img.onload = () => {
    common.textContent = current.nombre_comun;
    scientific.textContent = current.nombre_cientifico;
    card.classList.remove("flipped");
  };

  img.src = current.foto;
}

// Flip al tocar
card.addEventListener("click", () => {
  card.classList.toggle("flipped");
});

// Swipe detection
let startX = 0;

card.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

card.addEventListener("touchend", e => {
  let endX = e.changedTouches[0].clientX;

  if (endX - startX > 80) {
    // swipe derecha
    showRandom();
  }
});