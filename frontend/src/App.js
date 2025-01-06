import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import './index.css';

function App() {
  const [selectedTab, setSelectedTab] = useState('dashboard');
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
    <div className="flex flex-row h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <h1 className="text-xl font-bold text-center py-4 border-b border-gray-700">
          LA Traffic
          <br />
          Crash Analysis
        </h1>
        <button
          className={`py-3 px-4 text-left hover:bg-gray-700 ${
            selectedTab === 'dashboard' ? 'bg-gray-700 font-bold' : ''
          }`}
          onClick={() => setSelectedTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`py-3 px-4 text-left hover:bg-gray-700 ${
            selectedTab === 'how-to-use' ? 'bg-gray-700 font-bold' : ''
          }`}
          onClick={() => setSelectedTab('how-to-use')}
        >
          About This Dashboard
        </button>
      </div>
      {/* Main content */}
      <div className="flex-grow bg-gray-100 h-full overflow-y-auto">
        {selectedTab === 'dashboard' && <Dashboard googleMapsApiKey={googleMapsApiKey} />}
        {selectedTab === 'how-to-use' && (
          <div className="bg-white my-8 p-6 rounded-lg shadow-md max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Analysis of Traffic Speed Changes Due to Accidents in LA (March - June 2012)
            </h1>
            <p className="text-gray-600 mb-4">
              This system analyzes the traffic speed changes before and after traffic accidents in
              Los Angeles (LA) based on data from March to June of 2012.
            </p>
            <p className="text-gray-600 mb-4">
              At the top of the dashboard, you can view two graphs that provide an analysis of speed
              changes for all traffic accidents.
            </p>
            <p className="text-gray-600 mb-4">
              At the bottom of the dashboard, traffic accident data is displayed as markers on
              Google Maps. By clicking on a marker, you can view the basic details of the accident.
              The <span className="font-semibold">"Analyze"</span> button allows you to perform a
              detailed speed analysis, comparing predicted data (extracted via the STGCN model) with
              actual data. You can observe the speed changes from 5 minutes before to 30 minutes
              after the accident occurs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
