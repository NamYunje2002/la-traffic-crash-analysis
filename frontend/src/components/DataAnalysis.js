import React, { useEffect, useState } from 'react';
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

const DataAnalysis = ({ googleMapsApiKey, laCoordinates }) => {
  const [realScatterData, setRealScatterData] = useState([]);
  const [predictedScatterData, setPredictedScatterData] = useState([]);

  const [realHistogramData, setRealHistogramData] = useState([]);
  const [predictedHistogramData, setPredictedHistogramData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/collision-data?type=scatter')
      .then((response) => response.json())
      .then((data) => {
        setRealScatterData(data.scatter_real_data);
        setPredictedScatterData(data.scatter_predicted_data);
      })
      .catch((error) => console.error('Error fetching scatter data:', error));
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/collision-data?type=histogram')
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setRealHistogramData(
          data['histogram_real_data'].map((item) => ({
            range: `${item.range} to ${item.range + 10}`,
            count: item.count,
          })),
        );

        setPredictedHistogramData(
          data['histogram_predicted_data'].map((item) => ({
            range: `${item.range} to ${item.range + 10}`,
            count: item.count,
          })),
        );
      })
      .catch((error) => console.error('Error fetching histogram data:', error));
  }, []);

  return (
    <div style={styles.grid}>
      <div style={(styles.card, styles.fullWidth)}>
        <h2 style={styles.cardTitle}>사고 전후 평균 속도 비교</h2>
        <div style={styles.chartContainer}>
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid />
              <XAxis
                type="number"
                dataKey="preSpeed"
                name="교통사고 이전 속도"
                unit="km/h"
                domain={[0, 80]}
              />
              <YAxis
                type="number"
                dataKey="postSpeed"
                name="교통사고 이후 속도"
                unit="km/h"
                domain={[0, 80]}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="실제 데이터 속도 변화" data={realScatterData} fill="#8884d8" />
              <Scatter name="예측 데이터 속도 변화" data={predictedScatterData} fill="#ffc658" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ ...styles.card, ...styles.fullWidth }}>
        <h2 style={styles.cardTitle}>속도 변화 분포</h2>
        <div style={styles.chartContainer}>
          <ResponsiveContainer>
            <BarChart data={realHistogramData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="range"
                label={{
                  value: '속도 변화 ',
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
      </div>
    </div>
  );
};

export default DataAnalysis;
