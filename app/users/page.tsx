'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ResponsiveTable from '../components/ResponsiveTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  PlusIcon, 
  MoreVerticalIcon, 
  EditIcon, 
  TrashIcon,
  RefreshCwIcon,
  UsersIcon,
  DownloadIcon,
  UploadIcon
} from 'lucide-react';

interface User {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  createdAt: string;
  // Buyer-specific fields
  buyerNTNCNIC?: string;
  buyerBusinessName?: string;
  buyerProvince?: string;
  buyerAddress?: string;
  buyerRegistrationType?: string;
  loyaltyPoints?: {
    availablePoints: number;
    pendingPoints: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    pointsExpiringSoon: number;
  };
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchUsers = async (page = 1, limit = pageSize) => {
    setLoading(true);
    try {
      // Handle "view all" case
      const apiUrl = limit === -1 
        ? '/api/users?limit=999999' // Very large number for "view all"
        : `/api/users?page=${page}&limit=${limit}`;
      const res = await fetch(apiUrl);
      const response = await res.json();
      
      if (response.data && response.pagination) {
        // Handle paginated response
        setUsers(response.data);
        setPagination(response.pagination);
      } else {
        // Handle non-paginated response (fallback)
        const data = response.data || response;
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => {
            const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          });
          setUsers(sorted);
        } else {
          console.error('API returned non-array data:', data);
          setUsers([]);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, pageSize);
  }, [currentPage]);
  
  // Effect for page size changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when changing page size
    fetchUsers(1, pageSize);
  }, [pageSize]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
        setUsers(users.filter((user) => user.id !== id));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelected(checked ? new Set(users.map(u => u.id)) : new Set());
  };

  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id); else next.delete(id);
    setSelected(next);
    setSelectAll(next.size === users.length && users.length > 0);
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected user(s)? This cannot be undone.`)) return;
    try {
      setLoading(true);
      const ids = Array.from(selected);
      const res = await fetch('/api/users/delete-batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => !ids.includes(u.id)));
        setSelected(new Set());
        setSelectAll(false);
        alert(`${ids.length} user(s) deleted successfully.`);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to delete selected users. ${data?.error || ''}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const exportUsers = async () => {
    setExporting(true);
    try {
      // Convert users data to CSV format matching the import template exactly
      const csvHeaders = [
        'Name', 'Email', 'Phone', 'Buyer NTN Or CNIC', 'Buyer Business Name', 'Buyer Province', 'Buyer Address', 'Buyer Registration Type'
      ];
      const csvData = users.map((user) => [
        user.name || '',
        user.email || '',
        user.phone || '',
        user.buyerNTNCNIC || '',
        user.buyerBusinessName || '',
        user.buyerProvince || user.country || '', // Use buyerProvince first, fallback to country
        user.buyerAddress || user.address || '',
        user.buyerRegistrationType || ''
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting users:', error);
      alert('Failed to export users');
    } finally {
      setExporting(false);
    }
  };

  const handlePreviousPage = () => {
    if (pagination.hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStats = () => {
    // Ensure users is an array
    const userArray = Array.isArray(users) ? users : [];
    
    // Use pagination total for overall count, but calculate other stats from current page
    const totalUsers = pagination.total || userArray.length;
    const usersWithPhone = userArray.filter(user => user.phone).length;
    const usersWithAddress = userArray.filter(user => user.address).length;
    
    // Loyalty points stats
    const usersWithPoints = userArray.filter(user => user.loyaltyPoints && user.loyaltyPoints.availablePoints > 0).length;
    const totalAvailablePoints = userArray.reduce((sum, user) => sum + (user.loyaltyPoints?.availablePoints || 0), 0);
    const totalPointsEarned = userArray.reduce((sum, user) => sum + (user.loyaltyPoints?.totalPointsEarned || 0), 0);
    const totalPointsRedeemed = userArray.reduce((sum, user) => sum + (user.loyaltyPoints?.totalPointsRedeemed || 0), 0);
    const usersWithExpiring = userArray.filter(user => user.loyaltyPoints && user.loyaltyPoints.pointsExpiringSoon > 0).length;
    
    return { 
      totalUsers, 
      usersWithPhone, 
      usersWithAddress,
      usersWithPoints,
      totalAvailablePoints,
      totalPointsEarned,
      totalPointsRedeemed,
      usersWithExpiring
    };
  };

  const stats = getStats();

  const columns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectAll}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      width: '50px',
      render: (_: any, u: User) => (
        <input
          type="checkbox"
          checked={selected.has(u.id)}
          onChange={(e) => handleSelect(u.id, e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      )
    },
    {
      key: 'name',
      title: 'User',
      render: (_: any, user: User) => (
        <div>
          <div className="font-medium">{user.name || 'No Name'}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      )
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (_: any, user: User) => (
        <div className="text-sm">
          {user.phone || 'No phone'}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'location',
      title: 'Location',
      render: (_: any, user: User) => (
        <div className="text-sm">
          {user.city && user.country 
            ? `${user.city}, ${user.country}`
            : user.country || user.city || 'No location'
          }
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'loyaltyPoints',
      title: 'Loyalty Points',
      render: (_: any, user: User) => (
        <div className="text-sm space-y-1">
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            <Badge 
              variant="secondary" 
              className={`text-xs ${
                (user.loyaltyPoints?.availablePoints || 0) > 0 
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {user.loyaltyPoints?.availablePoints || 0} available
            </Badge>
            {user.loyaltyPoints && user.loyaltyPoints.pendingPoints > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                {user.loyaltyPoints.pendingPoints} pending
              </Badge>
            )}
            {user.loyaltyPoints && user.loyaltyPoints.pointsExpiringSoon > 0 && (
              <Badge variant="destructive" className="text-xs">
                {user.loyaltyPoints.pointsExpiringSoon} expiring
              </Badge>
            )}
          </div>
          {user.loyaltyPoints && (user.loyaltyPoints.totalPointsEarned > 0 || user.loyaltyPoints.totalPointsRedeemed > 0) && (
            <div className="text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Earned: {user.loyaltyPoints.totalPointsEarned}</span>
                <span>Redeemed: {user.loyaltyPoints.totalPointsRedeemed}</span>
              </div>
            </div>
          )}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'address',
      title: 'Address',
      render: (_: any, user: User) => (
        <div className="text-sm max-w-xs truncate">
          {user.address || 'No address'}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'createdAt',
      title: 'Joined',
      render: (_: any, user: User) => (
        <div className="text-sm">
          {new Date(user.createdAt).toLocaleDateString()}
        </div>
      )
    }
  ];

  const renderActions = (user: User) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/users/edit/${user.id}`} className="flex items-center">
            <EditIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/users/${user.id}/points-history`} className="flex items-center">
            <Badge className="h-4 w-4 mr-2 bg-purple-600" />
            Points History
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleDelete(user.id)}
          className="text-red-600 focus:text-red-600"
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage customer accounts and information
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={exportUsers} 
            disabled={exporting || users.length === 0} 
            variant="outline" 
            size="sm"
          >
            <DownloadIcon className={`h-4 w-4 mr-2 ${exporting ? 'animate-spin' : ''}`} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/users/bulk-upload">
              <UploadIcon className="h-4 w-4 mr-2" /> 
              Bulk Import
            </Link>
          </Button>
          <Button onClick={() => fetchUsers(currentPage, pageSize)} disabled={loading} variant="outline" size="sm">
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleDeleteSelected} disabled={loading || selected.size === 0} variant="destructive" size="sm">
            Delete Selected ({selected.size})
          </Button>
          <Button asChild>
            <Link href="/users/add">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add User
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.usersWithPhone}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{stats.usersWithAddress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.usersWithPoints}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalAvailablePoints.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.usersWithExpiring}</div>
            <p className="text-xs text-muted-foreground">users affected</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <ResponsiveTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No users found"
        actions={renderActions}
      />

      {/* Pagination */}
      {(pagination.totalPages > 1 || pageSize === -1) && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {pageSize === -1 ? (
                `Showing all ${pagination.total} users`
              ) : (
                <>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                </>
              )}
            </span>
            
            <div className="flex items-center gap-2">
              <span className="text-sm">Show:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {pageSize === -1 ? 'View All' : pageSize} 
                    <span className="ml-1">▼</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handlePageSizeChange(10)}>
                    10 per page
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePageSizeChange(20)}>
                    20 per page
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePageSizeChange(50)}>
                    50 per page
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePageSizeChange(100)}>
                    100 per page
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePageSizeChange(-1)}>
                    View All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {pageSize !== -1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={!pagination.hasPrevPage || loading}
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!pagination.hasNextPage || loading}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 