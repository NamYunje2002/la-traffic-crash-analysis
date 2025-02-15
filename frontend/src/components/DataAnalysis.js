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

const DataAnalysis = ({ googleMapsApiKey, laCoordinates }) => {
  const [realScatterData, setRealScatterData] = useState([]);
  const [predictedScatterData, setPredictedScatterData] = useState([]);
  const [combinedHistogramData, setCombinedHistogramData] = useState(null);

  const mergeHistogramData = (realData, predictedData) => {
    const mergedData = [];

    const realMap = new Map(realData.map((item) => [item.range, item.count]));
    const predictedMap = new Map(predictedData.map((item) => [item.range, item.count]));

    const allRanges = Array.from(new Set([...realMap.keys(), ...predictedMap.keys()]));

    allRanges.sort((a, b) => {
      const startA = parseInt(a.split(' to ')[0], 10);
      const startB = parseInt(b.split(' to ')[0], 10);
      return startA - startB;
    });

    allRanges.forEach((range) => {
      mergedData.push({
        range,
        realCount: realMap.get(range) || 0,
        predictedCount: predictedMap.get(range) || 0,
      });
    });

    return mergedData;
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/collisions/visualization?type=scatter')
      .then((response) => response.json())
      .then((data) => {
        setRealScatterData(data.scatter_real_data);
        setPredictedScatterData(data.scatter_predicted_data);
      })
      .catch((error) => console.error('Error fetching scatter data:', error));
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/collisions/visualization?type=histogram')
      .then((response) => response.json())
      .then((data) => {
        const realData = data['histogram_real_data'].map((item) => ({
          range: `${item.range} to ${item.range + 10}`,
          count: item.count,
        }));

        const predictedData = data['histogram_predicted_data'].map((item) => ({
          range: `${item.range} to ${item.range + 10}`,
          count: item.count,
        }));

        const mergedData = mergeHistogramData(realData, predictedData);
        setCombinedHistogramData(mergedData);
      })
      .catch((error) => console.error('Error fetching histogram data:', error));
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataSource = payload[0].payload.source;
      const preSpeed = payload[0].payload.preSpeed;
      const postSpeed = payload[0].payload.postSpeed;

      const color = dataSource === 'Real Data' ? '#8884d8' : '#82ca9d';

      return (
        <div className="bg-white border border-gray-300 p-3 rounded-md">
          <p className="font-bold" style={{ color: color }}>
            {dataSource}
          </p>
          <p>{`Previous Speed: ${preSpeed} km/h`}</p>
          <p>{`Post Speed: ${postSpeed} km/h`}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card bg-white shadow-md rounded-lg p-6 w-full">
        <div className="text-xl font-semibold mb-4">
          Speed Comparison Before and After the Accident
        </div>
        <div className="chart-container">
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid />
              <XAxis
                type="number"
                dataKey="preSpeed"
                name="Speed Before the Accident"
                unit="km/h"
                domain={[0, 80]}
              />
              <YAxis
                type="number"
                dataKey="postSpeed"
                name="Speed After the Accident"
                unit="km/h"
                domain={[0, 80]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Real Data" data={realScatterData} fill="#8884d8" />
              <Scatter name="Predicted Data" data={predictedScatterData} fill="#82ca9d" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card bg-white shadow-md rounded-lg p-6 w-full">
        <div className="text-xl font-semibold mb-4">Distribution of Speed Change</div>
        <div className="chart-container">
          <ResponsiveContainer>
            <BarChart data={combinedHistogramData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" label={{ position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="realCount" fill="#8884d8" name="Real Data" />
              <Bar dataKey="predictedCount" fill="#82ca9d" name="Predicted Data" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DataAnalysis;
