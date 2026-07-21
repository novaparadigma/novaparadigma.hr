import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const images = [
  // Immagini principali e hero:
  { file: "about-main.png", width: 1920, quality: 82 },
  { file: "book-main.png", width: 1920, quality: 82 },
  { file: "contact-main.png", width: 1920, quality: 82 },
  { file: "hero-main.png", width: 1920, quality: 82 },
  { file: "payment-main.png", width: 1920, quality: 82 },
  { file: "program-main.png", width: 1920, quality: 82 },
  { file: "put-main.png", width: 1920, quality: 82 },
  { file: "raspored-main.png", width: 1920, quality: 82 },

  // Banner:
  { file: "book-banner.png", width: 1600, quality: 80 },
  { file: "contact-banner.png", width: 1600, quality: 80 },
  { file: "program-banner.png", width: 1600, quality: 80 },
  { file: "put-banner.png", width: 1600, quality: 80 },
  { file: "raspored-banner.png", width: 1600, quality: 80 },

  // Immagini interne e illustrazioni:
  { file: "about-compass.png", width: 1400, quality: 82 },
  { file: "about-marco.png", width: 1400, quality: 82 },
  { file: "book-postcards.png", width: 1400, quality: 82 },
  { file: "book-symbols.png", width: 1400, quality: 82 },
  { file: "hero-forest.png", width: 1600, quality: 82 },
  { file: "program-flexible-illustration.png", width: 1400, quality: 82 },
  { file: "raspored-structure-illustration.png", width: 1400, quality: 82 },
];

const sectionsDirectory = "public/images/sections";
const openGraphInput = "public/images/ui/open-graph.png";
const openGraphOutput = "public/images/ui/open-graph.webp";

let originalTotal = 0;
let optimizedTotal = 0;

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  return `${Math.round(bytes / 1024)} KB`;
}

function percentageSaved(original, optimized) {
  return ((1 - optimized / original) * 100).toFixed(1);
}

async function optimizeSectionImage({ file, width, quality }) {
  const input = path.join(sectionsDirectory, file);
  const parsedName = path.parse(file);
  const output = path.join(
    sectionsDirectory,
    `${parsedName.name}.webp`,
  );

  const originalStats = await fs.stat(input);

  const result = await sharp(input)
    .resize({
      width,
      withoutEnlargement: true,
    })
    .webp({
      quality,
      effort: 6,
    })
    .toFile(output);

  originalTotal += originalStats.size;
  optimizedTotal += result.size;

  console.log(
    `${file.padEnd(38)} ${formatSize(originalStats.size).padStart(9)} → ${formatSize(result.size).padStart(9)}  (-${percentageSaved(originalStats.size, result.size)}%)`,
  );
}

async function optimizeOpenGraph() {
  try {
    const originalStats = await fs.stat(openGraphInput);

    const result = await sharp(openGraphInput)
      .resize({
        width: 1200,
        height: 630,
        fit: "cover",
        withoutEnlargement: true,
      })
      .webp({
        quality: 82,
        effort: 6,
      })
      .toFile(openGraphOutput);

    originalTotal += originalStats.size;
    optimizedTotal += result.size;

    console.log(
      `${"ui/open-graph.png".padEnd(38)} ${formatSize(originalStats.size).padStart(9)} → ${formatSize(result.size).padStart(9)}  (-${percentageSaved(originalStats.size, result.size)}%)`,
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("\nopen-graph.png non trovato: file saltato.");
      return;
    }

    throw error;
  }
}

async function run() {
  console.log("\nOttimizzazione immagini NOvA\n");

  for (const image of images) {
    try {
      await optimizeSectionImage(image);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.error(`File non trovato: ${image.file}`);
        continue;
      }

      throw error;
    }
  }

  await optimizeOpenGraph();

  console.log("\nTotale");
  console.log(`${formatSize(originalTotal)} → ${formatSize(optimizedTotal)}`);
  console.log(
    `Risparmio complessivo: ${percentageSaved(originalTotal, optimizedTotal)}%`,
  );
  console.log("\nGli originali PNG non sono stati modificati.");
}

run().catch((error) => {
  console.error("\nErrore durante l’ottimizzazione:");
  console.error(error);
  process.exit(1);
});