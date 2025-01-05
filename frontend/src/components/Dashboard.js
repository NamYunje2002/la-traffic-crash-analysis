import React, { useEffect, useState } from 'react';
import AccidentAnalyzer from './AccidentAnalyzer';
import ScatterComparisonChart from './ScatterComparisonChart';
import SpeedChangeHistogram from './SpeedChangeHistogram';

const Dashboard = ({ googleMapsApiKey }) => {
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

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div className="card bg-white shadow-md rounded-lg w-full">
          <ScatterComparisonChart
            realScatterData={realScatterData}
            predictedScatterData={predictedScatterData}
          />
        </div>
        <div className="card bg-white shadow-md rounded-lg w-full">
          <SpeedChangeHistogram combinedHistogramData={combinedHistogramData} />
        </div>
      </div>
      <AccidentAnalyzer googleMapsApiKey={googleMapsApiKey} />
    </div>
  );
};

export default Dashboard;
