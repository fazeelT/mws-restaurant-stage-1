
var staticCacheName = 'restaurants-review-static-v1';
var contentImgsCache = 'restaurants-review-content-imgs';
var contentDataCache = 'restaurants-review-content-data';
var idbDBName = 'RestaurantReviewsDB';
var idbStoreName = 'RestaurantReviews';
var serviceUrl = "http://localhost:1337";

var allCaches = [
  staticCacheName,
  contentImgsCache,
  contentDataCache
];

var idb;

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
  event.waitUntil(
    createDB()
  );
});

function createDB() {
  return new Promise(function(resolve,reject){
    idb = indexedDB.open(idbDBName, 1);  
    idb.onupgradeneeded = function(upgradeDB) {
      var db = upgradeDB.target.result;
      db.createObjectStore(idbStoreName);
    }   
    
    idb.onsuccess = resolve;
  });      
}

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
    if (requestUrl.origin === serviceUrl) {
      event.respondWith(serveDataFromIndexDB(event.request));
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

function getTransaction() {
    return idb.result.transaction([idbStoreName], 'readwrite').objectStore(idbStoreName)
}

function serveDataFromIndexDB(requestObject) {
    
  return new Promise(function(resolve,reject) {
    var storageUrl = requestObject.url;
    var objectStore = getTransaction();
    var request = objectStore.get(storageUrl);
    request.onsuccess = function(event) {
      // Get the old value that we want to update
      var data = event.target.result;
      var networkFetch = fetch(storageUrl).then(function(networkResponse) {
        // Put this updated object back into the database.
        networkResponse.clone().json().then((blob) => {
          getTransaction().add(blob, storageUrl);           
        });
        
        return networkResponse;
      });
          
        
      return resolve(toResponse(data) || networkFetch); 
    }
  });
  
}

function toResponse(data) {
  
  if(!data) {
      return null;
  }
  const contentType = 'application/json';
    
  const myHeaders = new Headers({
    "Content-Length": String(data.size),
    "Content-Type": contentType,
    "X-Custom-Header": "ProcessThisImmediately",
  });

  const init = {
    'content-type': 'application/json',
    'headers': myHeaders,
    'status' : 200,
    'statusText' : 'OKS',
  };
    
  var blob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});    
    
  return new Promise((resolve, reject) => resolve(new Response(blob, init)));  
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
