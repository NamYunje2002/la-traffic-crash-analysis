import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { styles } from './styles';
import CustomDatePicker from './CustomDatePicker';
import MapModal from './MapModal';

const DataAnalysis = () => {
  const minDate = new Date('2012-03-01');
  const maxDate = new Date('2012-06-30');

  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/google-maps-key');
        const data = await response.json();
        setGoogleMapsApiKey(data.apiKey);
      } catch (error) {
        console.error('Error fetching API key:', error);
      }
    };

    fetchApiKey();
  }, []);

  const initialCenter = {
    lat: 34.0522,
    lng: -118.2437,
  };

  const [scatterData, setScatterData] = useState([]);
  const [histogramData, setHistogramData] = useState([]);

  const [mapCenter, setMapCenter] = useState(initialCenter);
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
    fetch('http://localhost:5000/api/collision-data?type=scatter')
      .then((response) => response.json())
      .then((data) => setScatterData(data))
      .catch((error) => console.error('Error fetching scatter data:', error));
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/collision-data?type=histogram')
      .then((response) => response.json())
      .then((data) =>
        setHistogramData(
          data.map((item) => ({
            range: `${item.range} to ${item.range + 10}`,
            count: item.count,
          })),
        ),
      )
      .catch((error) => console.error('Error fetching histogram data:', error));
  }, []);

  useEffect(() => {
    handleCollisionSearchByDate(minDate, maxDate).catch((error) => console.log('Error: ', error));
  }, []);

  return (
    <div style={styles.grid}>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>사고 전후 평균 속도 비교</h2>
        <div style={styles.chartContainer}>
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid />
              <XAxis type="number" dataKey="preSpeed" name="Pre-Accident Speed" unit="km/h" />
              <YAxis type="number" dataKey="postSpeed" name="Post-Accident Speed" unit="km/h" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Speed Change" data={scatterData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ ...styles.card, ...styles.fixHeight }}>
        <h2 style={styles.cardTitle}>속도 변화 분포</h2>
        <ResponsiveContainer height={400}>
          <BarChart data={histogramData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="range"
              label={{
                value: 'Speed Change (km/h)',
                position: 'insideBottom',
                offset: -10,
              }}
            />
            <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

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

export default DataAnalysis;
