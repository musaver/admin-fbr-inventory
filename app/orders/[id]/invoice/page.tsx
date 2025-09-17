'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { Skeleton } from '@/components/ui/skeleton';
import { 
  Printer, 
  FileText, 
  CheckCircle, 
  Building2, 
  User, 
  Receipt,
  ShoppingCart,
  CreditCard,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import CurrencySymbol from '../../../components/CurrencySymbol';
import { formatWeightAuto } from '@/utils/weightUtils';
import { useCurrency } from '@/app/contexts/CurrencyContext';

export default function OrderInvoice() {
  const params = useParams();
  const orderId = params.id as string;
  const { currencySettings } = useCurrency();
  
  const [order, setOrder] = useState<any>(null);
  const [addons, setAddons] = useState<any[]>([]);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugJson, setDebugJson] = useState<{
    orderData?: any;
    fbrPayload?: any;
    fbrError?: any;
    showDebug: boolean;
  }>({
    showDebug: false
  });

  useEffect(() => {
    fetchOrderData();
    fetchAddons();
    fetchSellerInfo();
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const orderRes = await fetch(`/api/orders/${orderId}`);
      
      if (!orderRes.ok) throw new Error('Order not found');
      
      const orderData = await orderRes.json();
      
      // Process items to add weight-based information
      if (orderData.items) {
        orderData.items = orderData.items.map((item: any) => {
          // Determine if item is weight-based by checking if weightQuantity exists and is > 0
          const weightQuantity = item.weightQuantity ? parseFloat(item.weightQuantity) : 0;
          const isWeightBased = weightQuantity > 0;

          return {
            ...item,
            isWeightBased,
            weightQuantity: weightQuantity > 0 ? weightQuantity : undefined,
            weightUnit: item.weightUnit || undefined
          };
        });
      }
      
      setOrder(orderData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddons = async () => {
    try {
      const addonsRes = await fetch('/api/addons');
      if (addonsRes.ok) {
        const addonsData = await addonsRes.json();
        setAddons(addonsData);
      }
    } catch (err) {
      console.error('Failed to fetch addons:', err);
    }
  };

  const fetchSellerInfo = async () => {
    try {
      const sellerRes = await fetch('/api/settings/fbr');
      if (sellerRes.ok) {
        const sellerData = await sellerRes.json();
        if (sellerData.success && sellerData.settings) {
          setSellerInfo(sellerData.settings);
        }
      }
    } catch (err) {
      console.error('Failed to fetch seller info:', err);
    }
  };

  // Format amount for print (returns plain string, not React component)
  const formatAmountForPrint = (amount: string | number) => {
    const numAmount = Number(amount);
    
    if (isNaN(numAmount) || amount === null || amount === undefined || typeof numAmount !== 'number') {
      return `${currencySettings?.symbol || '₨'}0.00`;
    }
    
    return `${currencySettings?.symbol || '₨'}${numAmount.toFixed(2)}`;
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('Please allow popups for printing functionality');
      return;
    }

    // Build the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.orderNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.35;
              color: #1a1a1a;
              background: white;
              padding: 12px;
            }
            
            .invoice-header {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              padding: 16px;
              margin: -12px -12px 16px -12px;
              border-radius: 0 0 10px 10px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.12);
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            
            .invoice-title h1 {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 6px;
              letter-spacing: 2px;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.25);
            }
            
            .order-info {
              background: rgba(255,255,255,0.1);
              padding: 8px;
              border-radius: 6px;
              margin-top: 6px;
            }
            
            .order-info p {
              margin: 3px 0;
              font-size: 12px;
              font-weight: 500;
            }
            
            .company-info {
              text-align: right;
            }
            
            .company-info h2 {
              font-size: 20px;
              margin-bottom: 8px;
              font-weight: 700;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.25);
            }
            
            .company-info p {
              margin: 4px 0;
              font-size: 11px;
              opacity: 0.9;
            }
            
            .fbr-notice {
              margin: 12px 0;
              padding: 10px;
              background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
              border: 2px solid #10b981;
              border-radius: 8px;
              box-shadow: 0 1px 6px rgba(16, 185, 129, 0.2);
            }
            
            .fbr-notice strong {
              font-size: 13px;
              color: #047857;
              display: block;
              text-align: center;
            }
            
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 16px;
            }
            
            .info-box {
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px;
              box-shadow: 0 1px 6px rgba(0,0,0,0.05);
            }
            
            .info-box h3 {
              font-size: 14px;
              margin-bottom: 8px;
              color: #1e293b;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 8px;
              font-weight: 600;
            }
            
            .info-box p {
              margin: 4px 0;
              font-size: 12px;
              color: #374151;
              line-height: 1.4;
            }
            
            .contact-info {
              margin-top: 8px;
              padding-top: 8px;
              border-top: 1px solid #d1d5db;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 14px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.08);
              border-radius: 8px;
              overflow: hidden;
            }
            
            .items-table th {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              padding: 8px 8px;
              text-align: center;
              font-weight: 600;
              font-size: 11px;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            
            .items-table td {
              padding: 8px 8px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
              background: white;
            }
            
            .items-table tr:nth-child(even) td {
              background: #f9fafb;
            }
            
            .items-table tr:hover td {
              background: #f3f4f6;
            }
            
            .items-table .text-right {
              text-align: right;
              font-weight: 600;
            }
            
            .items-table .text-center {
              text-align: center;
            }
            
            .product-name {
              font-weight: 700;
              margin-bottom: 2px;
              color: #1f2937;
              font-size: 12px;
            }
            
            .product-details {
              font-size: 10px;
              color: #6b7280;
              line-height: 1.4;
              margin-top: 2px;
            }
            
            .product-identification {
              font-size: 9px;
              font-weight: 600;
              line-height: 1.3;
              margin-bottom: 3px;
            }
            
            .tax-details-row {
              background-color: #f0fdf4 !important;
              border-bottom: 1px solid #d1d5db;
            }
            
            .tax-details-row td {
              padding: 8px !important;
              font-size: 10px !important;
              color: #374151 !important;
            }
            
            .tax-details-title {
              font-weight: 600;
              margin-bottom: 4px;
              color: #1f2937;
              font-size: 11px;
            }
            
            .tax-details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 4px 12px;
            }
            
            .tax-detail-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            
            .tax-detail-value {
              font-weight: 600;
            }
            
            .price-highlight {
              color: #059669;
              font-weight: 700;
              font-size: 12px;
            }
            
            .totals-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 16px;
            }
            
            .fbr-logos {
              display: flex;
              gap: 12px;
              align-items: center;
              background: #f8fafc;
              padding: 10px;
              border-radius: 8px;
              border: 2px solid #e2e8f0;
            }
            
            .fbr-logos img {
              height: 80px;
              width: auto;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
            }
            
            .totals-box {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              border-radius: 15px;
              padding: 30px;
              min-width: 380px;
              box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            }
            
            .totals-box h3 {
              font-size: 24px;
              margin-bottom: 25px;
              text-align: center;
              font-weight: 700;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 12px 0;
              font-size: 16px;
              padding: 8px 0;
              border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .total-row:last-child {
              border-bottom: none;
            }
            
            .total-row.final {
              border-top: 3px solid #10b981;
              padding-top: 20px;
              margin-top: 20px;
              font-size: 22px;
              font-weight: 700;
              color: #10b981;
              text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
            }
            
            .footer {
              text-align: center;
              margin-top: 50px;
              padding-top: 30px;
              border-top: 3px solid #e5e7eb;
              background: #f8fafc;
              margin-left: -20px;
              margin-right: -20px;
              padding-left: 20px;
              padding-right: 20px;
              border-radius: 15px 15px 0 0;
            }
            
            .footer .thank-you {
              font-size: 26px;
              font-weight: 700;
              color: #059669;
              margin-bottom: 15px;
              text-shadow: 1px 1px 2px rgba(5, 150, 105, 0.2);
            }
            
            .footer .contact {
              font-size: 16px;
              color: #374151;
              line-height: 1.6;
            }
            
            .footer a {
              color: #2563eb;
              text-decoration: none;
              font-weight: 600;
            }
            
            .footer a:hover {
              text-decoration: underline;
            }
            
            @media print {
              body {
                padding: 0;
              }
              
              .invoice-header {
                margin: 0;
                border-radius: 0;
              }
              
              .footer {
                margin-left: 0;
                margin-right: 0;
                border-radius: 0;
              }
              
              @page {
                margin: 0.5in;
                size: A4;
              }
              
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          <!-- Invoice Header -->
          <div class="invoice-header">
            <div class="invoice-title">
              <h1>INVOICE</h1>
              <div class="order-info">
                <p><strong>Order: ${order.orderNumber}</strong></p>
                ${order.invoiceRefNo ? `<p>Ref: ${order.invoiceRefNo}</p>` : ''}
              </div>
            </div>
            <div class="company-info">
              ${sellerInfo?.fbrSellerBusinessName ? `<h2>${sellerInfo.fbrSellerBusinessName}</h2>` : '<h2>Business Name</h2>'}
              ${sellerInfo?.fbrSellerNTNCNIC ? `<p>NTN/CNIC: ${sellerInfo.fbrSellerNTNCNIC}</p>` : ''}
              ${sellerInfo?.fbrSellerAddress ? `<p>${sellerInfo.fbrSellerAddress}</p>` : ''}
              ${sellerInfo?.fbrSellerProvince ? `<p>${sellerInfo.fbrSellerProvince} Province</p>` : ''}
            </div>
          </div>
          
          ${order.invoiceNumber ? `
          <div class="fbr-notice">
            <strong>FBR Digital Invoice Number: ${order.invoiceNumber}</strong>
          </div>
          ` : ''}
          
          <!-- Information Section -->
          <div class="info-section">
            <!-- Buyer Information -->
            <div class="info-box">
              <h3>Buyer Information</h3>
              ${(order.buyerBusinessName || order.buyerNTNCNIC || order.buyerProvince || order.buyerAddress || order.buyerRegistrationType) ? `
                ${order.buyerBusinessName ? `<p><strong>${order.buyerBusinessName}</strong></p>` : ''}
                ${order.buyerNTNCNIC ? `<p>NTN/CNIC: ${order.buyerNTNCNIC}</p>` : ''}
                ${order.buyerRegistrationType ? `<p>Registration Type: ${order.buyerRegistrationType}</p>` : ''}
                ${order.buyerAddress ? `<p>${order.buyerAddress}</p>` : ''}
                ${order.buyerProvince ? `<p>${order.buyerProvince} Province</p>` : ''}
                
              ` : order.user ? `
                ${(order.user.name || order.user.firstName || order.user.lastName) ? `
                <p><strong>${order.user.name || `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim()}</strong></p>
                ` : ''}
                
                ${order.user.buyerNTNCNIC ? `<p>NTN/CNIC: ${order.user.buyerNTNCNIC}</p>` : ''}
                ${order.user.buyerAddress ? `<p>Address: ${order.user.buyerAddress}</p>` : ''}
              ` : `
                <p><strong>${order.billingFirstName} ${order.billingLastName}</strong></p>
                
              `}
            </div>
            
            <!-- Invoice Information -->
            <div class="info-box">
              <h3>Invoice Information</h3>
              <p>Invoice Date: ${formatDateTime(order.createdAt)}</p>
              <p>Order Status: ${order.status}</p>
              ${order.invoiceType ? `<p>Invoice Type: ${order.invoiceType}</p>` : ''}
              ${order.scenarioId ? `<p>Scenario ID: ${order.scenarioId}</p>` : ''}
              ${order.trackingNumber ? `<p>Tracking: ${order.trackingNumber}</p>` : ''}
            </div>
          </div>
          
          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50%;">Product Name</th>
                <th style="width: 15%;">Quantity</th>
                <th style="width: 15%;">Price Inc. Tax</th>
                <th style="width: 20%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems.map((item: any) => `
                <tr>
                  <td>
                    ${item.serialNumber ? `<div class="product-identification" style="color: #2563eb;">🔢 Serial: ${item.serialNumber}</div>` : ''}
                    ${item.listNumber ? `<div class="product-identification" style="color: #059669;">📋 List: ${item.listNumber}</div>` : ''}
                    ${item.bcNumber ? `<div class="product-identification" style="color: #7c3aed;">🏢 BC: ${item.bcNumber}</div>` : ''}
                    ${item.lotNumber ? `<div class="product-identification" style="color: #ea580c;">📦 Lot: ${item.lotNumber}</div>` : ''}
                    ${item.expiryDate ? `<div class="product-identification" style="color: #dc2626;">📅 Exp: ${item.expiryDate}</div>` : ''}
                    <div class="product-name">${item.productName}</div>
                    ${item.variantTitle ? `<div class="product-details">Variant: ${item.variantTitle}</div>` : ''}
                    ${item.sku ? `<div class="product-details">SKU: ${item.sku}</div>` : ''}
                    ${item.isWeightBased && item.weightQuantity ? `<div class="product-details">Weight: ${formatWeightAuto(item.weightQuantity).formattedString}</div>` : ''}
                  </td>
                  <td class="text-center">
                    ${item.isWeightBased && item.weightQuantity ? 
                      formatWeightAuto(item.weightQuantity).formattedString : 
                      item.quantity
                    }
                  </td>
                  <td class="text-right"><span class="price-highlight">${formatAmountForPrint(item.priceIncludingTax || item.price)}</span></td>
                  <td class="text-right"><strong class="price-highlight">${formatAmountForPrint(item.totalPrice)}</strong></td>
                </tr>
                ${(item.taxAmount || item.taxPercentage || item.discount || item.extraTax || item.furtherTax || item.fedPayableTax || item.priceIncludingTax || item.priceExcludingTax || item.fixedNotifiedValueOrRetailPrice || item.saleType) ? `
                <tr class="tax-details-row">
                  <td colspan="4">
                    <div class="tax-details-title">💰 Tax & Discount Details:</div>
                    <div class="tax-details-grid">
                      ${(Number(item.taxAmount) || 0) > 0 ? `
                      <div class="tax-detail-item">
                        <span>Tax Amount:</span>
                        <span class="tax-detail-value">${formatAmountForPrint(item.taxAmount || 0)}</span>
                      </div>
                      ` : ''}
                      ${(Number(item.taxPercentage) || 0) > 0 ? `
                      <div class="tax-detail-item">
                        <span>Tax Percentage:</span>
                        <span class="tax-detail-value">${Number(item.taxPercentage || 0).toFixed(2)}%</span>
                      </div>
                      ` : ''}
                      ${(Number(item.priceIncludingTax) || 0) > 0 ? `
                      <div class="tax-detail-item">
                        <span>Price Inc. Tax:</span>
                        <span class="tax-detail-value">${formatAmountForPrint(item.priceIncludingTax || 0)}</span>
                      </div>
                      ` : ''}
                      ${(Number(item.priceExcludingTax) || 0) > 0 ? `
                      <div class="tax-detail-item">
                        <span>Price Ex. Tax:</span>
                        <span class="tax-detail-value">${formatAmountForPrint(item.priceExcludingTax || 0)}</span>
                      </div>
                      ` : ''}
                      ${(Number(item.extraTax) || 0) > 0 ? `
                      <div class="tax-detail-item">
                        <span>Extra Tax:</span>
                        <span class="tax-detail-value">${formatAmountForPrint(item.extraTax || 0)}</span>
                      </div>
                      ` : ''}
                      ${(Number(item.furtherTax) || 0) > 0 ? `
                      <div class="tax-detail-item">
                        <span>Further Tax:</span>
                        <span class="tax-detail-value">${formatAmountForPrint(item.furtherTax || 0)}</span>
                      </div>
                      ` : ''}
                      ${(Number(item.fedPayableTax) || 0) > 0 ? `
                      <div class="tax-detail-item">
                        <span>FED Payable Tax:</span>
                        <span class="tax-detail-value">${formatAmountForPrint(item.fedPayableTax || 0)}</span>
                      </div>
                      ` : ''}
                      ${(Number(item.discount) || 0) > 0 ? `
                      <div class="tax-detail-item">
                        <span>Discount:</span>
                        <span class="tax-detail-value" style="color: #10b981;">-${formatAmountForPrint(item.discount || 0)}</span>
                      </div>
                      ` : ''}
                      ${(Number(item.fixedNotifiedValueOrRetailPrice) || 0) > 0 ? `
                      <div class="tax-detail-item">
                        <span>Fixed Notified Value/Retail Price:</span>
                        <span class="tax-detail-value">${formatAmountForPrint(item.fixedNotifiedValueOrRetailPrice || 0)}</span>
                      </div>
                      ` : ''}
                      ${item.saleType && item.saleType !== 'Goods at standard rate' ? `
                      <div class="tax-detail-item">
                        <span>Sale Type:</span>
                        <span class="tax-detail-value">${item.saleType}</span>
                      </div>
                      ` : ''}
                    </div>
                  </td>
                </tr>
                ` : ''}
              `).join('')}
            </tbody>
          </table>
          
          <!-- Totals Section -->
          <div class="totals-section">
            ${order.invoiceNumber ? `
            <div class="fbr-logos">
              <img src="/digital-invoicing-logo.webp" alt="FBR Digital Invoicing" />
              <img src="/fbr-pakistan-logo.png" alt="FBR Pakistan" />
            </div>
            ` : '<div></div>'}
            
            <div class="totals-box">
              <h3>Order Summary</h3>
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${formatAmountForPrint(order.subtotal)}</span>
              </div>
              ${parseFloat(order.taxAmount) > 0 ? `
              <div class="total-row">
                <span>Tax:</span>
                <span>${formatAmountForPrint(order.taxAmount)}</span>
              </div>
              ` : ''}
              ${parseFloat(order.shippingAmount) > 0 ? `
              <div class="total-row">
                <span>Shipping:</span>
                <span>${formatAmountForPrint(order.shippingAmount)}</span>
              </div>
              ` : ''}
              ${parseFloat(order.discountAmount) > 0 ? `
              <div class="total-row" style="color: #10b981;">
                <span>Discount:</span>
                <span>-${formatAmountForPrint(order.discountAmount)}</span>
              </div>
              ` : ''}
              <div class="total-row final">
                <span>Total:</span>
                <span>${formatAmountForPrint(order.totalAmount)}</span>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div class="thank-you">Thank you for your business!</div>
            <div class="contact">
              ${sellerInfo?.fbrSellerBusinessName ? `For questions about this invoice, please contact ${sellerInfo.fbrSellerBusinessName}` : 'For questions about this invoice, please contact us'}
            </div>
          </div>
        </body>
      </html>
    `;

    // Write content to print window
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  // Format date and time to "Aug 5, 2025 at 5:57 PM" format
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options).replace(',', ' at');
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = Number(amount);
    
    // Handle NaN, undefined, null, or invalid values
    if (isNaN(numAmount) || amount === null || amount === undefined || typeof numAmount !== 'number') {
      return (
        <span className="flex items-center gap-1">
          <CurrencySymbol />0.00
        </span>
      );
    }
    
    return (
      <span className="flex items-center gap-1">
        <CurrencySymbol />{numAmount.toFixed(2)}
      </span>
    );
  };

  const parseAddons = (addonsData: any) => {
    if (!addonsData) return [];
    
    try {
      // If it's already an array, return it
      if (Array.isArray(addonsData)) {
        return addonsData;
      }
      
      // If it's a string, try to parse it
      if (typeof addonsData === 'string') {
        const parsed = JSON.parse(addonsData);
        return Array.isArray(parsed) ? parsed : [];
      }
      
      // If it's an object but not an array, wrap it in an array
      if (typeof addonsData === 'object') {
        return [addonsData];
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing addons:', error);
      return [];
    }
  };


  const getAddonDescription = (addon: any) => {
    // Try to get description from addons table
    if (addon.addonId && addons.length > 0) {
      const addonFromTable = addons.find(a => a.id === addon.addonId);
      if (addonFromTable && addonFromTable.description) {
        return addonFromTable.description;
      }
    }
    return null;
  };

  const getAddonImage = (addon: any) => {
    // Try to get image from addons table
    if (addon.addonId && addons.length > 0) {
      const addonFromTable = addons.find(a => a.id === addon.addonId);
      if (addonFromTable && addonFromTable.image) {
        return addonFromTable.image;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <Card>
            <CardHeader className="pb-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
                  <div className="h-16 w-64 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="text-right space-y-2">
                  <div className="h-6 w-32 ml-auto bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-40 ml-auto bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-36 ml-auto bg-gray-200 animate-pulse rounded" />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Details Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-1/3 bg-gray-200 animate-pulse rounded" />
              </CardContent>
            </Card>
          </div>

          {/* Items Table Skeleton */}
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
                      <div className="h-3 w-32 bg-gray-200 animate-pulse rounded" />
                    </div>
                    <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Error loading invoice:</strong> {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Order not found. Please check the order ID and try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const orderItems = order.items || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Print Button */}
            <div className="mb-6 print-hidden flex gap-4">
            <Button
              onClick={handlePrint}
              size="lg"
              className="shadow-md hover:shadow-lg transition-shadow"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
            
            {/* Debug JSON Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="shadow-md hover:shadow-lg transition-shadow hidden"
                  onClick={() => setDebugJson(prev => ({ 
                    ...prev, 
                    orderData: order, 
                    showDebug: true 
                  }))}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View JSON Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    🔍 Debug: Order JSON Data
                  </DialogTitle>
                  <DialogDescription>
                    View the raw order data and any FBR submission details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 overflow-auto max-h-96">
                  {debugJson.orderData && (
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">📤 Order Data:</h4>
                      <pre className="bg-muted p-3 rounded border text-xs overflow-auto max-h-64">
                        {JSON.stringify(debugJson.orderData, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {debugJson.fbrPayload && (
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">📋 FBR JSON Payload:</h4>
                      <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-64">
                        {JSON.stringify(debugJson.fbrPayload, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {debugJson.fbrError && (
                    <div>
                      <h4 className="font-medium text-red-800 mb-2">❌ FBR Error Response:</h4>
                      <pre className="bg-red-50 p-3 rounded border text-xs overflow-auto max-h-64">
                        {JSON.stringify(debugJson.fbrError, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Screen Invoice */}
          <Card className="invoice-container shadow-xl border-0 overflow-hidden">
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-8 w-8" />
                    <h1 className="text-4xl font-bold tracking-tight">INVOICE</h1>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-sm font-mono bg-slate-700 text-slate-100">
                      Order: {order.orderNumber}
                    </Badge>
                    {order.invoiceRefNo && (
                      <Badge variant="outline" className="text-sm font-mono border-slate-300 text-slate-200">
                        Ref: {order.invoiceRefNo}
                      </Badge>
                    )}
                  </div>
                  {order.invoiceNumber && (
                    <Alert className="bg-emerald-50 border-emerald-200 mt-4">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <AlertDescription className="text-emerald-800">
                        <div className="font-semibold">FBR Digital Invoice Number</div>
                        <div className="font-mono text-lg mt-1">{order.invoiceNumber}</div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <div className="text-right space-y-3">
                  <div className="flex items-center justify-end gap-3">
                    <Building2 className="h-6 w-6" />
                    <h2 className="text-3xl font-bold">
                      {sellerInfo?.fbrSellerBusinessName || 'Business Name'}
                    </h2>
                  </div>
                  <div className="text-slate-200 space-y-1 text-sm">
                    {sellerInfo?.fbrSellerNTNCNIC && (
                      <div className="flex items-center justify-end gap-2">
                        <span>NTN/CNIC: {sellerInfo.fbrSellerNTNCNIC}</span>
                      </div>
                    )}
                    {sellerInfo?.fbrSellerAddress && (
                      <div className="flex items-center justify-end gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{sellerInfo.fbrSellerAddress}</span>
                      </div>
                    )}
                    {sellerInfo?.fbrSellerProvince && (
                      <div className="flex items-center justify-end gap-2">
                        <span>{sellerInfo.fbrSellerProvince} Province</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Invoice Details */}
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Buyer Information */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-blue-600" />
                      Buyer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                  <div className="text-gray-600">
                    {/* Primary: Show buyer business fields from order */}
                    {(order.buyerBusinessName || order.buyerNTNCNIC || order.buyerProvince || order.buyerAddress || order.buyerRegistrationType) ? (
                      <>
                        {order.buyerBusinessName && <p className="font-medium">{order.buyerBusinessName}</p>}
                        {order.buyerNTNCNIC && (
                          <div className="mt-1">
                            <span className="text-xs text-gray-500">NTN/CNIC: </span>
                            <span className="font-mono text-sm">{order.buyerNTNCNIC}</span>
                          </div>
                        )}
                        {order.buyerRegistrationType && (
                          <div className="mt-1">
                            <span className="text-xs text-gray-500">Registration Type: </span>
                            <span className="text-sm capitalize">{order.buyerRegistrationType}</span>
                          </div>
                        )}
                        {order.buyerAddress && <p className="mt-1">{order.buyerAddress}</p>}
                        {order.buyerProvince && <p className="text-sm">{order.buyerProvince} Province</p>}
                        
                        {/* Contact info from order */}
                        {/*{(order.email || order.phone) && (
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Contact Information:</p>
                            {order.email && <p className="text-sm">{order.email}</p>}
                            {order.phone && <p className="text-sm">Phone: {order.phone}</p>}
                          </div>
                        )}*/}
                      </>
                    ) : order.user ? (
                      /* Fallback: Show user table data if buyer fields are empty */
                      <>
                        {/* Basic User Information */}
                        {(order.user.name || order.user.firstName || order.user.lastName) && (
                          <p className="font-medium">
                            {order.user.name || `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim()}
                          </p>
                        )}
                        {order.user.displayName && order.user.displayName !== order.user.name && (
                          <p className="text-sm text-gray-500">Display Name: {order.user.displayName}</p>
                        )}
                        {order.user.username && <p className="text-sm text-gray-500">Username: @{order.user.username}</p>}
                        
                        {/* Contact Information */}
                        {order.user.email && <p className="mt-1 text-sm text-gray-500">{order.user.email} </p>}
                        {order.user.phone && <p className="text-sm text-gray-500">Phone: {order.user.phone}</p>}
                        {order.user.buyerNTNCNIC && <p className="text-sm text-gray-500">NTN / CNIC: {order.user.buyerNTNCNIC}</p>}
                        {order.user.buyerProvince && <p className="text-sm text-gray-500">Province: {order.user.buyerProvince}</p>}
                        {order.user.buyerAddress && <p className="text-sm text-gray-500">Address: {order.user.buyerAddress}</p>}
                        {order.user.buyerRegistrationType && <p className="text-sm text-gray-500">Registration Type: {order.user.buyerRegistrationType}</p>}
                        
                        {/* User Type & Profile */}
                        {order.user.userType && order.user.userType !== 'customer' && (
                          <p className="text-xs text-blue-600 capitalize">User Type: {order.user.userType}</p>
                        )}
                        {order.user.profilePicture && (
                          <div className="mt-2">
                            <img src={order.user.profilePicture} alt="Profile" className="w-8 h-8 rounded-full" />
                          </div>
                        )}
                        
                        {/* Address Information */}
                        {(order.user.address || order.user.city || order.user.state || order.user.postalCode || order.user.country) && (
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Address:</p>
                            {order.user.address && <p className="text-sm">{order.user.address}</p>}
                            <p className="text-sm">
                              {order.user.city && `${order.user.city}, `}
                              {order.user.state && `${order.user.state} `}
                              {order.user.postalCode}
                            </p>
                            {order.user.country && <p className="text-sm">{order.user.country}</p>}
                          </div>
                        )}
                      </>
                    ) : (
                      /* Final fallback: Show billing information if no user and no buyer business data */
                      <>
                        <p className="font-medium">{order.billingFirstName} {order.billingLastName}</p>
                        {order.email && <p className="mt-1">{order.email}</p>}
                        {order.phone && <p>Phone: {order.phone}</p>}
                        
                        {/* Billing Address */}
                        {(order.billingAddress1 || order.billingAddress2 || order.billingCity || order.billingState || order.billingPostalCode || order.billingCountry) && (
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Billing Address:</p>
                            {order.billingAddress1 && <p className="text-sm">{order.billingAddress1}</p>}
                            {order.billingAddress2 && <p className="text-sm">{order.billingAddress2}</p>}
                            <p className="text-sm">
                              {order.billingCity && `${order.billingCity}, `}
                              {order.billingState && `${order.billingState} `}
                              {order.billingPostalCode}
                            </p>
                            {order.billingCountry && <p className="text-sm">{order.billingCountry}</p>}
                          </div>
                        )}
                        
                        {/* Shipping Address if different */}
                        {(order.shippingFirstName && (order.shippingFirstName !== order.billingFirstName || order.shippingLastName !== order.billingLastName)) && (
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Shipping Address:</p>
                            <p className="text-sm font-medium">{order.shippingFirstName} {order.shippingLastName}</p>
                            {order.shippingAddress1 && <p className="text-sm">{order.shippingAddress1}</p>}
                            {order.shippingAddress2 && <p className="text-sm">{order.shippingAddress2}</p>}
                            <p className="text-sm">
                              {order.shippingCity && `${order.shippingCity}, `}
                              {order.shippingState && `${order.shippingState} `}
                              {order.shippingPostalCode}
                            </p>
                            {order.shippingCountry && <p className="text-sm">{order.shippingCountry}</p>}
                          </div>
                        )}
                      </>
                    )}
                    </div>
                  </CardContent>
                </Card>

                {/* Invoice Information */}
                <Card className="border-l-4 border-l-emerald-500">
                  <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-emerald-600" />
                      Invoice Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                  <div className="text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Invoice Date:</span>
                      <span className='text-sm text-gray-500'>{formatDateTime(order.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className='text-sm text-gray-500'>Order Status:</span>
                      <span className="text-sm text-gray-500 capitalize">{order.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className='text-sm text-gray-500'>Payment Status:</span>
                      <span className="capitalize text-sm text-gray-500">{order.paymentStatus}</span>
                    </div>
                    {order.invoiceType && (
                      <div className="flex justify-between">
                        <span className='text-sm text-gray-500'>Invoice Type:</span>
                        <span className="text-sm text-gray-500">{order.invoiceType}</span>
                      </div>
                    )}
                    {order.scenarioId && (
                      <div className="flex justify-between">
                        <span className='text-sm text-gray-500'>Scenario ID:</span>
                        <span className="text-sm text-gray-500 font-mono">{order.scenarioId}</span>
                      </div>
                    )}
                    {order.trackingNumber && (
                      <div className="flex justify-between">
                        <span className='text-sm text-gray-500'>Tracking:</span>
                        <span className="font-mono text-sm text-gray-500">{order.trackingNumber}</span>
                      </div>
                    )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>

            {/* Order Items */}
            <CardContent className="p-8">
              <CardTitle className="flex items-center gap-2 text-xl mb-6">
                <ShoppingCart className="h-6 w-6 text-slate-600" />
                Order Items
              </CardTitle>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Product Name</TableHead>
                      <TableHead className="text-left">HS Code</TableHead>
                      <TableHead className="text-left">Serial No.</TableHead>
                      <TableHead className="text-left">SRO/Schedule</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-center">UOM</TableHead>
                      <TableHead className="text-right">Price Inc. Tax</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.length > 0 ? (
                      orderItems.map((item: any, index: number) => (
                        <React.Fragment key={index}>
                          <TableRow className="hover:bg-slate-50">
                            {/* Product Name */}
                            <TableCell className="py-4">
                              <div>
                                {/* Product Identification Fields - Show before product name if they have data */}
                                {item.serialNumber && (
                                  <div className="text-xs text-blue-600 mb-1">
                                    🔢 Serial: {item.serialNumber}
                                  </div>
                                )}
                                {item.listNumber && (
                                  <div className="text-xs text-green-600 mb-1">
                                    📋 List: {item.listNumber}
                                  </div>
                                )}
                                {item.bcNumber && (
                                  <div className="text-xs text-purple-600 mb-1">
                                    🏢 BC: {item.bcNumber}
                                  </div>
                                )}
                                {item.lotNumber && (
                                  <div className="text-xs text-orange-600 mb-1">
                                    📦 Lot: {item.lotNumber}
                                  </div>
                                )}
                                {item.expiryDate && (
                                  <div className="text-xs text-red-600 mb-1">
                                    📅 Exp: {item.expiryDate}
                                  </div>
                                )}
                                <div className="font-medium">{item.productName}</div>
                                {item.variantTitle && (
                                  <div className="text-xs text-gray-500">{item.variantTitle}</div>
                                )}
                                {item.sku && (
                                  <div className="text-xs text-gray-500 font-mono">SKU: {item.sku}</div>
                                )}
                                {item.isWeightBased && item.weightQuantity && (
                                  <div className="text-xs text-blue-600">
                                    ⚖️ Weight: {formatWeightAuto(item.weightQuantity).formattedString}
                                  </div>
                                )}
                                {(() => {
                                  const parsedAddons = parseAddons(item.addons);
                                  return parsedAddons.length > 0 && (
                                    <div className="text-xs text-blue-600 mt-1">
                                      🧩 {parsedAddons.length} addon(s) included
                                    </div>
                                  );
                                })()}
                              </div>
                            </TableCell>
                            
                            {/* HS Code */}
                            <TableCell className="text-gray-600 font-mono text-xs">
                              {item.hsCode || '-'}
                            </TableCell>
                            
                            {/* Serial Number */}
                            <TableCell className="text-gray-600 font-mono text-xs">
                              {item.itemSerialNumber || '-'}
                            </TableCell>
                            
                            {/* SRO/Schedule Number */}
                            <TableCell className="text-gray-600 font-mono text-xs">
                              {item.sroScheduleNumber || '-'}
                            </TableCell>
                            
                            {/* Quantity */}
                            <TableCell className="text-center">
                              {item.isWeightBased && item.weightQuantity ? (
                                <div className="text-sm">
                                  <div>{formatWeightAuto(item.weightQuantity).formattedString}</div>
                                  <div className="text-xs text-gray-500">(Weight)</div>
                                </div>
                              ) : (
                                <div className="font-medium">{item.quantity}</div>
                              )}
                            </TableCell>
                            
                            {/* UOM */}
                            <TableCell className="text-center text-gray-600">
                              {item.isWeightBased ? (
                                <span className="text-xs text-gray-500">Weight-based</span>
                              ) : (
                                item.uom || '-'
                              )}
                            </TableCell>
                            
                            {/* Price Inc. Tax */}
                            <TableCell className="text-right">
                              {(() => {
                                const parsedAddons = parseAddons(item.addons);
                                const effectivePrice = item.priceIncludingTax || item.price;
                                if (parsedAddons.length > 0) {
                                  return (
                                    <div>
                                      <div className="text-sm">Price Inc. Tax: {formatAmount(effectivePrice)}</div>
                                      <div className="text-xs text-gray-500">
                                        +Addons: {formatAmount(parsedAddons.reduce((sum: number, addon: any) => sum + ((Number(addon.price) || 0) * (Number(addon.quantity) || 1)), 0))}
                                      </div>
                                    </div>
                                  );
                                } else if (item.isWeightBased && item.weightQuantity) {
                                  return (
                                    <div className="text-sm">
                                      {formatAmount(effectivePrice)}
                                      <div className="text-xs text-gray-500">
                                        (for {formatWeightAuto(item.weightQuantity).formattedString})
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return formatAmount(effectivePrice);
                                }
                              })()}
                            </TableCell>
                            
                            {/* Total */}
                            <TableCell className="text-right font-medium">
                              {formatAmount(item.totalPrice)}
                            </TableCell>
                          </TableRow>
                          {/* Addon details row */}
                          {(() => {
                            const parsedAddons = parseAddons(item.addons);
                            return parsedAddons.length > 0 && (
                              <TableRow className="bg-slate-25 hover:bg-slate-50">
                                <TableCell colSpan={8} className="py-3 pl-8">
                                  <div className="text-xs text-gray-600">
                                    <div className="font-medium mb-2 text-gray-700">🧩 Addons:</div>
                                    <div className="space-y-2">
                                      {parsedAddons.map((addon: any, addonIndex: number) => {
                                      // Ensure addon has required properties
                                      const safeAddon = {
                                        addonId: addon.addonId || '',
                                        addonTitle: addon.addonTitle || addon.title || addon.name || `Addon ${addonIndex + 1}`,
                                        price: Number(addon.price) || 0,
                                        quantity: Number(addon.quantity) || 1
                                      };
                                      
                                      const addonDescription = getAddonDescription(addon);
                                      const addonImage = getAddonImage(addon);
                                      return (
                                        <div key={addonIndex} className="flex items-start justify-between">
                                          <div className="flex items-start gap-2 flex-1">
                                            {addonImage && (
                                              <img 
                                                src={addonImage} 
                                                alt={safeAddon.addonTitle}
                                                className="w-6 h-6 object-cover rounded"
                                              />
                                            )}
                                            <div className="flex-1">
                                              <div className="font-medium text-gray-700">
                                                • {safeAddon.addonTitle} (x{safeAddon.quantity})
                                              </div>
                                              {addonDescription && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                  {addonDescription}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-right ml-4">
                                            <div className="font-medium text-gray-700">
                                              {formatAmount(safeAddon.price)} each
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              Total: {formatAmount(safeAddon.price * safeAddon.quantity)}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                        <div className="flex justify-between text-sm font-medium text-gray-700 border-t pt-2 mt-2">
                                          <span>Addons subtotal per product:</span>
                                          <span>{formatAmount(parsedAddons.reduce((sum: number, addon: any) => sum + ((Number(addon.price) || 0) * (Number(addon.quantity) || 1)), 0))}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })()}
                          
                          {/* Tax and Discount details row */}
                          {(item.taxAmount || item.taxPercentage || item.discount || item.extraTax || item.furtherTax || item.fedPayableTax || item.priceIncludingTax || item.priceExcludingTax || item.fixedNotifiedValueOrRetailPrice || item.saleType) && (
                            <TableRow className="bg-emerald-25 hover:bg-emerald-50">
                              <TableCell colSpan={8} className="py-3 pl-8">
                                <div className="text-xs text-gray-600">
                                  <div className="font-medium mb-2 text-gray-700">💰 Tax & Discount Details:</div>
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                    {(Number(item.taxAmount) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Tax Amount:</span>
                                        <span className="font-medium">{formatAmount(item.taxAmount || 0)}</span>
                                      </div>
                                    )}
                                    {(Number(item.taxPercentage) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Tax Percentage:</span>
                                        <span className="font-medium">{Number(item.taxPercentage || 0).toFixed(2)}%</span>
                                      </div>
                                    )}
                                    {(Number(item.priceIncludingTax) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Price Inc. Tax:</span>
                                        <span className="font-medium">{formatAmount(item.priceIncludingTax || 0)}</span>
                                      </div>
                                    )}
                                    {(Number(item.priceExcludingTax) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Price Ex. Tax:</span>
                                        <span className="font-medium">{formatAmount(item.priceExcludingTax || 0)}</span>
                                      </div>
                                    )}
                                    {(Number(item.extraTax) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Extra Tax:</span>
                                        <span className="font-medium">{formatAmount(item.extraTax || 0)}</span>
                                      </div>
                                    )}
                                    {(Number(item.furtherTax) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Further Tax:</span>
                                        <span className="font-medium">{formatAmount(item.furtherTax || 0)}</span>
                                      </div>
                                    )}
                                    {(Number(item.fedPayableTax) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>FED Payable Tax:</span>
                                        <span className="font-medium">{formatAmount(item.fedPayableTax || 0)}</span>
                                      </div>
                                    )}
                                    {(Number(item.discount) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Discount:</span>
                                        <span className="font-medium text-green-600">-{formatAmount(item.discount || 0)}</span>
                                      </div>
                                    )}
                                    {(Number(item.fixedNotifiedValueOrRetailPrice) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Fixed Notified Value/Retail Price:</span>
                                        <span className="font-medium">{formatAmount(item.fixedNotifiedValueOrRetailPrice || 0)}</span>
                                      </div>
                                    )}
                                    {item.saleType && item.saleType !== 'Goods at standard rate' && (
                                      <div className="flex justify-between">
                                        <span>Sale Type:</span>
                                        <span className="font-medium">{item.saleType}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                          No items found for this order
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>


            {/* Totals */}
            <CardContent className="p-8">
              <div className="flex justify-between items-start">
                {/* FBR Logos - Left Side - Only show if invoice has FBR invoice number */}
                {order.invoiceNumber && (
                  <div className="flex-shrink-0 flex items-center gap-4">
                    <img 
                      src="/digital-invoicing-logo.webp" 
                      alt="FBR Digital Invoicing" 
                      className="h-20 w-auto object-contain"
                    />
                    <img 
                      src="/fbr-pakistan-logo.png" 
                      alt="FBR Pakistan" 
                      className="h-20 w-auto object-contain"
                    />
                  </div>
                )}
                
                {/* Totals - Right Side */}
                <Card className="min-w-80 shadow-lg border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between py-2">
                      <span>Subtotal:</span>
                      <span>{formatAmount(order.subtotal)}</span>
                    </div>
                    
                    {parseFloat(order.taxAmount) > 0 && (
                      <div className="flex justify-between py-2">
                        <span>Tax:</span>
                        <span>{formatAmount(order.taxAmount)}</span>
                      </div>
                    )}
                    
                    {parseFloat(order.shippingAmount) > 0 && (
                      <div className="flex justify-between py-2">
                        <span>Shipping:</span>
                        <span>{formatAmount(order.shippingAmount)}</span>
                      </div>
                    )}
                    
                    {parseFloat(order.discountAmount) > 0 && (
                      <div className="flex justify-between py-2 text-green-600">
                        <span>Discount:</span>
                        <span>-{formatAmount(order.discountAmount)}</span>
                      </div>
                    )}
                    
                    <Separator className="my-3" />
                    <div className="flex justify-between py-2 text-xl font-bold text-emerald-700">
                      <span>Total:</span>
                      <span>{formatAmount(order.totalAmount)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>

            {/* Footer */}
            <CardContent className="p-8 text-center border-t">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-700">
                  <CheckCircle className="h-5 w-5" />
                  <p className="text-lg font-semibold">Thank you for your business!</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <p className="text-sm">
                    For questions about this invoice, please contact{' '}
                    {sellerInfo?.fbrSellerBusinessName || 'us'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
} 