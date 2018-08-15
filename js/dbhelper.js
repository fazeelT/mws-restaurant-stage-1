/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   */
  static get RESTAURANTS_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Restaurant Reviews URL.
   * Change this to restaurants.json file location on your server.
   */
  static get RESTAURANT_REVIEWS_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, id) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', id ? DBHelper.RESTAURANTS_URL + `/${id}` :  DBHelper.RESTAURANTS_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const restaurant = JSON.parse(xhr.responseText);
        callback(null, restaurant);
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurantReviews(id, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', id ? DBHelper.RESTAURANT_REVIEWS_URL + `/?restaurant_id=${id}` :  DBHelper.RESTAURANT_REVIEWS_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const restaurantReviews = JSON.parse(xhr.responseText);
        callback(null, restaurantReviews);
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }

  /**
   * Fetch all restaurants.
   */
  static fetchReviewById(id, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.RESTAURANT_REVIEWS_URL + `/${id}`);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const restaurantReview = JSON.parse(xhr.responseText);
        callback(null, restaurantReview);
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurant) => {
      if (error) {
        callback(error, null);
      } else {
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    }, id);
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighbourhoodsAndCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)

        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueNeighborhoods, uniqueCuisines);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static saveRestaurantReviewRequest(id, name, rating, comments) {
    let saveReviewParams = {
      "restaurant_id": Number(id),
      "name": name,
      "rating": Number(rating),
      "comments": comments
    };

    return {
      url: DBHelper.RESTAURANT_REVIEWS_URL,
      options: {
        headers: {
           "Content-Type": "application/json; charset=utf-8",
        },
        method: 'POST',
        body: JSON.stringify(saveReviewParams)
      }
    }
  }

// use messagechannel to communicate
static sendMessageToSw (msg) {
  return new Promise((resolve, reject) => {
    // Create a Message Channel
    const msg_chan = new MessageChannel()

    // Handler for recieving message reply from service worker
    msg_chan.port1.onmessage = event => {
      if(event.data.error) {
        reject(event.data.error)
      } else {
        resolve(event.data)
      }
    }
    navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
  })
}
// send message to serviceWorker
// this is use to tell the serviceworker how to parse our data
static sync (url, options) {
  return DBHelper.sendMessageToSw({type: 'sync', url, options})
}

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
