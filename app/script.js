window.addEventListener(
  'DOMContentLoaded',
  function() {
    document.querySelector('a.expand').addEventListener('click', function() {
      var el = document.querySelector('div.prices');
      el.className = el.className.replace('collapsed', '');
		});

		document.querySelector('.gallery .thumbnails .image').addEventListener('click', function() {
     console.log('click')
    });
  },
  true
);
