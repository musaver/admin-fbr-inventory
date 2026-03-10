'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CurrencySymbol from '../../components/CurrencySymbol';
import DateFilter from '../../components/DateFilter';

interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowth: number;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    orders: number;
    growth: number;
  }>;
}

export default function RevenueAnalytics() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const dateRanges = {
    today: { 
      label: 'Today',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    week: { 
      label: 'Last 7 Days',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    month: { 
      label: 'Last 30 Days',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    quarter: { 
      label: 'Last 90 Days',
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [startDate, endDate]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      // Use existing sales API with some processing
      const response = await fetch(`/api/reports/sales?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch revenue data');

      const salesData = await response.json();
      
      // Transform sales data into revenue analytics format
      const revenueData: RevenueData = {
        totalRevenue: salesData.summary.totalRevenue,
        totalOrders: salesData.summary.totalOrders,
        averageOrderValue: salesData.summary.averageOrderValue,
        revenueGrowth: 0, // Would need historical comparison
        dailyRevenue: salesData.dailySales.map((day: any) => ({
          date: day.date,
          revenue: day.totalRevenue,
          orders: day.orderCount
        })),
        monthlyRevenue: salesData.monthlySales.map((month: any) => ({
          month: month.month,
          revenue: month.totalRevenue,
          orders: month.orderCount,
          growth: 0 // Would need previous period comparison
        }))
      };

      setData(revenueData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setPresetDateRange = (preset: keyof typeof dateRanges) => {
    const range = dateRanges[preset];
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  if (loading) return <div className="p-8 text-center">Loading revenue analytics...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📊 Revenue Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive revenue trends and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/reports"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Reports
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Date Filters */}
      <div className="bg-white rounded-xl shadow-lg border p-6 mb-6">
        <DateFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClearFilter={clearFilters}
        />
        
        {/* Preset Date Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(dateRanges).map(([key, range]) => (
            <button
              key={key}
              onClick={() => setPresetDateRange(key as keyof typeof dateRanges)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <>
          {/* Revenue Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Revenue</p>
                  <p className="text-3xl font-bold">
                    <CurrencySymbol />{data.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="text-4xl opacity-80">💰</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Orders</p>
                  <p className="text-3xl font-bold">{data.totalOrders}</p>
                </div>
                <div className="text-4xl opacity-80">🛒</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Avg Order Value</p>
                  <p className="text-3xl font-bold">
                    <CurrencySymbol />{data.averageOrderValue.toFixed(2)}
                  </p>
                </div>
                <div className="text-4xl opacity-80">📊</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Revenue Growth</p>
                  <p className="text-3xl font-bold">+{data.revenueGrowth.toFixed(1)}%</p>
                </div>
                <div className="text-4xl opacity-80">📈</div>
              </div>
            </div>
          </div>

          {/* Daily Revenue Chart */}
          {data.dailyRevenue.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">📈 Daily Revenue Trend</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-700">Date</th>
                      <th className="text-left p-3 font-medium text-gray-700">Revenue</th>
                      <th className="text-left p-3 font-medium text-gray-700">Orders</th>
                      <th className="text-left p-3 font-medium text-gray-700">Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dailyRevenue.map((day, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">{new Date(day.date).toLocaleDateString()}</td>
                        <td className="p-3 font-semibold text-green-600">
                          <CurrencySymbol />{day.revenue.toFixed(2)}
                        </td>
                        <td className="p-3">{day.orders}</td>
                        <td className="p-3">
                          <CurrencySymbol />{day.orders > 0 ? (day.revenue / day.orders).toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Monthly Revenue Summary */}
          {data.monthlyRevenue.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">📅 Monthly Revenue Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-700">Month</th>
                      <th className="text-left p-3 font-medium text-gray-700">Revenue</th>
                      <th className="text-left p-3 font-medium text-gray-700">Orders</th>
                      <th className="text-left p-3 font-medium text-gray-700">Avg Order Value</th>
                      <th className="text-left p-3 font-medium text-gray-700">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthlyRevenue.map((month, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{month.month}</td>
                        <td className="p-3 font-semibold text-green-600">
                          <CurrencySymbol />{month.revenue.toFixed(2)}
                        </td>
                        <td className="p-3">{month.orders}</td>
                        <td className="p-3">
                          <CurrencySymbol />{month.orders > 0 ? (month.revenue / month.orders).toFixed(2) : '0.00'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-sm ${month.growth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {month.growth >= 0 ? '+' : ''}{month.growth.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 