const http = require("http");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const less = require("less");
const colors = require("colors");
const watch = require("watch");

const PORT = 8080;
const PUBLIC_DIR = "public";
const apiUrl = "http://python-servers-vtnovk529892.codeanyapp.com:5000";

let template = compileTemplate();
compileLess();
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdir(PUBLIC_DIR);
}

let requestListener = function(req, res) {
  console.log(colors.green(req.method), req.url);

  let content;

  switch (req.url) {
    case "/":
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
    case "/style.css":
      res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
      content = fs.readFileSync("public/style.css", "utf8");
      res.end(content);
    default:
      res.writeHead(404);
      res.end();
  }
};

var server = http.createServer(requestListener);
server.listen(PORT, () => {
  console.log(`listening ${PORT} ...`.green);
});

watch.watchTree("app", { ignoreDotFiles: true }, (f, prev, curr) => {
  if (typeof f == "object" && prev === null && curr === null) {
  } else {
    console.log("change".blue, f);
    switch (path.extname(f)) {
      case ".hbs":
        template = compileTemplate();
        break;
      case ".less":
        compileLess();
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
