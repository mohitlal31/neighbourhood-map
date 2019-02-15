var map;
var marker;
var bounds;
var largeInfoWindow;
var fourSquareData = "";

function initMap()
{
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 12.971599, lng: 77.594563},
    zoom: 13
  });

  bounds = new google.maps.LatLngBounds();

  for(var i=0; i<locationList.length; ++i) {
    //create a marker for every location and add it to the 'markers' array
    addMarker(locationList[i]);
    self.markers.push(marker);
  }
  resizeMapBounds();
}

function gm_authFailure()
{
  alert('Google maps failed to load!');
}

function addMarker(location) {
  marker = new google.maps.Marker({
    map: map,
    position: location.location,
    animation: google.maps.Animation.DROP,
    title: location.title
  });

  //display an infoWindow when marker is clicked
  largeInfoWindow = new google.maps.InfoWindow();
  marker.addListener('click', function() {
    populateInfoWindow(this, largeInfoWindow);
  });

  largeInfoWindow.addListener('closeclick', function() {
    resizeMapBounds();
  });
}

//adjust the bounds of the map to fit all displayed markers on the screen
function resizeMapBounds() {
  bounds = new google.maps.LatLngBounds();
  for(var i=0; i<self.markers.length; ++i) {
    if(self.markers[i].getMap() == map) {
        bounds.extend(self.markers[i].position);
    }
  }
  map.fitBounds(bounds, 10);
}

function hideAllMarkers() {
  for(var i=0; i<self.markers.length; ++i) {
    self.markers[i].setMap(null);
  }
}

function showAllMarkers() {
  for(var i=0; i<self.markers.length; ++i) {
    self.markers[i].setMap(map);
  }
}

function filterMarkers(query) {
  for (var i=0; i<self.markers.length; ++i)
  {
    if(self.markers[i].getTitle().toLowerCase().indexOf(query.toLowerCase()) == 0) {
      if(self.markers[i].getMap != map) {
        self.markers[i].setMap(map);
      }
    }
    else {
      self.markers[i].setMap(null);
    }
  }
}

function populateInfoWindow(marker, infoWindow) {
  //constant '4' is a hack to make the marker bounce twice on click then stop.
  marker.setAnimation(4);
  getFourSquareData(marker, infoWindow);
}

function onListItemClicked(location) {
  var marker = self.markers.find(function(element) {
    return location.title == element.getTitle();
  });
  populateInfoWindow(marker, largeInfoWindow);
}


var ViewModel = function() {
  var self = this;
  this.markers = [];
  this.filterQuery = ko.observable('');
  this.fourSquareClientId = "MQE1HS4YEWHS0XB0W21NWZIL0XHCBMGEJ0QQ4ZPEZ40PB24F";
  this.fourSquareClientSecret = "YIUDIULYTMBH2LHMGNTULCJOHLTVSBJAVJQ4VE3YLZLVRB15";
  //implements a search function to filter the list view of locations
  this.filteredLocationList = ko.pureComputed(function() {
    return locationList.filter(function(location) {
      return location.title.toLowerCase().indexOf(self.filterQuery().toLowerCase()) == 0;
    })
  })
}

ko.applyBindings(ViewModel);

$('#filterQuery').keyup(function() {
  filterMarkers(self.filterQuery());
  resizeMapBounds();
});

function getFourSquareData(marker, infoWindow) {
  var coordinates = marker.getPosition().toUrlValue();
  var venueSearchUrl = "https://api.foursquare.com/v2/venues/search";
  var parameters = {
    v: "20181220",
    ll: coordinates,
    client_id: self.fourSquareClientId,
    client_secret: self.fourSquareClientSecret,
    query: marker.getTitle(),
    limit: 1
  };

  $.ajax({
    dataType: "json",
    url: venueSearchUrl,
    data: parameters,
    success: function(data) {
      getFourSquarePhotoUrl(marker, infoWindow, data.response.venues[0].id);
    },
    error: function(data, textStatus, errorThrown) {
      onGetFourSquareDataError(marker, infoWindow, data, textStatus, errorThrown);
    },
  });
}

function getFourSquarePhotoUrl(marker, infoWindow, locationId) {
  var venuePhotosUrl = "https://api.foursquare.com/v2/venues/" + locationId + "/photos";
  var parameters = {
    v: "20181220",
    client_id: self.fourSquareClientId,
    client_secret: self.fourSquareClientSecret,
    limit: 1
  };

  $.ajax({
    dataType: "json",
    url: venuePhotosUrl,
    data: parameters,
    success: function(data) {
      var prefix = data.response.photos.items[0].prefix;
      var suffix = data.response.photos.items[0].suffix;
      var size = "height200";
      window.fourSquareData = prefix + size + suffix;
      onGetFourSquareDataSuccess(marker, infoWindow, window.fourSquareData);
    },
    error: function(data, textStatus, errorThrown) {
      onGetFourSquareDataError(marker, infoWindow, data, textStatus, errorThrown);
    },
  });
}

function onGetFourSquareDataSuccess(marker, infoWindow, photoUrl) {
  infoWindow.setContent("<div>" + marker.getTitle() + "</div>" +"<img src=" + photoUrl + ">" +
  "<div>Courtesy: <a target=_blank href=https://foursquare.com> FourSquare</a></div>");
  infoWindow.open(window.map, marker);
  //bring the marker to the center of map to display the infoWindow completely
  window.map.panTo(marker.getPosition());
}

function onGetFourSquareDataError(marker, infoWindow, data, textStatus, errorThrown) {
  infoWindow.setContent("<div>Unable to load FourSquare Image</div>" + "<div>textStatus: "
  + textStatus + "</div>" + "<div>errorThrown: " + errorThrown + "</div>");
  infoWindow.open(window.map, marker);
}
