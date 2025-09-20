'use client';

import React, { useState, useEffect } from 'react';
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
  BarChart3
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
      customerEmail: string;
    }>;
  } | null;
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
      csvContent = `Customer Email,Customer Name,Customer Phone,Product SKU,Product Name,Product Description,Quantity,Unit Price,Total Amount,Billing Address,Shipping Address,Order Status,Payment Status,Service Date,Service Time,Notes,HS Code,UOM,Serial Number,List Number,BC Number,Lot Number,Expiry Date
"john.doe@example.com","John Doe","+92300-1234567","PROD-001","Premium Widget","High quality widget for professional use","2","29.99","59.98","123 Main St, Lahore, Punjab","123 Main St, Lahore, Punjab","confirmed","paid","2024-12-25","14:30","Rush delivery requested","1234567890","Pcs","SN123456789","LIST-001","BC123456","LOT-2024-001","2024-12-31"
"jane.smith@example.com","Jane Smith","+92321-9876543","PROD-002","Standard Item","Standard quality item for regular use","1","19.99","19.99","456 Commerce Ave, Karachi, Sindh","456 Commerce Ave, Karachi, Sindh","processing","pending","2024-12-26","10:00","Standard delivery","9876543210","Kg","SN987654321","LIST-002","BC654321","LOT-2024-002","2025-06-30"
"ahmed.khan@example.com","Ahmed Khan","+92333-1122334","PROD-003","Premium Product","Premium quality product for special customers","3","45.00","135.00","789 Market Rd, Peshawar, KPK","789 Market Rd, Peshawar, KPK","pending","pending","2024-12-27","16:00","Handle with care","5555666677","Ltr","SN555666777","LIST-003","BC777888","LOT-2024-003","2025-12-31"`;
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
                    <li><strong>Required fields:</strong> Customer Email, Product SKU, Quantity, Unit Price</li>
                    <li><strong>Optional fields:</strong> Customer Name, Customer Phone, Product Name, Product Description, Total Amount, Billing Address, Shipping Address, Order Status, Payment Status, Service Date, Service Time, Notes, HS Code, UOM, Serial Number, List Number, BC Number, Lot Number, Expiry Date</li>
                    <li>Supports up to 100MB files (~50,000 orders)</li>
                    <li>If customer email exists, assigns order to existing user; otherwise creates new user</li>
                    <li>If product SKU exists, uses existing product; otherwise creates new product</li>
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
                  <CardDescription>Showing first 20 orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {currentJob.results.successfulOrders.slice(0, 20).map((order, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-950">
                        <ShoppingCart className="h-4 w-4 text-green-600" />
                        <div className="text-sm">
                          <span className="font-medium">{order.orderNumber}</span>
                          <span className="text-muted-foreground"> ({order.customerEmail})</span>
                        </div>
                      </div>
                    ))}
                    {currentJob.results.successfulOrders.length > 20 && (
                      <div className="text-sm text-muted-foreground italic text-center py-2">
                        ... and {currentJob.results.successfulOrders.length - 20} more orders
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
                  <CardDescription>Showing first 20 errors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {currentJob.errors.slice(0, 20).map((error, index) => (
                      <div key={index} className="p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                        <div className="font-medium text-red-800 dark:text-red-200">
                          Row {error.row}
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300">
                          {error.message}
                        </div>
                        <div className="text-sm text-red-600 dark:text-red-400">
                          {currentJob.type === 'users' 
                            ? `Email: ${error.email || 'N/A'}`
                            : currentJob.type === 'products'
                              ? `SKU: ${error.identifier || 'N/A'}`
                              : `Identifier: ${error.identifier || 'N/A'}`
                          }
                        </div>
                      </div>
                    ))}
                    {currentJob.errors.length > 20 && (
                      <div className="text-sm text-muted-foreground italic text-center py-2">
                        ... and {currentJob.errors.length - 20} more errors
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        Import completed successfully!
                      </span>
                    </div>
                    <Button
                      onClick={() => router.push(currentJob.type === 'users' ? '/users' : currentJob.type === 'products' ? '/products' : '/orders')}
                      className="gap-2"
                    >
                      View All {currentJob.type === 'users' ? 'Users' : currentJob.type === 'products' ? 'Products' : 'Orders'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}