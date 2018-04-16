const http = require("http");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const less = require("less");
const colors = require("colors");
const watch = require("watch");
const WebSocketServer = require("websocket").server;
const url = require("url");

const PORT = 8080;
const PUBLIC_DIR = "public";
const apiUrl = "http://python-servers-vtnovk529892.codeanyapp.com:5000";

let template = compileTemplate();
compileLess();
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdir(PUBLIC_DIR);
}

let requestListener = function(req, res) {
  let content;

  let url = req.url;

  switch (true) {
    case /\/app/.test(url):
      res.writeHead(200, { "Content-Type": "image/jpeg;" });
      content = fs.readFileSync(url.replace(/\//, ""));
      res.end(content);
      break;

    case /^\/$/.test(url):
      console.log(colors.green(req.method), req.url);
      http.get(`${apiUrl}/categories/`, response => {
        let requestData = "";

        response.on("data", chunk => (requestData += chunk));
        response.on("end", () => {
          let data = { categories: JSON.parse(requestData) };
          let result = template(data);
          res.end(result);
        });
      });
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      break;

    case /^\/style.css/.test(url):
      console.log(colors.green(req.method), req.url);
      res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
      content = fs.readFileSync("public/style.css", "utf8");
      res.end(content);
      break;

    default:
      console.log(colors.red(req.method), req.url);
      res.writeHead(404);
      res.end();
  }
};

var server = http.createServer(requestListener);
server.listen(PORT, () => {
  console.log(`listening ${PORT} ...`.green);
});

wsServer = new WebSocketServer({
  httpServer: server
});

wsServer.on("request", function(r) {
  wsConnection = r.accept("echo-protocol", r.origin);
});

function reload() {
  if (wsConnection) {
    wsConnection.sendUTF("reload");
  } else {
    console.log("Client is not connected".red);
  }
}

watch.watchTree("app", { ignoreDotFiles: true }, (f, prev, curr) => {
  if (typeof f == "object" && prev === null && curr === null) {
  } else {
    console.log("change".blue, f);
    switch (path.extname(f)) {
      case ".hbs":
        template = compileTemplate();
        reload();
        break;
      case ".less":
        compileLess();
        reload();
        break;
    }
  }
});

function compileLess() {
  fs.readFile("app/index.less", "utf8", (err, content) => {
    less.render(content).then(renderedContent => {
      fs.writeFile("public/style.css", renderedContent.css, "utf8");
    });
  });
}

function compileTemplate() {
  let data = fs.readFileSync("app/index.hbs", "utf8");
  return handlebars.compile(data);
}
