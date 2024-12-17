import React, { useEffect, useRef, useState } from 'react';
import Modal from 'react-modal';
import { Slider } from '@mui/material';
import { GoogleMap, Marker, Circle } from '@react-google-maps/api';
import { styles } from './styles';
import AverageSpeedChart from './AverageSpeedChart';

const MapMdal = ({ isOpen, onClose, collisionLocation }) => {
  const [mapCenter, setMapCenter] = useState({
    lat: collisionLocation.latitude,
    lng: collisionLocation.longitude,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCircle, setSelectedCircle] = useState(null);

  const [loading, setLoading] = useState(true);

  const [realSpeedData, setRealSpeedData] = useState(null);
  const [predictedSpeedData, setPredictedSpeedData] = useState(null);

  const [selectedDatetime, setSelectedDatetime] = useState(null);
  const [selectedCombinedData, setSelectedCombinedData] = useState(null);
  const [mapZoom, setMapZoom] = useState(13);

  const map1Ref = useRef(null);
  const map2Ref = useRef(null);
  const isSyncingRef = useRef(false);
  const [radius, setRadius] = useState(100);

  const [combinedData, setCombinedData] = useState(null);

  const handleSliderChange = (event, value) => {
    setRadius(value);
  };

  const handleMapChange = (sourceMapRef, targetMapRef, updateCenter = true, updateZoom = true) => {
    if (isSyncingRef.current || !sourceMapRef.current || !targetMapRef.current) {
      return;
    }
    isSyncingRef.current = true;

    const sourceMap = sourceMapRef.current;
    const targetMap = targetMapRef.current;

    if (updateCenter) {
      const center = sourceMap.getCenter();
      if (center !== null) {
        targetMap.setCenter({ lat: center.lat(), lng: center.lng() });
      }
    }

    if (updateZoom) {
      const zoom = sourceMap.getZoom();
      targetMap.setZoom(zoom);
    }

    isSyncingRef.current = false;
  };

  const onLoadMap1 = (map) => {
    map1Ref.current = map;
  };

  const onLoadMap2 = (map) => {
    map2Ref.current = map;
  };

  const getCircleColor = (speed) => {
    if (speed > 60) return '#00FF00';
    if (speed > 50) return '#ADFF2F';
    if (speed > 40) return '#FFFF00';
    if (speed > 30) return '#FFA500';
    if (speed > 20) return '#FF4500';
    return '#FF0000';
  };

  const renderSpeedCircles = (speeds) => {
    const getSpeedRange = (speed) => {
      if (speed > 60) return '60+';
      if (speed > 50) return '51-60';
      if (speed > 40) return '41-50';
      if (speed > 30) return '31-40';
      if (speed > 20) return '21-30';
      return '0-20';
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem' }}>
        {speeds.map((speed, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: getCircleColor(speed),
              }}
            ></div>
            <span>{`${getSpeedRange(speed)} km/h`}</span>
          </div>
        ))}
      </div>
    );
  };

  const parseCoordinates = (key) => {
    const [lat, lng] = key.replace('(', '').replace(')', '').split(', ').map(Number);
    return { lat, lng };
  };

  const filterDataByLocation = (speedData, location) => {
    if (!location || !speedData) return [];
    const rsl = [];
    speedData.forEach((speedDataByTime) => {
      const time = new Date(speedDataByTime['Date Occurred']).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      });
      Object.entries(speedDataByTime).forEach(([key, value]) => {
        const currentCoordinate = parseCoordinates(key);
        if (currentCoordinate.lat === location.lat && currentCoordinate.lng === location.lng) {
          rsl.push({ time: time, speed: value });
        }
      });
    });
    return rsl;
  };

  const processData = (data) => {
    const groupedData = {};

    data.forEach((entry) => {
      const { 'Date Occurred': dateOccurred, ...speeds } = entry;

      const time = new Date(dateOccurred).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      });

      const speedValues = Object.values(speeds).filter((value) => typeof value === 'number');
      const averageSpeed = speedValues.reduce((sum, speed) => sum + speed, 0) / speedValues.length;

      if (!groupedData[time]) {
        groupedData[time] = [];
      }
      groupedData[time].push(averageSpeed);
    });

    const processedData = Object.entries(groupedData).map(([time, speeds]) => ({
      time,
      speed: speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length,
    }));

    return processedData;
  };

  const renderCircles = (data, getCircleColor) => {
    return Object.entries(data)
      .filter(([key]) => !isNaN(parseCoordinates(key).lat))
      .map(([key, speed], index) => {
        const { lat, lng } = parseCoordinates(key);
        const isSelected = selectedCircle?.lat === lat && selectedCircle?.lng === lng;

        return (
          <Circle
            key={`${index}-${lat}-${lng}`}
            center={{ lat, lng }}
            radius={180}
            options={{
              fillColor: getCircleColor(speed),
              fillOpacity: 0.5,
              strokeColor: isSelected ? '#000000' : getCircleColor(speed),
              strokeOpacity: isSelected ? 1 : 0.8,
              strokeWeight: isSelected ? 3 : 1,
            }}
            onClick={() => {
              if (isSelected) {
                setSelectedCircle(null);
                setSelectedLocation(null);
              } else {
                setSelectedCircle({ lat, lng });
                setSelectedLocation({ lat, lng });
              }
            }}
          />
        );
      });
  };

  useEffect(() => {
    const fetchSpeedData = async () => {
      try {
        setLoading(true);

        const apiUrl = `/api/traffic-speeds?latitude=${collisionLocation.latitude}
        &longitude=${collisionLocation.longitude}
        &datetime=${collisionLocation['Date Occurred']} ${collisionLocation['Time Occurred']}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        const realSpeed = data.real_speed_trends || [];
        const predictedSpeed = data.predicted_speed_trends || [];
        const minLength = Math.min(realSpeed.length, predictedSpeed.length);

        setRealSpeedData(realSpeed);
        setPredictedSpeedData(predictedSpeed);
        setCombinedData(
          Array.from({ length: minLength }, (_, i) => ({
            realRow: realSpeed[i],
            predictedRow: predictedSpeed[i],
          })),
        );
      } catch (error) {
        console.error('Error:' + error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpeedData();
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      styles={styles.modalContent}
      contentLabel="Traffic Analysis Modal"
    >
      <div style={styles.grid}>
        <div style={(styles.card, styles.fullWidth)}>
          <div style={styles.cardTitle}>
            교통사고 발생 날짜: {collisionLocation['Date Occurred']}{' '}
            {collisionLocation['Time Occurred']}
            <button onClick={onClose} style={styles.modalCloseButton}>
              &times;
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {realSpeedData && (
              <div>
                {combinedData.map((row, index) => {
                  const realDate = row.realRow['Date Occurred'];
                  const predictedDate = row.predictedRow['Date Occurred'];
                  return (
                    <button
                      key={realDate}
                      style={{
                        padding: '10px 20px',
                        margin: '5px',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        backgroundColor: selectedDatetime === realDate ? '#007bff' : '#f1f1f1',
                        color: selectedDatetime === realDate ? '#fff' : '#000',
                        transition: 'background-color 0.3s',
                      }}
                      onClick={() => {
                        setSelectedDatetime(realDate);
                        setSelectedCombinedData({ real: row.realRow, predicted: row.predictedRow });
                      }}
                    >
                      {realDate}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          '로딩 중..'
        ) : (
          <>
            <div style={styles.fullWidth}>{renderSpeedCircles([10, 25, 35, 45, 55, 65])}</div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>실제 데이터</div>
              <div style={{ ...styles.mapContainer }}>
                <GoogleMap
                  mapContainerStyle={styles.mapContainerStyle}
                  zoom={mapZoom}
                  center={mapCenter}
                  onCenterChanged={() => handleMapChange(map1Ref, map2Ref, true, false)}
                  onZoomChanged={() => handleMapChange(map1Ref, map2Ref, false, true)}
                  onLoad={onLoadMap1}
                >
                  <Marker position={mapCenter} />
                  <Circle
                    center={mapCenter}
                    radius={radius}
                    options={{
                      fillOpacity: 0,
                      strokeColor: '#000000',
                      strokeWeight: 3,
                    }}
                  />
                  {selectedCombinedData && renderCircles(selectedCombinedData.real, getCircleColor)}
                </GoogleMap>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>예측 데이터</div>
              <div style={{ ...styles.mapContainer }}>
                <GoogleMap
                  mapContainerStyle={styles.mapContainerStyle}
                  zoom={mapZoom}
                  center={mapCenter}
                  onCenterChanged={() => handleMapChange(map2Ref, map1Ref, true, false)}
                  onZoomChanged={() => handleMapChange(map2Ref, map1Ref, false, true)}
                  onLoad={onLoadMap2}
                >
                  <Marker position={mapCenter} />
                  <Circle
                    center={mapCenter}
                    radius={radius}
                    options={{
                      fillOpacity: 0,
                      strokeColor: '#000000',
                      strokeWeight: 3,
                    }}
                  />
                  {selectedCombinedData &&
                    renderCircles(selectedCombinedData.predicted, getCircleColor)}
                </GoogleMap>
              </div>
            </div>
            <div
              style={{
                ...styles.fullWidth,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <span>사고 반경 조절 ({radius}m)</span>
              <Slider
                defaultValue={radius}
                value={radius}
                onChange={handleSliderChange}
                min={0}
                max={500}
                step={1}
                sx={{ width: 300 }}
              />
            </div>
            <div style={{ ...styles.card, ...styles.fullWidth }}>
              <div style={styles.cardTitle}>시간대별 평균 속도 변화</div>
              <AverageSpeedChart
                realSpeedData={processData(realSpeedData)}
                predictedSpeedData={processData(predictedSpeedData)}
              />
            </div>
            <div style={{ ...styles.card, ...styles.fullWidth }}>
              <div style={styles.cardTitle}>선택된 위치의 속도 변화</div>
              {selectedLocation ? (
                <AverageSpeedChart
                  realSpeedData={filterDataByLocation(realSpeedData, selectedLocation)}
                  predictedSpeedData={filterDataByLocation(predictedSpeedData, selectedLocation)}
                />
              ) : (
                <p>위치를 선택하여 데이터를 확인하세요.</p>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default MapMdal;
