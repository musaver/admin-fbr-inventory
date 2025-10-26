'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Upload, 
  Download, 
  Users, 
  Package,
  ShoppingCart,
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  Loader2,
  BarChart3,
  FileDown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImportJob {
  id: string;
  fileName: string;
  status: string;
  type: string;
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  progressPercent: number;
  estimatedTimeRemaining: number | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errors: Array<{
    row: number;
    email?: string;
    identifier?: string;
    message: string;
  }>;
  results: {
    successful: number;
    failed: number;
    successfulUsers?: Array<{
      id: string;
      name: string;
      email: string;
    }>;
    successfulProducts?: Array<{
      id: string;
      name: string;
      sku: string;
    }>;
    successfulOrders?: Array<{
      id: string;
      orderNumber: string;
      customOrderNumberImport: string | null;
      customerEmail: string;
      itemCount: number;
      rowNumbers: number[];
    }>;
    detailedReport?: Array<{
      row: number;
      status: 'success' | 'failed';
      action: string;
      data: {
        customerEmail?: string;
        customOrderNumber?: string;
        productSku?: string;
        productName?: string;
        quantity?: number;
        unitPrice?: number;
        taxAmount?: number;
        taxPercentage?: number;
        priceIncludingTax?: number;
        orderNumber?: string;
        orderId?: string;
        errorMessage?: string;
      };
    }>;
  } | null;
}

// Detailed Import Report Component
interface DetailedImportReportProps {
  report: Array<{
    row: number;
    status: 'success' | 'failed';
    action: string;
    data: {
      customerEmail?: string;
      customOrderNumber?: string;
      productSku?: string;
      productName?: string;
      quantity?: number;
      unitPrice?: number;
      taxAmount?: number;
      taxPercentage?: number;
      priceIncludingTax?: number;
      orderNumber?: string;
      orderId?: string;
      errorMessage?: string;
    };
  }>;
  importType: string;
  fileName: string;
}

function DetailedImportReport({ report, fileName }: DetailedImportReportProps) {
  const [showAllRows, setShowAllRows] = useState(false);
  const [sortBy, setSortBy] = useState<'row' | 'status'>('row');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');

  const filteredReport = report.filter(item => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const sortedReport = [...filteredReport].sort((a, b) => {
    if (sortBy === 'row') return a.row - b.row;
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    return 0;
  });

  const displayedReport = showAllRows ? sortedReport : sortedReport.slice(0, 20);
  const successCount = report.filter(item => item.status === 'success').length;
  const failedCount = report.filter(item => item.status === 'failed').length;

  const downloadReport = () => {
    const csvHeaders = ['Row', 'Status', 'Action', 'Customer Email', 'Order Number', 'Custom Order Number', 'Product SKU', 'Product Name', 'Quantity', 'Unit Price', 'Tax Amount', 'Tax Percentage', 'Price Including Tax', 'Error Message'];
    const csvRows = [
      csvHeaders.join(','),
      ...report.map(item => [
        item.row,
        item.status,
        item.action,
        item.data.customerEmail || '',
        item.data.orderNumber || '',
        item.data.customOrderNumber || '',
        item.data.productSku || '',
        item.data.productName || '',
        item.data.quantity || '',
        item.data.unitPrice || '',
        item.data.taxAmount || '',
        item.data.taxPercentage || '',
        item.data.priceIncludingTax || '',
        item.data.errorMessage || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${fileName.replace('.csv', '')}_import_report.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-800 dark:text-blue-200">
              Detailed Import Report
            </CardTitle>
          </div>
          <Button
            onClick={downloadReport}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <CardDescription>
          Row-by-row breakdown of the import process ({report.length} total rows)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">{successCount}</div>
            <div className="text-sm text-green-600 dark:text-green-400">Successful Rows</div>
          </div>
          <div className="bg-red-50 dark:bg-red-950 p-3 rounded border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-800 dark:text-red-200">{failedCount}</div>
            <div className="text-sm text-red-600 dark:text-red-400">Failed Rows</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{report.length}</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Total Rows</div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-4 py-2 border-t border-b">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Filter:</Label>
            <div className="flex gap-1">
              {['all', 'success', 'failed'].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status as any)}
                  className="h-7 text-xs"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== 'all' && (
                    <Badge variant="secondary" className="ml-1 h-4 text-xs px-1">
                      {status === 'success' ? successCount : failedCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Sort by:</Label>
            <div className="flex gap-1">
              {[
                { key: 'row', label: 'Row #' },
                { key: 'status', label: 'Status' }
              ].map((sort) => (
                <Button
                  key={sort.key}
                  variant={sortBy === sort.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy(sort.key as any)}
                  className="h-7 text-xs"
                >
                  {sort.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Table */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {displayedReport.map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                item.status === 'success'
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={item.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                    Row {item.row}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {item.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  {item.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {item.data.customerEmail && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Customer:</span>
                    <div className="font-mono text-xs">{item.data.customerEmail}</div>
                  </div>
                )}
                
                {item.data.customOrderNumber && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Original Order #:</span>
                    <div className="font-mono text-xs">{item.data.customOrderNumber}</div>
                  </div>
                )}
                
                {item.data.orderNumber && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Generated Order #:</span>
                    <div className="font-mono text-xs">{item.data.orderNumber}</div>
                  </div>
                )}
                
                {item.data.productSku && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Product SKU:</span>
                    <div className="font-mono text-xs">{item.data.productSku}</div>
                  </div>
                )}
                
                {item.data.productName && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Product:</span>
                    <div className="text-xs">{item.data.productName}</div>
                  </div>
                )}
                
                {item.data.quantity && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Quantity:</span>
                    <div className="text-xs">{item.data.quantity}</div>
                  </div>
                )}
                
                {item.data.unitPrice && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Unit Price (Excl. Tax):</span>
                    <div className="text-xs">{item.data.unitPrice}</div>
                  </div>
                )}
                
                {item.data.taxAmount && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Tax Amount:</span>
                    <div className="text-xs">{item.data.taxAmount}</div>
                  </div>
                )}
                
                {item.data.taxPercentage && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Tax %:</span>
                    <div className="text-xs">{item.data.taxPercentage}%</div>
                  </div>
                )}
                
                {item.data.priceIncludingTax && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Price (Incl. Tax):</span>
                    <div className="text-xs">{item.data.priceIncludingTax}</div>
                  </div>
                )}
              </div>

              {item.data.errorMessage && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded border border-red-200 dark:border-red-700">
                  <div className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">Error:</div>
                  <div className="text-xs text-red-700 dark:text-red-300">{item.data.errorMessage}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show More/Less Button */}
        {filteredReport.length > 20 && (
          <div className="flex justify-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowAllRows(!showAllRows)}
              className="gap-2"
            >
              {showAllRows ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less (showing all {filteredReport.length} rows)
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show All Rows ({filteredReport.length - 20} more)
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BulkUserUpload() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const defaultTab = searchParams.get('tab') === 'products' ? 'products' : 
                    searchParams.get('tab') === 'orders' ? 'orders' : 'users';
  const [activeTab, setActiveTab] = useState<'users' | 'products' | 'orders'>(defaultTab);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [error, setError] = useState('');
  const [showTechnicalLogs, setShowTechnicalLogs] = useState(false);
  const [removeExistingData, setRemoveExistingData] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const downloadTemplate = () => {
    let csvContent = '';
    let fileName = '';
    
    if (activeTab === 'users') {
      csvContent = `Name,Email,Phone,Buyer NTN Or CNIC,Buyer Business Name,Buyer Province,Buyer Address,Buyer Registration Type
"John Doe","john.doe@example.com","+92300-1234567","1234567890123","Doe Industries","Punjab","123 Business Street, Lahore","Registered"
"Jane Smith","jane.smith@example.com","+92321-9876543","9876543210987","Smith Trading Co","Sindh","456 Commerce Avenue, Karachi","Registered"
"Ahmed Khan","ahmed.khan@example.com","+92333-1122334","1122334455667","Khan Enterprises","KPK","789 Market Road, Peshawar","Unregistered"`;
      fileName = 'bulk_user_import_template.csv';
    } else if (activeTab === 'products') {
      csvContent = `SKU,Unit Price,Price Including Tax,Description,GST Amount,GST Percentage,HS Code,Stock Quantity,Serial Number,List Number,BC Number,Lot Number,Expiry Date,UOM
"PROD-001","29.99","32.49","Premium quality product","2.50","8.5","1234567890","100","SN123456789","LIST-001","BC123456","LOT-2024-001","2024-12-31","Pcs"
"PROD-002","19.99","21.59","Standard quality item","1.60","8.0","9876543210","50","SN987654321","LIST-002","BC654321","LOT-2024-002","2025-06-30","Kg"
"PROD-003","45.00","48.60","High-end product","3.60","8.0","5555666677","25","SN555666777","LIST-003","BC777888","LOT-2024-003","2025-12-31","Ltr"`;
      fileName = 'bulk_product_import_template.csv';
    } else {
      csvContent = `Order Number,Customer Phone,Customer Name,Customer Email,Product SKU,Product Name,Quantity,Unit Price,Tax Amount,Tax Percentage,Price Including Tax,HS Code,UOM,Serial Number,List Number,BC Number,Lot Number,Expiry Date
"ORD-001","+92300-1234567","John Doe","john.doe@example.com","PROD-001","Premium Widget - High quality widget for professional use","2","29.99","2.40","8.0","32.39","1234567890","Pcs","SN123456789","LIST-001","BC123456","LOT-2024-001","2024-12-31"
"ORD-001","+92300-1234567","John Doe","john.doe@example.com","PROD-002","Standard Item - Additional item for same order","","","1.60","8.0","21.59","9876543210","Kg","SN987654321","LIST-002","BC654321","LOT-2024-002","2025-06-30"
"ORD-002","+92321-9876543","Jane Smith","jane.smith@example.com","PROD-003","Premium Product - Premium quality product for special customers","3","45.00","3.60","8.0","48.60","5555666677","Ltr","SN555666777","LIST-003","BC777888","LOT-2024-003","2025-12-31"
"ORD-003","+92333-1122334","Ahmed Khan","ahmed.khan@example.com","PROD-001","Premium Widget - Single item order example","","","2.40","8.0","32.39","1234567890","Pcs","SN123456790","LIST-001","BC123457","LOT-2024-004","2024-12-31"`;
      fileName = 'bulk_order_import_template.csv';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedBy', 'current-user');
      formData.append('type', activeTab);
      formData.append('removeExistingData', removeExistingData.toString());

      const response = await fetch('/api/users/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      startStatusPolling(data.jobId);

    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  };

  const startStatusPolling = (jobId: string) => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/users/import-status/${jobId}`);
        const job: ImportJob = await response.json();
        
        setCurrentJob(job);

        if (job.status === 'completed' || job.status === 'failed') {
          setUploading(false);
          return;
        }

        setTimeout(pollStatus, 2000);
      } catch (error) {
        console.error('Error polling status:', error);
        setUploading(false);
      }
    };

    pollStatus();
  };

  const resetForm = () => {
    setFile(null);
    setCurrentJob(null);
    setError('');
    setUploading(false);
    setRemoveExistingData(false);
    const fileInput = document.getElementById('csvFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const formatTimeRemaining = (seconds: number | null): string => {
    if (!seconds) return 'Calculating...';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'processing': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTechnicalLogs = (): string[] => {
    if (!currentJob) return [];
    
    const logs: string[] = [];
    
    // Basic job information
    logs.push(`🚀 Import Job Started: ${currentJob.fileName}`);
    logs.push(`📁 Import Type: ${currentJob.type}`);
    logs.push(`⏰ Created At: ${new Date(currentJob.createdAt).toLocaleString()}`);
    
    if (currentJob.startedAt) {
      logs.push(`▶️ Processing Started: ${new Date(currentJob.startedAt).toLocaleString()}`);
    }
    
    // Progress information
    if (currentJob.totalRecords > 0) {
      logs.push(`📊 Total Records to Process: ${currentJob.totalRecords}`);
      logs.push(`✅ Successfully Processed: ${currentJob.successfulRecords}`);
      logs.push(`❌ Failed Records: ${currentJob.failedRecords}`);
      logs.push(`📈 Progress: ${currentJob.progressPercent}%`);
    }
    
    // Status updates
    if (currentJob.status === 'processing') {
      logs.push(`🔄 Status: Processing... (${currentJob.processedRecords}/${currentJob.totalRecords})`);
      if (currentJob.estimatedTimeRemaining) {
        logs.push(`⏱️ Estimated Time Remaining: ${formatTimeRemaining(currentJob.estimatedTimeRemaining)}`);
      }
    } else if (currentJob.status === 'completed') {
      logs.push(`🎉 Status: Completed Successfully`);
      if (currentJob.completedAt) {
        logs.push(`🏁 Completed At: ${new Date(currentJob.completedAt).toLocaleString()}`);
      }
    } else if (currentJob.status === 'failed') {
      logs.push(`💥 Status: Failed`);
      if (currentJob.completedAt) {
        logs.push(`💔 Failed At: ${new Date(currentJob.completedAt).toLocaleString()}`);
      }
    }
    
    // Error details
    if (currentJob.errors && currentJob.errors.length > 0) {
      logs.push(`⚠️ Error Summary: ${currentJob.errors.length} errors encountered`);
      logs.push(`📝 Error Details:`);
      currentJob.errors.slice(0, 10).forEach((error, index) => {
        logs.push(`   ${index + 1}. Row ${error.row}: ${error.message}`);
        if (error.identifier && error.identifier !== 'N/A') {
          logs.push(`      Identifier: ${error.identifier}`);
        }
      });
      if (currentJob.errors.length > 10) {
        logs.push(`   ... and ${currentJob.errors.length - 10} more errors`);
      }
    }
    
    // Success details for orders
    if (currentJob.type === 'orders' && currentJob.results?.successfulOrders) {
      logs.push(`📦 Orders Created: ${currentJob.results.successfulOrders.length}`);
      logs.push(`📊 Average Items per Order: ${currentJob.results.successfulOrders.length > 0 ? (currentJob.processedRecords / currentJob.results.successfulOrders.length).toFixed(1) : '0'}`);
      
      // Show first few successful orders
      if (currentJob.results.successfulOrders.length > 0) {
        logs.push(`✅ Sample Successful Orders:`);
        currentJob.results.successfulOrders.slice(0, 5).forEach((order, index) => {
          logs.push(`   ${index + 1}. ${order.orderNumber} for ${order.customerEmail} (${order.itemCount} items)`);
          if (order.customOrderNumberImport) {
            logs.push(`      Original Order Number: ${order.customOrderNumberImport}`);
          }
          if (order.rowNumbers) {
            logs.push(`      CSV Rows: ${order.rowNumbers.join(', ')}`);
          }
        });
        if (currentJob.results.successfulOrders.length > 5) {
          logs.push(`   ... and ${currentJob.results.successfulOrders.length - 5} more orders`);
        }
      }
    }
    
    // Success details for users
    if (currentJob.type === 'users' && currentJob.results?.successfulUsers) {
      logs.push(`👥 Users Created/Updated: ${currentJob.results.successfulUsers.length}`);
      if (currentJob.results.successfulUsers.length > 0) {
        logs.push(`✅ Sample Successful Users:`);
        currentJob.results.successfulUsers.slice(0, 5).forEach((user, index) => {
          logs.push(`   ${index + 1}. ${user.name} (${user.email})`);
        });
        if (currentJob.results.successfulUsers.length > 5) {
          logs.push(`   ... and ${currentJob.results.successfulUsers.length - 5} more users`);
        }
      }
    }
    
    // Success details for products
    if (currentJob.type === 'products' && currentJob.results?.successfulProducts) {
      logs.push(`🛍️ Products Created: ${currentJob.results.successfulProducts.length}`);
      if (currentJob.results.successfulProducts.length > 0) {
        logs.push(`✅ Sample Successful Products:`);
        currentJob.results.successfulProducts.slice(0, 5).forEach((product, index) => {
          logs.push(`   ${index + 1}. ${product.name} (SKU: ${product.sku})`);
        });
        if (currentJob.results.successfulProducts.length > 5) {
          logs.push(`   ... and ${currentJob.results.successfulProducts.length - 5} more products`);
        }
      }
    }
    
    return logs;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Bulk Import</h1>
          <p className="text-muted-foreground">
            Import multiple users, products, or orders from CSV files
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(activeTab === 'users' ? '/users' : activeTab === 'products' ? '/products' : '/orders')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {activeTab === 'users' ? 'Users' : activeTab === 'products' ? 'Products' : 'Orders'}
        </Button>
      </div>

      {/* Tab Navigation */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value as 'users' | 'products');
          resetForm();
          setRemoveExistingData(false); // Reset checkbox when changing tabs
        }}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Import Users
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Import Products
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Import Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Instructions
              </CardTitle>
              <CardDescription>
                Follow these guidelines for successful user import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <div>Download the CSV template below to see the required format</div>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong>Required fields:</strong> Name, Email</li>
                    <li><strong>Optional fields:</strong> Buyer NTN/CNIC, Business Name, Province, Address, Registration Type</li>
                    <li>Supports up to 100MB files (~200,000 users)</li>
                    <li>Duplicate emails will update existing users with new information</li>
                    <li>Processing happens in background with real-time progress</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Template
              </CardTitle>
              <CardDescription>
                Get the CSV template with correct format and sample data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Download User CSV Template
              </Button>
            </CardContent>
          </Card>

          {/* Remove Existing Data Option */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Import Options
              </CardTitle>
              <CardDescription>
                Configure how the import should handle existing data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="removeExistingUsers"
                  checked={activeTab === 'users' ? removeExistingData : false}
                  onChange={(e) => activeTab === 'users' && setRemoveExistingData(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="removeExistingUsers" className="text-sm font-medium text-red-700">
                  Remove all existing users before import
                </label>
              </div>
              <p className="text-xs text-red-600 mt-2">
                ⚠️ Warning: This will permanently delete all existing users and their data before importing new users.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Instructions
              </CardTitle>
              <CardDescription>
                Follow these guidelines for successful product import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <div>Download the CSV template below to see the required format</div>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong>Required fields:</strong> SKU, Unit Price</li>
                    <li><strong>Optional fields:</strong> Price Including Tax, Description, GST Amount, GST Percentage, HS Code, Stock Quantity, Serial Number, List Number, BC Number, Lot Number, Expiry Date, UOM</li>
                    <li>Supports up to 100MB files (~300,000 products)</li>
                    <li>Duplicate SKUs are allowed; each row creates a new product</li>
                    <li>Processing happens in background with real-time progress</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Template
              </CardTitle>
              <CardDescription>
                Get the CSV template with correct format and sample data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Download Product CSV Template
              </Button>
            </CardContent>
          </Card>

          {/* Remove Existing Data Option */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Import Options
              </CardTitle>
              <CardDescription>
                Configure how the import should handle existing data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="removeExistingProducts"
                  checked={activeTab === 'products' ? removeExistingData : false}
                  onChange={(e) => activeTab === 'products' && setRemoveExistingData(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="removeExistingProducts" className="text-sm font-medium text-red-700">
                  Remove all existing products before import
                </label>
              </div>
              <p className="text-xs text-red-600 mt-2">
                ⚠️ Warning: This will permanently delete all existing products and their data before importing new products.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Instructions
              </CardTitle>
              <CardDescription>
                Follow these guidelines for successful order import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <div>Download the CSV template below to see the required format</div>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong>Required fields:</strong> Order Number, Customer Phone, Product SKU</li>
                    <li><strong>Tax fields:</strong> Tax Amount, Tax Percentage, Price Including Tax (optional)</li>
                    <li><strong>Note:</strong> Unit Price and Quantity are now optional. Product Name can include description.</li>
                    <li><strong>Order Grouping:</strong> Rows with same Order Number = same order with multiple items</li>
                    <li><strong>Template Structure:</strong> Order Number first for easy sorting and visual grouping</li>
                    <li><strong>Smart Defaults:</strong> Order Status defaults to "pending", Payment Status to "pending"</li>
                    <li><strong>User/Product Matching:</strong> Existing phone numbers/SKUs are matched; new ones are auto-created</li>
                    <li><strong>Example:</strong> ORD-001 with 2 items = 1 order, ORD-002 with 1 item = separate order</li>
                    <li>Supports up to 100MB files (~50,000 order items)</li>
                    <li>Processing happens in background with real-time progress tracking</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Template
              </CardTitle>
              <CardDescription>
                Get the CSV template with correct format and sample data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Download Order CSV Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload {activeTab === 'users' ? 'Users' : activeTab === 'products' ? 'Products' : 'Orders'}
          </CardTitle>
          <CardDescription>
            Select your CSV file to begin the import process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csvFile">Select CSV File</Label>
              <Input
                type="file"
                id="csvFile"
                accept=".csv"
                onChange={handleFileChange}
                disabled={uploading}
                className="file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Start Import
                  </>
                )}
              </Button>
              
              {(file || currentJob) && (
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={uploading}
                  className="gap-2"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress & Status */}
      {currentJob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Import Progress
            </CardTitle>
            <CardDescription>
              Real-time status of your import job
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {getStatusIcon(currentJob.status)}
              <Badge variant={getStatusVariant(currentJob.status)}>
                {currentJob.status.charAt(0).toUpperCase() + currentJob.status.slice(1)}
              </Badge>
              {currentJob.status === 'processing' && currentJob.estimatedTimeRemaining && (
                <span className="text-sm text-muted-foreground">
                  Est. {formatTimeRemaining(currentJob.estimatedTimeRemaining)} remaining
                </span>
              )}
            </div>

            {/* Progress Bar */}
            {currentJob.totalRecords > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress: {currentJob.processedRecords} / {currentJob.totalRecords}</span>
                  <span className="font-medium">{currentJob.progressPercent}%</span>
                </div>
                <Progress value={currentJob.progressPercent} className="h-2" />
              </div>
            )}

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                        {currentJob.successfulRecords}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">Successful</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                        {currentJob.failedRecords}
                      </div>
                      <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                        {currentJob.processedRecords}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">Processed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Success Details */}
            {currentJob.type === 'users' && currentJob.results?.successfulUsers && Array.isArray(currentJob.results.successfulUsers) && currentJob.results.successfulUsers.length > 0 && (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Successfully Created Users
                  </CardTitle>
                  <CardDescription>Showing first 20 users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {currentJob.results.successfulUsers.slice(0, 20).map((user, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-950">
                        <Users className="h-4 w-4 text-green-600" />
                        <div className="text-sm">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-muted-foreground"> ({user.email})</span>
                        </div>
                      </div>
                    ))}
                    {currentJob.results.successfulUsers.length > 20 && (
                      <div className="text-sm text-muted-foreground italic text-center py-2">
                        ... and {currentJob.results.successfulUsers.length - 20} more users
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentJob.type === 'products' && currentJob.results?.successfulProducts && Array.isArray(currentJob.results.successfulProducts) && currentJob.results.successfulProducts.length > 0 && (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Successfully Created Products
                  </CardTitle>
                  <CardDescription>Showing first 20 products</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {currentJob.results.successfulProducts.slice(0, 20).map((product, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-950">
                        <Package className="h-4 w-4 text-green-600" />
                        <div className="text-sm">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-muted-foreground"> (SKU: {product.sku})</span>
                        </div>
                      </div>
                    ))}
                    {currentJob.results.successfulProducts.length > 20 && (
                      <div className="text-sm text-muted-foreground italic text-center py-2">
                        ... and {currentJob.results.successfulProducts.length - 20} more products
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentJob.type === 'orders' && currentJob.results?.successfulOrders && Array.isArray(currentJob.results.successfulOrders) && currentJob.results.successfulOrders.length > 0 && (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Successfully Created Orders
                  </CardTitle>
                  <CardDescription>
                    {currentJob.results.successfulOrders.length} orders created from {currentJob.processedRecords} CSV rows
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {currentJob.results.successfulOrders.slice(0, 15).map((order, index) => (
                      <div key={index} className="p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-1">
                          <ShoppingCart className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800 dark:text-green-200">
                            {order.orderNumber}
                          </span>
                          {order.customOrderNumberImport && (
                            <span className="text-xs bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                              Original: {order.customOrderNumberImport}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">
                          <div>Customer: <span className="font-medium">{order.customerEmail}</span></div>
                          <div>Items: <span className="font-medium">{order.itemCount}</span></div>
                          <div>CSV Rows: <span className="font-mono text-xs">{order.rowNumbers?.join(', ') || 'N/A'}</span></div>
                        </div>
                      </div>
                    ))}
                    {currentJob.results.successfulOrders.length > 15 && (
                      <div className="text-sm text-muted-foreground italic text-center py-2">
                        ... and {currentJob.results.successfulOrders.length - 15} more orders
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Details */}
            {currentJob.errors && Array.isArray(currentJob.errors) && currentJob.errors.length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Import Errors
                  </CardTitle>
                  <CardDescription>
                    {currentJob.errors.length} errors found - showing first 15 with detailed reasons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {currentJob.errors.slice(0, 15).map((error, index) => (
                      <div key={index} className="p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-red-800 dark:text-red-200">
                            CSV Row {error.row}
                          </span>
                          <span className="text-xs bg-red-100 dark:bg-red-900 px-2 py-1 rounded font-mono">
                            {error.identifier || 'N/A'}
                          </span>
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300 mb-1">
                          <strong>Reason:</strong> {error.message}
                        </div>
                        {currentJob.type === 'orders' && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            💡 <strong>Tip:</strong> Check that Customer Phone and Product SKU are provided and valid
                          </div>
                        )}
                        {currentJob.type === 'users' && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            💡 <strong>Tip:</strong> Check that Name and Email are provided and email format is valid
                          </div>
                        )}
                        {currentJob.type === 'products' && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            💡 <strong>Tip:</strong> Check that SKU and Unit Price are provided and price is a valid number
                          </div>
                        )}
                      </div>
                    ))}
                    {currentJob.errors.length > 15 && (
                      <div className="text-sm text-muted-foreground italic text-center py-2">
                        ... and {currentJob.errors.length - 15} more errors
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completion Actions */}
            {currentJob.status === 'completed' && (
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        Import completed successfully!
                      </span>
                    </div>
                    
                    {currentJob.type === 'orders' && currentJob.results?.successfulOrders && (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                        <div className="text-sm text-green-700 dark:text-green-300">
                          <strong>Summary:</strong> Created {currentJob.results.successfulOrders.length} orders from {currentJob.processedRecords} CSV rows
                          {currentJob.results.successfulOrders.length > 0 && (
                            <div className="mt-1">
                              Average: {(currentJob.processedRecords / currentJob.results.successfulOrders.length).toFixed(1)} items per order
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={() => router.push(currentJob.type === 'users' ? '/users' : currentJob.type === 'products' ? '/products' : '/orders')}
                        className="gap-2"
                      >
                        View All {currentJob.type === 'users' ? 'Users' : currentJob.type === 'products' ? 'Products' : 'Orders'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Technical Logs */}
            {currentJob && (currentJob.status === 'processing' || currentJob.status === 'completed' || currentJob.status === 'failed') && (
              <Card className="border-blue-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-blue-800 dark:text-blue-200">
                        Technical Logs
                      </CardTitle>
                    </div>
                    <Button
                      onClick={() => setShowTechnicalLogs(!showTechnicalLogs)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      {showTechnicalLogs ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Hide Logs
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Show Logs
                        </>
                      )}
                    </Button>
                  </div>
                  <CardDescription>
                    Detailed processing logs for technical debugging
                  </CardDescription>
                </CardHeader>
                {showTechnicalLogs && (
                  <CardContent>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                      {getTechnicalLogs().map((log, index) => (
                        <div key={index} className="mb-1">
                          {log}
                        </div>
                      ))}
                      {currentJob.status === 'processing' && (
                        <div className="text-yellow-400 animate-pulse">
                          ⏳ Processing in progress...
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Detailed Import Report */}
            {currentJob.status === 'completed' && currentJob.results?.detailedReport && Array.isArray(currentJob.results.detailedReport) && currentJob.results.detailedReport.length > 0 && (
              <DetailedImportReport
                report={currentJob.results.detailedReport}
                importType={currentJob.type}
                fileName={currentJob.fileName}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}