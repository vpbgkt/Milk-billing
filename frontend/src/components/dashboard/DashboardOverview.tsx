'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Truck, 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { superAdminService } from '@/services/superadmin';
import { PlatformAnalytics, Activity as ActivityType } from '@/types';

const DashboardOverview: React.FC = () => {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);      const data = await superAdminService.getPlatformAnalytics();
      setAnalytics(data);
    } catch (err: unknown) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const stats = [
    {
      title: 'Total Users',
      value: analytics.totalUsers,
      icon: Users,
      growth: analytics.monthlyGrowth.users,
      color: 'blue'
    },
    {
      title: 'Total Suppliers',
      value: analytics.totalSuppliers,
      icon: Truck,
      growth: analytics.monthlyGrowth.suppliers,
      color: 'green'
    },
    {
      title: 'Milk Deliveries',
      value: analytics.totalMilkEntries,
      icon: BarChart3,
      growth: 0, // You can add this to your analytics
      color: 'purple'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics.totalRevenue),
      icon: DollarSign,
      growth: analytics.monthlyGrowth.revenue,
      color: 'orange',
      isAmount: true
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.isAmount ? stat.value : stat.value.toLocaleString()}
                  </p>
                  {stat.growth !== 0 && (
                    <div className="flex items-center mt-2">
                      {stat.growth > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${stat.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(stat.growth)}% from last month
                      </span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-full ${getColorClasses(stat.color)}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentActivities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activities</p>
          ) : (
            <div className="space-y-4">
              {analytics.recentActivities.slice(0, 10).map((activity: ActivityType) => (
                <div key={activity._id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
