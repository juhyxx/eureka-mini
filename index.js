const http = require('http');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const less = require('less');
const colors = require('colors');
const watch = require('watch');
const url = require('url');
const server = require('./server');

const PUBLIC_DIR = 'public';
const SOURCE_DIR = 'app';
const API_URL = 'http://python-servers-vtnovk529892.codeanyapp.com:5000';

function mkdir(dir = '') {
  if (!fs.existsSync(PUBLIC_DIR + dir)) {
    fs.mkdirSync(PUBLIC_DIR + dir);
  }
}

mkdir();
handlebars.registerPartial('header', fs.readFileSync('app/partials/header.hbs', 'utf8'));
handlebars.registerPartial('footer', fs.readFileSync('app/partials/footer.hbs', 'utf8'));
handlebars.registerPartial('reload', fs.readFileSync('app/partials/reload.hbs', 'utf8'));
handlebars.registerHelper('eq', (a, b) => a === b);
handlebars.registerHelper('currency', a =>
  (a || '')
    .toString()
    .split('')
    .reverse()
    .join('')
    .split(/(.{3})/)
    .join(' ')
    .split('')
    .reverse()
    .join('')
    .trim()
);

watch.watchTree('app', { ignoreDotFiles: true }, (f, prev, curr) => {
  if (typeof f == 'object' && prev === null && curr === null) {
    console.log('Watching'.blue);
  } else {
    console.log('change'.blue, f);

    switch (path.extname(f)) {
      case '.hbs':
        render(f).then(() => server.reload());
        break;

      case '.less':
        compileLess().then(() => server.reload());
        break;
    }
  }
});

function compileLess() {
  return new Promise(resolve => {
    try {
      fs.unlinkSync('public/style.css');
    } catch (e) {
      console.log('unable to delete style.css'.yellow);
    }
    fs.readFile('app/styles/index.less', 'utf8', (err, content) => {
      less.render(content).then(renderedContent => {
        fs.writeFile(path.format({ dir: PUBLIC_DIR, name: 'style.css' }), renderedContent.css, 'utf8', () => resolve());
      });
    });
  });
}

function loadApiData(url) {
  return new Promise((resolve, reject) => {
    http.get(`${API_URL}/${url}`, response => {
      const { statusCode } = response;
      let requestData = '';
      if (statusCode !== 200) {
        reject(statusCode);
      }

      response.on('data', chunk => (requestData += chunk));
      response.on('end', () => {
        resolve(JSON.parse(requestData));
      });
    });
  });
}

function render(file) {
  return new Promise(resolve => {
    console.log(`Rendering...`.yellow);

    const templates = {
      index: handlebars.compile(fs.readFileSync(path.format({ dir: SOURCE_DIR, name: 'index.hbs' }), 'utf8')),
      page404: handlebars.compile(fs.readFileSync(path.format({ dir: SOURCE_DIR, name: '404.hbs' }), 'utf8')),
      category: handlebars.compile(fs.readFileSync(path.format({ dir: SOURCE_DIR, name: 'category.hbs' }), 'utf8'))
    };
    fs.writeFile('public/404.html', templates.page404(), 'utf8');

    loadApiData('categories/').then(categories => {
      let result = templates.index({ categories: categories });

      fs.writeFile(path.format({ dir: PUBLIC_DIR, name: 'index.html' }), result, 'utf8');
      mkdir('/category');
      categories.forEach(item => {
        mkdir(`/category/${item.categoryId}`);
        loadApiData(`products/${item.categoryId}/0/100/`).then(products => {
          products.forEach(product => {
            loadApiData(`offers/${product.productId}/0/100/`).then(offers => {
              offers = offers || [];
              let prices = offers.map(offer => offer.price);
              product.rangeMin = Math.min.apply(Math, prices);
              product.rangeMax = Math.max.apply(Math, prices);
              product.description = (offers.find(offer => !!offer.description) || {}).description;
              result = templates.category({ selected: item, categories: categories, products: products });
              fs.writeFile(`public/category/${item.categoryId}/index.html`, result, 'utf8');
            });
          });
        });
      });
      resolve();
    });
  });
}

Promise.all([render(), compileLess()]).then(() => {
  server.run();
});
