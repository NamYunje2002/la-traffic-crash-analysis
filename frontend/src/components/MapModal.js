import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { GoogleMap, Marker, Circle } from '@react-google-maps/api';

const MapMdal = ({ isOpen, onClose, collisionLocation }) => {
  const [loading, setLoading] = useState(true);
  const [speedData, setSpeedData] = useState(null);
  const [selectedDatetime, setSelectedDatetime] = useState(null);

  const mapModalCenter = {
    lat: collisionLocation.latitude,
    lng: collisionLocation.longitude,
  };

  const mapContainerStyle = {
    width: '100%',
    height: 'calc(100% - 60px)',
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

        if (data.success) {
          setSpeedData(data.speed_trends);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
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
          width: '80%',
          height: '80%',
          overflow: 'hidden',
          padding: '0',
        },
      }}
      contentLabel="Traffic Analysis Modal"
    >
      <div style={{ width: '100%', height: '100%' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            padding: '15px 20px',
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #ddd',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {collisionLocation['Date Occurred']} {collisionLocation['Time Occurred']}
            </span>
            {speedData && (
              <div>
                {speedData.map((row, index) => {
                  const date = row['Date Occurred'];
                  return (
                    <button
                      key={index}
                      style={{ margin: '5px' }}
                      onClick={() => setSelectedDatetime(row)}
                    >
                      {date}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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

        {loading ? (
          '로딩 중..'
        ) : (
          <div style={{ width: '100%', height: 'calc(100% - 60px)' }}>
            <GoogleMap mapContainerStyle={mapContainerStyle} zoom={14} center={mapModalCenter}>
              <Marker position={mapModalCenter} />
              {selectedDatetime &&
                Object.keys(selectedDatetime)
                  .filter((key) => key !== 'Date Occurred')
                  .map((key, index) => {
                    const [lat, lng] = key
                      .replace('(', '')
                      .replace(')', '')
                      .split(', ')
                      .map(Number);
                    const speed = selectedDatetime[key];

                    return (
                      <Circle
                        key={index}
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
                  })}
            </GoogleMap>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MapMdal;
