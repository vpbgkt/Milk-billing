'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Smartphone, 
  Mail, 
  Save,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationPreferences } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const NotificationSettings: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    enablePushNotifications,
    disablePushNotifications,
    isPushEnabled
  } = useNotifications();

  const [localPreferences, setLocalPreferences] = useState<Partial<NotificationPreferences>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus('saving');

    try {
      await updatePreferences(localPreferences);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToggle = async () => {
    if (isPushEnabled) {
      await disablePushNotifications();
    } else {
      await enablePushNotifications();
    }
  };

  const updateLocalPreference = (key: string, value: boolean | string) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const updateCategoryPreference = (category: string, value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      categories: {
        milkDeliveries: false,
        payments: false,
        systemUpdates: false,
        marketing: false,
        ...prev.categories,
        [category]: value
      }
    }));
  };
  const updateQuietHours = (key: string, value: boolean | string) => {
    setLocalPreferences(prev => ({
      ...prev,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        ...prev.quietHours,
        [key]: value
      }
    }));
  };

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(localPreferences);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* General Notification Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
            
            <div className="space-y-4">
              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Push Notifications</h4>
                    <p className="text-sm text-gray-600">
                      Receive notifications directly in your browser
                    </p>
                  </div>
                </div>
                <button
                  onClick={handlePushToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isPushEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isPushEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">
                      Receive notifications via email
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updateLocalPreference('emailNotifications', !localPreferences.emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    localPreferences.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localPreferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>              </div>
            </div>
          </div>

          {/* Notification Categories */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Categories</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Milk Deliveries</h4>
                  <p className="text-sm text-gray-600">Updates about milk deliveries and collections</p>
                </div>
                <input
                  type="checkbox"
                  checked={localPreferences.categories?.milkDeliveries ?? true}
                  onChange={(e) => updateCategoryPreference('milkDeliveries', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Payments</h4>
                  <p className="text-sm text-gray-600">Payment confirmations and reminders</p>
                </div>
                <input
                  type="checkbox"
                  checked={localPreferences.categories?.payments ?? true}
                  onChange={(e) => updateCategoryPreference('payments', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">System Updates</h4>
                  <p className="text-sm text-gray-600">Important system announcements and maintenance</p>
                </div>
                <input
                  type="checkbox"
                  checked={localPreferences.categories?.systemUpdates ?? true}
                  onChange={(e) => updateCategoryPreference('systemUpdates', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Marketing</h4>
                  <p className="text-sm text-gray-600">Promotional offers and platform updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={localPreferences.categories?.marketing ?? false}
                  onChange={(e) => updateCategoryPreference('marketing', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quiet Hours</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={localPreferences.quietHours?.enabled ?? false}
                  onChange={(e) => updateQuietHours('enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-900">
                  Enable quiet hours (no notifications during specified times)
                </label>
              </div>

              {localPreferences.quietHours?.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-7">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={localPreferences.quietHours?.startTime ?? '22:00'}
                      onChange={(e) => updateQuietHours('startTime', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={localPreferences.quietHours?.endTime ?? '08:00'}
                      onChange={(e) => updateQuietHours('endTime', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              {saveStatus === 'saved' && (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Settings saved successfully</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <X className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600">Failed to save settings</span>
                </>
              )}
            </div>
            
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
