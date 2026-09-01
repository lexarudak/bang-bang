// Локальный просмотр сайта с автоперезагрузкой.
//
// site/index.html — обычная готовая страница, её можно просто открыть в браузере.
// Этот сервер нужен только ради одного: сохранил файл — вкладка обновилась сама.
//
//   node serve.mjs            → http://localhost:8787
//   PORT=3000 node serve.mjs
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("./site", import.meta.url)));
const ENTRY = "index.html";
const PORT = Number(process.env.PORT || 8787);

const MIME = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".jpg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
	".svg": "image/svg+xml",
	".mp3": "audio/mpeg",
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
			const s = await stat(resolve(ROOT, ENTRY));
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

		// читаем до заголовков: иначе отсутствующий файл бросает уже после того,
		// как они отправлены, и попытка ответить 404 роняет процесс
		const buf = await readFile(file);
		res.writeHead(200, {
			"content-type": MIME[extname(file).toLowerCase()] || "application/octet-stream",
			"cache-control": "no-store",
		});
		res.end(
			name === ENTRY
				? String(buf).replace("</body>", RELOAD + "\n</body>")
				: buf,
		);
	} catch {
		if (!res.headersSent) {
			res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
		}
		res.end("404");
	}
}).listen(PORT, () => {
	console.log("сайт → http://localhost:" + PORT + "  (перезагрузка при сохранении)");
});
