// $(document).ready() is a jQuery function that delays executing the passed in
// JavaScript function until the browser has loaded all of the HTML.
$(document).ready(function() {
  // The first part of this is the same as what we've done before, but a little more concise...
  var DAYTON = [39.7589, -84.1916];

  // Ok, now we have to get the data. We'll use jQuery here to make things
  // easier on us.
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
      var markerLayer   = L.markerClusterGroup();
      // Ok, now we have an array of locations. We can now plot those on our map!
      len           = locations.length;
      var location;
      var bluemarker  = [];  //Seperate the markers into red/blue/other
      var redmarker   = [];
      var namarker    = [];
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
          if (location.team      == "Blue"){
              bluemarker.push(marker.addTo(markerLayer)
                    .bindPopup(L.Util.template(infoTemplate, location)));
          }else if (location.team == "Red") {
              redmarker.push(marker.addTo(markerLayer)
                    .bindPopup(L.Util.template(infoTemplate, location)));
          }else{
              namarker.push(marker.addTo(markerLayer)
                    .bindPopup(L.Util.template(infoTemplate, location)));
          }
          //marker.addTo(markerLayer)
          //      .bindPopup(L.Util.template(infoTemplate, location));
      }
      var red   = L.layerGroup(redmarker);
      var blue  = L.layerGroup(bluemarker);
      var na    = L.layerGroup(namarker);
      var allmarker = redmarker.concat(bluemarker);
      allmarker    = allmarker.concat(namarker);
      var allm  = L.layerGroup(allmarker);
      //-------------Setting up the map ---------------
      var mymap = L.map('map',{
        layers:[red, blue, na],
        type:'markercluster'
        }).setView(DAYTON, 8);
      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 22,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mymap);

      var overlaymarkers={
        "Red Team": red,
        "Blue Team":blue,
        "Support":na,
        "All": allm
      }
      markerLayer.addTo(mymap);
      L.control.layers(overlaymarkers).addTo(mymap);

      //_________________Bad Lands Area Layer___________________________________
      // Add Boundary layers
      var bdAreaLayer   = L.featureGroup();
      bdAreaLayer.addTo(mymap);

      var bdAreaPopup           = function(feature, layer) {
            var bdAreaTemplate  = '<h2>{Name}</h2><p>Walkie Channel: {Walkie_Chn}</p><p>Area ID: {AREA_ID}</p>';
            layer.bindPopup(L.Util.template(bdAreaTemplate, feature.properties));
      };

      // First, we need to load the GeoJSON file
      $.get('watcharea.json', function(data) {
          // L.geoJSON takes a second argument for processing options. Here, we're
          // telling Leaflet to run our bindPopup function (defined above) on
          // each feature in the counties.oh.json geojson file.
          L.geoJson(data, {
              onEachFeature: bdAreaPopup
          }).addTo(bdAreaLayer);


      }); // $.get()
      // Now we can zoom the map to the extent of the markers
      mymap.fitBounds(markerLayer.getBounds());
    });

}); // document.ready()
