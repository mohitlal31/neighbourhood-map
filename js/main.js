var map;
var marker;
var bounds;

function initMap()
{
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 12.971599, lng: 77.594563},
    zoom: 13
  });

  bounds = new google.maps.LatLngBounds();

  for(var i=0; i<locationList.length; ++i)
  {
    //create a marker for every location and add it to the 'markers' array
    addMarker(locationList[i]);
    self.markers.push(marker);
  }
  resizeMapBounds();
}

function addMarker(location) {
  marker = new google.maps.Marker({
    map: map,
    position: location.location,
    animation: google.maps.Animation.DROP,
    title: location.title
  });

  //display an infoWindow when marker is clicked
  var largeInfoWindow = new google.maps.InfoWindow();
  marker.addListener('click', function() {
    populateInfoWindow(this, largeInfoWindow);
  });

  largeInfoWindow.addListener('closeclick', function() {
    resizeMapBounds();
  });
}

//adjust the bounds of the map to fit all markers on the screen
function resizeMapBounds() {
  for(var i=0; i<self.markers.length; ++i) {
    if(self.markers[i].getMap() == map) {
      if(!bounds.contains(self.markers[i].position)) {
        bounds.extend(self.markers[i].position);
      }
    }
  }
  map.fitBounds(bounds);
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

function populateInfoWindow(marker, infoWindow)
{
    //constant '4' is a hack to make the marker bounce twice on click then stop.
    marker.setAnimation(4);
    infoWindow.setContent('mohit');
    infoWindow.open(map, marker);
}



var ViewModel = function() {
  var self = this;
  this.markers = [];
  this.filterQuery = ko.observable('');
  //implements a search function to filter the list of locations and markers
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
