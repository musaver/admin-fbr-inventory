import CurrencySymbol from '@/app/components/CurrencySymbol';

export async function sendTextEmail(to: string, subject: string, text: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Hisaab360 Inventory Support', email: 'Support@hisaab360.com' },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    console.error('Brevo Error:', error);
    throw new Error(error.message || 'Failed to send email');
  }

  return await res.json();
}

export async function sendHtmlEmail(to: string, subject: string, htmlContent: string, textContent?: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Hisaab360 Inventory Support', email: 'Support@hisaab360.com' },
      to: [{ email: to }],
      subject,
      htmlContent,
      textContent: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    console.error('Brevo Error:', error);
    throw new Error(error.message || 'Failed to send email');
  }

  return await res.json();
}

export async function sendWelcomeEmail(to: string, name?: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Hisaab360 Inventory Support', email: 'support@hisaab360.com' },
      to: [{ email: to }],
      subject: 'Welcome to Hisaab360 Inventory Management!',
      textContent: `Hello${name ? ` ${name}` : ''}, welcome to Hisaab360 Inventory Management System!`,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    console.error('Failed to send email via Brevo:', error);
    throw new Error(error.message || 'Brevo email failed');
  }

  return await res.json();
}

// Invoice email template interfaces
interface OrderItem {
  productName: string;
  variantTitle?: string;
  sku?: string;
  hsCode?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  isWeightBased?: boolean;
  weightQuantity?: number;
  weightUnit?: string;
  // Tax and discount fields
  taxAmount?: number;
  taxPercentage?: number;
  priceIncludingTax?: number;
  priceExcludingTax?: number;
  extraTax?: number;
  furtherTax?: number;
  fedPayableTax?: number;
  discount?: number;
  // Additional tax fields
  fixedNotifiedValueOrRetailPrice?: number;
  saleType?: string;
  addons?: any[];
}

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  phone?: string;
  status: string;
  paymentStatus?: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  // Billing address
  billingFirstName?: string;
  billingLastName?: string;
  billingAddress1?: string;
  billingAddress2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  // Shipping address
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingAddress1?: string;
  shippingAddress2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  // Invoice fields
  invoiceNumber?: string;
  invoiceRefNo?: string;
  invoiceType?: string;
  scenarioId?: string;
  validationResponse?: string;
  trackingNumber?: string;
  // Buyer fields (from selected customer)
  buyerBusinessName?: string;
  buyerNTNCNIC?: string;
  buyerProvince?: string;
  buyerAddress?: string;
  buyerRegistrationType?: string;
  createdAt: string;
  items: OrderItem[];
  // User and supplier info
  user?: any;
  supplier?: any;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  // Business fields
  sellerBusinessName?: string;
  sellerNTNCNIC?: string;
  sellerProvince?: string;
  sellerAddress?: string;
  phone?: string;
  fax?: string;
  website?: string;
  taxId?: string;
  // Address fields
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  // Contact fields
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  primaryContactMobile?: string;
  secondaryContactName?: string;
  secondaryContactEmail?: string;
  secondaryContactPhone?: string;
  secondaryContactMobile?: string;
}

// Generate invoice HTML template
export function generateInvoiceHtml(order: Order, isForSupplier: boolean = false): string {
  const currencySymbol = order.currency === 'PKR' ? '₨' : order.currency === 'USD' ? '$' : order.currency === 'AED' ? 'د.إ' : order.currency;
  
  const formatAmount = (amount: number) => `${currencySymbol}${amount.toFixed(2)}`;
  
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
  
  const recipientType = isForSupplier ? 'Supplier' : 'Customer';
  const emailTitle = isForSupplier ? 'New Order Notification' : 'Order Confirmation';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailTitle} - ${order.orderNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
        .email-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .header p { margin: 8px 0 0 0; opacity: 0.95; font-size: 16px; }
        .content { padding: 30px; }
        .company-header { text-align: right; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .company-header h2 { color: #2563eb; font-size: 24px; margin: 0 0 10px 0; }
        .company-header p { margin: 2px 0; color: #6b7280; font-size: 14px; }
        .invoice-details { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; margin: 30px 0; }
        .detail-section { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
        .detail-section h3 { margin: 0 0 15px 0; color: #374151; font-size: 16px; font-weight: 600; }
        .detail-section p { margin: 4px 0; font-size: 14px; color: #6b7280; }
        .detail-section .highlight { color: #374151; font-weight: 500; }
        .items-section { margin: 30px 0; }
        .items-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .items-table th { background: #f3f4f6; padding: 15px 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; }
        .items-table td { padding: 15px 12px; border-bottom: 1px solid #f3f4f6; }
        .item-name { font-weight: 500; color: #374151; }
        .item-meta { font-size: 12px; color: #9ca3af; margin-top: 4px; line-height: 1.4; }
        .item-meta .hs-code { color: #6366f1; }
        .item-meta .weight { color: #059669; }
        .tax-details { background: #f0fdf4; padding: 12px; margin-top: 8px; border-radius: 6px; border: 1px solid #bbf7d0; }
        .tax-details h5 { margin: 0 0 8px 0; color: #065f46; font-size: 12px; font-weight: 600; }
        .tax-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .tax-item { display: flex; justify-content: space-between; font-size: 11px; color: #065f46; }
        .totals { background: #f8f9fa; padding: 25px; margin: 30px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
        .totals-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 15px; }
        .totals-row.subtotal { color: #6b7280; }
        .totals-row.total { font-weight: 700; font-size: 20px; color: #374151; border-top: 2px solid #d1d5db; padding-top: 15px; margin-top: 15px; }
        .next-steps { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 8px; margin: 30px 0; border: 1px solid #bae6fd; }
        .next-steps h4 { margin: 0 0 15px 0; color: #0c4a6e; font-size: 16px; }
        .next-steps ul { margin: 0; padding-left: 20px; }
        .next-steps li { margin: 8px 0; color: #0f172a; }
        .footer { background: #374151; color: white; padding: 25px; text-align: center; }
        .footer p { margin: 5px 0; }
        .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-confirmed { background: #dbeafe; color: #1e40af; }
        .status-processing { background: #d1fae5; color: #065f46; }
        .status-paid { background: #d1fae5; color: #065f46; }
        @media (max-width: 768px) {
            .invoice-details { grid-template-columns: 1fr; gap: 20px; }
            .items-table { font-size: 13px; }
            .items-table th, .items-table td { padding: 10px 8px; }
            .tax-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 1024px) and (min-width: 769px) {
            .invoice-details { grid-template-columns: 1fr 1fr; gap: 20px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>${emailTitle}</h1>
            <p>Invoice #${order.orderNumber}</p>
            ${order.invoiceNumber ? `<p style="opacity: 0.8;">Invoice Number: ${order.invoiceNumber}</p>` : ''}
        </div>
        
        <div class="content">
            <!-- Company Header -->
            <div class="company-header">
                <h2>Hisaab360</h2>
                <p>Alrasheed arcade second floor
Flat no 1 mujahid street ,
Defence road , Rawalpindi</p>
                <p>Phone: 0321-4250013</p>
                <p>Email: support@hisaab360.com</p>
            </div>

            <!-- Invoice Details Grid -->
            <div class="invoice-details">
                <!-- Supplier Section -->
                <div class="detail-section">
                    <h3>🏢 Supplier</h3>
                    ${order.supplier ? `
                        <p class="highlight">${order.supplier.name}</p>
                        ${order.supplier.sellerBusinessName ? `<p>${order.supplier.sellerBusinessName}</p>` : ''}
                        ${order.supplier.email ? `<p>${order.supplier.email}</p>` : ''}
                        ${order.supplier.phone ? `<p>Phone: ${order.supplier.phone}</p>` : ''}
                        ${order.supplier.sellerNTNCNIC ? `<p>NTN/CNIC: ${order.supplier.sellerNTNCNIC}</p>` : ''}
                        ${order.supplier.taxId ? `<p>Tax ID: ${order.supplier.taxId}</p>` : ''}
                        ${order.supplier.sellerAddress ? `<p style="margin-top: 8px;">${order.supplier.sellerAddress}</p>` : ''}
                        ${order.supplier.sellerProvince ? `<p>${order.supplier.sellerProvince} Province</p>` : ''}
                        ${order.supplier.website ? `<p style="color: #2563eb;">${order.supplier.website}</p>` : ''}
                        ${order.supplier.primaryContactName ? `
                            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                                <p style="font-weight: 500;">Contact: ${order.supplier.primaryContactName}</p>
                                ${order.supplier.primaryContactEmail ? `<p>${order.supplier.primaryContactEmail}</p>` : ''}
                                ${order.supplier.primaryContactPhone ? `<p>Phone: ${order.supplier.primaryContactPhone}</p>` : ''}
                            </div>
                        ` : ''}
                    ` : '<p style="color: #9ca3af; font-style: italic;">No supplier information</p>'}
                </div>



                <!-- Buyer Section -->
                <div class="detail-section">
                    <h3>👤 Buyer</h3>
                    ${order.buyerBusinessName || order.buyerNTNCNIC ? `
                        ${order.buyerBusinessName ? `<p class="highlight">${order.buyerBusinessName}</p>` : ''}
                        ${order.buyerNTNCNIC ? `<p>NTN/CNIC: ${order.buyerNTNCNIC}</p>` : ''}
                        ${order.buyerRegistrationType ? `<p>Type: ${order.buyerRegistrationType}</p>` : ''}
                        ${order.buyerAddress ? `<p>${order.buyerAddress}</p>` : ''}
                        ${order.buyerProvince ? `<p>${order.buyerProvince} Province</p>` : ''}
                        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                            <p>${order.email}</p>
                            ${order.phone ? `<p>Phone: ${order.phone}</p>` : ''}
                        </div>
                    ` : order.user ? `
                        <p class="highlight">${order.user.name || `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim()}</p>
                        ${order.user.displayName && order.user.displayName !== order.user.name ? `<p>${order.user.displayName}</p>` : ''}
                        <p>${order.user.email}</p>
                        ${order.user.phone ? `<p>Phone: ${order.user.phone}</p>` : ''}
                        ${order.user.buyerNTNCNIC ? `<p>NTN/CNIC: ${order.user.buyerNTNCNIC}</p>` : ''}
                        ${order.user.address || order.user.city ? `
                            <div style="margin-top: 8px;">
                                ${order.user.address ? `<p>${order.user.address}</p>` : ''}
                                ${order.user.city ? `<p>${order.user.city}${order.user.state ? `, ${order.user.state}` : ''} ${order.user.postalCode || ''}</p>` : ''}
                                ${order.user.country ? `<p>${order.user.country}</p>` : ''}
                            </div>
                        ` : ''}
                    ` : `
                        <p class="highlight">${order.billingFirstName || ''} ${order.billingLastName || ''}</p>
                        <p>${order.email}</p>
                        ${order.phone ? `<p>Phone: ${order.phone}</p>` : ''}
                        ${order.billingAddress1 || order.billingCity ? `
                            <div style="margin-top: 8px;">
                                ${order.billingAddress1 ? `<p>${order.billingAddress1}</p>` : ''}
                                ${order.billingAddress2 ? `<p>${order.billingAddress2}</p>` : ''}
                                ${order.billingCity ? `<p>${order.billingCity}${order.billingState ? `, ${order.billingState}` : ''} ${order.billingPostalCode || ''}</p>` : ''}
                                ${order.billingCountry ? `<p>${order.billingCountry}</p>` : ''}
                            </div>
                        ` : ''}
                    `}
                </div>

                <!-- Invoice Information -->
                <div class="detail-section">
                    <h3>📄 Invoice Information</h3>
                    <p><strong>Date:</strong> ${formatDateTime(order.createdAt)}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
                    ${order.paymentStatus ? `<p><strong>Payment:</strong> <span class="status-badge status-${order.paymentStatus}">${order.paymentStatus}</span></p>` : ''}
                    ${order.invoiceType ? `<p><strong>Type:</strong> ${order.invoiceType}</p>` : ''}
                    ${order.invoiceRefNo ? `<p><strong>Ref No:</strong> ${order.invoiceRefNo}</p>` : ''}
                    ${order.scenarioId ? `<p><strong>Scenario ID:</strong> ${order.scenarioId}</p>` : ''}
                    ${order.trackingNumber ? `<p><strong>Tracking:</strong> ${order.trackingNumber}</p>` : ''}
                </div>
            </div>

            <!-- Order Items -->
            <div class="items-section">
                <h3 style="margin-bottom: 20px; color: #374151;">Order Items</h3>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 50%;">Item</th>
                            <th style="width: 15%;">SKU</th>
                            <th style="width: 15%;">Qty/Weight</th>
                            <th style="width: 10%;">Unit Price</th>
                            <th style="width: 10%;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>
                                    <div class="item-name">${item.productName}</div>
                                    <div class="item-meta">
                                        ${item.variantTitle ? `<div>Variant: ${item.variantTitle}</div>` : ''}
                                        ${item.hsCode ? `<div class="hs-code">HS Code: ${item.hsCode}</div>` : ''}
                                        ${item.isWeightBased && item.weightQuantity ? `<div class="weight">⚖️ Weight: ${item.weightQuantity}${item.weightUnit || 'g'}</div>` : ''}
                                    </div>
                                    ${(item.taxAmount && Number(item.taxAmount) > 0) || (item.discount && Number(item.discount) > 0) || (item.taxPercentage && Number(item.taxPercentage) > 0) ? `
                                        <div class="tax-details">
                                            <h5>💰 Tax & Discount Details</h5>
                                            <div class="tax-grid">
                                                ${item.taxAmount && Number(item.taxAmount) > 0 ? `<div class="tax-item"><span>Tax Amount:</span><span>${formatAmount(Number(item.taxAmount))}</span></div>` : ''}
                                                ${item.taxPercentage && Number(item.taxPercentage) > 0 ? `<div class="tax-item"><span>Tax %:</span><span>${Number(item.taxPercentage).toFixed(2)}%</span></div>` : ''}
                                                ${item.priceIncludingTax && Number(item.priceIncludingTax) > 0 ? `<div class="tax-item"><span>Price Inc. Tax:</span><span>${formatAmount(Number(item.priceIncludingTax))}</span></div>` : ''}
                                                ${item.priceExcludingTax && Number(item.priceExcludingTax) > 0 ? `<div class="tax-item"><span>Price Ex. Tax:</span><span>${formatAmount(Number(item.priceExcludingTax))}</span></div>` : ''}
                                                ${item.extraTax && Number(item.extraTax) > 0 ? `<div class="tax-item"><span>Extra Tax:</span><span>${formatAmount(Number(item.extraTax))}</span></div>` : ''}
                                                ${item.furtherTax && Number(item.furtherTax) > 0 ? `<div class="tax-item"><span>Further Tax:</span><span>${formatAmount(Number(item.furtherTax))}</span></div>` : ''}
                                                ${item.fedPayableTax && Number(item.fedPayableTax) > 0 ? `<div class="tax-item"><span>FED Tax:</span><span>${formatAmount(Number(item.fedPayableTax))}</span></div>` : ''}
                                                ${item.discount && Number(item.discount) > 0 ? `<div class="tax-item"><span>Discount:</span><span style="color: #dc2626;">-${formatAmount(Number(item.discount))}</span></div>` : ''}
                                                ${item.fixedNotifiedValueOrRetailPrice && Number(item.fixedNotifiedValueOrRetailPrice) > 0 ? `<div class="tax-item"><span>Fixed Notified Value/Retail Price:</span><span>${formatAmount(Number(item.fixedNotifiedValueOrRetailPrice))}</span></div>` : ''}
                                                ${item.saleType && item.saleType !== 'Goods at standard rate' ? `<div class="tax-item"><span>Sale Type:</span><span>${item.saleType}</span></div>` : ''}
                                            </div>
                                        </div>
                                    ` : ''}
                                </td>
                                <td style="font-family: monospace; font-size: 13px; color: #6b7280;">${item.sku || 'N/A'}</td>
                                <td style="text-align: center;">
                                    ${item.isWeightBased && item.weightQuantity ? 
                                        `<div style="font-weight: 500;">${item.weightQuantity}${item.weightUnit || 'g'}</div>` : 
                                        `<div style="font-weight: 500;">${item.quantity}</div>`
                                    }
                                </td>
                                <td style="text-align: right; font-weight: 500;">${formatAmount(item.price)}</td>
                                <td style="text-align: right; font-weight: 600; color: #374151;">${formatAmount(item.totalPrice)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Totals -->
            <div class="totals">
                <div class="totals-row subtotal">
                    <span>Subtotal:</span>
                    <span>${formatAmount(order.subtotal)}</span>
                </div>
                ${order.discountAmount > 0 ? `
                <div class="totals-row subtotal">
                    <span>Discount:</span>
                    <span style="color: #dc2626;">-${formatAmount(order.discountAmount)}</span>
                </div>
                ` : ''}
                ${order.taxAmount > 0 ? `
                <div class="totals-row subtotal">
                    <span>Tax:</span>
                    <span>${formatAmount(order.taxAmount)}</span>
                </div>
                ` : ''}
                ${order.shippingAmount > 0 ? `
                <div class="totals-row subtotal">
                    <span>Shipping:</span>
                    <span>${formatAmount(order.shippingAmount)}</span>
                </div>
                ` : ''}
                <div class="totals-row total">
                    <span>Total Amount:</span>
                    <span>${formatAmount(order.totalAmount)}</span>
                </div>
            </div>

            <!-- Next Steps -->
            <div class="next-steps">
                <h4>${isForSupplier ? '📦 Next Steps for Supplier' : '📦 What happens next?'}</h4>
                <ul>
                    ${isForSupplier ? `
                        <li>Review the order items and quantities carefully</li>
                        <li>Check product availability and HS codes for customs</li>
                        <li>Verify tax details and pricing information</li>
                        <li>Prepare items for shipment according to specifications</li>
                        <li>Update order status once items are ready</li>
                        <li>Contact us if you have any questions about the order</li>
                    ` : `
                        <li>We'll process your order and prepare your items</li>
                        <li>You'll receive a shipping confirmation when dispatched</li>
                        <li>Track your order status in your account</li>
                        <li>All tax and customs information is included</li>
                        <li>Contact us if you have any questions</li>
                    `}
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Hisaab360 Inventory Management System</strong></p>
            <p>Thank you for your business!</p>
            <p>For support, contact us at Support@hisaab360.com</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

// Send invoice email to customer
export async function sendCustomerInvoiceEmail(order: Order): Promise<void> {
  const subject = `Order Confirmation - ${order.orderNumber}`;
  const htmlContent = generateInvoiceHtml(order, false);
  
  await sendHtmlEmail(order.email, subject, htmlContent);
}

// Send invoice email to supplier
export async function sendSupplierInvoiceEmail(order: Order, supplier: Supplier): Promise<void> {
  const subject = `New Order Notification - ${order.orderNumber}`;
  const htmlContent = generateInvoiceHtml(order, true);
  
  await sendHtmlEmail(supplier.email, subject, htmlContent);
}

// Send invoice emails to both customer and supplier
export async function sendInvoiceEmails(order: Order, supplier?: Supplier, options?: {
  skipCustomerEmail?: boolean;
  skipSellerEmail?: boolean;
}): Promise<{
  customerEmailSent: boolean;
  supplierEmailSent: boolean;
  errors: string[];
}> {
  const results = {
    customerEmailSent: false,
    supplierEmailSent: false,
    errors: [] as string[]
  };

  // Send email to customer (unless skipped)
  if (!options?.skipCustomerEmail) {
    try {
      await sendCustomerInvoiceEmail(order);
      results.customerEmailSent = true;
      console.log(`Invoice email sent to customer: ${order.email}`);
    } catch (error: any) {
      results.errors.push(`Failed to send email to customer (${order.email}): ${error.message}`);
      console.error('Customer email error:', error);
    }
  } else {
    console.log('⏭️ Skipping customer email as requested');
  }

  // Send email to supplier if provided (unless skipped)
  if (supplier?.email && !options?.skipSellerEmail) {
    try {
      await sendSupplierInvoiceEmail(order, supplier);
      results.supplierEmailSent = true;
      console.log(`Invoice email sent to supplier: ${supplier.email}`);
    } catch (error: any) {
      results.errors.push(`Failed to send email to supplier (${supplier.email}): ${error.message}`);
      console.error('Supplier email error:', error);
    }
  } else if (options?.skipSellerEmail) {
    console.log('⏭️ Skipping seller email as requested');
  }

  return results;
}
