'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import NotificationTesting from '@/components/notifications/NotificationTesting';

const NotificationSettingsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your notification preferences and test push notification functionality.
          </p>
        </div>

        <NotificationTesting />
      </div>
    </DashboardLayout>
  );
};

export default NotificationSettingsPage;
