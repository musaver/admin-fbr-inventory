'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { normalizeProductImages } from '../../utils/jsonUtils';
import CurrencySymbol from '../../components/CurrencySymbol';
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
  EyeIcon, 
  TrashIcon,
  RefreshCwIcon,
  PackageIcon,
  SearchIcon,
  DownloadIcon
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: string;
  productType: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId?: string;
  images?: any;
  createdAt: string;
  // Tax and pricing fields
  taxAmount?: string;
  taxPercentage?: string;
  priceIncludingTax?: string;
  hsCode?: string;
  // Product identification fields
  serialNumber?: string;
  listNumber?: string;
  bcNumber?: string;
  lotNumber?: string;
  expiryDate?: string;
  uom?: string;
  description?: string;
}

interface ProductWithCategory {
  product: Product;
  category: {
    id: string;
    name: string;
  } | null;
  supplier: {
    id: string;
    name: string;
    companyName?: string;
  } | null;
}

export default function ProductsList() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchProducts = async (page = 1, limit = pageSize, search = searchTerm) => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (limit === -1) {
        params.append('limit', '999999'); // Very large number for "view all"
      } else {
        params.append('page', page.toString());
        params.append('limit', limit.toString());
      }
      
      if (search.trim()) {
        params.append('search', search.trim());
      }
      
      const apiUrl = `/api/products?${params.toString()}`;
      const res = await fetch(apiUrl);
      const response = await res.json();
      
      if (response.data && response.pagination) {
        // Handle paginated response
        setProducts(response.data);
        setPagination(response.pagination);
      } else {
        // Handle non-paginated response (fallback)
        const data = response.data || response;
        const sorted = Array.isArray(data)
          ? [...data].sort((a, b) => {
              const aTime = a?.product?.createdAt ? new Date(a.product.createdAt).getTime() : 0;
              const bTime = b?.product?.createdAt ? new Date(b.product.createdAt).getTime() : 0;
              return bTime - aTime;
            })
          : data;
        setProducts(sorted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage, pageSize);
  }, [currentPage]);
  
  // Effect for page size changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when changing page size
    fetchProducts(1, pageSize);
  }, [pageSize]);

  // Effect for search changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when searching
    fetchProducts(1, pageSize, searchTerm);
  }, [searchTerm]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        setProducts(products.filter((item) => item.product.id !== id));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedProducts(new Set(products.map(item => item.product.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
    setSelectAll(newSelected.size === products.length && products.length > 0);
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedProducts.size} selected product(s)? This action cannot be undone.`)) {
      try {
        setLoading(true);
        const ids = Array.from(selectedProducts);
        const res = await fetch('/api/products/delete-batch', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });

        if (res.ok) {
          // Remove deleted products from state
          const remainingProducts = products.filter(item => !ids.includes(item.product.id));
          setProducts(remainingProducts);
          setSelectedProducts(new Set());
          setSelectAll(false);
          alert(`${ids.length} product(s) deleted successfully.`);
        } else {
          const data = await res.json().catch(() => ({}));
          alert(`Failed to delete selected products. ${data?.error || ''}`);
        }
      } catch (error) {
        console.error('Error deleting selected products:', error);
        alert('Error deleting selected products. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (confirm('Are you sure you want to delete ALL products? This action cannot be undone and will also delete all related data including product variants, inventory, and order history.')) {
      try {
        setLoading(true);
        const res = await fetch('/api/products/delete-all', { method: 'DELETE' });
        if (res.ok) {
          setProducts([]);
          setSelectedProducts(new Set());
          setSelectAll(false);
          alert('All products have been deleted successfully.');
        } else {
          const errorData = await res.json();
          alert(`Failed to delete products: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error deleting all products:', error);
        alert('Error deleting all products. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const exportProducts = async () => {
    setExporting(true);
    try {
      // Get all products for export (not just current page)
      const allProductsResponse = await fetch('/api/products?limit=999999');
      const allProductsData = await allProductsResponse.json();
      const allProducts = allProductsData.data || allProductsData;

      // Convert products data to CSV format matching the import template exactly
      const csvHeaders = [
        'SKU', 'Unit Price', 'Price Including Tax', 'Description', 'GST Amount', 'GST Percentage', 'HS Code', 'Stock Quantity', 'Serial Number', 'List Number', 'BC Number', 'Lot Number', 'Expiry Date', 'UOM'
      ];
      
      const csvData = allProducts.map((item: ProductWithCategory) => [
        item.product.sku || '',
        item.product.price || '',
        item.product.priceIncludingTax || '',
        item.product.description || item.product.name || '',
        item.product.taxAmount || '',
        item.product.taxPercentage || '',
        item.product.hsCode || '',
        '', // Stock Quantity - would need to be fetched from inventory
        item.product.serialNumber || '',
        item.product.listNumber || '',
        item.product.bcNumber || '',
        item.product.lotNumber || '',
        item.product.expiryDate || '',
        item.product.uom || ''
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
      link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting products:', error);
      alert('Failed to export products');
    } finally {
      setExporting(false);
    }
  };

  const formatPrice = (price: string, productType?: string) => {
    const numPrice = parseFloat(price);
    if (productType === 'group' && numPrice === 0) {
      return 'From addons';
    }
    return (
      <span className="flex items-center gap-1">
        <CurrencySymbol />
        {numPrice.toFixed(2)}
      </span>
    );
  };

  const getFirstProductImage = (imagesData: any): string | null => {
    const normalizedImages = normalizeProductImages(imagesData);
    return normalizedImages.length > 0 ? normalizedImages[0] : null;
  };

  const ProductImage = ({ imagesData, productName }: { imagesData: any; productName: string }) => {
    const imageUrl = getFirstProductImage(imagesData);
    
    if (!imageUrl) {
      return (
        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
          <PackageIcon className="h-6 w-6 text-gray-400" />
        </div>
      );
    }

    return (
      <img 
        src={imageUrl}
        alt={productName}
        className="w-12 h-12 object-cover rounded border border-gray-200"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          const fallback = (e.target as HTMLElement).parentElement?.querySelector('.fallback-image') as HTMLElement;
          if (fallback) {
            fallback.style.display = 'flex';
          }
        }}
      />
    );
  };

  const getStats = () => {
    // Safety check to ensure products is an array
    if (!Array.isArray(products)) {
      return { totalProducts: 0, activeProducts: 0, featuredProducts: 0, groupProducts: 0 };
    }
    
    // Use pagination total for overall count, but calculate other stats from current page
    const totalProducts = pagination.total || products.length;
    const activeProducts = products.filter(item => item.product.isActive).length;
    const featuredProducts = products.filter(item => item.product.isFeatured).length;
    const groupProducts = products.filter(item => item.product.productType === 'group').length;
    
    return { totalProducts, activeProducts, featuredProducts, groupProducts };
  };

  const stats = getStats();

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
      render: (_: any, item: ProductWithCategory) => (
        <input
          type="checkbox"
          checked={selectedProducts.has(item.product.id)}
          onChange={(e) => handleSelectProduct(item.product.id, e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      )
    },
    {
      key: 'image',
      title: 'Image',
      render: (_: any, item: ProductWithCategory) => (
        <ProductImage 
          imagesData={item.product.images} 
          productName={item.product.name}
        />
      ),
      mobileHidden: true
    },
    {
      key: 'name',
      title: 'Product',
      render: (_: any, item: ProductWithCategory) => (
        <div>
          <div className="font-medium">{item.product.name}</div>
          {item.product.sku && (
            <div className="text-sm text-muted-foreground">SKU: {item.product.sku}</div>
          )}
        </div>
      )
    },
    {
      key: 'type',
      title: 'Type',
      render: (_: any, item: ProductWithCategory) => (
        <Badge variant={item.product.productType === 'group' ? 'secondary' : 'outline'}>
          {item.product.productType === 'group' ? 'Group' : 'Simple'}
        </Badge>
      ),
      mobileHidden: true
    },
    {
      key: 'price',
      title: 'Price',
      render: (_: any, item: ProductWithCategory) => (
        <div className="font-medium">
          {formatPrice(item.product.price, item.product.productType)}
        </div>
      )
    },
    {
      key: 'category',
      title: 'Category',
      render: (_: any, item: ProductWithCategory) => (
        <div className="text-sm">
          {item.category ? item.category.name : 'No Category'}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'supplier',
      title: 'Supplier',
      render: (_: any, item: ProductWithCategory) => (
        <div className="text-sm">
          {item.supplier ? (
            <div>
              <div className="font-medium">{item.supplier.name}</div>
              {item.supplier.companyName && (
                <div className="text-xs text-muted-foreground">{item.supplier.companyName}</div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">No Supplier</span>
          )}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'status',
      title: 'Status',
      render: (_: any, item: ProductWithCategory) => (
        <div className="space-y-1">
          <Badge variant={item.product.isActive ? 'default' : 'secondary'}>
            {item.product.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {item.product.isFeatured && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Featured
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'taxInfo',
      title: 'Tax Info',
      render: (_: any, item: ProductWithCategory) => (
        <div className="text-xs space-y-1">
          {item.product.taxAmount && (
            <div className="text-blue-600">GST: {item.product.taxAmount}</div>
          )}
          {item.product.taxPercentage && (
            <div className="text-blue-600">Rate: {item.product.taxPercentage}%</div>
          )}
          {item.product.hsCode && (
            <div className="text-gray-600">HS: {item.product.hsCode}</div>
          )}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'identifiers',
      title: 'Identifiers',
      render: (_: any, item: ProductWithCategory) => (
        <div className="text-xs space-y-1">
          {item.product.serialNumber && (
            <div className="text-green-600">Serial: {item.product.serialNumber}</div>
          )}
          {item.product.listNumber && (
            <div className="text-purple-600">List: {item.product.listNumber}</div>
          )}
          {item.product.bcNumber && (
            <div className="text-orange-600">BC: {item.product.bcNumber}</div>
          )}
          {item.product.lotNumber && (
            <div className="text-pink-600">Lot: {item.product.lotNumber}</div>
          )}
          {item.product.expiryDate && (
            <div className="text-red-600">Exp: {item.product.expiryDate}</div>
          )}
          {item.product.uom && (
            <div className="text-gray-600">UOM: {item.product.uom}</div>
          )}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'createdAt',
      title: 'Created',
      render: (_: any, item: ProductWithCategory) => (
        <div className="text-sm">
          {new Date(item.product.createdAt).toLocaleDateString()}
        </div>
      ),
      mobileHidden: true
    }
  ];

  const renderActions = (item: ProductWithCategory) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/products/edit/${item.product.id}`} className="flex items-center">
            <EditIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleDelete(item.product.id)}
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
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your products and services
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={exportProducts} 
            disabled={exporting || products.length === 0} 
            variant="outline" 
            size="sm"
          >
            <DownloadIcon className={`h-4 w-4 mr-2 ${exporting ? 'animate-spin' : ''}`} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button onClick={() => fetchProducts(currentPage, pageSize, searchTerm)} disabled={loading} variant="outline" size="sm">
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleDeleteSelected} 
            disabled={loading || selectedProducts.size === 0} 
            variant="destructive" 
            size="sm"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete Selected ({selectedProducts.size})
          </Button>
          <Button 
            onClick={handleDeleteAll} 
            disabled={loading || products.length === 0} 
            variant="destructive" 
            size="sm"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete All
          </Button>
          <Button asChild variant="outline">
            <Link href="/users/bulk-upload?tab=products">
              📤 Bulk Import
            </Link>
          </Button>
          <Button asChild>
            <Link href="/products/add">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        {searchTerm && (
          <Button 
            onClick={() => setSearchTerm('')} 
            variant="outline" 
            size="sm"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{stats.activeProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.featuredProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Group Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.groupProducts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <ResponsiveTable
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="No products found"
        actions={renderActions}
      />

      {/* Pagination */}
      {(pagination.totalPages > 1 || pageSize === -1) && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {pageSize === -1 ? (
                `Showing all ${pagination.total} products`
              ) : (
                <>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
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