// $(document).ready() is a jQuery function that delays executing the passed in
// JavaScript function until the browser has loaded all of the HTML.
$(document).ready(function() {
  var DAYTON = [39.7589, -84.1916];  // Var to point the map too

  //-------------Different Types of Maps---------
  var Streetmap= L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 22,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });//.addTo(mymap);

  var Stamen_Terrain = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
  	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  	subdomains: 'abcd',
  	minZoom: 0,
  	maxZoom: 18,
  	ext: 'png'
  });

  var Roads =   L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/roads_and_labels/{z}/{x}/{y}.png', {
 	  attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });

  // https: also suppported.
  var Esri_WorldImagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	   attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
     maxZoom:18
   });

   //---------------------------------------
   // Set the Map ------------------------
   var mymap = L.map('map',{
     layers:[Streetmap]
   }).setView(DAYTON, 8);

   // Map choices.----------
   var baseMaps={
     "Street":Streetmap,
     "TopoMap":Stamen_Terrain,
     "WorldImagery":Esri_WorldImagery,
     "Roads_Labels":Roads
  };

  // ----------------Markers ---------------------
  var red, blue, na, allm; // These will be the markers for map
  var bluemarker  = [];  //Seperate the markers into red/blue/other
  var redmarker   = [];
  var namarker    = [];
  var allmarker;
  // Here we are using jQuery to get the Marker data
  $.get('TalkTruth.txt', function(data) {
      // jQuery gives us back the data as a big string, so the first step
      // is to split on the newlines
      var lines     = data.split('\n');
      var i, values;
      var len       = lines.length;
      var locations = [];
      for (i = 0; i < len; i++) {
          // for each line, split on the tab character. The latitude and longitude
          // values are in the first and second positions respectively.
          values    = lines[i].split('\t');

          // We have the header line of the tsv as well as the ending newline
          // to take care of.
          // Only keep lines that have a numeric value in the first and second
          // slots
          if (!isNaN(values[0]) && !isNaN(values[1])) {
              locations.push({
                  latitude:   Number(values[0]),
                  longitude:  Number(values[1]),
                  name:         values[2],
                  type:         values[3],
                  description:  values[5],
                  team:         values[6],
                  phone:        values[7],
                  icon:         values[8]
              });
          }
      }

      // infoTemplate is a string template for use with L.Util.template()
      var infoTemplate = '<h2>{name}</h2><p>Info: {description}</p><p>Phone: {phone}</p>';

      // Ok, now we have an array of locations. We can now plot those on our map!
      len           = locations.length;
      var location;
      for (i = 0; i < len; i++) {
          location  = locations[i];
          // Here we're defining a new icon to use on our map.
          var icondir     = 'icons/';
          var iconpre     = '.png';
          var iconname    = icondir.concat(location.icon,iconpre);
          var customIcon  = L.icon({
                     iconUrl: iconname,
                     iconSize: [65,65]
                 });
          var marker;
              marker      = L.marker([location.latitude, location.longitude], {
                  icon: customIcon

              });
              marker.bindPopup(L.Util.template(infoTemplate,location));
          if (location.team      == "Blue"){
            bluemarker.push(marker);
          }else if (location.team == "Red") {
              redmarker.push(marker);
          }else{
              namarker.push(marker);
          }
      }


    red   = L.markerClusterGroup().addLayers(redmarker);
    blue  =  L.markerClusterGroup().addLayers(bluemarker);
    //blue  = L.layerGroup(bluemarker);
    na    =  L.markerClusterGroup().addLayers(namarker);
    allmarker = redmarker.concat(bluemarker);
    allmarker    = allmarker.concat(namarker);
    allm  =  L.markerClusterGroup().addLayers(allmarker);
    allm.addTo(mymap);

    // Now we can zoom the map to the extent of the markers
    mymap.fitBounds(allm.getBounds());

    //-------------Setting up the map ---------------
    var overlaymarkers={
        "Red Team": red,
        "Blue Team":blue,
        "Support":na,
        "All": allm
    }
    L.control.layers(overlaymarkers, baseMaps).addTo(mymap);
    });//$.get()

    //_________________Bad Lands Area Layer___________________________________
    // Add Boundary layers
    var bdAreaLayer   = L.featureGroup();
    bdAreaLayer.addTo(mymap);


    var bdAreaPopup           = function(feature, layer) {
            var bdAreaTemplate  = '<h2>{Name}</h2><p>Walkie Channel: {Walkie_Chn}</p><p>Area ID: {AREA_ID}</p>';
            layer.bindPopup(L.Util.template(bdAreaTemplate, feature.properties));
    };

      // First, we need to load the GeoJSON file
    $.getJSON('watcharea.json', function(data) {
          // L.geoJSON takes a second argument for processing options. Here, we're
          // telling Leaflet to run our bindPopup function (defined above) on
          // each feature in the counties.oh.json geojson file.
          L.geoJson(data, {
              onEachFeature: bdAreaPopup
          }).addTo(bdAreaLayer);
        //  mymap.fitBounds(bdAreaLayer.getBounds());
    }); // $.get()

    // Set the Map

}); // document.ready()
