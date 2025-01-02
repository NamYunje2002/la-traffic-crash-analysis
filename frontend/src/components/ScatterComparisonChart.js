import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-300 p-3 rounded-md">
        <p>{`Previous speed: ${payload[0].payload.preSpeed} km/h`}</p>
        <p>{`Post-collision speed: ${payload[0].payload.postSpeed} km/h`}</p>
      </div>
    );
  }
  return null;
};

const ScatterComparisonChart = ({ realScatterData, predictedScatterData }) => {
  const sampleData = [
    { preSpeed: 10, postSpeed: 20 },
    { preSpeed: 30, postSpeed: 40 },
  ];

  return (
    <div className="p-4 rounded-md" style={{ height: '500px', width: '100%' }}>
      <div className="text-xl font-semibold mb-4">
        Speed Comparison Before and After the Accident
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <ScatterChart>
          <CartesianGrid />
          <XAxis
            type="number"
            dataKey="preSpeed"
            name="Speed Before Accident"
            unit="km/h"
            domain={[0, 80]}
          />
          <YAxis
            type="number"
            dataKey="postSpeed"
            name="Speed After Accident"
            unit="km/h"
            domain={[0, 80]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Scatter name="Actual Data" data={realScatterData || sampleData} fill="#8884d8" />
          <Scatter name="Predicted Data" data={predictedScatterData || sampleData} fill="#82ca9d" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScatterComparisonChart;
