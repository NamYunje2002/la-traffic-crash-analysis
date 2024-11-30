import React, { useState } from 'react';
import { styles } from './styles';
import DataAnalysis from './DataAnalysis';
import Prediction from './Prediction';
import Xai from './Xai';

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState('data-analysis');

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
          예측 모델
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(selectedTab === 'xai' ? styles.activeTab : {}),
          }}
          onClick={() => setSelectedTab('xai')}
        >
          eXplainable AI
        </button>
      </div>

      {selectedTab === 'data-analysis' && <DataAnalysis />}
      {selectedTab === 'prediction' && <Prediction />}
      {selectedTab === 'xai' && <Xai />}
    </div>
  );
};

export default Dashboard;
