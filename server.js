const fs = require("fs");
const http = require("http");
const path = require("path");

const rootArg = process.argv.find((arg) => arg.startsWith("--root="));
const root = path.resolve(rootArg ? rootArg.slice("--root=".length) : ".");
const port = Number(process.env.PORT || 8765);
const host = process.env.HOST || "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2"
};

function resolveFile(urlPath) {
  const pathname = decodeURIComponent((urlPath || "/").split("?")[0]);
  const abs = path.normalize(path.join(root, pathname));
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
    const index = path.join(abs, "index.html");
    return fs.existsSync(index) ? index : null;
  }
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  const index = path.join(abs, "index.html");
  if (fs.existsSync(index) && fs.statSync(index).isFile()) return index;
  return null;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url);
  if (!file) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("404");
    return;
  }
  res.writeHead(200, {
    "content-type": types[path.extname(file)] || "application/octet-stream",
    "cache-control": "no-cache"
  });
  fs.createReadStream(file).pipe(res);
});

if (require.main === module) {
  server.listen(port, host, () => {
    console.log("http://" + host + ":" + port);
    console.log("http://" + host + ":" + port + "/a");
    console.log("http://" + host + ":" + port + "/b");
  });
}

module.exports = { resolveFile, root };
