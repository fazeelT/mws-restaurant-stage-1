
var staticCacheName = 'restaurants-review-static-v1';
var contentImgsCache = 'restaurants-review-content-imgs';
var contentDataCache = 'restaurants-review-content-data';
var allCaches = [
  staticCacheName,
  contentImgsCache,
  contentDataCache
];

self.addEventListener('install', function(event) {

  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/',
        'js/main.js',
        'js/dbhelper.js',
        'js/restaurant_info.js',
        'css/styles.css'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('restaurants-review-') &&
                 cacheName != staticCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname.startsWith('/img/')) {
      event.respondWith(servePhoto(event.request));
      return;
    }
    if (requestUrl.pathname.startsWith('/data/')) {
      event.respondWith(serveData(event.request));
      return;
    }
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(serveData(event.request));
      return;
    }
  }
  if (['https://maps.googleapis.com', 'https://maps.gstatic.com', 'c'].indexOf(requestUrl.origin) >= 0) {
      event.respondWith(serveData(event.request));
    
      return;  
  }
    if (requestUrl.pathname.endsWith('/restaurants')) {
      event.respondWith(serveData(event.request));
      return;
    }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

function serveData(request) {
  var storageUrl = request.url;

  return caches.open(contentDataCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
        var networkFetch = fetch(request).then(function(networkResponse) {
            cache.put(storageUrl, networkResponse.clone())
            
            return networkResponse;
        });
        
        return response || networkFetch;
    });
  });
}

function servePhoto(request) {
  var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open(contentImgsCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
