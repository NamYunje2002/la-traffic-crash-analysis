import React, { useEffect, useState } from 'react';
import { styles } from './styles';
import DataAnalysis from './DataAnalysis';
import Prediction from './Prediction';

const Dashboard = () => {
  const laCoordinates = {
    lat: 34.0522,
    lng: -118.2437,
  };
  const [selectedTab, setSelectedTab] = useState('data-analysis');
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

  return (
    <div style={styles.container}>
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tabButton,
            ...(selectedTab === 'data-analysis' ? styles.activeTab : {}),
          }}
          onClick={() => setSelectedTab('data-analysis')}
        >
          데이터 분석
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(selectedTab === 'prediction' ? styles.activeTab : {}),
          }}
          onClick={() => setSelectedTab('prediction')}
        >
          교통사고 분석
        </button>
      </div>

      {selectedTab === 'data-analysis' && (
        <DataAnalysis googleMapsApiKey={googleMapsApiKey} laCoordinates={laCoordinates} />
      )}
      {selectedTab === 'prediction' && (
        <Prediction googleMapsApiKey={googleMapsApiKey} laCoordinates={laCoordinates} />
      )}
    </div>
  );
};

export default Dashboard;
