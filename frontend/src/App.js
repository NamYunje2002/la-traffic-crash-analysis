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
          LA Crash Impact
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
              Analysis of the Impact of Traffic Accidents on Speed in LA
            </h1>
            <p className="text-gray-600 mb-4">
              This is a VA system designed to analyze the impact of traffic accidents on speed in
              LA.
            </p>
            <p className="text-gray-600 mb-4">
              The dashboard is divided into two tabs: the{' '}
              <span className="font-semibold">Data Analysis</span> tab and the{' '}
              <span className="font-semibold">Traffic Accident Analysis</span> tab.
            </p>
            <p className="text-gray-600">
              The <span className="font-semibold">Data Analysis</span> tab provides an overview of
              speed analysis for all traffic accidents. The{' '}
              <span className="font-semibold">Traffic Accident Analysis</span> tab allows users to
              view speed analysis for specific traffic accidents selected by the user.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
