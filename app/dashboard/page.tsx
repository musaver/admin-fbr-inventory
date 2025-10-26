'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CurrencySymbol from '../components/CurrencySymbol';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CalendarIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  UsersIcon, 
  PackageIcon, 
  FolderIcon, 
  ShoppingCartIcon, 
  UserCheckIcon,
  DollarSignIcon,
  BarChart3Icon,
  PlusIcon,
  RefreshCwIcon,
  FilterIcon,
  TargetIcon
} from 'lucide-react';

interface DashboardStats {
  customers: number;
  products: number;
  categories: number;
  orders: number;
  adminUsers: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  averageOrderValue: number;
  profitableItems: number;
  lossItems: number;
  dateRange?: {
    startDate: string | null;
    endDate: string | null;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    products: 0,
    categories: 0,
    orders: 0,
    adminUsers: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0,
    averageOrderValue: 0,
    profitableItems: 0,
    lossItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/dashboard/stats?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = () => {
    fetchStats();
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    // Fetch stats without date filters
    setTimeout(() => fetchStats(), 100);
  };

  const setPresetDates = (preset: string) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    switch (preset) {
      case 'today':
        setStartDate(startOfToday.toISOString().split('T')[0]);
        setEndDate(startOfToday.toISOString().split('T')[0]);
        break;
      case 'week':
        const weekAgo = new Date(startOfToday);
        weekAgo.setDate(weekAgo.getDate() - 7);
        setStartDate(weekAgo.toISOString().split('T')[0]);
        setEndDate(startOfToday.toISOString().split('T')[0]);
        break;
      case 'month':
        const monthAgo = new Date(startOfToday);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        setStartDate(monthAgo.toISOString().split('T')[0]);
        setEndDate(startOfToday.toISOString().split('T')[0]);
        break;
    }
    setTimeout(() => fetchStats(), 100);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    trend, 
    onClick,
    loading: cardLoading 
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    description: string;
    trend?: 'up' | 'down' | 'neutral';
    onClick?: () => void;
    loading?: boolean;
  }) => (
    <Card 
      className={`transition-all duration-200 hover:shadow-lg ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {cardLoading ? <Skeleton className="h-8 w-20" /> : value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
        {trend && !cardLoading && (
          <div className={`flex items-center mt-2 text-xs ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' && <TrendingUpIcon className="h-3 w-3 mr-1" />}
            {trend === 'down' && <TrendingDownIcon className="h-3 w-3 mr-1" />}
            {trend === 'neutral' && <TargetIcon className="h-3 w-3 mr-1" />}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const FinancialCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    color = "default",
    onClick,
    loading: cardLoading 
  }: {
    title: string;
    value: React.ReactNode;
    icon: React.ElementType;
    description: string;
    color?: "default" | "green" | "red" | "blue" | "purple";
    onClick?: () => void;
    loading?: boolean;
  }) => {
    const colorVariants = {
      default: {
        border: "border-border hover:border-border/80",
        bg: "bg-background",
        icon: "text-muted-foreground",
        text: "text-foreground"
      },
      green: {
        border: "border-green-200 hover:border-green-300 dark:border-green-800 dark:hover:border-green-700",
        bg: "",
        icon: "text-green-600 dark:text-green-400",
        text: "text-green-600 dark:text-green-400"
      },
      red: {
        border: "border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700",
        bg: "",
        icon: "text-red-600 dark:text-red-400",
        text: "text-red-600 dark:text-red-400"
      },
      blue: {
        border: "border-blue-200 hover:border-blue-300 dark:border-blue-800 dark:hover:border-blue-700",
        bg: "",
        icon: "text-blue-600 dark:text-blue-400",
        text: "text-blue-600 dark:text-blue-400"
      },
      purple: {
        border: "border-purple-200 hover:border-purple-300 dark:border-purple-800 dark:hover:border-purple-700",
        bg: "",
        icon: "text-purple-600 dark:text-purple-400",
        text: "text-purple-600 dark:text-purple-400"
      }
    };

    const variant = colorVariants[color];

    return (
      <Card 
        className={`transition-all duration-200 hover:shadow-lg ${variant.border} ${variant.bg} ${
          onClick ? 'cursor-pointer hover:scale-105' : ''
        }`}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className={`h-5 w-5 ${variant.icon}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-lg font-bold ${variant.text}`}>
            {cardLoading ? <Skeleton className="h-9 w-24" /> : value}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Good Morning!</h1>
          <p className="text-muted-foreground">
            Welcome to Hisaab360
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={fetchStats}
            disabled={loading}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Filters */}
      <Card className=''>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Filter by Date Range
          </CardTitle>
          <CardDescription>
            Customize your dashboard view with date filters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={handleDateFilterChange} className="w-full">
                Apply Filter
              </Button>
            </div>
            
            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setPresetDates('today')}
              variant="secondary"
              size="sm"
            >
              Today
            </Button>
            <Button
              onClick={() => setPresetDates('week')}
              variant="secondary"
              size="sm"
            >
              Last 7 Days
            </Button>
            <Button
              onClick={() => setPresetDates('month')}
              variant="secondary"
              size="sm"
            >
              Last 30 Days
            </Button>
          </div>

          {/* Active Filter Display */}
          {(startDate || endDate) && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">Active Filter:</span>
              <span className="text-sm text-blue-600">
                {startDate && `From ${new Date(startDate).toLocaleDateString()}`}
                {endDate && ` To ${new Date(endDate).toLocaleDateString()}`}
                {!startDate && endDate && `Up to ${new Date(endDate).toLocaleDateString()}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <span className="text-red-500">⚠️</span>
              <span className="font-medium">Error loading dashboard statistics:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Attraction Sections */}
      <div className="grid gap-6 lg:grid-cols-2 hidden">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3Icon className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest transactions and system activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <ShoppingCartIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">New order received</p>
                    <p className="text-xs text-muted-foreground">Order #1234 - $299.99</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">2 min ago</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <UsersIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">New customer registered</p>
                    <p className="text-xs text-muted-foreground">john.doe@example.com</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">5 min ago</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <PackageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Product updated</p>
                    <p className="text-xs text-muted-foreground">Premium Service Plan</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">1 hour ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Key performance indicators for your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <TrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Customer Satisfaction</p>
                    <p className="text-xs text-muted-foreground">Based on recent feedback</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">94%</p>
                  <p className="text-xs text-green-600 dark:text-green-400">+2.1% from last month</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <TargetIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Order Completion Rate</p>
                    <p className="text-xs text-muted-foreground">Successfully processed orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">98.7%</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">+0.5% from last month</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <DollarSignIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Revenue Growth</p>
                    <p className="text-xs text-muted-foreground">Month over month growth</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">+12.3%</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Above target</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Customers"
          value={loading ? 0 : stats.customers}
          icon={UsersIcon}
          description="Total customers"
          trend="up"
          onClick={() => router.push('/users')}
          loading={loading}
        />
        <StatCard
          title="Products"
          value={loading ? 0 : stats.products}
          icon={PackageIcon}
          description="Total Products"
          trend="up"
          onClick={() => router.push('/products')}
          loading={loading}
        />
        <StatCard
          title="Categories"
          value={loading ? 0 : stats.categories}
          icon={FolderIcon}
          description="Product categories"
          trend="neutral"
          onClick={() => router.push('/categories')}
          loading={loading}
        />
        <StatCard
          title="Orders"
          value={loading ? 0 : stats.orders}
          icon={ShoppingCartIcon}
          description="Total orders"
          trend="up"
          onClick={() => router.push('/orders')}
          loading={loading}
        />
        <StatCard
          title="Admin Users"
          value={loading ? 0 : stats.adminUsers}
          icon={UserCheckIcon}
          description="System administrators"
          trend="neutral"
          onClick={() => router.push('/admins')}
          loading={loading}
        />
      </div>

      {/* Financial Dashboard Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FinancialCard
          title="Revenue"
          value={loading ? <Skeleton className="h-9 w-24" /> : (
            <div className="flex items-center gap-1">
              <CurrencySymbol />
              {stats.totalRevenue.toFixed(2)}
            </div>
          )}
          icon={DollarSignIcon}
          description="Total revenue"
          color="green"
          onClick={() => router.push('/reports/sales')}
          loading={loading}
        />

        <FinancialCard
          title="Profit/Loss"
          value={loading ? <Skeleton className="h-9 w-24" /> : (
            <div className="flex items-center gap-1">
              <CurrencySymbol />
              {stats.totalProfit.toFixed(2)}
            </div>
          )}
          icon={stats.totalProfit >= 0 ? TrendingUpIcon : TrendingDownIcon}
          description={stats.totalProfit >= 0 ? 'Net profit' : 'Net loss'}
          color={stats.totalProfit >= 0 ? "green" : "red"}
          onClick={() => router.push('/reports/profits')}
          loading={loading}
        />

        <FinancialCard
          title="Margin"
          value={loading ? <Skeleton className="h-9 w-20" /> : `${stats.profitMargin.toFixed(1)}%`}
          icon={BarChart3Icon}
          description="Profit margin"
          color={stats.profitMargin >= 0 ? "blue" : "red"}
          loading={loading}
        />

        <FinancialCard
          title="Avg Order"
          value={loading ? <Skeleton className="h-9 w-24" /> : (
            <div className="flex items-center gap-1">
              <CurrencySymbol />
              {stats.averageOrderValue.toFixed(2)}
            </div>
          )}
          icon={ShoppingCartIcon}
          description="Average order value"
          color="purple"
          loading={loading}
        />
      </div>

      

      {/* Additional Dashboard Content old */}
      
    </div>
  );
} 