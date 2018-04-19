window.addEventListener(
  'DOMContentLoaded',
  function() {
    document.querySelector('a.expand').addEventListener('click', function() {
      var el = document.querySelector('div.prices');
      el.className = el.className.replace('collapsed', '');
    });

    var collapsible = document.querySelector('.collapsible');

    if (collapsible.querySelector('.content').clientHeight < 50) {
      collapsible.className = collapsible.className.replace('collapsed', '');
    }

    document.querySelector('.collapsible .expand').addEventListener('click', function(e) {
      var el = e.target.parentNode;
      el.className = el.className.replace('collapsed', '');
    });

    if (document.querySelector('.thumbnails')) {
      document.querySelector('.gallery .show').addEventListener('click', function(e) {
        e.stopPropagation();
        showGallery();
      });
      document.querySelector('.gallery .thumbnails .image').addEventListener('click', function(e) {
        e.stopPropagation();
        showGallery(e.target);
      });
    }
  },
  true
);

function Images(urlList) {
  this.selected = 0;
  this.urlList = urlList;
}

Images.prototype.next = function() {
  this.selected++;
  if (this.selected >= this.urlList.length) {
    this.selected = 0;
  }
  return this.get();
};

Images.prototype.prev = function() {
  this.selected--;
  if (this.selected < 0) {
    this.selected = this.urlList.length - 1;
  }
  return this.get();
};

Images.prototype.get = function() {
  return this.urlList[this.selected];
};

Images.prototype.setPointer = function(url) {
  this.selected = this.urlList.indexOf(url);
};

function showGallery(target) {
  imagesList = new Images(
    [].slice.call(document.querySelectorAll('.image')).map(function(img) {
      return img.style.backgroundImage;
    })
  );
  if (target) {
    imagesList.setPointer(target.style.backgroundImage);
  }

  var win = document.createElement('div');
  win.id = 'preview';
  document.body.appendChild(win);

  var toolbar = document.createElement('div');
  toolbar.id = 'toolbar';
  win.appendChild(toolbar);

  var container = document.createElement('div');
  container.id = 'container';
  win.appendChild(container);

  var close = document.createElement('div');
  close.id = 'close';
  close.innerHTML = '×';
  toolbar.appendChild(close);

  var left = document.createElement('div');
  left.id = 'left';
  left.innerHTML = '⮜';
  container.appendChild(left);

  var img = document.createElement('div');
  img.id = 'image';
  img.style.backgroundImage = imagesList.get();
  container.appendChild(img);

  var right = document.createElement('div');
  right.id = 'right';
  right.innerHTML = '⮞';
  container.appendChild(right);

  function closeHandler(e) {
    document.body.removeChild(win);
    document.body.removeEventListener('click', closeHandler);
  }

  close.addEventListener('click', closeHandler);
  document.body.addEventListener('click', closeHandler);
  win.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  left.addEventListener('click', function(e) {
    e.stopPropagation();
    img.style.backgroundImage = imagesList.prev();
  });
  right.addEventListener('click', function(e) {
    e.stopPropagation();
    img.style.backgroundImage = imagesList.next();
  });
}
