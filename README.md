# Restaurant Reviews

Simple app that allows to review restaurants, mark restaurant as favorite. It uses backend service(https://github.com/udacity/mws-restaurant-stage-3) to fetch/create reviews, fetch restaurants and mark restaurants as favorite/unfavorite.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

* Python
```
check python version $python -V
If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.
```
* Backend service
```
git clone https://github.com/udacity/mws-restaurant-stage-3
```

### Installing

Start backend Service

```
npm install
node server
```

Run python server

```
Python 2.x: $python -m SimpleHTTPServer 8000 (or some other port, if port 8000 is already in use.)
For Python 3.x: $python3 -m http.server 8000.
```

With your server running, visit the site: `http://localhost:8000`.

## Built With

* [Service worker](https://developers.google.com/web/fundamentals/primers/service-workers/)
* [python server](https://docs.python.org/2/library/simplehttpserver.html)

## Authors

* **Udacity Instructor** - *Initial work*

See also the list of [contributors](https://github.com/fazeelT/mws-restaurant-stage-1/graphs/contributors) who participated in this project.

## Acknowledgments

* This code is fork of [mws-restaurant-stage-1](https://github.com/udacity/mws-restaurant-stage-1)
