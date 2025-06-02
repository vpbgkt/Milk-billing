'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Volume2, 
  VolumeX, 
  Smartphone,
  Settings as SettingsIcon,
  TestTube,
  Play,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationSettings from '@/components/notifications/NotificationSettings';

interface NotificationTestData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: Record<string, unknown>;
}

interface NotificationTestingProps {
  className?: string;
}

const NotificationTesting: React.FC<NotificationTestingProps> = ({ className }) => {
  const { showNotification } = useNotifications();
  const [testResults, setTestResults] = useState({
    browser: 'pending' as 'pending' | 'success' | 'error',
    push: 'pending' as 'pending' | 'success' | 'error',
    sound: 'pending' as 'pending' | 'success' | 'error'
  });
  
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
    checkServiceWorker();
  }, []);

  const checkPermissionStatus = () => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  };

  const checkServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        setIsServiceWorkerReady(!!registration);
      } catch (error) {
        console.error('Service Worker check failed:', error);
        setIsServiceWorkerReady(false);
      }
    }
  };

  const testNotifications = [
    {
      id: 'basic',
      title: 'Basic Notification',
      body: 'This is a basic notification test',
      icon: '/icons/icon-192x192.svg',
      tag: 'test-basic'
    },
    {
      id: 'delivery',
      title: 'Milk Delivery Update',
      body: 'Your milk delivery is on the way! Expected arrival: 2:30 PM',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/badge-72x72.svg',
      tag: 'test-delivery',
      actions: [
        { action: 'track', title: 'Track Order', icon: '/icons/track.png' },
        { action: 'contact', title: 'Contact Driver', icon: '/icons/contact.png' }
      ],
      data: { url: '/dashboard/orders', type: 'delivery' }
    },
    {
      id: 'payment',
      title: 'Payment Reminder',
      body: 'Your monthly subscription payment of $45.99 is due tomorrow',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/badge-72x72.svg',
      tag: 'test-payment',
      actions: [
        { action: 'pay', title: 'Pay Now', icon: '/icons/pay.png' },
        { action: 'remind', title: 'Remind Later', icon: '/icons/remind.png' }
      ],
      data: { url: '/dashboard/billing', type: 'payment' }
    },
    {
      id: 'urgent',
      title: '🚨 Service Disruption',
      body: 'Due to weather conditions, deliveries in your area may be delayed by 2-3 hours',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/badge-72x72.svg',
      tag: 'test-urgent',
      requireInteraction: true,
      silent: false,
      data: { url: '/dashboard/notifications', type: 'urgent' }
    }
  ];

  const testBrowserNotification = async () => {
    try {
      if (!('Notification' in window)) {
        setTestResults(prev => ({ ...prev, browser: 'error' }));
        return;
      }

      let permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
        setPermissionStatus(permission);
      }

      if (permission === 'granted') {
        showNotification('Test Notification', {
          body: 'Browser notifications are working correctly!',
          icon: '/icons/icon-192x192.svg',
          tag: 'test-browser-basic'
        });
        setTestResults(prev => ({ ...prev, browser: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, browser: 'error' }));
      }
    } catch (error) {
      console.error('Browser notification test failed:', error);
      setTestResults(prev => ({ ...prev, browser: 'error' }));
    }
  };
  const testRichNotification = async (notificationData: NotificationTestData) => {
    try {
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setTestResults(prev => ({ ...prev, push: 'error' }));
          return;
        }
      }showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: notificationData.tag,
        requireInteraction: notificationData.requireInteraction,
        silent: notificationData.silent,
        data: notificationData.data
      });

      setTestResults(prev => ({ ...prev, push: 'success' }));
    } catch (error) {
      console.error('Rich notification test failed:', error);
      setTestResults(prev => ({ ...prev, push: 'error' }));
    }
  };

  const testNotificationSound = async () => {
    try {
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setTestResults(prev => ({ ...prev, sound: 'error' }));
          return;
        }
      }

      // Test with sound (non-silent notification)
      showNotification('Sound Test', {
        body: 'This notification should play a sound',
        icon: '/icons/icon-192x192.svg',
        tag: 'test-sound',
        silent: false,
        requireInteraction: false
      });

      setTestResults(prev => ({ ...prev, sound: 'success' }));
    } catch (error) {
      console.error('Sound notification test failed:', error);
      setTestResults(prev => ({ ...prev, sound: 'error' }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPermissionColor = (permission: NotificationPermission) => {
    switch (permission) {
      case 'granted':
        return 'text-green-600';
      case 'denied':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TestTube className="w-5 h-5 mr-2" />
          Enhanced Notification Testing
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Permission</span>
              <span className={`text-sm font-semibold ${getPermissionColor(permissionStatus)}`}>
                {permissionStatus.charAt(0).toUpperCase() + permissionStatus.slice(1)}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {permissionStatus === 'granted' ? 'Notifications enabled' : 
               permissionStatus === 'denied' ? 'Notifications blocked' : 
               'Permission not requested'}
            </p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Service Worker</span>
              <span className={`text-sm font-semibold ${isServiceWorkerReady ? 'text-green-600' : 'text-red-600'}`}>
                {isServiceWorkerReady ? 'Ready' : 'Not Ready'}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {isServiceWorkerReady ? 'Background notifications enabled' : 'Service worker not available'}
            </p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Device</span>
              <Smartphone className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500">
              {/Mobi|Android/i.test(navigator.userAgent) ? 'Mobile Device' : 'Desktop Device'}
            </p>
          </div>
        </div>

        {/* Basic Tests */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Basic Notification Tests</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Browser Test</h4>
                {getStatusIcon(testResults.browser)}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Test basic browser notification functionality
              </p>
              <Button
                onClick={testBrowserNotification}
                className="w-full"
                variant="outline"
                size="sm"
              >
                <Bell className="w-4 h-4 mr-2" />
                Test Basic
              </Button>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Sound Test</h4>
                {getStatusIcon(testResults.sound)}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Test notification sound functionality
              </p>
              <Button
                onClick={testNotificationSound}
                className="w-full"
                variant="outline"
                size="sm"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Test Sound
              </Button>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Permission</h4>
                {getStatusIcon(permissionStatus === 'granted' ? 'success' : 'pending')}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Request notification permissions
              </p>
              <Button
                onClick={checkPermissionStatus}
                className="w-full"
                variant="outline"
                size="sm"
              >
                <SettingsIcon className="w-4 h-4 mr-2" />
                Check Status
              </Button>
            </div>
          </div>
        </div>

        {/* Rich Notification Tests */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Rich Notification Tests</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {testNotifications.slice(1).map((notification) => (
              <div key={notification.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{notification.title}</h4>
                  <BellRing className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {notification.body}
                </p>
                <div className="space-y-2">
                  {notification.actions && (
                    <div className="flex flex-wrap gap-1">
                      {notification.actions.map((action, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {action.title}
                        </span>
                      ))}
                    </div>
                  )}
                  <Button
                    onClick={() => testRichNotification(notification)}
                    className="w-full"
                    variant="outline"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Test Rich
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings Integration */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Notification Preferences</h3>
          <NotificationSettings />
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationTesting;
