import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const SpeedChangeHistogram = ({ combinedHistogramData }) => {
  return (
    <div className="p-4 rounded-md chart-container" style={{ height: '500px', width: '100%' }}>
      <div className="text-xl font-semibold mb-4">Speed Change Distribution</div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={combinedHistogramData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="range" label={{ position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="realCount" fill="#8884d8" name="Actual Data" />
          <Bar dataKey="predictedCount" fill="#82ca9d" name="Predicted Data" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpeedChangeHistogram;
