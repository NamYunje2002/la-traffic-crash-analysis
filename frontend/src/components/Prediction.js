import React, { useEffect, useState } from 'react';
import { styles } from './styles';
import { GoogleMap, InfoWindow, LoadScript, Marker } from '@react-google-maps/api';
import CustomDatePicker from './CustomDatePicker';
import MapModal from './MapModal';

const Prediction = ({ googleMapsApiKey, laCoordinates }) => {
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
        throw new Error('API 호출 실패:', response.status);
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
    <div style={styles.grid}>
      <div style={{ ...styles.card, ...styles.fullWidth }}>
        {mapModalIsOpen && (
          <MapModal
            isOpen={mapModalIsOpen}
            onClose={() => setMapModalIsOpen(false)}
            collisionLocation={selectedCollisionLocation}
          />
        )}
        <h2 style={styles.cardTitle}>특정 교통사고 분석</h2>
        <CustomDatePicker
          minDate={minDate}
          maxDate={maxDate}
          handleSearch={handleCollisionSearchByDate}
        />
        <div style={styles.mapContainer}>
          <div style={styles.mapText}>
            {googleMapsApiKey ? (
              <LoadScript googleMapsApiKey={googleMapsApiKey}>
                <GoogleMap
                  mapContainerStyle={styles.mapContainerStyle}
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
                      <div>
                        <h3>교통사고 정보</h3>
                        <p>
                          <strong>날짜:</strong> {selectedCollisionLocation['Date Occurred']}
                        </p>
                        <p>
                          <strong>시간:</strong> {selectedCollisionLocation['Time Occurred']}
                        </p>
                        <p>
                          <strong>위치:</strong> {selectedCollisionLocation.latitude},{' '}
                          {selectedCollisionLocation.longitude}
                        </p>
                        <button
                          style={styles.analyzeButton}
                          onClick={() => handleAnalyze(selectedCollisionLocation)}
                        >
                          분석
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            ) : (
              '구글 맵 로딩 중..'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prediction;
