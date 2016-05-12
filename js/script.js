//************my map ********************
//global variables
var map;
var markers = [];
var infowindow;
//Google Maps API success callback
function initMap() {
  "use strict";
  var mapOptions = {
    center: {
      lat: 50.7781,
      lng: -1.0833
    },
    zoom: 12,
    disableDefaultUI: true
  };

  var mapCanvas = document.getElementById('map');
  // Create the map
  map = new google.maps.Map(mapCanvas, mapOptions);
  //Create Info Windows
  infowindow = new google.maps.InfoWindow({
    maxWidth: 200
  });
  //for each place in data array create marker
  //var i;
  for (var i = 0; i < mylist.length; i++) {
    createMarker(i);
  }
  //this function create each marker
  function createMarker(i) {
    var place = mylist[i];
    var marker = new google.maps.Marker({
      position: {lat: place.lat, lng: place.lng},
      title: place.name
    });
    marker.setMap(map);
    place.marker = marker;
    //Push each marker into array
    markers.push(marker);

    //animate marker
    function toggleBounce() {
      if (place.marker.getAnimation()) {
        place.marker.setAnimation(null);
      } else {
        place.marker.setAnimation(google.maps.Animation.BOUNCE);
      }
      setTimeout(function() {
        place.marker.setAnimation(null);
      }, 2000);
    }

    //Request data from MediaWiki API
    function loadWiki(clickedMarker){
      //building url for our request
      var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' +
       mylist[i].name + '&' + mylist[i].address + '&format=json&callback=wikiCallback';
      //after me review added setTimeout function for error handling with JSON P
      var wikiRequestTimeout = setTimeout(function(){
        contentString = '<p>"Failed to get wikipedia resources."<p>';
        //alert(contentString);
        infowindow.setContent(contentString);
        infowindow.open(map,clickedMarker);
        toggleBounce();
      }, 5000);

      //replased success method with done as the first is deprecated.
      //remove error method as it is not build in jsonp, instead I put setTimeout.

      $.ajax({
        url: wikiUrl,
        dataType: "jsonp",
        jsonp: "callback"
      }).done(function( response ) {
          var name = response[1];
          //var name = response[0];
          var descrStr = response[2];
          //var urlStr = response[3];
          var url = 'http://en.wikipedia.org/wiki/' + name;
          var contentString = '<div><h4>' + name + '</h4>' + '<p id = "descr">' + descrStr +
           '</p><p><b>Learn more about</b>: <a href="' + url + '">' + name + '</a></p></div>';

          infowindow.setContent(contentString);
          infowindow.open(map,clickedMarker);
          toggleBounce();
          //added after my review
          clearTimeout(wikiRequestTimeout);
        });
    }

   //Event listeners, when marker is clicked request data from wiki to
   //build infowindow content string
    google.maps.event.addListener(marker, 'click', function() {
    loadWiki(this);
    map.panTo(marker.position);
    //map.setZoom(16);
    });
  }

 //thanks to Ashley Davison, https://github.com/AshleyED/NeighborhoodMap
 //event listener, map resize and remain centered in response to a window resize
  google.maps.event.addDomListener(window, "resize", function() {
    var center = map.getCenter();
    google.maps.event.trigger(map, "resize");
    map.setCenter(center);
  });
  ko.applyBindings(new ViewModel());
} //end of initMap

//error message if Google Maps API call fails.
function googleError() {
  $('#map').html('<h3>"Google map failed to load. Please try again later."<h3>');
}

var Loc = function(data) {
  this.name = ko.observable(data.name);
  this.address = ko.observable(data.address);
  this.descrString = ko.observable(data.descrString);
  this.lat = ko.observable(data.lat);
  this.lng = ko.observable(data.lng);
  this.marker = '';
};

// *********** viewModel *******************

var ViewModel = function() {
  var self = this;
  this.locList = ko.observableArray([]);

  //Create place object. Push to array.
  mylist.forEach(function(locItem) {
    self.locList.push(new Loc(locItem));
  });

  // set first place
  this.currentLoc = ko.observable(this.locList()[0]);

  this.setLoc = function(clickedLoc) {
    self.currentLoc(clickedLoc);
    google.maps.event.trigger(clickedLoc.marker, 'click');
    //google.maps.event.trigger(this.marker, 'click');
  };

  //store and observe the user input string
  this.searchStr = ko.observable("");
  this.points = ko.observableArray(mylist);

  //The filter
  this.search = ko.computed(function() {
    return ko.utils.arrayFilter(self.points(), function(point) {
      if (point.name.toLowerCase().indexOf(self.searchStr().toLowerCase()) >= 0) {
        point.marker.setVisible(true);
        return true;
      } else {
        point.marker.setVisible(false);
        return false;
      }
    });
  });
}; //end of viewModel

