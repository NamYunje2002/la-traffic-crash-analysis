import React, { useState } from 'react';
import { styles } from './styles';
import DataAnalysis from './DataAnalysis';
import Prediction from './Prediction';

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState('data-analysis');

  const sensorLocations = [
    { sensor_id: '773869', latitude: 34.15497, longitude: -118.31829 },
    { sensor_id: '767541', latitude: 34.11621, longitude: -118.23799 },
  ];

  const speedTimeSeriesData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    avgSpeed: Math.random() * 20 + 40,
    predictedSpeed: Math.random() * 20 + 40
  }));

  return (
    <div style={styles.container}>
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tabButton,
            ...(selectedTab === 'data-analysis' ? styles.activeTab : {})
          }}
          onClick={() => setSelectedTab('data-analysis')}
        >
          데이터 분석
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(selectedTab === 'prediction' ? styles.activeTab : {})
          }}
          onClick={() => setSelectedTab('prediction')}
        >
          예측 모델
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(selectedTab === 'xai' ? styles.activeTab : {})
          }}
          onClick={() => setSelectedTab('xai')}
        >
          eXplainable AI
        </button>
      </div>

      {selectedTab === 'data-analysis' && (
        <DataAnalysis
          sensorLocations={sensorLocations}
          speedTimeSeriesData={speedTimeSeriesData}
        />
      )}
      {selectedTab === 'prediction' && (
        <Prediction 
          speedTimeSeriesData={speedTimeSeriesData} 
        />
      )}
    </div>
  );
};

export default Dashboard;