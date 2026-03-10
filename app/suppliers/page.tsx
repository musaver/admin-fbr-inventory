'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ResponsiveTable from '../components/ResponsiveTable';
import { 
  PlusIcon, 
  SearchIcon, 
  EditIcon, 
  TrashIcon,
  BuildingIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon
} from 'lucide-react';

interface Supplier {
  id: string;
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  paymentTerms?: string;
  currency?: string;
  sellerNTNCNIC?: string;
  sellerBusinessName?: string;
  sellerProvince?: string;
  sellerAddress?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const filtered = suppliers.filter(supplier =>
      supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.primaryContactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.sellerBusinessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.sellerNTNCNIC?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSuppliers(filtered);
  }, [suppliers, searchTerm]);

  const fetchSuppliers = async () => {
    try {
      setError(null);
      const response = await fetch('/api/suppliers');
      if (response.ok) {
        const data = await response.json();
        setSuppliers(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch suppliers' }));
        setError(errorData.error || 'Failed to fetch suppliers');
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuppliers(suppliers.filter(supplier => supplier.id !== id));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete supplier');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Failed to delete supplier');
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Supplier Name',
      render: (_: any, supplier: Supplier) => (
        <div className="space-y-1">
          <div className="font-medium">{supplier.name || 'Unnamed Supplier'}</div>
          {supplier.companyName && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <BuildingIcon className="h-3 w-3" />
              {supplier.companyName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      title: 'Contact Information',
      render: (_: any, supplier: Supplier) => (
        <div className="space-y-1">
          {supplier.email && (
            <div className="flex items-center gap-1 text-sm">
              <MailIcon className="h-3 w-3" />
              {supplier.email}
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <PhoneIcon className="h-3 w-3" />
              {supplier.phone}
            </div>
          )}
          {supplier.primaryContactName && (
            <div className="text-sm text-muted-foreground">
              Contact: {supplier.primaryContactName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'location',
      title: 'Location',
      render: (_: any, supplier: Supplier) => (
        <div className="space-y-1">
          {(supplier.city || supplier.state || supplier.country) && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPinIcon className="h-3 w-3" />
              {[supplier.city, supplier.state, supplier.country].filter(Boolean).join(', ')}
            </div>
          )}
          {supplier.address && (
            <div className="text-sm text-muted-foreground">
              {supplier.address}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'terms',
      title: 'Payment Terms',
      render: (_: any, supplier: Supplier) => (
        <div className="space-y-1">
          {supplier.paymentTerms && (
            <Badge variant="outline">{supplier.paymentTerms}</Badge>
          )}
          <div className="text-sm text-muted-foreground">
            Currency: {supplier.currency || 'USD'}
          </div>
        </div>
      ),
    },
    {
      key: 'seller',
      title: 'Seller Information',
      render: (_: any, supplier: Supplier) => (
        <div className="space-y-1">
          {supplier.sellerBusinessName && (
            <div className="font-medium text-sm">
              {supplier.sellerBusinessName}
            </div>
          )}
          {supplier.sellerNTNCNIC && (
            <div className="text-sm text-muted-foreground">
              NTN/CNIC: {supplier.sellerNTNCNIC}
            </div>
          )}
          {supplier.sellerProvince && (
            <div className="text-sm text-muted-foreground">
              Province: {supplier.sellerProvince}
            </div>
          )}
          {supplier.sellerAddress && (
            <div className="text-sm text-muted-foreground">
              {supplier.sellerAddress}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (_: any, supplier: Supplier) => (
        <Badge variant={supplier.isActive !== false ? 'default' : 'secondary'}>
          {supplier.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, supplier: Supplier) => (
        <div className="flex items-center gap-2">
          <Link href={`/suppliers/edit/${supplier.id}`}>
            <Button variant="outline" size="sm">
              <EditIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(supplier.id, supplier.name || 'Unnamed Supplier')}
            className="text-destructive hover:text-destructive"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground">
              Manage your suppliers and vendor relationships
            </p>
          </div>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchSuppliers} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage your suppliers and vendor relationships
          </p>
        </div>
        <Link href="/suppliers/add">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <ResponsiveTable
          data={filteredSuppliers}
          columns={columns}
          emptyMessage="No suppliers found. Add your first supplier to get started."
        />
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredSuppliers.length} of {suppliers.length} suppliers
      </div>
    </div>
  );
}
