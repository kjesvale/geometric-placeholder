import colors from "colors";
import type { Stats } from "fs";
import fsPromise from "fs/promises";
import path from "path";
import type { SqipResult } from "sqip";
import { sqip } from "sqip";
import { downloadImage } from "../../../services/imageDownloadService";
import { getPhotoById } from "./unsplash";

export const log = {
  success: (message: string) => console.log(colors.green(message)),
};

function regnUtStorrelseIMB(fil: Stats): number {
  return fil.size / (1024 * 1024);
}

function regnUtBesparelseIProsent(
  original: number,
  nyStorrelse: number
): number {
  const x = original - nyStorrelse;
  return (x / original) * 100;
}

async function lagreFilTilMappe(destination: string, content: any) {
  await fsPromise.writeFile(destination, content);
}

export async function fetchFromUnsplashAndRunThroughSqip(id: string) {
  const timestamp = 0;
  log.success(`Søker etter bilder av: ${id}`);
  const unsplashResponse = await getPhotoById(id);

  const destUrl = (unsplashResponse?.response?.urls.raw ?? "") + ".png";
  const nedlastetBildePath = `${path.dirname(
    __dirname
  )}/public/images/${id}-${timestamp}.png`;
  log.success("Laster ned bilde...");
  await downloadImage(destUrl, nedlastetBildePath);
  log.success(`Bilde er lastet ned og kan sees her: ${nedlastetBildePath}`);
  const options = {
    numberOfPrimitives: 500,
    mode: 1,
    blur: 0,
  };
  log.success(
    `Kjører bilde gjennom Sqip med følgende parameter: ${JSON.stringify(
      options,
      null,
      2
    )}`
  );

  const result = (await sqip({
    input: nedlastetBildePath,
    plugins: [
      {
        name: "sqip-plugin-primitive",
        options,
      },
      "sqip-plugin-svgo",
    ],
  })) as Partial<SqipResult>;

  const resultatSvgPath = `${path.dirname(
    __dirname
  )}/public/images/${id}-${timestamp}.svg`;
  await lagreFilTilMappe(resultatSvgPath, result.content);
  log.success("Ferdig med konvertering i Sqip!");
  const original = await fsPromise.stat(nedlastetBildePath);
  const resultat = await fsPromise.stat(resultatSvgPath);

  const originalStorrelse = regnUtStorrelseIMB(original);
  const nyStorrelse = regnUtStorrelseIMB(resultat);
  log.success(`Original størrelse i MB: ${originalStorrelse.toFixed(2)}`);
  log.success(`Ny størrelse i MB: ${nyStorrelse.toFixed(10)}`);
  const prosentSpart = regnUtBesparelseIProsent(
    originalStorrelse,
    nyStorrelse
  ).toFixed(2);
  log.success(`Du har spart: ${prosentSpart}%`);
  return {
    originalStorrelse,
    nyStorrelse: nyStorrelse.toFixed(10),
    prosentSpart,
    nedlastetBildePath: path.join("images", path.basename(nedlastetBildePath)),
    resultatSvgPath: path.join("images", path.basename(resultatSvgPath)),
  };
}
