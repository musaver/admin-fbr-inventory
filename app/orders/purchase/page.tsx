'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ResponsiveTable from '../../components/ResponsiveTable';
import { 
  PlusIcon, 
  SearchIcon, 
  EditIcon, 
  EyeIcon,
  BuildingIcon,
  CalendarIcon,
  PackageIcon
} from 'lucide-react';
import CurrencySymbol from '../../components/CurrencySymbol';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  purchaseOrderNumber?: string;
  orderType: string;
  supplierId?: string;
  supplierName?: string;
  supplierCompany?: string;
  status: string;
  totalAmount: string;
  currency: string;
  expectedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    const filtered = purchaseOrders.filter(order => {
      const matchesSearch = 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.purchaseOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplierCompany?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    setFilteredOrders(filtered);
  }, [purchaseOrders, searchTerm, statusFilter]);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch('/api/orders?orderType=purchase_order');
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data);
      } else {
        console.error('Failed to fetch purchase orders');
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'processing': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const columns = [
    {
      key: 'orderInfo',
      title: 'Order Information',
      render: (order: PurchaseOrder) => (
        <div className="space-y-1">
          <div className="font-medium">{order.orderNumber}</div>
          {order.purchaseOrderNumber && (
            <div className="text-sm text-muted-foreground">
              PO: {order.purchaseOrderNumber}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Created: {new Date(order.createdAt).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      key: 'supplier',
      title: 'Supplier',
      render: (order: PurchaseOrder) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <BuildingIcon className="h-3 w-3" />
            <span className="font-medium">{order.supplierName || 'N/A'}</span>
          </div>
          {order.supplierCompany && (
            <div className="text-sm text-muted-foreground">
              {order.supplierCompany}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      title: 'Total Amount',
      render: (order: PurchaseOrder) => (
        <div className="font-medium">
          <CurrencySymbol />
          {parseFloat(order.totalAmount).toFixed(2)}
        </div>
      ),
    },
    {
      key: 'delivery',
      title: 'Expected Delivery',
      render: (order: PurchaseOrder) => (
        <div className="space-y-1">
          {order.expectedDeliveryDate ? (
            <div className="flex items-center gap-1 text-sm">
              <CalendarIcon className="h-3 w-3" />
              {new Date(order.expectedDeliveryDate).toLocaleDateString()}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">Not specified</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (order: PurchaseOrder) => (
        <Badge variant={getStatusColor(order.status)}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (order: PurchaseOrder) => (
        <div className="flex items-center gap-2">
          <Link href={`/orders/${order.id}`}>
            <Button variant="outline" size="sm">
              <EyeIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/orders/edit/${order.id}`}>
            <Button variant="outline" size="sm">
              <EditIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage orders to suppliers and track deliveries
          </p>
        </div>
        <Link href="/orders/purchase/add">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Purchase Order
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-card rounded-lg border">
        <ResponsiveTable
          data={filteredOrders}
          columns={columns}
          emptyMessage="No purchase orders found. Create your first purchase order to get started."
        />
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredOrders.length} of {purchaseOrders.length} purchase orders
      </div>
    </div>
  );
}
