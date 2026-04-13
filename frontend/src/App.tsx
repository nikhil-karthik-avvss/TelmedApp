import { CameraCapture } from './components/CameraCapture';
import { SignalVisualization } from './components/SignalVisualization';
import { AlertDisplay } from './components/AlertDisplay';
import { useTelemedicine } from './hooks/useTelemedicine';
import { Activity, Play, Square, Heart, Wind } from 'lucide-react';

function App() {
  const {
    isActive,
    signalData,
    alerts,
    signalQuality,
    heartRate,
    spo2,
    fingerPresent,
    placementOk,
    placementMsg,
    handleFrameCapture,
    startMonitoring,
    stopMonitoring,
  } = useTelemedicine();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-red-400" />
              <h1 className="text-2xl font-bold text-white">
                Telemedicine PPG Monitor
              </h1>
            </div>
            <button
              onClick={isActive ? stopMonitoring : startMonitoring}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isActive
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isActive ? (
                <>
                  <Square className="w-5 h-5" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start</span>
                </>
              )}
            </button>
          </div>
          <p className="text-gray-400 mt-2 text-sm">
            Real-time photoplethysmography monitoring for remote patient assessment
          </p>
        </header>

        <div className="space-y-6">
          <section>
            <h2 className="text-white font-semibold mb-3 flex items-center space-x-2">
              <span>Live Video Feed</span>
              {isActive && (
                <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">
                  MONITORING
                </span>
              )}
            </h2>
            <CameraCapture onFrameCapture={handleFrameCapture} isActive={isActive} />
          </section>

          {/* Finger placement guidance — visible only while monitoring */}
          {isActive && (
            <section>
              <div className={`rounded-lg px-4 py-3 flex items-center space-x-3 text-sm font-medium transition-colors ${
                !fingerPresent
                  ? 'bg-yellow-900 border border-yellow-600 text-yellow-200'
                  : placementOk
                    ? 'bg-green-900 border border-green-600 text-green-200'
                    : 'bg-orange-900 border border-orange-600 text-orange-200'
              }`}>
                <span className="text-lg">
                  {!fingerPresent ? '👆' : placementOk ? '✅' : '⚠️'}
                </span>
                <span>
                  {!fingerPresent
                    ? 'Place your finger firmly over the rear camera lens and turn on the torch.'
                    : placementOk
                      ? 'Finger placement OK — hold still while measuring.'
                      : placementMsg || 'Adjust finger placement.'}
                </span>
              </div>
            </section>
          )}

          <section>
            <SignalVisualization signalData={signalData} signalQuality={signalQuality} />
          </section>

          <section>
            <AlertDisplay alerts={alerts} />
          </section>
        </div>

        <footer className="mt-8 pt-6 border-t border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Status</p>
              <p className="text-white font-semibold">
                {isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
              <div className="flex items-center space-x-1 mb-1">
                <Heart className="w-3 h-3 text-red-400" />
                <p className="text-gray-400 text-xs">Heart Rate</p>
              </div>
              <p className="text-white font-semibold">
                {heartRate !== null ? `${heartRate} BPM` : '---'}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
              <div className="flex items-center space-x-1 mb-1">
                <Wind className="w-3 h-3 text-blue-400" />
                <p className="text-gray-400 text-xs">SpO2</p>
              </div>
              <p className="text-white font-semibold">
                {spo2 !== null ? `${spo2}%` : '---'}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Quality</p>
              <p className="text-white font-semibold">
                {Math.round(signalQuality * 100)}%
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
