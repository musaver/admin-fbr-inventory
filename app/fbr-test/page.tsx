'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FbrResponse {
  step: string;
  ok: boolean;
  response?: any;
  validation?: any;
  fbrInvoice?: any;
  error?: string;
}

export default function FbrTestPage() {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<FbrResponse | null>(null);
  const [setupResult, setSetupResult] = useState<any>(null);
  
  // Test order data
  const [orderData, setOrderData] = useState({
    email: 'test@example.com',
    scenarioId: 'SN026',
    invoiceType: 'Sale Invoice',
    subtotal: 1000,
    totalAmount: 1180,
    taxAmount: 180,
    currency: 'PKR',
    buyerRegistrationType: 'Unregistered',
    billingFirstName: 'John',
    billingLastName: 'Doe',
    billingAddress1: '123 Test Street',
    billingCity: 'Lahore',
    billingState: 'Punjab',
    billingCountry: 'Pakistan',
    items: [{
      productId: 'test-1',
      productName: 'Test Product',
      productDescription: 'A test product for FBR integration',
      hsCode: '1234567890',
      uom: 'PCS',
      quantity: 1,
      price: 1000,
      totalPrice: 1000,
      taxPercentage: 18,
      taxAmount: 180
    }]
  });

  const testSetup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fbr/test?type=setup');
      const result = await response.json();
      setSetupResult(result);
    } catch (error) {
      console.error('Setup test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitInvoice = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/fbr/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      console.error('Invoice submission failed:', error);
      setTestResult({
        step: 'error',
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderField = (field: string, value: any) => {
    setOrderData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateItemField = (field: string, value: any) => {
    setOrderData(prev => ({
      ...prev,
      items: [{
        ...prev.items[0],
        [field]: value
      }]
    }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">FBR Digital Invoicing Test</h1>
        <Button onClick={testSetup} disabled={loading}>
          Test Setup
        </Button>
      </div>

      {/* Setup Test Results */}
      {setupResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Setup Test Results
              <Badge variant={setupResult.success ? 'default' : 'destructive'}>
                {setupResult.success ? 'Success' : 'Failed'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">Configuration:</Label>
                <p className={`text-sm ${setupResult.configuration?.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {setupResult.configuration?.isValid ? '✅ Valid' : '❌ Invalid'}
                </p>
                {setupResult.configuration?.errors?.length > 0 && (
                  <ul className="text-sm text-red-600 list-disc list-inside">
                    {setupResult.configuration.errors.map((error: string, i: number) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div>
                <Label className="font-semibold">Connection:</Label>
                <p className={`text-sm ${setupResult.connection?.success ? 'text-green-600' : 'text-red-600'}`}>
                  {setupResult.connection?.success ? '✅ Connected' : '❌ Failed'}
                </p>
                {setupResult.connection?.error && (
                  <p className="text-sm text-red-600">{setupResult.connection.error}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Data Form */}
      <Card>
        <CardHeader>
          <CardTitle>Test Invoice Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={orderData.email}
                onChange={(e) => updateOrderField('email', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="scenarioId">Scenario ID</Label>
              <Select 
                value={orderData.scenarioId} 
                onValueChange={(value) => updateOrderField('scenarioId', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SN001">SN001 - Standard Rate</SelectItem>
                  <SelectItem value="SN002">SN002 - With Withholding Tax</SelectItem>
                  <SelectItem value="SN005">SN005 - Reduced Rate</SelectItem>
                  <SelectItem value="SN006">SN006 - Exempt Goods</SelectItem>
                  <SelectItem value="SN007">SN007 - Zero Rate</SelectItem>
                  <SelectItem value="SN008">SN008 - 3rd Schedule</SelectItem>
                  <SelectItem value="SN017">SN017 - FED in ST Mode</SelectItem>
                  <SelectItem value="SN026">SN026 - Standard (Tested)</SelectItem>
                  <SelectItem value="SN027">SN027 - Retail (Invoice Level)</SelectItem>
                  <SelectItem value="SN028">SN028 - Retail (Item Level)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="buyerType">Buyer Type</Label>
              <Select 
                value={orderData.buyerRegistrationType} 
                onValueChange={(value) => updateOrderField('buyerRegistrationType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unregistered">Unregistered</SelectItem>
                  <SelectItem value="Registered">Registered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="subtotal">Subtotal</Label>
              <Input
                id="subtotal"
                type="number"
                value={orderData.subtotal}
                onChange={(e) => updateOrderField('subtotal', parseFloat(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="taxAmount">Tax Amount</Label>
              <Input
                id="taxAmount"
                type="number"
                value={orderData.taxAmount}
                onChange={(e) => updateOrderField('taxAmount', parseFloat(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="totalAmount">Total Amount</Label>
              <Input
                id="totalAmount"
                type="number"
                value={orderData.totalAmount}
                onChange={(e) => updateOrderField('totalAmount', parseFloat(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={orderData.currency}
                onChange={(e) => updateOrderField('currency', e.target.value)}
              />
            </div>
          </div>

          <Separator />
          
          <div>
            <Label className="text-lg font-semibold">Item Details</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={orderData.items[0].productName}
                  onChange={(e) => updateItemField('productName', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="hsCode">HS Code</Label>
                <Input
                  id="hsCode"
                  value={orderData.items[0].hsCode}
                  onChange={(e) => updateItemField('hsCode', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="uom">Unit of Measurement</Label>
                <Input
                  id="uom"
                  value={orderData.items[0].uom}
                  onChange={(e) => updateItemField('uom', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={orderData.items[0].quantity}
                  onChange={(e) => updateItemField('quantity', parseInt(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={orderData.items[0].price}
                  onChange={(e) => updateItemField('price', parseFloat(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="totalPrice">Total Price</Label>
                <Input
                  id="totalPrice"
                  type="number"
                  value={orderData.items[0].totalPrice}
                  onChange={(e) => updateItemField('totalPrice', parseFloat(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="taxPercentage">Tax %</Label>
                <Input
                  id="taxPercentage"
                  type="number"
                  value={orderData.items[0].taxPercentage}
                  onChange={(e) => updateItemField('taxPercentage', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={submitInvoice} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Submitting Invoice...' : 'Submit Invoice to FBR'}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              FBR Submission Results
              <Badge variant={testResult.ok ? 'default' : 'destructive'}>
                {testResult.ok ? 'Success' : 'Failed'}
              </Badge>
              <Badge variant="outline">{testResult.step}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Validation Response */}
            {testResult.response?.validationResponse && (
              <div>
                <Label className="text-lg font-semibold text-blue-600">Validation Response</Label>
                <div className="bg-blue-50 p-4 rounded-lg mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">Status:</Label>
                    <Badge variant={testResult.response.validationResponse.status === 'Valid' ? 'default' : 'destructive'}>
                      {testResult.response.validationResponse.status}
                    </Badge>
                  </div>
                  
                  {testResult.response.validationResponse.statusCode && (
                    <div className="flex items-center gap-2">
                      <Label className="font-semibold">Status Code:</Label>
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        {testResult.response.validationResponse.statusCode}
                      </code>
                    </div>
                  )}
                  
                  {testResult.response.validationResponse.errorCode && (
                    <div className="flex items-center gap-2">
                      <Label className="font-semibold">Error Code:</Label>
                      <code className="bg-red-100 px-2 py-1 rounded text-red-800">
                        {testResult.response.validationResponse.errorCode}
                      </code>
                    </div>
                  )}
                  
                  {testResult.response.validationResponse.error && (
                    <div>
                      <Label className="font-semibold">Error:</Label>
                      <p className="text-red-600 bg-red-50 p-2 rounded mt-1">
                        {testResult.response.validationResponse.error}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoice Response (if successful) */}
            {testResult.response?.success && (
              <div>
                <Label className="text-lg font-semibold text-green-600">Invoice Status</Label>
                <div className="bg-green-50 p-4 rounded-lg mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">Status:</Label>
                    <Badge variant="default">Success</Badge>
                  </div>
                  
                  {testResult.response.invoiceNumber && (
                    <div className="flex items-center gap-2">
                      <Label className="font-semibold">Invoice No:</Label>
                      <code className="bg-green-100 px-2 py-1 rounded font-mono">
                        {testResult.response.invoiceNumber}
                      </code>
                    </div>
                  )}
                  
                  {testResult.response.message && (
                    <div>
                      <Label className="font-semibold">Message:</Label>
                      <p className="text-green-700">{testResult.response.message}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {testResult.error && (
              <div>
                <Label className="text-lg font-semibold text-red-600">Error</Label>
                <p className="text-red-600 bg-red-50 p-4 rounded-lg mt-2">
                  {testResult.error}
                </p>
              </div>
            )}

            {/* Raw Response */}
            <div>
              <Label className="text-lg font-semibold">Raw Response</Label>
              <Textarea
                value={JSON.stringify(testResult, null, 2)}
                readOnly
                className="mt-2 h-64 font-mono text-xs"
              />
            </div>

            {/* FBR Invoice (if available) */}
            {testResult.fbrInvoice && (
              <div>
                <Label className="text-lg font-semibold">Generated FBR Invoice</Label>
                <Textarea
                  value={JSON.stringify(testResult.fbrInvoice, null, 2)}
                  readOnly
                  className="mt-2 h-64 font-mono text-xs"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
