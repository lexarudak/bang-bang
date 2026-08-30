// Local preview for the site.
//
// site/covers.html is an Artifact fragment: it has no <html>/<head>, because the
// publisher supplies them. Here we wrap it the same way, add the charset the
// Cyrillic needs, and inject a live-reload poll — so editing colours and
// reloading is a save away. The source file itself is never touched.
//
//   node tools/serve.mjs            → http://localhost:8787
//   PORT=3000 node tools/serve.mjs
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../site", import.meta.url)));
const ENTRY = "covers.html";
const PORT = Number(process.env.PORT || 8787);

const MIME = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
	".svg": "image/svg+xml",
};

const RELOAD = `<script>
(function () {
  var last = null;
  setInterval(function () {
    fetch("/__mtime", { cache: "no-store" })
      .then(function (r) { return r.text(); })
      .then(function (t) { if (last === null) last = t; else if (t !== last) location.reload(); })
      .catch(function () {});
  }, 600);
})();
</script>`;

createServer(async (req, res) => {
	const url = new URL(req.url, "http://localhost");
	try {
		if (url.pathname === "/__mtime") {
			const s = await stat(join(ROOT, ENTRY));
			res.writeHead(200, { "content-type": "text/plain", "cache-control": "no-store" });
			res.end(String(s.mtimeMs));
			return;
		}

		const name = url.pathname === "/" ? ENTRY : url.pathname.replace(/^\/+/, "");
		const file = resolve(ROOT, name);
		if (!file.startsWith(ROOT)) {
			res.writeHead(403).end("nope");
			return;
		}

		if (name === ENTRY) {
			const body = await readFile(file, "utf8");
			res.writeHead(200, { "content-type": MIME[".html"], "cache-control": "no-store" });
			res.end(
				'<!doctype html><html lang="ru"><head><meta charset="utf-8">' +
					'<meta name="viewport" content="width=device-width,initial-scale=1">' +
					"</head><body>" + body + RELOAD + "</body></html>",
			);
			return;
		}

		res.writeHead(200, {
			"content-type": MIME[extname(file).toLowerCase()] || "application/octet-stream",
			"cache-control": "no-store",
		});
		res.end(await readFile(file));
	} catch {
		res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("404");
	}
}).listen(PORT, () => {
	console.log("site → http://localhost:" + PORT + "  (live reload on save)");
});
