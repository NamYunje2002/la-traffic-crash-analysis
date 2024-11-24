import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
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
  ResponsiveContainer 
} from 'recharts';
import { styles } from './styles';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { ko } from "date-fns/locale";

const DataAnalysis = ({ sensorLocations, speedTimeSeriesData }) => {
  const initialCenter  = {
    lat: 34.0522,
    lng: -118.2437,
  };  

  const minDate = new Date("2012-03-01");
  const maxDate = new Date("2012-06-30");

  const [scatterData, setScatterData] = useState([]);
  const [histogramData, setHistogramData] = useState([]);

  const [mapCenter, setMapCenter] = useState(initialCenter); 
  const [selectedCollisionLocation, setSelectedCollisionLocation] = useState(null);
  const [collisionLocations, setCollisionLocations] = useState([]);
  const [startDateTime, setStartDateTime] = useState(minDate);
  const [endDateTime, setEndDateTime] = useState(maxDate);

  useEffect(() => {
    fetch("http://localhost:5000/api/collision-data?type=scatter")
      .then((response) => response.json())
      .then((data) => setScatterData(data))
      .catch((error) => console.error("Error fetching scatter data:", error));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/collision-data?type=histogram")
      .then((response) => response.json())
      .then((data) =>
        setHistogramData(
          data.map((item) => ({
            range: `${item.range} to ${item.range + 10}`,
            count: item.count,
          }))
        )
      )
      .catch((error) => console.error("Error fetching histogram data:", error));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/collisions")
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
  
  const handleMarkerClick = (location) => {
    setSelectedCollisionLocation(location);
    setMapCenter({
      lat: parseFloat(location.latitude),
      lng: parseFloat(location.longitude),
    });
  };

  // 사고 데이터를 포함한 API 호출 함수
const analyzeSpeed = async (collisionData) => {
  try {
      const response = await fetch('http://localhost:5000/api/analyze-traffic', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json', // JSON 데이터 전송
          },
          body: JSON.stringify(collisionData), // 사고 데이터를 JSON으로 변환하여 전송
      });

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data; // 성공적으로 받아온 데이터를 반환
  } catch (error) {
      console.error('Error fetching traffic analysis:', error);
  }
};


  const handleAnalyze = async (location) => {
    console.log(location);
  };

  const handleSearch = async () => {
    const apiUrl = `/api/collisions?start_datetime=${startDateTime}&end_datetime=${endDateTime}`;

    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        setCollisionLocations(data);
      } else {
        console.error("API 호출 실패:", response.status);
      }
    } catch (error) {
      console.error("API 호출 에러:", error);
    }
  };
  
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
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Legend />
              <Scatter name="Speed Change" data={scatterData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ ...styles.card, ...styles.fixHeight }}>
        <h2 style={styles.cardTitle}>속도 변화 분포</h2>
        <ResponsiveContainer>
          <BarChart data={histogramData} >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" label={{ value: "Speed Change (km/h)", position: "insideBottom", offset: -10 }} />
            <YAxis label={{ value: "Frequency", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div style={{ ...styles.card, ...styles.fullWidth }}>
        <h2 style={styles.cardTitle}>특정 교통사고 분석</h2>
        <div style={{ margin: "32px 0px" }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} locale={ko}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <DateTimePicker
                label="시작 날짜"
                value={startDateTime}
                onChange={(newValue) => setStartDateTime(newValue)}
                minDateTime={minDate}
                maxDateTime={maxDate}
                ampm={false}
                format="yyyy-MM-dd HH:mm"
              />
              <span>-</span>
              <DateTimePicker
                label="종료 날짜"
                value={endDateTime}
                onChange={(newValue) => setEndDateTime(newValue)}
                minDateTime={startDateTime}
                maxDateTime={maxDate}
                ampm={false}
                format="yyyy-MM-dd HH:mm"
              />
              <button
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                onClick={handleSearch}
              >
                검색
              </button>
            </div>
          </LocalizationProvider>
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
                      <h3>교통사고 정보</h3>
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
