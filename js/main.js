// initialize map
var map = document.getElementById('map'); // Global map variable
var places; // Global variable containing place instances
var currentInfoWindow; // Global variable for current open info window
var currentMarker; // Global variable for the current Marker

function initMap() {
  var center = {
    lat: 55.961659,
    lng: -3.175880
  };
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 13,
    mapTypeControl: false,
    center: center,
    clickableIcons: true,
    scaleControl: false,
    streetViewControl: false,
    zoomControl: false,
  });
  // Place class to create instances from
  var place = function(title, label, visible, position) {
    var self = this;
    self.markerData = {
      title: title,
      icon: {
        scale: 9,
        strokeWeight: 5,
        strokeColor: "SkyBlue",
        path: google.maps.SymbolPath.CIRCLE
      },
      label: label,
      visible: visible,
      position: position,
      animation: google.maps.Animation.DROP
    };
    self.marker = new google.maps.Marker(self.markerData);
    self.visible = ko.observable(true);
    // Initiate HTTP get request with long and lat data
    self.getGeoData = function(long, lat) {
      var url = '//api.postcodes.io/postcodes?lon=' + long + '&lat=' + lat + '&limit=1';
      aysncHttpGetRequest(url, self.processResponse);
    };
    // Add api response data to content string
    self.processResponse = function(response) {
      var parsed = JSON.parse(response).result[0],
          apiContent = '<div id="apiContent">' +
                       '<h4>' + parsed.msoa + ', ' + parsed.postcode + '</h4>' +
                       '</div>';
      self.contentString += apiContent;
    };
    self.contentString = '<div id="content">' +
                         '<h2>' + title + '</h2>' +
                         '</div>';
    self.infoWindow = new google.maps.InfoWindow({
      content: self.contentString
    });
    self.init = function() {
      self.getGeoData(position.lng, position.lat);
      self.marker.addListener('click', function() {
        // Add new content dynamically if processResponse has returned
        self.infoWindow.setContent(self.contentString);
        sortClick(self);
      });
    };
  };

  // My default places to render markers
  places = [
    new place('Dean Gardens', 'DG', true, {
      lat: 55.9548197802915,
      lng: -3.211491519708498
    }),
    new place('Five-way Crossroads', 'FC', true, {
      lat: 55.974213,
      lng: -3.202350
    }),
    new place('Maison de Moggy', 'MM', true, {
      lat: 55.946745,
      lng: -3.198284
    }),
    new place('Edinburgh Playhouse', 'EP', true, {
      lat: 55.956898,
      lng: -3.184992
    }),
    new place('Waterstones', 'W', true, {
      lat: 55.950821,
      lng: -3.204684
    }),
    new place('Ocean Terminal', 'OT', true, {
      lat: 55.980682,
      lng: -3.177731
    }),
    new place('Lochend Loch', 'LL', true, {
      lat: 55.960841,
      lng: -3.160699,
    }),
  ];
  // Activates knockout.js
  ko.applyBindings(new ViewModel());
}

function sortClick(clickedPlace) {
  if (currentInfoWindow) {
    currentInfoWindow.close();
  }
  if (currentMarker) {
    currentMarker.setAnimation(null);
  }
  currentMarker = clickedPlace.marker;
  currentInfoWindow = clickedPlace.infoWindow;
  currentMarker.setAnimation(google.maps.Animation.BOUNCE);
  currentInfoWindow.open(map, currentMarker);
}

function mapLoadError() {
  alert("Google maps has failed to load, please check your internet connection and refresh the page.");
}
//Knockout.js begins
function ViewModel() {
  var self = this;
  self.menuIsOpen = ko.observable(false);
  self.toggleMenu = function() {
    self.menuIsOpen(!self.menuIsOpen());
  };
  self.userInput = ko.observable();
  self.currentFilter = '';
  // Watch userInput and filter markers by that
  self.userInput.subscribe(function(newValue) {
    self.currentFilter = newValue;
    self.manipulateMarkers('filter');
  });
  self.filteredPlaces = ko.observableArray(places.slice());
  // function to create markers from array of objects
  self.manipulateMarkers = function(action) {
    self.filteredPlaces().forEach(function(item, index, array) {
      var currentPlace = array[index],
        currentIterationMarker = currentPlace.marker;
      if (action === 'create') {
        currentIterationMarker.setMap(map);
        currentPlace.init();
      }
      if (action === 'filter') {
        if (!currentIterationMarker.title.toLowerCase().includes(self.currentFilter)) {
          currentIterationMarker.setVisible(false);
          currentPlace.visible(false);
          if (currentInfoWindow) {
            currentInfoWindow.close();
          }
        } else {
          currentIterationMarker.setVisible(true);
          currentPlace.visible(true);
        }
      }
    });
  };
  self.manipulateMarkers('create');
  self.listClick = function(place) {
    sortClick(place);
  };
}

// function to make asynconous request to API
function aysncHttpGetRequest(url, callback) {
  var xhr = new XMLHttpRequest();
  var done;
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4)
      //if all goes well
      if (xhr.status == 200) {
        callback(xhr.responseText);
      } else { // if other than 200
        alert('Error', xhr.statusText);
      }
  };
  xhr.open("GET", url, true);
  xhr.send(null);
}