import { AlertMessage } from '../types/telemedicine';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface AlertDisplayProps {
  alerts: AlertMessage[];
}

export function AlertDisplay({ alerts }: AlertDisplayProps) {
  const getAlertIcon = (type: AlertMessage['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getAlertStyles = (type: AlertMessage['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-900 border-red-500 text-red-100';
      case 'warning':
        return 'bg-yellow-900 border-yellow-500 text-yellow-100';
      case 'success':
        return 'bg-green-900 border-green-500 text-green-100';
      case 'info':
      default:
        return 'bg-blue-900 border-blue-500 text-blue-100';
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="w-full bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center space-x-3 text-gray-400">
          <Info className="w-5 h-5" />
          <p className="text-sm">No alerts. System is monitoring...</p>
        </div>
      </div>
    );
  }

  const recentAlerts = alerts.slice(-5).reverse();

  return (
    <div className="w-full space-y-2">
      <h3 className="text-white font-semibold mb-2 flex items-center space-x-2">
        <AlertCircle className="w-5 h-5" />
        <span>Status Alerts</span>
      </h3>

      {recentAlerts.map((alert, index) => (
        <div
          key={`${alert.timestamp}-${index}`}
          className={`p-3 rounded-lg border-l-4 ${getAlertStyles(alert.type)} animate-in slide-in-from-top duration-300`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getAlertIcon(alert.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug">
                {alert.message}
              </p>
              <p className="text-xs opacity-75 mt-1">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
