let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []
let lazy = [];

const UN_FAVORITE_ICON_CHAR_CODE = 9734;
const FAVORITE_ICON_CHAR_CODE = 9733;
const FAVORITE_TOOLTIP = 'Mark as Favorite';
const UN_FAVORITE_TOOLTIP = 'Mark as Unfavorite';

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  registerServiceWorker();
  fetchNeighbourhoodsAndCuisines();
  initializeStaticMap();

  registerListener('load', lazyLoad);
  registerListener('scroll', lazyLoad);
  registerListener('resize', lazyLoad);

});

initializeStaticMap = () => {

  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      fillStaticMapImage(restaurants);
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });

}

fillStaticMapImage = (restaurants) => {
  const mapStaticUrl = new URL('https://maps.googleapis.com/maps/api/staticmap');
  mapStaticUrl.searchParams.set('key', 'AIzaSyDs7Q5sHMAl_FxNNvmx-dwbnomMf0xPfyQ');
  mapStaticUrl.searchParams.set('center', '40.722216,-73.987501');
  mapStaticUrl.searchParams.set('size', '600x400');
  mapStaticUrl.searchParams.set('zoom', '12');

  restaurants.forEach(restaurant => {
    const marker = DBHelper.mapLocationForRestaurant(restaurant);
    mapStaticUrl.searchParams.append('markers', `${marker.position.lat},${marker.position.lng}`);
  });
  const staticMapImage = document.createElement('img');
  staticMapImage.setAttribute('src', mapStaticUrl);
  staticMapImage.alt = 'Map with restaurants';
  staticMapImage.id = 'map';

  document.getElementById('map-container').append(staticMapImage);
}

registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/sw.js').then(function(reg) {
    // Registration was successful
    console.log('ServiceWorker registration successful with scope: ', reg.scope);
  });
};

/**
 * Fetch all neighborhoods and cuisines and set their HTML.
 */
fetchNeighbourhoodsAndCuisines = () => {
  DBHelper.fetchNeighbourhoodsAndCuisines((error, neighborhoods, cuisines) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = `An image of ${restaurant.name}`;
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
  li.append(image);
  lazy.push(image);

  const favoriteButton = document.createElement('button');
  favoriteButton.classList.add('favorite-button');
  const is_favorite = restaurant.is_favorite ? restaurant.is_favorite : false;
  favoriteButton.innerHTML = is_favorite ? getIcon(FAVORITE_ICON_CHAR_CODE) : getIcon(UN_FAVORITE_ICON_CHAR_CODE);
  favoriteButton.title = is_favorite ? UN_FAVORITE_TOOLTIP : FAVORITE_TOOLTIP;
  li.append(favoriteButton);

  favoriteButton.addEventListener('click', function() {
    DBHelper.toggleRestaurantFavorite(restaurant.id, getCharCode(favoriteButton.innerHTML) === UN_FAVORITE_ICON_CHAR_CODE, function(error) {
      if(error) {
        favoriteButton.title = `Failed, Try again. ${favoriteButton.title}`;
        return;
      }
      const charCode = getCharCode(favoriteButton.innerHTML) === UN_FAVORITE_ICON_CHAR_CODE ? FAVORITE_ICON_CHAR_CODE : UN_FAVORITE_ICON_CHAR_CODE;
      favoriteButton.innerHTML = getIcon(charCode);
      favoriteButton.title = favoriteButton.title === FAVORITE_TOOLTIP ? UN_FAVORITE_TOOLTIP : FAVORITE_TOOLTIP;
    })
  });

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute("aria-label", "View Details for " + restaurant.name)
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

getIcon = (charCode) => {
  return `&#${charCode};`;
}

getCharCode = (symbol) => {
  return symbol.charCodeAt(0);
}

/**
 * Register listener to scroll and load for images
 */
registerListener = (event, func) => {
    if (window.addEventListener) {
        window.addEventListener(event, func)
    } else {
        window.attachEvent('on' + event, func)
    }
}

/**
 * Loads image only if image is in view port
 */
lazyLoad = () => {
    for(var i=0; i<lazy.length; i++){
        if(isInViewport(lazy[i])){
            if (lazy[i].getAttribute('data-src')){
                lazy[i].src = lazy[i].getAttribute('data-src');
                lazy[i].removeAttribute('data-src');
            }
        }
    }

    cleanLazy();
}

/**
 * Remove loaded images from the array.
 */
cleanLazy = () => {
    lazy = Array.prototype.filter.call(lazy, function(l){ return l.getAttribute('data-src');});
}

/**
 * Check for rectangle for image and see if its in view port
 */
isInViewport = (el) => {
    var rect = el.getBoundingClientRect();

    return (
        rect.bottom >= 0 &&
        rect.right >= 0 &&
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.left <= (window.innerWidth || document.documentElement.clientWidth)
     );
}
