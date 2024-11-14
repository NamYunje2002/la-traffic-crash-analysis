import API_KEY from './config.js';

const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
script.async = true;
script.defer = true;
document.head.appendChild(script);

const sampleDataPath = '../static/sample';

proj4.defs("EPSG:32618", "+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs");

const utmToLatLng = (easting, northing) => {
   const [lng, lat] = proj4("EPSG:32618", "WGS84", [easting, northing]);
   return { lat, lng };
};

const initMap = async () => {
   const map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 40.7128, lng: -74.0060 },
      zoom: 10,
   });

   const speedResponse = await fetch(`${sampleDataPath}/speed_data.json`);
   const sampleSpeedData = await speedResponse.json(); 

   sampleSpeedData.forEach(speedData => {
      const path = speedData.LINK_POINTS.split(" ").map(coord => {
         const [lat, lng] = coord.split(",").map(Number);
         return { lat, lng };
      });

      const polyline = new google.maps.Polyline({
         path: path,
         geodesic: true,
         strokeColor: "#0000FF",
         strokeOpacity: 0.7,
         strokeWeight: 5,
      });
      polyline.setMap(map);
   });

   const crashResponse = await fetch(`${sampleDataPath}/crash_data.json`);
   const sampleCrashData = await crashResponse.json();

   sampleCrashData.forEach(crashData => {
      const marker = new google.maps.Marker({
         position: { lat: crashData.LATITUDE, lng: crashData.LONGITUDE },
         map: map,
         title: `Accident on ${crashData["ON STREET NAME"] || 'Unknown Street'}`
     });
     const infoWindow = new google.maps.InfoWindow({
      content: `
         <div>
            <h3>${crashData.BOROUGH} Accident</h3>
            <p><strong>Date:</strong> ${crashData["CRASH DATE"]}</p>
            <p><strong>Time:</strong> ${crashData["CRASH TIME"]}</p>
            <p><strong>Street:</strong> ${crashData["ON STREET NAME"] || 'Unknown'}</p>
            <p><strong>Off Street:</strong> ${crashData["OFF STREET NAME"] || 'None'}</p>
            <p><strong>Injuries:</strong> ${crashData["NUMBER OF PERSONS INJURED"]}</p>
            <p><strong>Fatalities:</strong> ${crashData["NUMBER OF PERSONS KILLED"]}</p>
         </div>
      `
      });
      
      marker.addListener('click', () => {
         infoWindow.open(map, marker);
      });
   });

   const volumeResponse = await fetch(`${sampleDataPath}/volume_data.json`);
   const sampleVolumeData = await volumeResponse.json();

   sampleVolumeData.forEach(volumeData => {
         const coords = volumeData.WktGeom.match(/\(([^)]+)\)/)[1].split(" ");
         const easting = parseFloat(coords[0]);
         const northing = parseFloat(coords[1]);

         const { lat, lng } = utmToLatLng(easting, northing);

         const circle = new google.maps.Circle({
            strokeColor: "#8781BD",
            strokeOpacity: 0.8,
            strokeWeight: 1,
            fillColor: "#8781BD",
            fillOpacity: 0.6,
            map: map,
            center: { lat, lng },
            radius: volumeData.Vol * 2
         });
     });
}
window.onload = initMap;