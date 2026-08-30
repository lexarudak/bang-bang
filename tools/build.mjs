// Wraps site/covers.html into a complete, standalone document for real hosting.
//
//   node tools/build.mjs                          → dist/index.html
//   node tools/build.mjs --base=https://example.ru → also writes Open Graph tags
//                                                    and dist/og.jpg for the
//                                                    Telegram link preview
//
// The output has no external dependencies beyond Google Fonts: photos, styles,
// scripts and the explosion sound all live inside the one file. Upload dist/ and
// it works.
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SRC = resolve(ROOT, "site/covers.html");
const OUT = resolve(ROOT, "dist");

const TITLE = "Мария Сокирко — врач-косметолог";
const DESC =
	"Врач-косметолог в Москве. Работа с лицом как с портретом — бережно и точно. Телеграм-канал о работе и результатах.";

const base = (process.argv.find((a) => a.startsWith("--base=")) || "").slice(7).replace(/\/$/, "");

const FAVICON =
	"data:image/svg+xml," +
	encodeURIComponent(
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
			'<rect width="32" height="32" fill="#0e0e12"/>' +
			'<circle cx="16" cy="16" r="8" fill="#ff5b3d"/></svg>',
	);

const body = await readFile(SRC, "utf8");

const og = base
	? [
			`<meta property="og:type" content="website">`,
			`<meta property="og:url" content="${base}/">`,
			`<meta property="og:title" content="${TITLE}">`,
			`<meta property="og:description" content="${DESC}">`,
			`<meta property="og:image" content="${base}/og.jpg">`,
			`<meta name="twitter:card" content="summary_large_image">`,
		].join("\n\t")
	: "<!-- run with --base=https://your-domain to emit Open Graph tags -->";

const html = `<!doctype html>
<html lang="ru">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width,initial-scale=1">
	<title>${TITLE}</title>
	<meta name="description" content="${DESC}">
	<meta name="theme-color" content="#0e0e12">
	<link rel="icon" href="${FAVICON}">
	${og}
</head>
<body>
${body}
</body>
</html>
`;

await mkdir(OUT, { recursive: true });
await writeFile(resolve(OUT, "index.html"), html, "utf8");
if (base) await copyFile(resolve(ROOT, "site/photos/1.jpg"), resolve(OUT, "og.jpg"));

const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`dist/index.html — ${kb} KB${base ? " + dist/og.jpg" : ""}`);
