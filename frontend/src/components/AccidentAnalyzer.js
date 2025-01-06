import React, { useEffect, useState } from 'react';
import { GoogleMap, InfoWindow, LoadScript, Marker } from '@react-google-maps/api';
import CustomDatePicker from './CustomDatePicker';
import MapModal from './MapModal';

const AccidentAnalyzer = ({ googleMapsApiKey }) => {
  const laCoordinates = {
    lat: 34.0522,
    lng: -118.2437,
  };

  const minDate = new Date('2012-03-01');
  const maxDate = new Date('2012-06-30');

  const [mapCenter, setMapCenter] = useState(laCoordinates);
  const [collisionLocations, setCollisionLocations] = useState([]);
  const [selectedCollisionLocation, setSelectedCollisionLocation] = useState(null);

  const [mapModalIsOpen, setMapModalIsOpen] = useState(false);

  const handleMarkerClick = (location) => {
    setSelectedCollisionLocation(location);
    setMapCenter({
      lat: parseFloat(location.latitude),
      lng: parseFloat(location.longitude),
    });
  };

  const handleAnalyze = async (location) => {
    setMapModalIsOpen(true);
  };

  const handleCollisionSearchByDate = async (startDateTime, endDateTime) => {
    let apiUrl = `/api/collisions?start_datetime=${startDateTime}&end_datetime=${endDateTime}`;
    if (startDateTime === undefined || endDateTime === undefined) {
      apiUrl = '/api/collisions';
    }
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('API call failed:', response.status);
      }
      const data = await response.json();
      setCollisionLocations(data);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    handleCollisionSearchByDate(minDate, maxDate).catch((error) => console.error('Error: ', error));
  }, []);

  return (
    <div className="grid gap-6 p-6">
      <div className="bg-white shadow-md rounded-lg w-full p-6">
        {mapModalIsOpen && (
          <MapModal
            isOpen={mapModalIsOpen}
            onClose={() => setMapModalIsOpen(false)}
            collisionLocation={selectedCollisionLocation}
          />
        )}
        <h2 className="text-xl font-bold mb-4">Accident Analysis</h2>
        <CustomDatePicker
          minDate={minDate}
          maxDate={maxDate}
          handleSearch={handleCollisionSearchByDate}
        />
        <div className="mt-4 relative">
          {googleMapsApiKey ? (
            <LoadScript googleMapsApiKey={googleMapsApiKey}>
              <GoogleMap
                mapContainerClassName="w-full h-[40rem] rounded-lg"
                zoom={14}
                center={mapCenter}
                onClick={() => setSelectedCollisionLocation(null)}
              >
                {collisionLocations.length > 0 &&
                  collisionLocations.map((location, index) => (
                    <Marker
                      key={index}
                      position={{
                        lat: parseFloat(location.latitude),
                        lng: parseFloat(location.longitude),
                      }}
                      title={`Date: ${location['Date Occurred']}, Time: ${location['Time Occurred']}`}
                      onClick={() => handleMarkerClick(location)}
                    />
                  ))}

                {selectedCollisionLocation && (
                  <InfoWindow
                    position={{
                      lat: parseFloat(selectedCollisionLocation.latitude),
                      lng: parseFloat(selectedCollisionLocation.longitude),
                    }}
                    options={{
                      disableAutoPan: true,
                      pixelOffset: new window.google.maps.Size(0, -40),
                    }}
                    onCloseClick={() => setSelectedCollisionLocation(null)}
                  >
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">Accident Information</h3>
                      <p>
                        <strong>Date:</strong> {selectedCollisionLocation['Date Occurred']}
                      </p>
                      <p>
                        <strong>Time:</strong> {selectedCollisionLocation['Time Occurred']}
                      </p>
                      <p>
                        <strong>Location:</strong> {selectedCollisionLocation.latitude},{' '}
                        {selectedCollisionLocation.longitude}
                      </p>
                      <button
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => handleAnalyze(selectedCollisionLocation)}
                      >
                        Analyze
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </LoadScript>
          ) : (
            'Loading Google Maps...'
          )}
        </div>
      </div>
    </div>
  );
};

export default AccidentAnalyzer;
