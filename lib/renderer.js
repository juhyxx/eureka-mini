const handlebars = require('handlebars');
const fs = require('fs');
const http = require('http');
const common = require('./common');
const config = require('./config.json');

module.exports = {
  init() {
    handlebars.registerPartial('header', fs.readFileSync(common.source('partials/header.hbs'), 'utf8'));
    handlebars.registerPartial('footer', fs.readFileSync(common.source('partials/footer.hbs'), 'utf8'));
    handlebars.registerPartial('reload', fs.readFileSync(common.source('partials/reload.hbs'), 'utf8'));
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
  },

  loadApiData(url) {
    console.log(`API ${url}`.gray);
    return new Promise((resolve, reject) => {
      http.get(`${config.API_URL}/${url}`, response => {
        const { statusCode } = response;
        let requestData = '';
        if (statusCode !== 200) {
          reject(statusCode);
        }
        response.on('data', chunk => (requestData += chunk));
        response.on('end', () => {
          try {
            resolve(JSON.parse(requestData));
          } catch (e) {
            console.log('Error'.red, `Unable to parse JSON from `, `${url}`.blue, '\n', e);
          }
        });
      });
    });
  },

  loadAll() {
    return new Promise((resolve, reject) => {
      this.loadApiData('categories/')
        .then(categories => {
          Promise.all(categories.map(category => this.loadApiData(`products/${category.categoryId}/0/100/`)))
            .then(products => {
              let flattenProducts = products.reduce((acc, item) => acc.concat(item), []);

              Promise.all(flattenProducts.map(product => this.loadApiData(`offers/${product.productId}/0/100/`)))
                .then(allOffers => {
                  flattenProducts.forEach((product, index) => {
                    let offers = allOffers[index];
                    product.offers = offers;
                    let prices = offers.map(offer => offer.price);
                    product.rangeMin = Math.min.apply(Math, prices);
                    product.rangeMax = Math.max.apply(Math, prices);
                    product.description = (offers.find(offer => !!offer.description) || {}).description;
										let category = categories.find(category => category.categoryId === product.categoryId);
										product.category = {title: category.title, categoryId: category.categoryId};
                    category.products = category.products || [];
                    category.products.push(product);
                  });
                  resolve(categories);
                })
                .catch(e => reject(e));
            })
            .catch(e => reject(e));
        })
        .catch(e => reject(e));
    });
  },

  renderAll(categories) {
    return new Promise((resolve, reject) => {
      const templates = {
        index: handlebars.compile(fs.readFileSync(common.source('index.hbs'), 'utf8')),
        page404: handlebars.compile(fs.readFileSync(common.source('404.hbs'), 'utf8')),
        category: handlebars.compile(fs.readFileSync(common.source('category.hbs'), 'utf8')),
        detail: handlebars.compile(fs.readFileSync(common.source('detail.hbs'), 'utf8'))
      };

      let result = templates.index({ categories: categories });
      fs.writeFile(common.public('index.html'), result, 'utf8');
      fs.writeFile(common.public('404.html'), templates.page404(), 'utf8');
      common.mkdir('/category');

      categories.forEach(category => {
        common.mkdir(`/category/${category.categoryId}`);
        result = templates.category({ selected: category, categories: categories, products: category.products });
        fs.writeFileSync(common.public(`category/${category.categoryId}/index.html`), result, 'utf8');
        category.products.forEach(product => {
          result = templates.detail({ selected: product, offers: product.offers.sort((a, b) => a.price - b.price) });
          fs.writeFileSync(common.public(`category/${category.categoryId}/${product.productId}.html`), result, 'utf8');
        });
      });
      resolve();
    });
  },

  render() {
    return new Promise(resolve => {
      console.log(`Rendering...`.yellow);
      let startTime = new Date();
      this.loadAll()
        .then(data => {
          console.log(`Loaded in ${(new Date() - startTime) / 1000}s`);
          fs.writeFileSync(`public/data.json`, JSON.stringify(data, null, 2), 'utf8');
          startTime = new Date();
          this.renderAll(data).then(() => {
            console.log(`Rendered in ${(new Date() - startTime) / 1000}s`);
            resolve();
          });
        })
        .catch(e => {
          console.log('Error'.red, 'Unable to load data from API\n', e);
        });
    });
  }
};
