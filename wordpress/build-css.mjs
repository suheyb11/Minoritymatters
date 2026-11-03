// Builds the theme's stylesheet: minority-matters/assets/css/src.css -> minority-matters/assets/css/app.css
// Run it from the project folder after changing classes in the theme: node wordpress/build-css.mjs
// (It uses the Tailwind CSS that the Next.js project already installs; app.css is uploaded with the theme.)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const folder = path.join(path.dirname(fileURLToPath(import.meta.url)), "minority-matters", "assets", "css");
const from = path.join(folder, "src.css");
const to = path.join(folder, "app.css");

const result = await postcss([tailwind({ optimize: { minify: true } })]).process(fs.readFileSync(from, "utf8"), { from, to });
fs.writeFileSync(to, result.css);
console.log(`Saved ${path.relative(process.cwd(), to)} (${Math.round(result.css.length / 1024)} KB)`);
