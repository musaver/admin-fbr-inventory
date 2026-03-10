'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftIcon, SaveIcon, PlusIcon, TrashIcon } from 'lucide-react';
import CurrencySymbol from '../../../components/CurrencySymbol';

interface Supplier {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  currency: string;
  paymentTerms?: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: string;
  costPrice?: string;
  stockManagementType?: string;
  pricePerUnit?: string;
  baseWeightUnit?: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  weightQuantity?: number;
  weightUnit?: string;
  price: number;
  totalPrice: number;
}

export default function AddPurchaseOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  const [orderData, setOrderData] = useState({
    supplierId: '',
    purchaseOrderNumber: '',
    expectedDeliveryDate: '',
    notes: '',
    status: 'pending',
    currency: 'USD',
  });

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [suppliersRes, productsRes] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/products'),
      ]);

      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json();
        setSuppliers(suppliersData.filter((s: any) => s.isActive));
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.map((p: any) => p.product).filter((p: any) => p.isActive));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    setSelectedSupplier(supplier || null);
    setOrderData({
      ...orderData,
      supplierId,
      currency: supplier?.currency || 'USD'
    });
  };

  const addOrderItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      productId: '',
      productName: '',
      quantity: 1,
      price: 0,
      totalPrice: 0,
    };
    setOrderItems([...orderItems, newItem]);
  };

  const removeOrderItem = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const updateOrderItem = (itemId: string, updates: Partial<OrderItem>) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        
        // Recalculate total price
        if (updatedItem.weightQuantity && updatedItem.weightQuantity > 0) {
          // Weight-based calculation
          updatedItem.totalPrice = updatedItem.price * updatedItem.weightQuantity;
        } else {
          // Quantity-based calculation
          updatedItem.totalPrice = updatedItem.price * updatedItem.quantity;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleProductChange = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const isWeightBased = product.stockManagementType === 'weight';
      updateOrderItem(itemId, {
        productId,
        productName: product.name,
        sku: product.sku,
        price: parseFloat(isWeightBased ? product.pricePerUnit || '0' : product.costPrice || product.price || '0'),
        weightQuantity: isWeightBased ? 1 : undefined,
        weightUnit: isWeightBased ? product.baseWeightUnit || 'grams' : undefined,
      });
    }
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderData.supplierId) {
      alert('Please select a supplier');
      return;
    }

    if (orderItems.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }

    setSubmitting(true);
    
    try {
      const submitData = {
        orderType: 'purchase_order',
        supplierId: orderData.supplierId,
        purchaseOrderNumber: orderData.purchaseOrderNumber,
        expectedDeliveryDate: orderData.expectedDeliveryDate || null,
        status: orderData.status,
        currency: orderData.currency,
        notes: orderData.notes,
        subtotal: calculateSubtotal(),
        totalAmount: calculateSubtotal(), // For now, no tax/shipping on purchase orders
        items: orderItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          weightQuantity: item.weightQuantity,
          weightUnit: item.weightUnit,
          price: item.price,
          totalPrice: item.totalPrice,
        })),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        router.push('/orders/purchase');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create purchase order');
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/orders/purchase">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Purchase Orders
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Purchase Order</h1>
          <p className="text-muted-foreground">
            Create a new order to a supplier
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>
              Basic purchase order details and supplier selection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="supplierId" className="text-sm font-medium">
                  Supplier *
                </label>
                <select
                  id="supplierId"
                  value={orderData.supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  required
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} {supplier.companyName && `(${supplier.companyName})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="purchaseOrderNumber" className="text-sm font-medium">
                  PO Number
                </label>
                <Input
                  id="purchaseOrderNumber"
                  value={orderData.purchaseOrderNumber}
                  onChange={(e) => setOrderData({...orderData, purchaseOrderNumber: e.target.value})}
                  placeholder="Enter PO number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="expectedDeliveryDate" className="text-sm font-medium">
                  Expected Delivery Date
                </label>
                <Input
                  id="expectedDeliveryDate"
                  type="date"
                  value={orderData.expectedDeliveryDate}
                  onChange={(e) => setOrderData({...orderData, expectedDeliveryDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="currency" className="text-sm font-medium">
                  Currency
                </label>
                <Input
                  id="currency"
                  value={orderData.currency}
                  onChange={(e) => setOrderData({...orderData, currency: e.target.value})}
                  placeholder="USD"
                />
              </div>
            </div>

            {selectedSupplier && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Supplier Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="ml-2">{selectedSupplier.email}</span>
                  </div>
                  {selectedSupplier.paymentTerms && (
                    <div>
                      <span className="text-muted-foreground">Payment Terms:</span>
                      <span className="ml-2">{selectedSupplier.paymentTerms}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>
              Add products to this purchase order
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderItems.map((item, index) => {
              const product = products.find(p => p.id === item.productId);
              const isWeightBased = product?.stockManagementType === 'weight';

              return (
                <div key={item.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOrderItem(item.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Product *</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(item.id, e.target.value)}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        required
                      >
                        <option value="">Select product...</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} {product.sku && `(${product.sku})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isWeightBased ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Weight *</label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={item.weightQuantity || ''}
                            onChange={(e) => updateOrderItem(item.id, { weightQuantity: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.001"
                            placeholder="0"
                            required
                          />
                          <select
                            value={item.weightUnit || 'grams'}
                            onChange={(e) => updateOrderItem(item.id, { weightUnit: e.target.value })}
                            className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            <option value="grams">g</option>
                            <option value="kg">kg</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quantity *</label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                          min="1"
                          placeholder="1"
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Price per {isWeightBased ? product?.baseWeightUnit || 'unit' : 'unit'} *
                      </label>
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateOrderItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Total Price</label>
                      <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                        <CurrencySymbol />
                        {item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <Button type="button" variant="outline" onClick={addOrderItem} className="w-full">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount:</span>
                <span>
                  <CurrencySymbol />
                  {calculateSubtotal().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Order Notes
              </label>
              <textarea
                id="notes"
                value={orderData.notes}
                onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="Additional notes for this purchase order..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/orders/purchase">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            ) : (
              <SaveIcon className="mr-2 h-4 w-4" />
            )}
            Create Purchase Order
          </Button>
        </div>
      </form>
    </div>
  );
}
