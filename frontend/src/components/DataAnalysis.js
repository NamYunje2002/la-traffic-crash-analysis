import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Circle, Marker, InfoWindow } from "@react-google-maps/api";
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { styles } from './styles';


const DataAnalysis = ({ sensorLocations, speedTimeSeriesData }) => {
  const initialCenter  = {
    lat: 34.0522,
    lng: -118.2437,
  };  

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCollisionLocation, setSelectedCollisionLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(initialCenter); 

  const handleMarkerClick = (location) => {
    setSelectedCollisionLocation(location);
    setMapCenter({
      lat: parseFloat(location.latitude),
      lng: parseFloat(location.longitude),
    });
  };

  const handleAnalyze = (location) => {
    console.log("Analyzing accident data:", location);
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const [collisionLocations, setCollisionLocations] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/collision-data")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        return response.json();
      })
      .then((collisionData) => {
        setCollisionLocations(collisionData);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);
  
  return (
    <div style={styles.grid}>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>시간대별 평균 속도</h2>
        <div style={styles.chartContainer}>
          <ResponsiveContainer>
            <LineChart data={speedTimeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" label={{ value: '시간', position: 'bottom' }} />
              <YAxis label={{ value: '속도 (mph)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgSpeed" stroke="#8884d8" name="평균 속도" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>(그래프2)</h2>
        <div style={styles.chartContainer}>
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="longitude" name="경도" />
              <YAxis type="number" dataKey="latitude" name="위도" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="속도" data={sensorLocations} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ ...styles.card, ...styles.fullWidth }}>
        <h2 style={styles.cardTitle}>특정 사고 분석: 교통 속도 변화</h2>
        <div style={{ marginBottom: "16px" }}>
          <label style={styles.dateLabel}>
            날짜 선택:
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              style={styles.dateInput}
              min="2012-03-01"
              max="2012-06-30"
            />
          </label>
          {selectedDate && (
            <p style={styles.selectedDateText}>선택한 날짜: {selectedDate}</p>
          )}
        </div>
        <div style={styles.mapContainer}>
          <div style={styles.mapText}>
            <LoadScript googleMapsApiKey="API_KEY">
              <GoogleMap 
                mapContainerStyle={styles.mapContainerStyle} 
                zoom={14}
                center={mapCenter} 
                onClick={() => setSelectedCollisionLocation(null)}
              >
                {collisionLocations.length > 0 && collisionLocations.map((location, index) => (
                  <Marker
                    key={index}
                    position={{ 
                      lat: parseFloat(location.latitude), 
                      lng: parseFloat(location.longitude) 
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
                      <h3>사고 정보</h3>
                      <p><strong>날짜:</strong> {selectedCollisionLocation["Date Occurred"]}</p>
                      <p><strong>시간:</strong> {selectedCollisionLocation["Time Occurred"]}</p>
                      <p><strong>위치:</strong> {selectedCollisionLocation.latitude}, {selectedCollisionLocation.longitude}</p>
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
          </div>
        </div>
      </div> 
    </div>
  );
};

export default DataAnalysis;
