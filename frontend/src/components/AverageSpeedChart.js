import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomLegend = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '2rem',
        marginTop: '0.6rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <div
          style={{
            width: '0.6rem',
            height: '0.6rem',
            borderRadius: '50%',
            backgroundColor: '#8884d8',
          }}
        ></div>
        <span style={{ fontSize: '1rem', color: '#8884d8' }}>실제 데이터</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <div
          style={{
            width: '0.6rem',
            height: '0.6rem',
            borderRadius: '50%',
            backgroundColor: '#82ca9d',
          }}
        ></div>
        <span style={{ fontSize: '1rem', color: '#82ca9d' }}>예측 데이터</span>
      </div>
    </div>
  );
};

const AverageSpeedChart = ({ realSpeedData, predictedSpeedData }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const combinedData = realSpeedData.map((real, index) => ({
      time: real.time,
      realAverageSpeed: real.speed,
      predictedAverageSpeed: predictedSpeedData[index].speed,
    }));

    setChartData(combinedData);
  }, [realSpeedData, predictedSpeedData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" label={{ value: '시간', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: '평균 속도 (km/h)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value) => `${value.toFixed(2)} km/h`} />
          <Line
            type="monotone"
            dataKey="realAverageSpeed"
            name="실제 데이터"
            stroke="#8884d8"
            strokeWidth={4}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="predictedAverageSpeed"
            name="예측 데이터"
            stroke="#82ca9d"
            strokeWidth={4}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <CustomLegend />
    </div>
  );
};

export default AverageSpeedChart;
