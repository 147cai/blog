import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src/assets/images/avatar.jpg");
const outDir = path.join(root, "public/favicon");
const sizes = [32, 128, 180, 192];

for (const size of sizes) {
  const out = path.join(outDir, `favicon-avatar-${size}.png`);
  await sharp(src)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png()
    .toFile(out);
  console.log("generated", out);
}
