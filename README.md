# eureka-mini

##How to run
```yarn && yarn start```
or
```npm run && npm start```

## Used technologies
* **Node** as rendering engine and server
* **Handlebars** for HTML templating
* **LESS** for generation of CSS
* **WebSockets** for reloading on change

## How it works
After run:
1. Node loads all required data from API
1. Node renders and compiles into public folder (see config.json)
	* HTML files (server side rendering), compiles
	* SASS
	* JavaScript
2. Web server is started on defined port (see config.json)
3. Watcher is started (shouldn't be included into distribution version)
4. Ready for using, happy browsing!

*In real traffic should be solved starting of api data load and rendering periodically, or on same event or on demand.*