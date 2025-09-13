import React from 'react';
import { useNetworkStatus } from '@/lib/error-handling';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, CheckCircle } from 'lucide-react';

export const OfflineNotification: React.FC = () => {
  const { isOnline, wasOffline, clearOfflineFlag } = useNetworkStatus();

  // Show reconnection notification briefly when coming back online
  React.useEffect(() => {
    if (isOnline && wasOffline) {
      const timer = setTimeout(clearOfflineFlag, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, clearOfflineFlag]);

  if (isOnline && !wasOffline) {
    return null; // Don't show anything when online and never been offline
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {!isOnline ? (
        <Alert className="bg-destructive/10 border-destructive/20 text-destructive rounded-none">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-center font-medium">
            You're offline. Some features may not be available.
          </AlertDescription>
        </Alert>
      ) : wasOffline ? (
        <Alert className="bg-green-50 border-green-200 text-green-800 rounded-none">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-center font-medium">
            Connection restored! You're back online.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
};

interface NetworkStatusIndicatorProps {
  showOnlineStatus?: boolean;
  compact?: boolean;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showOnlineStatus = false,
  compact = false
}) => {
  const { isOnline } = useNetworkStatus();

  if (isOnline && !showOnlineStatus) {
    return null;
  }

  const Icon = isOnline ? Wifi : WifiOff;
  const color = isOnline ? 'text-green-600' : 'text-red-600';
  const status = isOnline ? 'Online' : 'Offline';

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-3 w-3" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${color}`}>
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{status}</span>
    </div>
  );
};

export default OfflineNotification;