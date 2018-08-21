let restaurant;
var map;

document.addEventListener('DOMContentLoaded', (event) => {
  registerServiceWorker();
  initializeStaticMap();
});

/**
 * Initialize Google map, called from HTML.
 */
initializeStaticMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      fillStaticMapImage(restaurant);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
  fetchRestaurantReviewsURL(fillReviewsHTML);
}

fillStaticMapImage = (restaurant) => {
  const mapStaticUrl = new URL('https://maps.googleapis.com/maps/api/staticmap');
  mapStaticUrl.searchParams.set('key', 'AIzaSyDs7Q5sHMAl_FxNNvmx-dwbnomMf0xPfyQ');
  mapStaticUrl.searchParams.set('center', `${restaurant.latlng.lat}x${restaurant.latlng.lng}`);
  mapStaticUrl.searchParams.set('size', '600x400');
  mapStaticUrl.searchParams.set('zoom', '16');

  const marker = DBHelper.mapLocationForRestaurant(restaurant);
  mapStaticUrl.searchParams.append('markers', `${marker.position.lat},${marker.position.lng}`);

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
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantReviewsURL = (callback) => {
  if (self.reviews) { // restaurant already fetched!
    callback(self.reviews)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
  } else {
    DBHelper.fetchRestaurantReviews(id, (error, restaurantReviews) => {
      self.reviews = restaurantReviews;
      if (!restaurantReviews) {
        console.error(error);
        return;
      }

      callback(restaurantReviews)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.alt = restaurant.name + " image";
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const reviewHeaderContainer = document.createElement('div');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  title.style.display = 'inline-block'
  reviewHeaderContainer.appendChild(title);

  const addReviewButton = document.createElement('button');
  addReviewButton.innerHTML = 'Add Review';
  addReviewButton.style.float = 'right';
  reviewHeaderContainer.appendChild(addReviewButton);
  container.appendChild(reviewHeaderContainer);

  const ul = document.getElementById('reviews-list');
  addReviewButton.addEventListener("click", function( event ) {
    // display the current click count inside the clicked div
    addReviewButton.disabled = true;
    ul.insertBefore(createNewReviewForm(addReviewButton), ul.firstChild);
  });

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }

  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const reviewHeader = document.createElement('div');
  reviewHeader.classList.add('review-header');
  const name = document.createElement('span');
  name.classList.add('reviewer-name');
  name.innerHTML = review.name;
  reviewHeader.appendChild(name);


  const date = document.createElement('span');
  date.innerHTML = new Date(review.createdAt).toLocaleString();
  date.classList.add('review-date');
  reviewHeader.appendChild(date);
  li.appendChild(reviewHeader);

  const ratingsContainer = document.createElement('p');
  const rating = document.createElement('span');
  rating.classList.add('review-rating-' + review.rating);
  rating.innerHTML = `Rating: ${review.rating}`;
  ratingsContainer.appendChild(rating);
  li.appendChild(ratingsContainer);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Create new review form HTML and add it to the webpage.
 */
createNewReviewForm = (addReviewButton) => {
  const li = document.createElement('li');
  const reviewHeader = document.createElement('div');
  reviewHeader.classList.add('review-header');
  const name = document.createElement('span');
  name.classList.add('reviewer-name');
  name.innerHTML = 'Create new review';
  reviewHeader.appendChild(name);
  li.appendChild(reviewHeader);

  const reviewForm = document.createElement('form');

  //Create an input for name
  var nameInput = createInput('name', 'text', 'name-input');
  var nameLabel = document.createElement("Label");
  nameLabel.innerHTML = "Name";
  nameLabel.setAttribute('for', 'name-input')
  reviewForm.appendChild(nameLabel);
  reviewForm.appendChild(nameInput);

  //Create an input for rating
  var ratingInput = createDropDown('rating', [0,1,2,3,4], 'rating-input');

  var ratingLabel = document.createElement("Label");
  ratingLabel.innerHTML = "Rating";
  ratingLabel.setAttribute('for', 'rating-input')
  reviewForm.appendChild(ratingLabel);
  reviewForm.appendChild(ratingInput);

  //Create an input for comments
  var commentsInput = document.createElement("textarea");
  commentsInput.id = 'comments-input';
  var commentsLabel = document.createElement("Label");
  commentsLabel.innerHTML = "Comments";
  commentsLabel.setAttribute('for', 'comments-input');
  reviewForm.appendChild(commentsLabel);
  reviewForm.appendChild(commentsInput);

  //Create button input to save review
  var saveReviewInput = createInput('', 'submit');
  saveReviewInput.value = 'Save Review';
  reviewForm.appendChild(saveReviewInput);

  saveReviewInput.addEventListener('click', function(event) {
    event.preventDefault()
    const name = nameInput.value;
    const rating = ratingInput.value;
    const comments = commentsInput.value;

    name ? nameInput.classList.remove("invalid-input") : nameInput.classList.add("invalid-input");
    rating !== '0' ? ratingInput.classList.remove("invalid-input") : ratingInput.classList.add("invalid-input");
    comments ? commentsInput.classList.remove("invalid-input") : commentsInput.classList.add("invalid-input");

    if(!name || rating === '0' || !comments) {
      return;
    }
    const messageParagraph = document.createElement("p");
    messageParagraph.innerHTML = 'Saving...';

    let saveRestaurantReviewParams = DBHelper.saveRestaurantReviewRequest(getParameterByName('id'), name, rating, comments);
    sync(saveRestaurantReviewParams.url, saveRestaurantReviewParams.options)
      .then(response => {
        li.removeChild(messageParagraph);
      })
      .catch(response => {

        messageParagraph.innerHTML = `Error saving review. ${response}`;
        messageParagraph.style.color = "Red";
      })
    const newReviewLi = createReviewHTML({
      'name': name,
      'createdAt': new Date().toLocaleString(),
      'rating': rating,
      'comments': comments
    });

    li.innerHTML = newReviewLi.innerHTML;
    li.appendChild(messageParagraph);
    addReviewButton.disabled = false;
  });

  //Create button input to cancel save review
  var cancelReviewInput = createInput('', 'button');
  cancelReviewInput.value = 'Cancel';
  reviewForm.appendChild(cancelReviewInput);

  cancelReviewInput.addEventListener('click', function() {
    li.parentNode.removeChild(li)
    addReviewButton.disabled = false;
  });

  li.appendChild(reviewForm);

  return li;
}

/**
 * This function does retry... Not used for now...
 */
saveRestaurantReview = function(name, rating, comments, li, retries = 1) {
  const restaurantReviewResponseHandler = (error) => {
    if(error) {
      if(retries === 1) {
        const errorParagraph = document.createElement("p");
        errorParagraph.innerHTML = 'Error saving review. Retrying...';
        errorParagraph.style.color = "Red";
        errorParagraph.id = 'save-review-error';
        li.appendChild(errorParagraph);
      }
      // retry with backoff
      setTimeout(() => {
         saveRestaurantReview(name, rating, comments, li, retries + 1);
      }, retries * retries * 1000);
    } else {
      li.querySelector("#save-review-error").remove();
    }
  }
  DBHelper.saveRestaurantReview(getParameterByName('id'), name, rating, comments, restaurantReviewResponseHandler);
}

handleReviewSaveResponse = function(error, restaurantReview) {
  if(error) {
    console.log(error);
  } else {
    console.log(restaurantReview);
  }
}

createInput = function(name, type, id) {
  var input = document.createElement("input");
  //Assign different attributes to the element.
  input.setAttribute("type", type);
  input.setAttribute("name", name);
  input.id = id;

  return input;
}

createDropDown = function(name, values, id) {
  //Create and append select list
  var selectList = document.createElement("select");
  selectList.setAttribute("name", name);
  selectList.id = id;

  //Create and append the options
  for (var i = 0; i < values.length; i++) {
    var option = document.createElement("option");
    option.value = values[i];
    option.text = values[i];
    selectList.appendChild(option);
  }

  return selectList;
}

// use messagechannel to communicate
sendMessageToSw = function(msg) {
  return new Promise((resolve, reject) => {
    // Create a Message Channel
    const messageChannel = new MessageChannel()

    // Handler for recieving message reply from service worker
    messageChannel.port1.onmessage = event => {
      if(event.data.error) {
        reject(event.data.error)
      } else {
        resolve(event.data)
      }
    }

    navigator.serviceWorker.controller.postMessage(msg, [messageChannel.port2]);
  })
}
// send message to serviceWorker
sync = function(url, options) {
  return sendMessageToSw({type: 'sync', url, options})
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.setAttribute('href', `restaurant.html?id=${restaurant.id}`);
  a.setAttribute('aria-current', 'page');
  a.innerHTML = restaurant.name;
  li.appendChild(a);
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
