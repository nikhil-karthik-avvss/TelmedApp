import { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  ChartOptions,
} from 'chart.js';
import { SignalData } from '../types/telemedicine';
import { Activity } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

interface SignalVisualizationProps {
  signalData: SignalData[];
  signalQuality: number;
}

const MAX_DATA_POINTS = 100;

export function SignalVisualization({ signalData, signalQuality }: SignalVisualizationProps) {
  const [displayData, setDisplayData] = useState<SignalData[]>([]);

  useEffect(() => {
    const recentData = signalData.slice(-MAX_DATA_POINTS);
    setDisplayData(recentData);
  }, [signalData]);

  const chartData = {
    labels: displayData.map(() => ''),
    datasets: [
      {
        label: 'PPG Signal',
        data: displayData.map((d) => d.value),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 0.8) return 'text-green-400';
    if (quality >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getQualityLabel = (quality: number) => {
    if (quality >= 0.8) return 'Excellent';
    if (quality >= 0.5) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="w-full bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-red-400" />
          <h3 className="text-white font-semibold">PPG Signal</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">Quality:</span>
          <span className={`font-semibold ${getQualityColor(signalQuality)}`}>
            {getQualityLabel(signalQuality)} ({Math.round(signalQuality * 100)}%)
          </span>
        </div>
      </div>

      <div className="w-full h-48 bg-gray-800 rounded p-2">
        {displayData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Waiting for signal data...</p>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-800 rounded p-2">
          <p className="text-gray-400 text-xs">Data Points</p>
          <p className="text-white font-semibold">{displayData.length}</p>
        </div>
        <div className="bg-gray-800 rounded p-2">
          <p className="text-gray-400 text-xs">Current Value</p>
          <p className="text-white font-semibold">
            {displayData.length > 0
              ? displayData[displayData.length - 1].value.toFixed(2)
              : '---'}
          </p>
        </div>
        <div className="bg-gray-800 rounded p-2">
          <p className="text-gray-400 text-xs">Avg Value</p>
          <p className="text-white font-semibold">
            {displayData.length > 0
              ? (displayData.reduce((sum, d) => sum + d.value, 0) / displayData.length).toFixed(2)
              : '---'}
          </p>
        </div>
      </div>
    </div>
  );
}
