import React, { useEffect, useRef, useState } from 'react';
import Modal from 'react-modal';
import { GoogleMap, Marker, Circle } from '@react-google-maps/api';
import { styles } from './styles';

const MapMdal = ({ isOpen, onClose, collisionLocation }) => {
  const [loading, setLoading] = useState(true);
  const [realSpeedData, setRealSpeedData] = useState(null);
  const [predictedSpeedData, setPredictedSpeedData] = useState(null);
  const [selectedDatetime, setSelectedDatetime] = useState(null);
  const [mapCenter, setMapCenter] = useState({
    lat: collisionLocation.latitude,
    lng: collisionLocation.longitude,
  });
  const [mapZoom, setMapZoom] = useState(13);
  const map1Ref = useRef(null);
  const map2Ref = useRef(null);
  const isSyncingRef = useRef(false);

  const [combinedData, setCombinedData] = useState(null);

  const handleMapChange = (sourceMapRef, targetMapRef, updateCenter = true, updateZoom = true) => {
    if (isSyncingRef.current || !sourceMapRef.current || !targetMapRef.current) return;
    isSyncingRef.current = true;

    const sourceMap = sourceMapRef.current;
    const targetMap = targetMapRef.current;

    if (updateCenter) {
      const center = sourceMap.getCenter();
      targetMap.setCenter({ lat: center.lat(), lng: center.lng() });
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
    if (speed > 90) return '#0000FF';
    if (speed > 80) return '#00BFFF';
    if (speed > 70) return '#00FF00';
    if (speed > 60) return '#ADFF2F';
    if (speed > 50) return '#FFFF00';
    if (speed > 40) return '#FFA500';
    if (speed > 30) return '#FF4500';
    return '#FF0000';
  };

  const parseCoordinates = (key) => {
    const [lat, lng] = key.replace('(', '').replace(')', '').split(', ').map(Number);
    return { lat, lng };
  };

  const renderCircles = (data, getCircleColor) => {
    return Object.entries(data).map(([key, speed], index) => {
      const { lat, lng } = parseCoordinates(key);

      return (
        <Circle
          key={`${index}-${lat}-${lng}`}
          center={{ lat, lng }}
          radius={200}
          options={{
            fillColor: getCircleColor(speed),
            fillOpacity: 0.5,
            strokeColor: getCircleColor(speed),
            strokeOpacity: 0.8,
            strokeWeight: 1,
          }}
        />
      );
    });
  };

  useEffect(() => {
    const fetchSpeedData = async () => {
      try {
        setLoading(true);

        const apiUrl = `/api/get_speed_data?latitude=${collisionLocation.latitude}
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
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          height: '90%',
        },
      }}
      contentLabel="Traffic Analysis Modal"
    >
      <div style={styles.grid}>
        <div style={(styles.card, styles.fullWidth)}>
          <div style={styles.cardTitle}>
            교통사고 발생 날짜: {collisionLocation['Date Occurred']}{' '}
            {collisionLocation['Time Occurred']}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {realSpeedData && (
              <div>
                {combinedData.map((row, index) => {
                  const realDate = row.realRow['Date Occurred'];
                  const predictedDate = row.predictedRow['Date Occurred'];

                  return (
                    <button
                      key={index}
                      style={{ margin: '5px' }}
                      onClick={() => {
                        setSelectedDatetime({ real: row.realRow, predicted: row.predictedRow });
                      }}
                    >
                      {realDate}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#f44336',
                color: '#fff',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              닫기
            </button>
          </div>
        </div>

        {loading ? (
          '로딩 중..'
        ) : (
          <>
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
                  {selectedDatetime && renderCircles(selectedDatetime.real, getCircleColor)}
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
                  {selectedDatetime && renderCircles(selectedDatetime.predicted, getCircleColor)}
                </GoogleMap>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default MapMdal;
