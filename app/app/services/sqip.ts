import colors from "colors";
import type { Stats } from "fs";
import fsPromise from "fs/promises";
import path from "path";
import type { SqipResult } from "sqip";
import { sqip } from "sqip";
import { downloadImage } from "./imageDownloadService";
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

async function optionalHentSvg(photoId: string): Promise<Buffer | undefined> {
  return await fsPromise.readFile(
    `${path.dirname(__dirname)}/public/images/${photoId}.png`
  );
}

async function optionalHentMetadata(
  photoId: string
): Promise<string | undefined> {
  try {
    return await fsPromise.readFile(
      `${path.dirname(__dirname)}/public/metadata/${photoId}.json`,
      "utf-8"
    );
  } catch (error) {
    return Promise.resolve(undefined);
  }
}

export async function fetchFromUnsplashAndRunThroughSqip(photoId: string) {
  const metadataFinnesFraFor = await optionalHentMetadata(photoId);

  if (metadataFinnesFraFor) return JSON.parse(metadataFinnesFraFor);

  log.success(`Søker etter bilder av: ${photoId}`);
  const unsplashResponse = await getPhotoById(photoId);

  const destUrl = (unsplashResponse?.response?.urls.raw ?? "") + ".png";
  const nedlastetBildePath = `${path.dirname(
    __dirname
  )}/public/images/${photoId}.png`;
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
  )}/public/images/${photoId}.svg`;
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
  const jsonResult = {
    originalStorrelse,
    nyStorrelse: nyStorrelse.toFixed(10),
    prosentSpart,
    nedlastetBildePath: path.join("images", path.basename(nedlastetBildePath)),
    resultatSvgPath: path.join("images", path.basename(resultatSvgPath)),
  };
  await fsPromise.writeFile(
    `${path.dirname(__dirname)}/public/metadata/${photoId}.json`,
    JSON.stringify(jsonResult)
  );
  return jsonResult;
}