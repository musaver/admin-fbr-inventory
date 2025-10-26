'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CurrencySymbol from '../../../components/CurrencySymbol';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Check, ChevronsUpDown, Plus, UserPlus, PackagePlus, Loader } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { 
  formatWeightAuto, 
  parseWeightInput,
  calculateWeightBasedPrice
} from '@/utils/weightUtils';
import { useCurrency } from '@/app/contexts/CurrencyContext';

interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  productType: string;
  isActive: boolean;
  supplierId?: string;
  variants?: ProductVariant[];
  addons?: ProductAddon[];
  hsCode?: string;
  stockManagementType?: string;
  pricePerUnit?: number;
  baseWeightUnit?: string;
  uom?: string;
  taxAmount?: number;
  taxPercentage?: number;
  priceIncludingTax?: number;
  priceExcludingTax?: number;
  extraTax?: number;
  furtherTax?: number;
  fedPayableTax?: number;
  discount?: number;
  serialNumber?: string;
  listNumber?: string;
  bcNumber?: string;
  lotNumber?: string;
  expiryDate?: string;
  fixedNotifiedValueOrRetailPrice?: number;
  saleType?: string;
}

interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  price: number;
  isActive: boolean;
  inventoryQuantity: number;
}

interface Addon {
  id: string;
  title: string;
  price: number;
  description?: string;
  image?: string;
  isActive: boolean;
}

interface ProductAddon {
  id: string;
  productId: string;
  addonId: string;
  price: number;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  addon: Addon;
}

interface SelectedAddon {
  addonId: string;
  addonTitle: string;
  price: number;
  quantity: number;
}

interface OrderItem {
  id?: string;
  productId: string;
  variantId?: string;
  productName: string;
  productDescription?: string;
  variantTitle?: string;
  sku?: string;
  hsCode?: string;
  price: number;
  quantity: number;
  totalPrice: number;
  addons?: SelectedAddon[];
  weightQuantity?: number;
  weightUnit?: string;
  isWeightBased?: boolean;
  uom?: string;
  itemSerialNumber?: string;
  sroScheduleNumber?: string;
  serialNumber?: string;
  listNumber?: string;
  bcNumber?: string;
  lotNumber?: string;
  expiryDate?: string;
  taxAmount?: number | string;
  taxPercentage?: number | string;
  priceIncludingTax?: number | string;
  priceExcludingTax?: number | string;
  extraTax?: number | string;
  furtherTax?: number | string;
  fedPayableTax?: number | string;
  discount?: number | string;
  fixedNotifiedValueOrRetailPrice?: number | string;
  saleType?: string;
  disableAutoTaxCalculations?: boolean;
}

interface Customer {
  id: string;
  name?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  buyerNTNCNIC?: string;
  buyerBusinessName?: string;
  buyerProvince?: string;
  buyerAddress?: string;
  buyerRegistrationType?: string;
  userType?: string;
  tenantId?: string;
  loyaltyPoints?: {
    availablePoints: number;
    pendingPoints: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    pointsExpiringSoon: number;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  email: string;
  phone?: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  
  billingFirstName?: string;
  billingLastName?: string;
  billingAddress1?: string;
  billingAddress2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingAddress1?: string;
  shippingAddress2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  
  shippingMethod?: string;
  trackingNumber?: string;
  cancelReason?: string;
  
  invoiceType?: string;
  invoiceRefNo?: string;
  scenarioId?: string;
  invoiceNumber?: string;
  validationResponse?: string;
  fbrEnvironment?: string;
  
  createdAt: string;
  updatedAt: string;
  
  items?: OrderItem[];
  user?: {
    id: string;
    name?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    buyerNTNCNIC?: string;
    buyerBusinessName?: string;
    buyerProvince?: string;
    buyerAddress?: string;
    buyerRegistrationType?: string;
  };
  
  assignedDriverId?: string;
  deliveryStatus?: string;
  pointsToRedeem?: number;
  pointsDiscountAmount?: number;
  supplierId?: string;
  invoiceDate?: string;
  buyerFirstName?: string;
  buyerLastName?: string;
  buyerFullName?: string;
  buyerNTNCNIC?: string;
  buyerBusinessName?: string;
  buyerProvince?: string;
  buyerAddress?: string;
  buyerRegistrationType?: string;
}


export default function EditOrder() {
  const router = useRouter();
  const params = useParams();
  const { currentCurrency } = useCurrency();
  const [orderId, setOrderId] = useState<string>('');
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fbrValidationLoading, setFbrValidationLoading] = useState(false);
  
  // Error scroll reference
  const errorRef = useRef<HTMLDivElement>(null);
  
  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  
  // Loyalty points state
  const [loyaltySettings, setLoyaltySettings] = useState({
    enabled: false,
    earningRate: 1,
    earningBasis: 'subtotal',
    redemptionValue: 0.01,
    maxRedemptionPercent: 50,
    redemptionMinimum: 100,
    minimumOrder: 0
  });
  const [customerPoints, setCustomerPoints] = useState({
    availablePoints: 0,
    totalPointsEarned: 0,
    totalPointsRedeemed: 0
  });
  
  
  // Seller information (auto-filled from env but editable)
  const [sellerInfo, setSellerInfo] = useState({
    sellerNTNCNIC: '',
    sellerBusinessName: '',
    sellerProvince: '',
    sellerAddress: '',
    fbrSandboxToken: '',
    fbrBaseUrl: ''
  });

  const [skipCustomerEmail, setSkipCustomerEmail] = useState(true);
  const [skipSellerEmail, setSkipSellerEmail] = useState(true);
  const [skipFbrSubmission, setSkipFbrSubmission] = useState(false);
  const [isProductionSubmission, setIsProductionSubmission] = useState(false);
  const [productionToken, setProductionToken] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Order form data
  const [orderData, setOrderData] = useState({
    customerId: '',
    email: '',
    phone: '',
    status: 'pending',
    paymentStatus: 'pending',
    notes: '',
    shippingAmount: 0,
    taxRate: 0,
    discountAmount: 0,
    discountType: 'amount',
    currency: currentCurrency,
    assignedDriverId: '',
    deliveryStatus: 'pending',
    assignmentType: 'manual',
    pointsToRedeem: 0,
    pointsDiscountAmount: 0,
    useAllPoints: false,
    supplierId: '' as string,
    invoiceType: 'Sale Invoice',
    invoiceRefNo: '',
    scenarioId: '',
    invoiceNumber: '',
    invoiceDate: new Date() as Date | undefined,
    validationResponse: '',
    buyerFullName: '',
    buyerNTNCNIC: '',
    buyerBusinessName: '',
    buyerProvince: '',
    buyerAddress: '',
    buyerRegistrationType: ''
  });

  const [isCustomProvince, setIsCustomProvince] = useState(false);
  const [isCustomSellerProvince, setIsCustomSellerProvince] = useState(false);

  // Customer/shipping information
  const [customerInfo, setCustomerInfo] = useState({
    isGuest: true,
    billingFirstName: '',
    billingLastName: '',
    billingAddress1: '',
    billingAddress2: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    billingCountry: 'US',
    shippingFirstName: '',
    shippingLastName: '',
    shippingAddress1: '',
    shippingAddress2: '',
    shippingCity: '',
    shippingState: '',
    shippingPostalCode: '',
    shippingCountry: 'US',
    shippingMethod: '',
    useShippingAsBilling: false,
  });

  // Search and filter states
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState('all');
  const [uomComboboxOpen, setUomComboboxOpen] = useState(false);
  const [existingItemUomOpen, setExistingItemUomOpen] = useState<{[key: number]: boolean}>({});

  // Product selection state for detailed entry
  const [productSelection, setProductSelection] = useState({
    selectedProductId: '',
    selectedVariantId: '',
    quantity: 1,
    customPrice: '',
    weightInput: '',
    weightUnit: 'grams' as 'grams' | 'kg',
    uom: '',
    hsCode: '',
    itemSerialNumber: '',
    sroScheduleNumber: '',
    productName: '',
    productDescription: '',
    taxAmount: 0 as string | number,
    taxPercentage: 0 as string | number,
    priceIncludingTax: 0 as string | number,
    priceExcludingTax: 0 as string | number,
    extraTax: 0 as string | number,
    furtherTax: 0 as string | number,
    fedPayableTax: 0 as string | number,
    discountAmount: 0 as string | number,
    fixedNotifiedValueOrRetailPrice: 0 as string | number,
    saleType: 'Goods at standard rate',
    serialNumber: '',
    listNumber: '',
    bcNumber: '',
    lotNumber: '',
    expiryDate: '',
    disableAutoTaxCalculations: false
  });

  // Loading states
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isTaxCalculating, setIsTaxCalculating] = useState(false);

  // FBR scenario management
  const [isCustomScenario, setIsCustomScenario] = useState(false);

  // Custom field options management
  const [isCustomSroScheduleNumber, setIsCustomSroScheduleNumber] = useState(false);
  const [isCustomItemSerialNumber, setIsCustomItemSerialNumber] = useState(false);
  
  // Custom field options for order items (tracks state per item index)
  const [itemCustomSroScheduleNumber, setItemCustomSroScheduleNumber] = useState<{[key: number]: boolean}>({});
  const [itemCustomItemSerialNumber, setItemCustomItemSerialNumber] = useState<{[key: number]: boolean}>({});

  // FBR preview and confirmation states
  const [fbrPreviewData, setFbrPreviewData] = useState<any>(null);
  const [fbrJsonPreview, setFbrJsonPreview] = useState<any>(null);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [showProductionConfirmation, setShowProductionConfirmation] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  // Sticky sidebar state
  const [isSticky, setIsSticky] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Helper function to format date for FBR
  const formatDateForFbr = (dateString: string): string => {
    if (!dateString) return new Date().toISOString().split('T')[0];
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Helper function to safely format price
  const safeFormatPrice = (price: number | string | undefined | null): string => {
    if (price === null || price === undefined) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  // Generate FBR invoice preview data
  const generateFbrPreview = async () => {
    setGeneratingPreview(true);
    try {
      const totals = calculateTotals();
      
      const orderForPreview = {
        email: orderData.email,
        scenarioId: orderData.scenarioId,
        invoiceType: orderData.invoiceType || 'Sale Invoice',
        invoiceDate: orderData.invoiceDate ? formatDateForFbr(orderData.invoiceDate.toString()) : undefined,
        invoiceRefNo: orderData.invoiceRefNo,
        subtotal: parseFloat(totals.subtotal.toString()),
        totalAmount: parseFloat(totals.total.toString()),
        taxAmount: parseFloat((totals.taxAmount || 0).toString()),
        currency: orderData.currency,
        items: orderItems,
        buyerFirstName: customerInfo.billingFirstName || customerInfo.shippingFirstName || '',
        buyerLastName: customerInfo.billingLastName || customerInfo.shippingLastName || '',
        buyerFullName: orderData.buyerFullName || `${(customerInfo.billingFirstName || customerInfo.shippingFirstName || '').trim()} ${(customerInfo.billingLastName || customerInfo.shippingLastName || '').trim()}`.trim(),
        buyerNTNCNIC: orderData.buyerNTNCNIC || '',
        buyerBusinessName: orderData.buyerBusinessName || '',
        buyerProvince: orderData.buyerProvince || '',
        buyerAddress: orderData.buyerAddress || '',
        buyerRegistrationType: orderData.buyerRegistrationType || '',
        
        // Seller fields
        sellerNTNCNIC: sellerInfo.sellerNTNCNIC || '',
        sellerBusinessName: sellerInfo.sellerBusinessName || '',
        sellerProvince: sellerInfo.sellerProvince || '',
        sellerAddress: sellerInfo.sellerAddress || '',
        fbrSandboxToken: isProductionSubmission ? productionToken : sellerInfo.fbrSandboxToken,
        fbrBaseUrl: sellerInfo.fbrBaseUrl || '',
        isProductionSubmission: isProductionSubmission
      };
      
      // Make preview request to get FBR formatted data
      console.log('🚀 Sending FBR Preview Request:', orderForPreview);
      const response = await fetch('/api/fbr/submit?preview=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderForPreview)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔍 FBR Preview API Response:', result);
        
        const raw = result.fbrInvoice || result;
        // Enhance preview with quantity-adjusted totals for display
        const enhanced = { ...raw } as any;
        
        // Ensure buyer name exists in preview
        const computedBuyerName = (orderData.buyerFullName || `${(customerInfo.billingFirstName || customerInfo.shippingFirstName || '').trim()} ${(customerInfo.billingLastName || customerInfo.shippingLastName || '').trim()}`.trim()) || '';
        if (!enhanced.buyerFullName) enhanced.buyerFullName = computedBuyerName;
        if (!enhanced.buyerFirstName) enhanced.buyerFirstName = customerInfo.billingFirstName || customerInfo.shippingFirstName || '';
        if (!enhanced.buyerLastName) enhanced.buyerLastName = customerInfo.billingLastName || customerInfo.shippingLastName || '';
        
        if (Array.isArray(enhanced.items)) {
          enhanced.items = enhanced.items.map((it: any, idx: number) => {
            const src = orderItems[idx] || {} as any;
            const qty = Number(src.quantity ?? it.quantity ?? 1) || 1;
            const pct = Number(src.taxPercentage ?? it.taxPercentage ?? 0) || 0;
            const unitEx = (() => {
              const ex = Number(src.priceExcludingTax ?? it.priceExcludingTax ?? 0) || 0;
              if (ex > 0) return ex;
              const inc = Number(src.priceIncludingTax ?? it.priceIncludingTax ?? 0) || 0;
              if (inc > 0 && pct > 0) return inc / (1 + pct / 100);
              return Number(src.price ?? it.rate ?? 0) || 0;
            })();
            const unitTax = (() => {
              const t = Number(src.taxAmount ?? it.taxAmount ?? 0) || 0;
              if (t > 0) return t;
              if (pct > 0 && unitEx > 0) return (unitEx * pct) / 100;
              const inc = Number(src.priceIncludingTax ?? it.priceIncludingTax ?? 0) || 0;
              if (inc > 0 && unitEx > 0) return inc - unitEx;
              return 0;
            })();
            const unitInc = Number(src.priceIncludingTax ?? it.priceIncludingTax ?? 0) || (unitEx + unitTax);
            return {
              ...it,
              quantity: qty,
              priceExcludingTaxTotal: unitEx * qty,
              priceIncludingTaxTotal: unitInc * qty,
              salesTaxApplicable: unitTax * qty, // for display
              valueSalesExcludingST: unitEx * qty,
              totalValues: unitInc * qty,
            };
          });
        }
        setFbrPreviewData(enhanced);
        setFbrJsonPreview(enhanced); // Store adjusted JSON for display
      } else {
        const errorText = await response.text();
        console.error('Failed to generate FBR preview:', response.status, response.statusText, errorText);
        setError(`Failed to generate FBR preview: ${response.status} ${response.statusText} - ${errorText}`);
        setFbrPreviewData(null);
        setFbrJsonPreview(null);
      }
      
    } catch (error) {
      console.error('Error generating FBR preview:', error);
      setError(`Failed to generate FBR preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setFbrPreviewData(null);
      setFbrJsonPreview(null);
    } finally {
      setGeneratingPreview(false);
    }
  };

  // Function to preview JSON without submitting
  const handlePreviewJson = () => {
    if (orderItems.length === 0) {
      setError('Please add at least one product to preview JSON');
      // Scroll to error
      setTimeout(() => {
        if (errorRef.current) {
          errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
      return;
    }
    
    setError('');
    generateFbrPreview().then(() => {
      if (fbrPreviewData) {
        setShowJsonPreview(true);
      }
    });
  };

  // Duplicate order handler
  const handleDuplicateOrder = async () => {
    if (!order) {
      setError('No order data available to duplicate');
      return;
    }

    if (!confirm('Are you sure you want to create a duplicate of this order? This will create a new order with a new order number.')) {
      return;
    }

    setDuplicating(true);
    setError('');

    try {
      const response = await fetch(`/api/orders/${orderId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to duplicate order');
      }

      const result = await response.json();
      
      // Redirect to the new duplicated order
      router.push(`/orders/edit/${result.newOrderId}`);
    } catch (err: any) {
      setError(`Failed to duplicate order: ${err.message}`);
      if (errorRef.current) {
        errorRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } finally {
      setDuplicating(false);
    }
  };

  // Helper functions for product management
  const isWeightBasedProduct = (stockManagementType: string) => {
    return stockManagementType === 'weight';
  };

  const convertToGrams = (weight: number, unit: 'grams' | 'kg'): number => {
    return unit === 'kg' ? weight * 1000 : weight;
  };

  const getPricePerGram = (product: Product): number => {
    const pricePerUnit = Number(product.pricePerUnit) || 0;
    if (product.baseWeightUnit === 'kg') {
      return pricePerUnit / 1000;
    }
    return pricePerUnit;
  };

  const calculateTaxAmount = async (priceExcludingTax: number, taxPercentage: number) => {
    if (priceExcludingTax <= 0 || taxPercentage <= 0) {
      return 0;
    }
    setIsTaxCalculating(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const taxAmount = (priceExcludingTax * taxPercentage) / 100;
    const roundedTaxAmount = Math.round(taxAmount * 100) / 100;
    
    setIsTaxCalculating(false);
    return roundedTaxAmount;
  };


  useEffect(() => {
    const id = params.id as string;
    setOrderId(id);
    
    if (id) {
      fetchOrder(id);
    }
    
    fetchProducts();
    fetchCustomers();
    fetchLoyaltySettings();
    fetchSellerInfo();
    fetchFbrSettings();
  }, [params.id]);

  // Auto-run FBR validation 2 seconds after page load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (orderItems.length > 0 && !loading) {
        setFbrValidationLoading(true);
        handleFbrValidation();
        setTimeout(() => {
          setFbrValidationLoading(false);
        }, 500); // Brief delay to show loading state
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [loading, orderItems.length]); // Run when loading is complete and items are available

  // Initialize custom field states based on existing values
  useEffect(() => {
    // Safety check: ensure orderData.items exists and is an array
    if (!orderData.items || !Array.isArray(orderData.items)) {
      return;
    }

    const newItemCustomSroScheduleNumber: {[key: number]: boolean} = {};
    const newItemCustomItemSerialNumber: {[key: number]: boolean} = {};

    orderData.items.forEach((item, index) => {
      // Check if SRO/Schedule Number is a custom value
      if (item.sroScheduleNumber && item.sroScheduleNumber !== 'ICTO TABLE I') {
        newItemCustomSroScheduleNumber[index] = true;
      }
      
      // Check if Item Serial Number is a custom value
      if (item.itemSerialNumber && item.itemSerialNumber !== '19') {
        newItemCustomItemSerialNumber[index] = true;
      }
    });

    setItemCustomSroScheduleNumber(newItemCustomSroScheduleNumber);
    setItemCustomItemSerialNumber(newItemCustomItemSerialNumber);
  }, [orderData.items]);

  // Initialize custom field states for product selection based on existing values
  useEffect(() => {
    // Check if SRO/Schedule Number is a custom value
    if (productSelection.sroScheduleNumber && productSelection.sroScheduleNumber !== 'ICTO TABLE I') {
      setIsCustomSroScheduleNumber(true);
    } else {
      setIsCustomSroScheduleNumber(false);
    }
    
    // Check if Item Serial Number is a custom value
    if (productSelection.itemSerialNumber && productSelection.itemSerialNumber !== '19') {
      setIsCustomItemSerialNumber(true);
    } else {
      setIsCustomItemSerialNumber(false);
    }
  }, [productSelection.sroScheduleNumber, productSelection.itemSerialNumber]);

  // Scroll detection for sticky sidebar
  useEffect(() => {
    const handleScroll = () => {
      if (sidebarContainerRef.current && sidebarRef.current) {
        const containerRect = sidebarContainerRef.current.getBoundingClientRect();
        const shouldStick = containerRect.top <= 24; // 24px offset for top spacing
        setIsSticky(shouldStick);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Populate product selection form when product is selected
  useEffect(() => {
    if (productSelection.selectedProductId && products.length > 0) {
      const product = products.find(p => p.id === productSelection.selectedProductId);
      if (product) {
        setProductSelection(prev => ({
          ...prev,
          hsCode: product.hsCode || '',
          productName: product.name || '',
          productDescription: product.description || product.name || '',
          taxAmount: product.taxAmount || 0,
          taxPercentage: product.taxPercentage || 0,
          priceIncludingTax: product.priceIncludingTax || 0,
          priceExcludingTax: product.priceExcludingTax || 0,
          extraTax: product.extraTax || 0,
          furtherTax: product.furtherTax || 0,
          fedPayableTax: product.fedPayableTax || 0,
          discountAmount: product.discount || 0,
          fixedNotifiedValueOrRetailPrice: 0,
          saleType: 'Goods at standard rate',
          serialNumber: product.serialNumber || '',
          listNumber: product.listNumber || '',
          bcNumber: product.bcNumber || '',
          lotNumber: product.lotNumber || '',
          expiryDate: product.expiryDate || '',
          uom: product.uom || ''
        }));
      }
    }
  }, [productSelection.selectedProductId, products]);

  const fetchOrder = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${id}`);
      if (!response.ok) {
        throw new Error('Order not found');
      }
      
      const orderData = await response.json();
      setOrder(orderData);
      
      // Pre-populate all form data from existing order
      // Standard FBR scenario IDs
      const standardScenarios = [
        'SN001', 'SN002', 'SN003', 'SN004', 'SN005', 'SN006', 'SN007', 'SN008',
        'SN009', 'SN010', 'SN011', 'SN012', 'SN013', 'SN014', 'SN015', 'SN016',
        'SN017', 'SN018', 'SN019', 'SN020', 'SN021', 'SN022', 'SN023', 'SN024',
        'SN025', 'SN026', 'SN027', 'SN028'
      ];
      
      // Check if scenario ID is custom (not in standard list)
      const currentScenarioId = orderData.scenarioId || '';
      const isCustom = currentScenarioId && !standardScenarios.includes(currentScenarioId);
      setIsCustomScenario(isCustom);
      
      // Initialize FBR submission settings from order data
      if (orderData.skipFbrSubmission !== undefined) {
        setSkipFbrSubmission(orderData.skipFbrSubmission);
      }
      if (orderData.isProductionSubmission !== undefined) {
        setIsProductionSubmission(orderData.isProductionSubmission);
      }
      // Production token is now fetched from tenant settings in fetchFbrSettings()
      
      // Initialize province dropdown states
      const predefinedProvinces = ["Punjab", "Sindh", "Khyber Pakhtunkhwa (KPK)", "Balochistan", "Capital Territory", "Azad Jammu & Kashmir (AJK)", "Gilgit-Baltistan (GB)", "N/A"];
      if (orderData.buyerProvince && !predefinedProvinces.includes(orderData.buyerProvince)) {
        setIsCustomProvince(true);
      }

      setOrderData({
        customerId: orderData.userId || '',
        email: orderData.email || '',
        phone: orderData.phone || '',
        status: orderData.status || 'pending',
        paymentStatus: orderData.paymentStatus || 'pending',
        notes: orderData.notes || '',
        shippingAmount: Number(orderData.shippingAmount) || 0,
        taxRate: 0,
        discountAmount: Number(orderData.discountAmount) || 0,
        discountType: 'amount',
        currency: orderData.currency || currentCurrency,
        assignedDriverId: orderData.assignedDriverId || '',
        deliveryStatus: orderData.deliveryStatus || 'pending',
        assignmentType: 'manual',
        pointsToRedeem: Number(orderData.pointsToRedeem) || 0,
        pointsDiscountAmount: Number(orderData.pointsDiscountAmount) || 0,
        useAllPoints: false,
        supplierId: orderData.supplierId || '',
        invoiceType: orderData.invoiceType || 'Sale Invoice',
        invoiceRefNo: orderData.invoiceRefNo || '',
        scenarioId: currentScenarioId,
        invoiceNumber: orderData.invoiceNumber || '',
        invoiceDate: orderData.invoiceDate ? new Date(orderData.invoiceDate) : new Date(),
        validationResponse: orderData.validationResponse || '',
        buyerFullName: orderData.buyerFullName || orderData.user?.name || '',
        buyerNTNCNIC: orderData.buyerNTNCNIC || orderData.user?.buyerNTNCNIC || '',
        buyerBusinessName: orderData.buyerBusinessName || orderData.user?.buyerBusinessName || '',
        buyerProvince: orderData.buyerProvince || orderData.user?.buyerProvince || '',
        buyerAddress: orderData.buyerAddress || orderData.user?.buyerAddress || '',
        buyerRegistrationType: orderData.buyerRegistrationType || orderData.user?.buyerRegistrationType || ''
      });

      // Pre-populate customer information
      setCustomerInfo({
        isGuest: !orderData.userId,
        billingFirstName: orderData.billingFirstName || '',
        billingLastName: orderData.billingLastName || '',
        billingAddress1: orderData.billingAddress1 || '',
        billingAddress2: orderData.billingAddress2 || '',
        billingCity: orderData.billingCity || '',
        billingState: orderData.billingState || '',
        billingPostalCode: orderData.billingPostalCode || '',
        billingCountry: orderData.billingCountry || 'US',
        shippingFirstName: orderData.shippingFirstName || '',
        shippingLastName: orderData.shippingLastName || '',
        shippingAddress1: orderData.shippingAddress1 || '',
        shippingAddress2: orderData.shippingAddress2 || '',
        shippingCity: orderData.shippingCity || '',
        shippingState: orderData.shippingState || '',
        shippingPostalCode: orderData.shippingPostalCode || '',
        shippingCountry: orderData.shippingCountry || 'US',
        shippingMethod: orderData.shippingMethod || '',
        useShippingAsBilling: false,
      });

      // Pre-populate order items
      if (orderData.items) {
        const processedItems = orderData.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          productDescription: item.productDescription,
          variantTitle: item.variantTitle,
          sku: item.sku,
          hsCode: item.hsCode,
          price: Number(item.price),
          quantity: Number(item.quantity),
          totalPrice: Number(item.totalPrice),
          addons: item.addons ? (Array.isArray(item.addons) ? item.addons : JSON.parse(item.addons || '[]')) : [],
          weightQuantity: item.weightQuantity ? Number(item.weightQuantity) : undefined,
          weightUnit: item.weightUnit,
          isWeightBased: item.isWeightBased || (item.weightQuantity && Number(item.weightQuantity) > 0),
          uom: item.uom,
          itemSerialNumber: item.itemSerialNumber,
          sroScheduleNumber: item.sroScheduleNumber,
          serialNumber: item.serialNumber,
          listNumber: item.listNumber,
          bcNumber: item.bcNumber,
          lotNumber: item.lotNumber,
          expiryDate: item.expiryDate,
          taxAmount: Number(item.taxAmount) || 0,
          taxPercentage: Number(item.taxPercentage) || 0,
          priceIncludingTax: Number(item.priceIncludingTax) || 0,
          priceExcludingTax: Number(item.priceExcludingTax) || 0,
          extraTax: Number(item.extraTax) || 0,
          furtherTax: Number(item.furtherTax) || 0,
          fedPayableTax: Number(item.fedPayableTax) || 0,
          discount: Number(item.discount) || 0,
          fixedNotifiedValueOrRetailPrice: Number(item.fixedNotifiedValueOrRetailPrice) || 0,
          saleType: item.saleType,
          disableAutoTaxCalculations: item.disableAutoTaxCalculations || false
        }));
        
        // Sort items by SRO Item Serial No. (FBR) - empty values go to the end
        const sortedItems = sortItemsBySerialNumber(processedItems);
        setOrderItems(sortedItems);
      }

      // Fetch customer points if loyalty is enabled and customer exists
      if (orderData.userId && loyaltySettings.enabled) {
        fetchCustomerPoints(orderData.userId);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        console.log('Raw products data:', data.length, 'products');
        
        // Process products to include variants and addons
        const processedProducts = await Promise.all(
          data.map(async (productItem: any) => {
            const product = {
              ...productItem.product,
              category: productItem.category,
              subcategory: productItem.subcategory,
              supplier: productItem.supplier
            };
            
            // Convert price to number
            product.price = Number(product.price) || 0;
            
            if (product.productType === 'variable') {
              try {
                const variantsRes = await fetch(`/api/product-variants?productId=${product.id}`);
                if (variantsRes.ok) {
                  const variantsData = await variantsRes.json();
                  product.variants = variantsData.map((v: any) => ({
                    ...v.variant,
                    price: Number(v.variant.price) || 0
                  }));
                }
              } catch (err) {
                console.error('Error fetching variants for product', product.id, err);
                product.variants = [];
              }
            } else if (product.productType === 'group') {
              try {
                const addonsRes = await fetch(`/api/product-addons?productId=${product.id}`);
                if (addonsRes.ok) {
                  const addonsData = await addonsRes.json();
                  product.addons = addonsData.map((a: any) => ({
                    ...a,
                    price: Number(a.price) || 0
                  }));
                }
              } catch (err) {
                console.error('Error fetching addons for product', product.id, err);
                product.addons = [];
              }
            }
            
            return product;
          })
        );
        
        console.log('Processed products:', processedProducts.length, 'products');
        setProducts(processedProducts);
      } else {
        console.error('Failed to fetch products, status:', response.status);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        // Filter to only get customers (users with userType 'customer' or null)
        const customers = data.filter((user: any) => 
          user.userType === 'customer' || user.userType === null
        );
        console.log('Customers fetched:', customers.length, 'customers');
        setCustomers(customers);
      } else {
        console.error('Failed to fetch customers, status:', response.status);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const fetchProductsDataBySku = async () => {
    if (orderItems.length === 0) {
      alert('No order items to update');
      return;
    }

    setIsUpdating(true);
    try {
      console.log('Fetching product data for all SKUs...');
      
      const updatedItems = await Promise.all(
        orderItems.map(async (item, index) => {
          if (!item.sku) {
            console.warn(`Item ${index + 1} has no SKU, skipping...`);
            return item;
          }

          try {
            // Fetch product data by SKU
            const response = await fetch(`/api/products?sku=${encodeURIComponent(item.sku)}`);
            if (!response.ok) {
              console.warn(`Failed to fetch product for SKU: ${item.sku}`);
              return item;
            }

            const data = await response.json();
            const productData = data.find((p: any) => p.product?.sku === item.sku)?.product;
            
            if (!productData) {
              console.warn(`No product found for SKU: ${item.sku}`);
              return item;
            }

            console.log(`Updating item with SKU ${item.sku} with fresh data:`, productData);
            console.log(`Current item pricing:`, {
              price: item.price,
              taxPercentage: item.taxPercentage,
              taxAmount: item.taxAmount,
              priceIncludingTax: item.priceIncludingTax,
              priceExcludingTax: item.priceExcludingTax
            });

            // Update item with fresh product data from database
            const basePrice = Number(productData.price) || item.price;
            const taxPercentage = Number(productData.taxPercentage) || Number(item.taxPercentage) || 0;
            const priceIncludingTax = Number(productData.priceIncludingTax) || Number(item.priceIncludingTax) || 0;
            const priceExcludingTax = Number(productData.priceExcludingTax) || Number(item.priceExcludingTax) || 0;
            let taxAmount = Number(productData.taxAmount) || Number(item.taxAmount) || 0;

            // Calculate missing tax fields based on available data
            let calculatedPriceExcludingTax = priceExcludingTax;
            let calculatedPriceIncludingTax = priceIncludingTax;
            let calculatedTaxAmount = taxAmount;

            // If we have price including tax and tax percentage, but missing price excluding tax
            if (priceIncludingTax > 0 && taxPercentage > 0 && !priceExcludingTax) {
              calculatedPriceExcludingTax = priceIncludingTax / (1 + taxPercentage / 100);
              calculatedTaxAmount = priceIncludingTax - calculatedPriceExcludingTax;
            }
            // If we have price excluding tax and tax percentage, but missing other fields
            else if (calculatedPriceExcludingTax > 0 && taxPercentage > 0) {
              calculatedTaxAmount = (calculatedPriceExcludingTax * taxPercentage) / 100;
              calculatedPriceIncludingTax = calculatedPriceExcludingTax + calculatedTaxAmount;
            }
            // If we have base price but no tax calculations, use base price as including tax
            else if (basePrice > 0 && !calculatedPriceIncludingTax && !calculatedPriceExcludingTax) {
              if (taxPercentage > 0) {
                // Assume base price is including tax
                calculatedPriceIncludingTax = basePrice;
                calculatedPriceExcludingTax = basePrice / (1 + taxPercentage / 100);
                calculatedTaxAmount = calculatedPriceIncludingTax - calculatedPriceExcludingTax;
              } else {
                // No tax, price excluding and including are the same
                calculatedPriceExcludingTax = basePrice;
                calculatedPriceIncludingTax = basePrice;
                calculatedTaxAmount = 0;
              }
            }

            // Round calculated values to 2 decimal places
            calculatedPriceExcludingTax = Math.round(calculatedPriceExcludingTax * 100) / 100;
            calculatedPriceIncludingTax = Math.round(calculatedPriceIncludingTax * 100) / 100;
            calculatedTaxAmount = Math.round(calculatedTaxAmount * 100) / 100;

            const updatedItem = {
              ...item,
              productId: productData.id,
              productName: productData.name || item.productName,
              productDescription: productData.description || item.productDescription,
              price: basePrice,
              hsCode: productData.hsCode || item.hsCode,
              uom: productData.uom || item.uom,
              serialNumber: productData.serialNumber || item.serialNumber,
              listNumber: productData.listNumber || item.listNumber,
              bcNumber: productData.bcNumber || item.bcNumber,
              lotNumber: productData.lotNumber || item.lotNumber,
              expiryDate: productData.expiryDate || item.expiryDate,
              taxAmount: calculatedTaxAmount,
              taxPercentage: taxPercentage,
              priceIncludingTax: calculatedPriceIncludingTax,
              priceExcludingTax: calculatedPriceExcludingTax,
              extraTax: Number(productData.extraTax) || Number(item.extraTax) || 0,
              furtherTax: Number(productData.furtherTax) || Number(item.furtherTax) || 0,
              fedPayableTax: Number(productData.fedPayableTax) || Number(item.fedPayableTax) || 0,
              discount: Number(productData.discount) || Number(item.discount) || 0,
              fixedNotifiedValueOrRetailPrice: Number(productData.fixedNotifiedValueOrRetailPrice) || Number(item.fixedNotifiedValueOrRetailPrice) || 0,
              saleType: productData.saleType || item.saleType,
            };

            // Recalculate total price based on price including tax and existing quantity
            updatedItem.totalPrice = calculatedPriceIncludingTax * updatedItem.quantity;

            console.log(`Updated item pricing for SKU ${item.sku}:`, {
              price: updatedItem.price,
              taxPercentage: updatedItem.taxPercentage,
              taxAmount: updatedItem.taxAmount,
              priceIncludingTax: updatedItem.priceIncludingTax,
              priceExcludingTax: updatedItem.priceExcludingTax,
              totalPrice: updatedItem.totalPrice
            });

            return updatedItem;
          } catch (error) {
            console.error(`Error fetching product data for SKU ${item.sku}:`, error);
            return item;
          }
        })
      );

      setOrderItems(updatedItems);
      console.log('Successfully updated all order items with fresh product data');
      
      // Count how many items were actually updated with pricing data
      const itemsWithPricing = updatedItems.filter(item => 
        Number(item.priceIncludingTax || 0) > 0 || Number(item.priceExcludingTax || 0) > 0 || Number(item.taxAmount || 0) > 0
      ).length;
      
      alert(`Successfully updated ${updatedItems.length} order items with fresh product data from database. ${itemsWithPricing} items now have complete pricing information.`);
      
    } catch (error) {
      console.error('Error updating products data:', error);
      alert('Failed to update products data. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchLoyaltySettings = async () => {
    try {
      const response = await fetch('/api/settings/loyalty');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLoyaltySettings({
            enabled: data.settings.loyalty_enabled?.value || false,
            redemptionValue: data.settings.points_redemption_value?.value || 0.01,
            maxRedemptionPercent: data.settings.points_max_redemption_percent?.value || 50,
            redemptionMinimum: data.settings.points_redemption_minimum?.value || 100,
            earningRate: data.settings.points_earning_rate?.value || 1,
            earningBasis: data.settings.points_earning_basis?.value || 'subtotal',
            minimumOrder: data.settings.points_minimum_order?.value || 0
          });
        }
      }
    } catch (err) {
      console.error('Error fetching loyalty settings:', err);
    }
  };

  const fetchSellerInfo = async () => {
    try {
      const response = await fetch('/api/seller-info');
      if (response.ok) {
        const data = await response.json();
        console.log('Seller info fetched:', data);
        setSellerInfo({
          sellerNTNCNIC: data.sellerNTNCNIC || '',
          sellerBusinessName: data.sellerBusinessName || '',
          sellerProvince: data.sellerProvince || '',
          sellerAddress: data.sellerAddress || '',
          fbrSandboxToken: data.fbrSandboxToken || '',
          fbrBaseUrl: data.fbrBaseUrl || ''
        });
        
        // Set custom seller province flag if the loaded province is not in predefined list
        const predefinedSellerProvinces = ["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Capital Territory", "Azad Jammu and Kashmir", "Gilgit-Baltistan", "N/A"];
        if (data.sellerProvince && !predefinedSellerProvinces.includes(data.sellerProvince)) {
          setIsCustomSellerProvince(true);
        }
      } else {
        console.error('Failed to fetch seller info, status:', response.status);
      }
    } catch (err) {
      console.error('Error fetching seller info:', err);
    }
  };

  const fetchFbrSettings = async () => {
    try {
      const response = await fetch('/api/settings/fbr');
      if (response.ok) {
        const data = await response.json();
        console.log('FBR settings fetched:', data);
        if (data.success && data.settings) {
          // Update seller info with FBR settings (only if values exist in settings)
          setSellerInfo(prev => ({
            ...prev,
            fbrSandboxToken: data.settings.fbrSandboxToken || prev.fbrSandboxToken,
            fbrBaseUrl: data.settings.fbrBaseUrl || prev.fbrBaseUrl,
            // Update seller details from FBR settings if available (but preserve existing if not)
            sellerNTNCNIC: data.settings.fbrSellerNTNCNIC || prev.sellerNTNCNIC,
            sellerBusinessName: data.settings.fbrSellerBusinessName || prev.sellerBusinessName,
            sellerProvince: data.settings.fbrSellerProvince || prev.sellerProvince,
            sellerAddress: data.settings.fbrSellerAddress || prev.sellerAddress
          }));
          
          // Set production token
          setProductionToken(data.settings.fbrProductionToken || '');
          console.log('FBR Production token loaded:', data.settings.fbrProductionToken ? '✅ Token found (***' + data.settings.fbrProductionToken.slice(-4) + ')' : '❌ No production token found');
        }
      } else {
        console.error('Failed to fetch FBR settings, status:', response.status);
      }
    } catch (err) {
      console.error('Error fetching FBR settings:', err);
    }
  };

  const fetchCustomerPoints = async (customerId: string) => {
    try {
      const response = await fetch(`/api/loyalty/points?userId=${customerId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCustomerPoints({
            availablePoints: data.points.availablePoints || 0,
            totalPointsEarned: data.points.totalPointsEarned || 0,
            totalPointsRedeemed: data.points.totalPointsRedeemed || 0
          });
        }
      }
    } catch (err) {
      console.error('Error fetching customer points:', err);
    }
  };

  // Customer selection functions
  const handleCustomerSelect = (customer: Customer) => {
    setOrderData(prev => ({
      ...prev,
      customerId: customer.id,
      email: customer.email,
      phone: customer.phone || '',
      buyerFullName: customer.name || '',
      buyerNTNCNIC: customer.buyerNTNCNIC || '',
      buyerBusinessName: customer.buyerBusinessName || '',
      buyerProvince: customer.buyerProvince || '',
      buyerAddress: customer.buyerAddress || '',
      buyerRegistrationType: customer.buyerRegistrationType || ''
    }));
    
    // Set custom province flag if the selected customer's province is not in predefined list
    const predefinedProvinces = ["Punjab", "Sindh", "Khyber Pakhtunkhwa (KPK)", "Balochistan", "Capital Territory", "Azad Jammu & Kashmir (AJK)", "Gilgit-Baltistan (GB)", "N/A"];
    if (customer.buyerProvince && !predefinedProvinces.includes(customer.buyerProvince)) {
      setIsCustomProvince(true);
    } else {
      setIsCustomProvince(false);
    }

    setCustomerInfo(prev => ({
      ...prev,
      isGuest: false,
      billingFirstName: customer.name?.split(' ')[0] || '',
      billingLastName: customer.name?.split(' ').slice(1).join(' ') || '',
      billingAddress1: customer.address || '',
      billingCity: customer.city || '',
      billingState: customer.state || '',
      billingPostalCode: customer.postalCode || '',
      billingCountry: customer.country || 'US'
    }));

    // Set loyalty points from customer data if available
    if (loyaltySettings.enabled && customer.loyaltyPoints) {
      setCustomerPoints({
        availablePoints: customer.loyaltyPoints.availablePoints || 0,
        totalPointsEarned: customer.loyaltyPoints.totalPointsEarned || 0,
        totalPointsRedeemed: customer.loyaltyPoints.totalPointsRedeemed || 0
      });
    } else if (loyaltySettings.enabled) {
      // Fallback to fetching points if not included in customer data
      fetchCustomerPoints(customer.id);
    }

    setCustomerSearchOpen(false);
  };

  // Product search and filter functions
  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name && product.name.toLowerCase().includes(productSearchTerm.toLowerCase())) ||
                         (product.sku && product.sku.toLowerCase().includes(productSearchTerm.toLowerCase()));
    const matchesCategory = selectedProductCategory === 'all' || product.productType === selectedProductCategory;
    return matchesSearch && matchesCategory && product.isActive;
  });

  const productCategories = Array.from(new Set(products.map(p => p.productType).filter(Boolean)));

  // Quick add product to order (from search dropdown)
  const quickAddProductToOrder = (product: Product, variant?: ProductVariant) => {
    setProductSelection({
      selectedProductId: product.id,
      selectedVariantId: variant?.id || '',
      quantity: 1,
      customPrice: '',
      weightInput: '',
      weightUnit: 'grams',
      uom: '',
      hsCode: product.hsCode || '',
      itemSerialNumber: '',
      sroScheduleNumber: '',
      productName: product.name || '',
      productDescription: product.description || product.name || '',
      taxAmount: product.taxAmount || 0,
      taxPercentage: product.taxPercentage || 0,
      priceIncludingTax: product.priceIncludingTax || 0,
      priceExcludingTax: product.priceExcludingTax || 0,
      extraTax: product.extraTax || 0,
      furtherTax: product.furtherTax || 0,
      fedPayableTax: product.fedPayableTax || 0,
      discountAmount: product.discount || 0,
      fixedNotifiedValueOrRetailPrice: 0,
      saleType: 'Goods at standard rate',
      serialNumber: product.serialNumber || '',
      listNumber: product.listNumber || '',
      bcNumber: product.bcNumber || '',
      lotNumber: product.lotNumber || '',
      expiryDate: product.expiryDate || '',
      disableAutoTaxCalculations: false
    });
    setProductSearchOpen(false);
  };

  // Add product with full details
  const handleAddProduct = async () => {
    const { selectedProductId, selectedVariantId, quantity, customPrice, weightInput, weightUnit } = productSelection;
    
    if (!selectedProductId) {
      alert('Please select a product');
      return;
    }

    setIsAddingProduct(true);
    
    try {
      const product = products.find(p => p.id === selectedProductId);
      if (!product) {
        setIsAddingProduct(false);
        return;
      }

      const isWeightBased = isWeightBasedProduct(product.stockManagementType || 'quantity');

      if (isWeightBased) {
        if (!weightInput || parseFloat(weightInput) <= 0) {
          alert('Please enter a valid weight');
          setIsAddingProduct(false);
          return;
        }
      } else {
        if (quantity <= 0) {
          alert('Please enter a valid quantity');
          setIsAddingProduct(false);
          return;
        }
      }

      let variant = null;
      let price = Number(product.price) || 0;
      let productName = product.name;
      let variantTitle = '';
      let sku = product.sku || '';
      let weightInGrams = 0;
      let finalQuantity = quantity;

      if (selectedVariantId && product.variants) {
        variant = product.variants.find(v => v.id === selectedVariantId);
        if (variant) {
          price = Number(variant.price) || 0;
          variantTitle = variant.title;
          sku = variant.sku || sku;
        }
      }

      if (isWeightBased) {
        weightInGrams = convertToGrams(parseFloat(weightInput), weightUnit);
        const pricePerGram = getPricePerGram(product);
        price = calculateWeightBasedPrice(weightInGrams, pricePerGram);
        finalQuantity = 1;
      }

      if (customPrice) {
        price = parseFloat(customPrice);
      }

      const priceIncludingTax = typeof productSelection.priceIncludingTax === 'string' 
        ? parseFloat(productSelection.priceIncludingTax) || 0 
        : productSelection.priceIncludingTax || 0;
      const effectivePrice = priceIncludingTax || price;
      
      // Calculate total price including all taxes and discounts
      let totalPrice = effectivePrice * finalQuantity;
      
      // Add additional taxes and subtract discounts
      const extraTax = Number(productSelection.extraTax) || 0;
      const furtherTax = Number(productSelection.furtherTax) || 0;
      const fedPayableTax = Number(productSelection.fedPayableTax) || 0;
      const discount = Number(productSelection.discountAmount) || 0;
      
      if (extraTax > 0 || furtherTax > 0 || fedPayableTax > 0 || discount > 0) {
        totalPrice += (extraTax + furtherTax + fedPayableTax - discount) * finalQuantity;
      }

      const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      const newItem: OrderItem = {
        id: itemId,
        productId: selectedProductId,
        variantId: selectedVariantId || undefined,
        productName: productSelection.productName || productName,
        productDescription: productSelection.productDescription || undefined,
        variantTitle: variantTitle || undefined,
        sku,
        hsCode: productSelection.hsCode || product.hsCode,
        price,
        quantity: finalQuantity,
        totalPrice,
        addons: [],
        isWeightBased,
        weightQuantity: isWeightBased ? weightInGrams : undefined,
        weightUnit: isWeightBased ? weightUnit : undefined,
        uom: !isWeightBased ? productSelection.uom : undefined,
        itemSerialNumber: productSelection.itemSerialNumber || undefined,
        sroScheduleNumber: productSelection.sroScheduleNumber || undefined,
        serialNumber: productSelection.serialNumber || undefined,
        listNumber: productSelection.listNumber || undefined,
        bcNumber: productSelection.bcNumber || undefined,
        lotNumber: productSelection.lotNumber || undefined,
        expiryDate: productSelection.expiryDate || undefined,
        taxAmount: productSelection.taxAmount || 0,
        taxPercentage: productSelection.taxPercentage || 0,
        priceIncludingTax: productSelection.priceIncludingTax || 0,
        priceExcludingTax: productSelection.priceExcludingTax || 0,
        extraTax: productSelection.extraTax || 0,
        furtherTax: productSelection.furtherTax || 0,
        fedPayableTax: productSelection.fedPayableTax || 0,
        discount: productSelection.discountAmount || 0,
        fixedNotifiedValueOrRetailPrice: productSelection.fixedNotifiedValueOrRetailPrice || 0,
        saleType: productSelection.saleType || 'Goods at standard rate',
        disableAutoTaxCalculations: productSelection.disableAutoTaxCalculations || false
      };

      // Add new item and sort by SRO Item Serial No. (FBR)
      const updatedItems = [...orderItems, newItem];
      const sortedItems = sortItemsBySerialNumber(updatedItems);
      setOrderItems(sortedItems);
      
      // Reset selection
      setProductSelection({
        selectedProductId: '',
        selectedVariantId: '',
        quantity: 1,
        customPrice: '',
        weightInput: '',
        weightUnit: 'grams',
        uom: '',
        hsCode: '',
        itemSerialNumber: '',
        sroScheduleNumber: '',
        productName: '',
        productDescription: '',
        taxAmount: 0,
        taxPercentage: 0,
        priceIncludingTax: 0,
        priceExcludingTax: 0,
        extraTax: 0,
        furtherTax: 0,
        fedPayableTax: 0,
        discountAmount: 0,
        fixedNotifiedValueOrRetailPrice: 0,
        saleType: 'Goods at standard rate',
        serialNumber: '',
        listNumber: '',
        bcNumber: '',
        lotNumber: '',
        expiryDate: '',
        disableAutoTaxCalculations: false
      });
      
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setIsAddingProduct(false);
    }
  };

  // Update order item
  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...orderItems];
    const item = updatedItems[index];
    
    if (field === 'quantity' && item.isWeightBased) {
      // For weight-based products, don't update quantity directly
      return;
    }
    
    if (field === 'weightQuantity' && item.isWeightBased) {
      const weightResult = parseWeightInput(value, item.weightUnit as any || 'grams');
      const weightValue = typeof weightResult === 'number' ? weightResult : (weightResult?.value || 0);
      updatedItems[index] = {
        ...item,
        weightQuantity: weightValue,
        quantity: 1, // Weight-based products always have quantity 1
        totalPrice: calculateWeightBasedPrice(weightValue, item.price)
      };
    } else {
      // Update the field first
      updatedItems[index] = { ...item, [field]: value };
      const updatedItem = updatedItems[index];
      
      // Handle different field updates
      if (field === 'quantity') {
        // When quantity changes, only recalculate total price (keep per-unit values the same)
        const quantity = updatedItem.quantity;
        const unitPriceIncludingTax = Number(updatedItem.priceIncludingTax) || updatedItem.price;
        const extraTax = Number(updatedItem.extraTax) || 0;
        const furtherTax = Number(updatedItem.furtherTax) || 0;
        const fedPayableTax = Number(updatedItem.fedPayableTax) || 0;
        const discount = Number(updatedItem.discount) || 0;
        
        // Calculate total price = (unit price + per-unit taxes - per-unit discount) × quantity
        updatedItems[index].totalPrice = (unitPriceIncludingTax + extraTax + furtherTax + fedPayableTax - discount) * quantity;
        
      } else if (field === 'price' || field === 'priceIncludingTax' || field === 'priceExcludingTax' || field === 'taxPercentage' || field === 'taxAmount') {
        // When tax/price fields change, recalculate related per-unit values and total
        const quantity = updatedItem.quantity;
        const basePrice = updatedItem.price;
        const priceExcludingTax = Number(updatedItem.priceExcludingTax) || 0;
        const priceIncludingTax = Number(updatedItem.priceIncludingTax) || 0;
        const taxPercentage = Number(updatedItem.taxPercentage) || 0;
        
        // Auto-calculate missing per-unit values based on what was changed (only if auto calculations are enabled for this item)
        if (!Boolean(updatedItem.disableAutoTaxCalculations)) {
          if (field === 'taxPercentage' && priceExcludingTax > 0) {
            // Calculate tax amount and price including tax from percentage
            const calculatedTaxAmount = (priceExcludingTax * taxPercentage) / 100;
            const calculatedPriceIncludingTax = priceExcludingTax + calculatedTaxAmount;
            updatedItems[index].taxAmount = calculatedTaxAmount;
            updatedItems[index].priceIncludingTax = calculatedPriceIncludingTax;
          } else if (field === 'priceExcludingTax' && taxPercentage > 0) {
            // Calculate tax amount and price including tax from excluding price
            const calculatedTaxAmount = (priceExcludingTax * taxPercentage) / 100;
            const calculatedPriceIncludingTax = priceExcludingTax + calculatedTaxAmount;
            updatedItems[index].taxAmount = calculatedTaxAmount;
            updatedItems[index].priceIncludingTax = calculatedPriceIncludingTax;
          } else if (field === 'priceIncludingTax' && taxPercentage > 0) {
            // Calculate price excluding tax and tax amount from including price
            const calculatedPriceExcludingTax = priceIncludingTax / (1 + taxPercentage / 100);
            const calculatedTaxAmount = priceIncludingTax - calculatedPriceExcludingTax;
            updatedItems[index].priceExcludingTax = calculatedPriceExcludingTax;
            updatedItems[index].taxAmount = calculatedTaxAmount;
          } else if (field === 'priceIncludingTax' && priceExcludingTax > 0) {
            // If no tax percentage, calculate it from the price difference
            const calculatedTaxAmount = priceIncludingTax - priceExcludingTax;
            const calculatedTaxPercentage = priceExcludingTax > 0 ? (calculatedTaxAmount / priceExcludingTax) * 100 : 0;
            updatedItems[index].taxAmount = calculatedTaxAmount;
            updatedItems[index].taxPercentage = calculatedTaxPercentage;
          } else if (field === 'priceExcludingTax' && priceIncludingTax > 0) {
            // If no tax percentage, calculate it from the price difference
            const calculatedTaxAmount = priceIncludingTax - priceExcludingTax;
            const calculatedTaxPercentage = priceExcludingTax > 0 ? (calculatedTaxAmount / priceExcludingTax) * 100 : 0;
            updatedItems[index].taxAmount = calculatedTaxAmount;
            updatedItems[index].taxPercentage = calculatedTaxPercentage;
          }
        }
        
        // Recalculate total price with updated per-unit values
        const finalUnitPriceIncludingTax = Number(updatedItems[index].priceIncludingTax) || basePrice;
        const extraTax = Number(updatedItem.extraTax) || 0;
        const furtherTax = Number(updatedItem.furtherTax) || 0;
        const fedPayableTax = Number(updatedItem.fedPayableTax) || 0;
        const discount = Number(updatedItem.discount) || 0;
        
        updatedItems[index].totalPrice = (finalUnitPriceIncludingTax + extraTax + furtherTax + fedPayableTax - discount) * quantity;
      }
      
      // Special handling for additional tax fields - recalculate total when they change
      if (field === 'extraTax' || field === 'furtherTax' || field === 'fedPayableTax' || field === 'discount') {
        const quantity = updatedItem.quantity;
        const effectivePrice = Number(updatedItem.priceIncludingTax) || updatedItem.price;
        const extraTax = Number(updatedItem.extraTax) || 0;
        const furtherTax = Number(updatedItem.furtherTax) || 0;
        const fedPayableTax = Number(updatedItem.fedPayableTax) || 0;
        const discount = Number(updatedItem.discount) || 0;
        
        // Calculate total with all taxes and discounts
        updatedItems[index].totalPrice = (effectivePrice + extraTax + furtherTax + fedPayableTax - discount) * quantity;
      }
    }
    
    // If serialNumber was updated, sort the items to maintain order
    if (field === 'serialNumber') {
      const sortedItems = sortItemsBySerialNumber(updatedItems);
      setOrderItems(sortedItems);
    } else {
      setOrderItems(updatedItems);
    }
  };

  // Remove order item
  const removeOrderItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => {
      let itemTotal = item.totalPrice;
      
      // Add addon costs
      if (item.addons && item.addons.length > 0) {
        const addonTotal = item.addons.reduce((addonSum, addon) => 
          addonSum + (addon.price * addon.quantity), 0
        );
        itemTotal += addonTotal * item.quantity;
      }
      
      return sum + itemTotal;
    }, 0);

    const discountAmount = orderData.discountType === 'percentage' 
      ? (subtotal * orderData.discountAmount / 100)
      : orderData.discountAmount;

    const pointsDiscountAmount = orderData.pointsDiscountAmount || 0;
    const taxAmount = (subtotal - discountAmount - pointsDiscountAmount) * (orderData.taxRate / 100);
    const total = subtotal + taxAmount + orderData.shippingAmount - discountAmount - pointsDiscountAmount;

    return {
      subtotal,
      taxAmount,
      discountAmount,
      pointsDiscountAmount,
      total: Math.max(0, total)
    };
  };

  // Points redemption functions
  const handlePointsRedemption = (pointsToRedeem: number) => {
    if (pointsToRedeem < 0) pointsToRedeem = 0;
    if (pointsToRedeem > customerPoints.availablePoints) {
      pointsToRedeem = customerPoints.availablePoints;
    }

    // Calculate discount amount based on points
    const discountAmount = pointsToRedeem * loyaltySettings.redemptionValue;
    
    // Get current totals to check max redemption limit
    const { subtotal } = calculateTotals();
    const currentDiscount = orderData.discountAmount || 0;
    const maxAllowedDiscount = (subtotal - currentDiscount) * (loyaltySettings.maxRedemptionPercent / 100);
    
    const finalDiscountAmount = Math.min(discountAmount, maxAllowedDiscount);
    const finalPointsToRedeem = Math.floor(finalDiscountAmount / loyaltySettings.redemptionValue);

    setOrderData(prev => ({
      ...prev,
      pointsToRedeem: finalPointsToRedeem,
      pointsDiscountAmount: finalDiscountAmount,
      useAllPoints: false
    }));
  };

  const handleUseAllPoints = () => {
    if (orderData.useAllPoints) {
      // Turn off - clear points
      setOrderData(prev => ({
        ...prev,
        pointsToRedeem: 0,
        pointsDiscountAmount: 0,
        useAllPoints: false
      }));
    } else {
      // Turn on - use maximum allowed points
      const { subtotal } = calculateTotals();
      const currentDiscount = orderData.discountAmount || 0;
      const maxAllowedDiscount = (subtotal - currentDiscount) * (loyaltySettings.maxRedemptionPercent / 100);
      const maxPointsDiscount = customerPoints.availablePoints * loyaltySettings.redemptionValue;
      
      const finalDiscountAmount = Math.min(maxAllowedDiscount, maxPointsDiscount);
      const finalPointsToRedeem = Math.floor(finalDiscountAmount / loyaltySettings.redemptionValue);

      setOrderData(prev => ({
        ...prev,
        pointsToRedeem: finalPointsToRedeem,
        pointsDiscountAmount: finalDiscountAmount,
        useAllPoints: true
      }));
    }
  };

  // Sort items by SRO Item Serial No. (FBR) - serialNumber field
  const sortItemsBySerialNumber = (items: OrderItem[]) => {
    return items.sort((a, b) => {
      const aSerial = a.serialNumber || '';
      const bSerial = b.serialNumber || '';
      
      // If both are empty, maintain original order
      if (!aSerial && !bSerial) return 0;
      // Empty values go to the end
      if (!aSerial) return 1;
      if (!bSerial) return -1;
      
      // Compare serial numbers (alphanumeric sort)
      return aSerial.localeCompare(bSerial, undefined, { numeric: true, sensitivity: 'base' });
    });
  };

  // Validate and format HS codes for FBR compliance
  const handleFbrValidation = () => {
    const updatedItems = orderItems.map(item => {
      if (item.hsCode && item.hsCode.trim()) {
        let hsCode = item.hsCode.trim();
        
        // Check if it already has 4 digits after decimal
        const parts = hsCode.split('.');
        if (parts.length === 2) {
          const decimalPart = parts[1];
          if (decimalPart.length < 4) {
            // Pad with zeros to make it 4 digits
            const paddedDecimal = decimalPart.padEnd(4, '0');
            hsCode = `${parts[0]}.${paddedDecimal}`;
          }
        } else if (parts.length === 1) {
          // No decimal point, add .0000
          hsCode = `${hsCode}.0000`;
        }
        
        return { ...item, hsCode };
      }
      return item;
    });
    
    setOrderItems(updatedItems);
    
    // Show success message
    const updatedCount = updatedItems.filter((item, index) => 
      item.hsCode !== orderItems[index].hsCode
    ).length;
    
    if (updatedCount > 0) {
      //alert(`✅ FBR Validation Complete! Updated ${updatedCount} HS code${updatedCount > 1 ? 's' : ''} for FBR compliance.`);
    } else {
      //alert('ℹ️ All HS codes are already in correct FBR format.');
    }
  };

  // Submit order update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (orderItems.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }
    
    // Validate production token if production mode is enabled
    if (isProductionSubmission && !skipFbrSubmission && !productionToken.trim()) {
      setError('Please provide production environment token');
      return;
    }

    // Generate FBR preview data if FBR submission is not skipped
    if (!skipFbrSubmission) {
      await generateFbrPreview();
    }
    
    // Show appropriate confirmation dialog
    if (isProductionSubmission && !skipFbrSubmission) {
      setShowProductionConfirmation(true);
    } else {
      setShowOrderConfirmation(true);
    }
  };

  // Actual order update function (called from confirmation dialogs)
  const updateOrder = async () => {
    setSubmitting(true);
    setError('');

    try {
      const { subtotal, taxAmount, total } = calculateTotals();

      const orderPayload = {
        ...orderData,
        items: orderItems,
        subtotal,
        taxAmount,
        totalAmount: total,
        currency: currentCurrency,
        
        // Billing address
        billingFirstName: customerInfo.billingFirstName,
        billingLastName: customerInfo.billingLastName,
        billingAddress1: customerInfo.billingAddress1,
        billingAddress2: customerInfo.billingAddress2,
        billingCity: customerInfo.billingCity,
        billingState: customerInfo.billingState,
        billingPostalCode: customerInfo.billingPostalCode,
        billingCountry: customerInfo.billingCountry,
        
        // Shipping address
        shippingFirstName: customerInfo.sameAsBilling ? customerInfo.billingFirstName : customerInfo.shippingFirstName,
        shippingLastName: customerInfo.sameAsBilling ? customerInfo.billingLastName : customerInfo.shippingLastName,
        shippingAddress1: customerInfo.sameAsBilling ? customerInfo.billingAddress1 : customerInfo.shippingAddress1,
        shippingAddress2: customerInfo.sameAsBilling ? customerInfo.billingAddress2 : customerInfo.shippingAddress2,
        shippingCity: customerInfo.sameAsBilling ? customerInfo.billingCity : customerInfo.shippingCity,
        shippingState: customerInfo.sameAsBilling ? customerInfo.billingState : customerInfo.shippingState,
        shippingPostalCode: customerInfo.sameAsBilling ? customerInfo.billingPostalCode : customerInfo.shippingPostalCode,
        shippingCountry: customerInfo.sameAsBilling ? customerInfo.billingCountry : customerInfo.shippingCountry,
        
        // Buyer fields (from selected customer)
        buyerNTNCNIC: orderData.buyerNTNCNIC || null,
        buyerBusinessName: orderData.buyerBusinessName || null,
        buyerProvince: orderData.buyerProvince || null,
        buyerAddress: orderData.buyerAddress || null,
        buyerRegistrationType: orderData.buyerRegistrationType || null,
        buyerFirstName: customerInfo.billingFirstName || customerInfo.shippingFirstName || null,
        buyerLastName: customerInfo.billingLastName || customerInfo.shippingLastName || null,
        buyerFullName: `${(customerInfo.billingFirstName || customerInfo.shippingFirstName || '').trim()} ${(customerInfo.billingLastName || customerInfo.shippingLastName || '').trim()}`.trim(),
        
        // Seller fields (for FBR Digital Invoicing)
        sellerNTNCNIC: sellerInfo.sellerNTNCNIC || null,
        sellerBusinessName: sellerInfo.sellerBusinessName || null,
        sellerProvince: sellerInfo.sellerProvince || null,
        sellerAddress: sellerInfo.sellerAddress || null,
        fbrSandboxToken: sellerInfo.fbrSandboxToken || null,
        fbrBaseUrl: sellerInfo.fbrBaseUrl || null,
        
        // Email and FBR submission control flags
        skipCustomerEmail,
        skipSellerEmail,
        skipFbrSubmission,
        
        // Production environment fields
        isProductionSubmission,
        productionToken: isProductionSubmission ? productionToken : undefined,
        isCustomScenario,
        isCustomProvince,
        isCustomSellerProvince
      };

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        const data = await response.json();
        
        // Handle FBR-specific errors with more detail (same as add order page)
        if (data.step === 'fbr_validation' || data.step === 'fbr_connection') {
          let errorMessage = data.error || 'FBR Digital Invoice submission failed';
          
          // Show detailed FBR validation errors
          if (data.fbrError?.response?.validationResponse?.invoiceStatuses) {
            const itemErrors = data.fbrError.response.validationResponse.invoiceStatuses
              .filter((status: any) => status.error)
              .map((status: any) => `• Item ${status.itemSNo}: ${status.error}`)
              .join('\n');
            
            if (itemErrors) {
              //errorMessage += '\n\nValidation Details:\n' + itemErrors;
            }
          }
          
          throw new Error(errorMessage);
        }
        
        throw new Error(data.error || 'Failed to update order');
      }

      const result = await response.json();
      
      // Close confirmation dialogs
      setShowOrderConfirmation(false);
      setShowProductionConfirmation(false);
      
      // Show success message and redirect to invoice page if FBR invoice was generated
      if (result.fbrInvoiceNumber) {
        console.log('✅ Order updated with FBR Digital Invoice:', {
          orderNumber: result.orderNumber,
          fbrInvoiceNumber: result.fbrInvoiceNumber,
          orderId: result.orderId || orderId
        });
        
        // Redirect to invoice page like add order does
        router.push(`/orders/${result.orderId || orderId}/invoice`);
      } else {
        console.log('✅ Order updated successfully (no FBR submission):', {
          orderNumber: result.orderNumber,
          orderId: result.orderId || orderId
        });
        
        // Redirect to order detail page 
        router.push(`/orders/${result.orderId || orderId}`);
      }
    } catch (err: any) {
      setError(err.message);
      if (errorRef.current) {
        errorRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      
      // Close confirmation dialogs on error too
      setShowOrderConfirmation(false);
      setShowProductionConfirmation(false);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: any) => {
    const numAmount = Number(amount);
    
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

  if (loading) return <div className="p-8 text-center">Loading order...</div>;
  if (error && !order) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!order) return <div className="p-8 text-center">Order not found</div>;

  const totals = calculateTotals();

  return (
    <div className="p-4 max-w-8xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">✏️ Edit Order #{order.orderNumber}</h1>
          <div className="text-sm text-gray-500">Order ID: {order.id}</div>
          {order.fbrEnvironment && (
            <div className="text-sm">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                order.fbrEnvironment === 'production' 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {order.fbrEnvironment === 'production' ? '🚨 Production' : '🧪 Sandbox'} FBR
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/orders/${order.id}/invoice`)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            📄 View Invoice
          </button>
          <button
            onClick={handleDuplicateOrder}
            disabled={duplicating}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {duplicating ? (
              <>
                <Loader className="inline mr-2 h-4 w-4 animate-spin" />
                Duplicating...
              </>
            ) : (
              '📋 Make a Duplicate'
            )}
          </button>
          <button
            onClick={() => router.push('/orders')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            ← Back to Orders
          </button>
        </div>
      </div>

      {error && (
        <div ref={errorRef} className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {fbrValidationLoading && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded flex items-center">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
          Auto-validating FBR data...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="customerType"
                      checked={customerInfo.isGuest}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCustomerInfo({...customerInfo, isGuest: true});
                          setOrderData({...orderData, customerId: ''});
                        }
                      }}
                    />
                    <span>Guest Customer</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="customerType"
                      checked={!customerInfo.isGuest}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCustomerInfo({...customerInfo, isGuest: false});
                        }
                      }}
                    />
                    <span>Existing Customer</span>
                  </label>
                </div>

                {!customerInfo.isGuest && (
                  <div className="space-y-4">
                    <div>
                      <Label>Select Customer</Label>
                      <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={customerSearchOpen}
                            className="w-full justify-between"
                          >
                            {orderData.customerId 
                              ? (() => {
                                  const customer = customers.find(c => c.id === orderData.customerId);
                                  return customer ? (customer.name || customer.phone || customer.email) : `Customer ID: ${orderData.customerId}`;
                                })()
                              : "Select customer..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search customers by name, phone, or email..."
                              value={customerSearchTerm}
                              onValueChange={setCustomerSearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {customers.length === 0 ? 'No customers found. Loading...' : 'No customers match your search.'}
                              </CommandEmpty>
                              <CommandGroup>
                                {customers
                                  .filter(customer => {
                                    if (!customerSearchTerm) return true;
                                    return customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                                           customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                                           customer.phone?.toLowerCase().includes(customerSearchTerm.toLowerCase());
                                  })
                                  .map((customer) => (
                                    <CommandItem
                                      key={customer.id}
                                      onSelect={() => handleCustomerSelect(customer)}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          orderData.customerId === customer.id ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      <div>
                                        <div className="font-medium">{customer.name || customer.phone || customer.email}</div>
                                        <div className="text-sm text-gray-500">{customer.phone || customer.email}</div>
                                        {customer.phone && customer.email && (
                                          <div className="text-xs text-gray-400">{customer.email}</div>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="text-xs text-gray-500">
                      {customers.length > 0 ? `${customers.length} customers available` : 'Loading customers...'}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={orderData.email}
                      onChange={(e) => setOrderData({...orderData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={orderData.phone}
                      onChange={(e) => setOrderData({...orderData, phone: e.target.value})}
                    />
                  </div>
                </div>

                {/* Buyer Information for FBR */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Buyer Information (FBR)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="buyerFullName">Name</Label>
                      <Input
                        id="buyerFullName"
                        value={orderData.buyerFullName}
                        onChange={(e) => setOrderData({...orderData, buyerFullName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="buyerNTNCNIC">NTN/CNIC</Label>
                      <Input
                        id="buyerNTNCNIC"
                        value={orderData.buyerNTNCNIC}
                        onChange={(e) => setOrderData({...orderData, buyerNTNCNIC: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="buyerBusinessName">Business Name</Label>
                      <Input
                        id="buyerBusinessName"
                        value={orderData.buyerBusinessName}
                        onChange={(e) => setOrderData({...orderData, buyerBusinessName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="buyer-registration-type">Registration Type</Label>
                      <Select value={orderData.buyerRegistrationType} onValueChange={(value) => setOrderData({...orderData, buyerRegistrationType: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Registration Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Registered">Registered</SelectItem>
                          <SelectItem value="Unregistered">Unregistered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="buyer-province">Province</Label>
                      <div className="space-y-2">
                        <Select 
                          value={
                            isCustomProvince ? "custom" :
                            ["Punjab", "Sindh", "Khyber Pakhtunkhwa (KPK)", "Balochistan", "Capital Territory", "Azad Jammu & Kashmir (AJK)", "Gilgit-Baltistan (GB)", "N/A"].includes(orderData.buyerProvince || "")
                              ? orderData.buyerProvince 
                              : ""
                          } 
                          onValueChange={(value) => {
                            if (value === "custom") {
                              setIsCustomProvince(true);
                              setOrderData({...orderData, buyerProvince: ""});
                            } else {
                              setIsCustomProvince(false);
                              setOrderData({...orderData, buyerProvince: value});
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Province" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Punjab">Punjab</SelectItem>
                            <SelectItem value="Sindh">Sindh</SelectItem>
                            <SelectItem value="Khyber Pakhtunkhwa (KPK)">Khyber Pakhtunkhwa (KPK)</SelectItem>
                            <SelectItem value="Balochistan">Balochistan</SelectItem>
                            <SelectItem value="Capital Territory">Capital Territory</SelectItem>
                            <SelectItem value="Azad Jammu & Kashmir (AJK)">Azad Jammu & Kashmir (AJK)</SelectItem>
                            <SelectItem value="Gilgit-Baltistan (GB)">Gilgit-Baltistan (GB)</SelectItem>
                            <SelectItem value="N/A">N/A</SelectItem>
                            <SelectItem value="custom">Custom Province...</SelectItem>
                          </SelectContent>
                        </Select>
                        {isCustomProvince && (
                          <Input
                            placeholder="Enter custom province"
                            value={orderData.buyerProvince || ""}
                            onChange={(e) => setOrderData({...orderData, buyerProvince: e.target.value})}
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="buyerAddress">Address</Label>
                      <Input
                        id="buyerAddress"
                        value={orderData.buyerAddress}
                        onChange={(e) => setOrderData({...orderData, buyerAddress: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Products */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <PackagePlus className="h-5 w-5" />
                    Order Items
                  </CardTitle>
                  <Button 
                    onClick={fetchProductsDataBySku}
                    variant="outline" 
                    size="sm"
                    disabled={orderItems.length === 0 || isUpdating}
                    className="gap-2"
                  >
                    {isUpdating ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <PackagePlus className="h-4 w-4" />
                    )}
                    Fetch Products Data by SKU
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      Add Product <Plus className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <div className="flex items-center border-b px-3">
                        <CommandInput
                          placeholder="Search products..."
                          value={productSearchTerm}
                          onValueChange={setProductSearchTerm}
                          className="flex-1"
                        />
                        <Select value={selectedProductCategory} onValueChange={setSelectedProductCategory}>
                          <SelectTrigger className="w-[180px] ml-2">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {productCategories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <CommandList>
                        <CommandEmpty>
                          {products.length === 0 ? 'Loading products...' : 'No products match your search.'}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredProducts.map((product) => (
                            <div key={product.id}>
                              <CommandItem onSelect={() => quickAddProductToOrder(product)}>
                                <div className="flex-1">
                                  <div className="font-medium">{product.name || 'Unnamed Product'}</div>
                                  <div className="text-sm text-gray-500">
                                    {formatCurrency(product.price)} • {product.productType || 'No Category'}
                                    {product.sku && ` • SKU: ${product.sku}`}
                                  </div>
                                </div>
                              </CommandItem>
                              {product.variants && product.variants.length > 0 && (
                                <div className="ml-4 border-l border-gray-200">
                                  {product.variants.filter(v => v.isActive).map((variant) => (
                                    <CommandItem
                                      key={variant.id}
                                      onSelect={() => quickAddProductToOrder(product, variant)}
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">↳ {variant.title}</div>
                                        <div className="text-xs text-gray-500">
                                          {formatCurrency(variant.price)}
                                          {variant.sku && ` • SKU: ${variant.sku}`}
                                          • Stock: {variant.inventoryQuantity}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Product & Tax Details Form */}
                {productSelection.selectedProductId && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">📋 Product & Tax Details (Editable)</CardTitle>
                      <CardDescription>
                        These values are pre-populated from the product but can be modified before adding to the order.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Basic Product Fields */}
                      <div>
                        <h5 className="text-sm font-medium mb-3 text-muted-foreground">Product Information</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="product-name-edit" className="text-sm">Product Name</Label>
                            <Input
                              id="product-name-edit"
                              type="text"
                              value={productSelection.productName}
                              onChange={(e) => setProductSelection({...productSelection, productName: e.target.value})}
                              placeholder="Product name"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="quantity-edit" className="text-sm">Quantity</Label>
                            <Input
                              id="quantity-edit"
                              type="number"
                              min="1"
                              value={productSelection.quantity}
                              onChange={(e) => setProductSelection({...productSelection, quantity: parseInt(e.target.value) || 1})}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="custom-price-edit" className="text-sm">Custom Price (Optional)</Label>
                            <Input
                              id="custom-price-edit"
                              type="text"
                              value={productSelection.customPrice}
                              onChange={(e) => setProductSelection({...productSelection, customPrice: e.target.value})}
                              placeholder="Override product price"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="uom-edit" className="text-sm">Unit of Measurement (UOM)</Label>
                            <div className="flex gap-2">
                              <Popover open={uomComboboxOpen} onOpenChange={setUomComboboxOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={uomComboboxOpen}
                                    className="justify-between text-sm flex-1"
                                  >
                                    {(() => {
                                      const uomOptions = ["MT", "Bill of lading", "SET", "KWH", "40KG", "Liter", "SqY", "Bag", "KG", "MMBTU", "Meter", "Pcs", "Carat", "Cubic Metre", "Dozen", "Gram", "Gallon", "Kilogram", "Pound", "Timber Logs", "Numbers, pieces, units", "Packs", "Pair", "Square Foot", "Square Metre", "Thousand Unit", "Mega Watt", "Foot", "Barrels", "NO", "1000 kWh"];
                                      const isCustomUom = productSelection.uom && !uomOptions.includes(productSelection.uom);
                                      return productSelection.uom && uomOptions.includes(productSelection.uom)
                                        ? productSelection.uom
                                        : isCustomUom 
                                          ? "Others"
                                          : productSelection.uom
                                            ? "Others"
                                            : "Select UOM...";
                                    })()}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                                  <Command>
                                    <CommandInput placeholder="Search UOM..." />
                                    <CommandList className="h-[200px]">
                                      <CommandEmpty>No UOM found.</CommandEmpty>
                                      <CommandGroup>
                                        {["MT", "Bill of lading", "SET", "KWH", "40KG", "Liter", "SqY", "Bag", "KG", "MMBTU", "Meter", "Pcs", "Carat", "Cubic Metre", "Dozen", "Gram", "Gallon", "Kilogram", "Pound", "Timber Logs", "Numbers, pieces, units", "Packs", "Pair", "Square Foot", "Square Metre", "Thousand Unit", "Mega Watt", "Foot", "Barrels", "NO", "1000 kWh", "Others (custom)"].map((uom) => (
                                          <CommandItem
                                            key={uom}
                                            value={uom}
                                            onSelect={() => {
                                              if (uom === "Others (custom)") {
                                                setProductSelection({...productSelection, uom: ""});
                                              } else {
                                                setProductSelection({...productSelection, uom: uom});
                                              }
                                              setUomComboboxOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 ${productSelection.uom === uom ? "opacity-100" : "opacity-0"}`}
                                            />
                                            {uom}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              {(() => {
                                const uomOptions = ["MT", "Bill of lading", "SET", "KWH", "40KG", "Liter", "SqY", "Bag", "KG", "MMBTU", "Meter", "Pcs", "Carat", "Cubic Metre", "Dozen", "Gram", "Gallon", "Kilogram", "Pound", "Timber Logs", "Numbers, pieces, units", "Packs", "Pair", "Square Foot", "Square Metre", "Thousand Unit", "Mega Watt", "Foot", "Barrels", "NO", "1000 kWh"];
                                const isCustomUom = productSelection.uom && !uomOptions.includes(productSelection.uom);
                                const showCustomInput = productSelection.uom === "" || isCustomUom || (productSelection.uom && !uomOptions.includes(productSelection.uom));
                                return showCustomInput && (
                                  <Input
                                    className="flex-1 text-sm"
                                    type="text"
                                    value={isCustomUom || (productSelection.uom && !uomOptions.includes(productSelection.uom)) ? productSelection.uom : ""}
                                    onChange={(e) => setProductSelection({...productSelection, uom: e.target.value})}
                                    placeholder="Enter custom UOM"
                                  />
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tax Calculation Fields */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium text-muted-foreground">Tax & Pricing Details</h5>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="disable-auto-tax-product-selection"
                              checked={Boolean(productSelection.disableAutoTaxCalculations)}
                              onChange={(e) => setProductSelection({...productSelection, disableAutoTaxCalculations: e.target.checked})}
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <Label htmlFor="disable-auto-tax-product-selection" className="text-xs text-muted-foreground cursor-pointer">
                              Disable automatic tax calculations
                            </Label>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="price-excluding-tax-edit" className="text-sm">Price Excluding Tax</Label>
                            <Input
                              id="price-excluding-tax-edit"
                              type="text"
                              value={productSelection.priceExcludingTax === 0 ? '' : productSelection.priceExcludingTax.toString()}
                              onChange={async (e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  const priceExcludingTax = value === '' ? 0 : parseFloat(value) || 0;
                                  setProductSelection(prev => ({...prev, priceExcludingTax: priceExcludingTax}));
                                  
                                  if (!productSelection.disableAutoTaxCalculations && !value.endsWith('.') && value !== '' && Number(productSelection.taxPercentage) > 0) {
                                    const taxPercentageNum = parseFloat(productSelection.taxPercentage.toString());
                                    const calculatedTaxAmount = await calculateTaxAmount(priceExcludingTax, taxPercentageNum);
                                    const calculatedPriceIncludingTax = priceExcludingTax + calculatedTaxAmount;
                                    setProductSelection(prev => ({
                                      ...prev, 
                                      taxAmount: calculatedTaxAmount,
                                      priceIncludingTax: Math.round(calculatedPriceIncludingTax * 100) / 100
                                    }));
                                  } else if (!productSelection.disableAutoTaxCalculations && !value.endsWith('.') && value !== '' && Number(productSelection.priceIncludingTax) > 0) {
                                    // If no tax percentage but we have price including tax, calculate tax percentage
                                    const priceIncludingTaxNum = Number(productSelection.priceIncludingTax);
                                    const calculatedTaxAmount = priceIncludingTaxNum - priceExcludingTax;
                                    const calculatedTaxPercentage = priceExcludingTax > 0 ? (calculatedTaxAmount / priceExcludingTax) * 100 : 0;
                                    setProductSelection(prev => ({
                                      ...prev, 
                                      taxAmount: calculatedTaxAmount,
                                      taxPercentage: Math.round(calculatedTaxPercentage * 100) / 100
                                    }));
                                  }
                                }
                              }}
                              placeholder="Enter price"
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="tax-percentage-edit" className="text-sm">
                              Tax Percentage {isTaxCalculating && <span className="text-blue-500">(Calculating...)</span>}
                            </Label>
                            <Input
                              id="tax-percentage-edit"
                              type="text"
                              value={productSelection.taxPercentage === 0 ? '' : productSelection.taxPercentage.toString()}
                              onChange={async (e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  const taxPercentage = value === '' ? 0 : parseFloat(value) || 0;
                                  setProductSelection(prev => ({...prev, taxPercentage: value === '' ? 0 : value}));
                                  
                                  if (!productSelection.disableAutoTaxCalculations && taxPercentage > 0 && Number(productSelection.priceExcludingTax) > 0 && !value.endsWith('.')) {
                                    const priceExcludingTaxNum = parseFloat(productSelection.priceExcludingTax.toString());
                                    const calculatedTaxAmount = await calculateTaxAmount(priceExcludingTaxNum, taxPercentage);
                                    const calculatedPriceIncludingTax = priceExcludingTaxNum + calculatedTaxAmount;
                                    setProductSelection(prev => ({
                                      ...prev, 
                                      taxAmount: calculatedTaxAmount,
                                      priceIncludingTax: Math.round(calculatedPriceIncludingTax * 100) / 100
                                    }));
                                  }
                                }
                              }}
                              placeholder="Enter percentage"
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="price-including-tax-edit" className="text-sm">Price Including Tax</Label>
                            <Input
                              id="price-including-tax-edit"
                              type="text"
                              value={productSelection.priceIncludingTax === 0 ? '' : productSelection.priceIncludingTax.toString()}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  const priceIncludingTax = value === '' ? 0 : parseFloat(value) || 0;
                                  setProductSelection(prev => ({...prev, priceIncludingTax: priceIncludingTax}));
                                  
                                  if (!productSelection.disableAutoTaxCalculations && !value.endsWith('.') && value !== '' && Number(productSelection.taxPercentage) > 0) {
                                    // Calculate price excluding tax and tax amount from including price
                                    const taxPercentageNum = Number(productSelection.taxPercentage);
                                    const calculatedPriceExcludingTax = priceIncludingTax / (1 + taxPercentageNum / 100);
                                    const calculatedTaxAmount = priceIncludingTax - calculatedPriceExcludingTax;
                                    setProductSelection(prev => ({
                                      ...prev, 
                                      priceExcludingTax: Math.round(calculatedPriceExcludingTax * 100) / 100,
                                      taxAmount: Math.round(calculatedTaxAmount * 100) / 100
                                    }));
                                  } else if (!productSelection.disableAutoTaxCalculations && !value.endsWith('.') && value !== '' && Number(productSelection.priceExcludingTax) > 0) {
                                    // If no tax percentage but we have price excluding tax, calculate tax percentage
                                    const priceExcludingTaxNum = Number(productSelection.priceExcludingTax);
                                    const calculatedTaxAmount = priceIncludingTax - priceExcludingTaxNum;
                                    const calculatedTaxPercentage = priceExcludingTaxNum > 0 ? (calculatedTaxAmount / priceExcludingTaxNum) * 100 : 0;
                                    setProductSelection(prev => ({
                                      ...prev, 
                                      taxAmount: calculatedTaxAmount,
                                      taxPercentage: Math.round(calculatedTaxPercentage * 100) / 100
                                    }));
                                  }
                                }
                              }}
                              placeholder="Enter price"
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="tax-amount-edit" className="text-sm">Tax Amount</Label>
                            <Input
                              id="tax-amount-edit"
                              type="text"
                              value={productSelection.taxAmount === 0 ? '' : productSelection.taxAmount.toString()}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setProductSelection({...productSelection, taxAmount: value === '' ? 0 : value});
                                }
                              }}
                              placeholder="Calculated automatically"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Additional Tax Fields */}
                      <div>
                        <h5 className="text-sm font-medium mb-3 text-muted-foreground">Additional Tax Fields</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="extra-tax-edit" className="text-sm">Extra Tax</Label>
                            <Input
                              id="extra-tax-edit"
                              type="text"
                              value={productSelection.extraTax === 0 ? '' : productSelection.extraTax}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setProductSelection({...productSelection, extraTax: value === '' ? 0 : value});
                                }
                              }}
                              placeholder="Enter amount"
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="further-tax-edit" className="text-sm">Further Tax 1</Label>
                            <Input
                              id="further-tax-edit"
                              type="text"
                              value={productSelection.furtherTax === 0 ? '' : productSelection.furtherTax}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setProductSelection({...productSelection, furtherTax: value === '' ? 0 : value});
                                }
                              }}
                              placeholder="Enter amount"
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="fed-payable-tax-edit" className="text-sm">FED Payable Tax</Label>
                            <Input
                              id="fed-payable-tax-edit"
                              type="text"
                              value={productSelection.fedPayableTax === 0 ? '' : productSelection.fedPayableTax}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setProductSelection({...productSelection, fedPayableTax: value === '' ? 0 : value});
                                }
                              }}
                              placeholder="Enter amount"
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="fixed-notified-value-edit" className="text-sm">Fixed Notified Value/Retail Price</Label>
                            <Input
                              id="fixed-notified-value-edit"
                              type="text"
                              value={productSelection.fixedNotifiedValueOrRetailPrice === 0 ? '' : productSelection.fixedNotifiedValueOrRetailPrice}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setProductSelection({...productSelection, fixedNotifiedValueOrRetailPrice: value === '' ? 0 : value});
                                }
                              }}
                              placeholder="Enter value"
                              className="text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="sale-type-edit" className="text-sm">Sale Type</Label>
                            <Input
                              id="sale-type-edit"
                              type="text"
                              value={productSelection.saleType}
                              onChange={(e) => setProductSelection({...productSelection, saleType: e.target.value})}
                              placeholder="Goods at standard rate"
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="discount-edit" className="text-sm">Discount Amount</Label>
                            <Input
                              id="discount-edit"
                              type="text"
                              value={productSelection.discountAmount === 0 ? '' : productSelection.discountAmount}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setProductSelection({...productSelection, discountAmount: value === '' ? 0 : value});
                                }
                              }}
                              placeholder="Enter amount"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Product Identification Fields */}
                      <div>
                        <h5 className="text-sm font-medium mb-3 text-muted-foreground">Product Identification</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="serial-number-edit" className="text-sm">SRO Item Serial No. (FBR)</Label>
                            <Input
                              id="serial-number-edit"
                              type="text"
                              value={productSelection.serialNumber}
                              onChange={(e) => setProductSelection({...productSelection, serialNumber: e.target.value})}
                              placeholder="Product serial number"
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="list-number-edit" className="text-sm">List Number</Label>
                            <Input
                              id="list-number-edit"
                              type="text"
                              value={productSelection.listNumber}
                              onChange={(e) => setProductSelection({...productSelection, listNumber: e.target.value})}
                              placeholder="List reference number"
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="bc-number-edit" className="text-sm">BC Number</Label>
                            <Input
                              id="bc-number-edit"
                              type="text"
                              value={productSelection.bcNumber}
                              onChange={(e) => setProductSelection({...productSelection, bcNumber: e.target.value})}
                              placeholder="BC identification number"
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="lot-number-edit" className="text-sm">Lot Number</Label>
                            <Input
                              id="lot-number-edit"
                              type="text"
                              value={productSelection.lotNumber}
                              onChange={(e) => setProductSelection({...productSelection, lotNumber: e.target.value})}
                              placeholder="Batch/lot number"
                              className="text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiry-date-edit" className="text-sm">Expiry Date</Label>
                            <Input
                              id="expiry-date-edit"
                              type="date"
                              value={productSelection.expiryDate}
                              onChange={(e) => setProductSelection({...productSelection, expiryDate: e.target.value})}
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="item-serial-number-edit" className="text-sm">Item Serial Number</Label>
                            {!isCustomItemSerialNumber ? (
                              <div className="flex gap-2">
                                <Select
                                  value={productSelection.itemSerialNumber}
                                  onValueChange={(value) => {
                                    if (value === 'custom') {
                                      setIsCustomItemSerialNumber(true);
                                      setProductSelection({...productSelection, itemSerialNumber: ''});
                                    } else {
                                      setProductSelection({...productSelection, itemSerialNumber: value});
                                    }
                                  }}
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Select Item Serial Number" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="19">19</SelectItem>
                                    <SelectItem value="custom">Custom (Type your own)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Input
                                  id="item-serial-number-edit"
                                  type="text"
                                  value={productSelection.itemSerialNumber}
                                  onChange={(e) => setProductSelection({...productSelection, itemSerialNumber: e.target.value})}
                                  placeholder="Enter custom item serial number"
                                  className="text-sm"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setIsCustomItemSerialNumber(false);
                                    setProductSelection({...productSelection, itemSerialNumber: '19'});
                                  }}
                                  className="px-3 text-xs"
                                >
                                  Back to Select
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="sro-schedule-number-edit" className="text-sm">SRO/Schedule Number</Label>
                            {!isCustomSroScheduleNumber ? (
                              <div className="flex gap-2">
                                <Select
                                  value={productSelection.sroScheduleNumber}
                                  onValueChange={(value) => {
                                    if (value === 'custom') {
                                      setIsCustomSroScheduleNumber(true);
                                      setProductSelection({...productSelection, sroScheduleNumber: ''});
                                    } else {
                                      setProductSelection({...productSelection, sroScheduleNumber: value});
                                    }
                                  }}
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Select SRO/Schedule Number" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ICTO TABLE I">ICTO TABLE I</SelectItem>
                                    <SelectItem value="custom">Custom (Type your own)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Input
                                  id="sro-schedule-number-edit"
                                  type="text"
                                  value={productSelection.sroScheduleNumber}
                                  onChange={(e) => setProductSelection({...productSelection, sroScheduleNumber: e.target.value})}
                                  placeholder="Enter custom SRO schedule reference"
                                  className="text-sm"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setIsCustomSroScheduleNumber(false);
                                    setProductSelection({...productSelection, sroScheduleNumber: 'ICTO TABLE I'});
                                  }}
                                  className="px-3 text-xs"
                                >
                                  Back to Select
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="hs-code-edit" className="text-sm">HS Code</Label>
                            <Input
                              id="hs-code-edit"
                              type="text"
                              value={productSelection.hsCode}
                              onChange={(e) => setProductSelection({...productSelection, hsCode: e.target.value})}
                              placeholder="Harmonized System Code"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Add Product Button */}
                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          onClick={handleAddProduct}
                          disabled={isAddingProduct || !productSelection.selectedProductId}
                          className="min-w-[120px]"
                        >
                          {isAddingProduct ? (
                            <>
                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Product
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Order Items List */}
                {orderItems.length > 0 && (
                  <div className="space-y-4">
                    {orderItems.map((item, index) => (
                      <div key={item.id || index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="font-medium">{item.productName}</div>
                            {item.variantTitle && (
                              <div className="text-sm text-gray-600">{item.variantTitle}</div>
                            )}
                            {item.sku && (
                              <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeOrderItem(index)}
                          >
                            Remove
                          </Button>
                        </div>

                        {/* Basic Product Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div>
                            <Label className="text-sm">Product Name</Label>
                            <Input
                              value={item.productName || ''}
                              onChange={(e) => updateOrderItem(index, 'productName', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          
                          {item.isWeightBased ? (
                            <div>
                              <Label className="text-sm">Weight ({item.weightUnit})</Label>
                              <Input
                                type="number"
                                step="0.001"
                                value={item.weightQuantity ? formatWeightAuto(item.weightQuantity).formattedString : ''}
                                onChange={(e) => updateOrderItem(index, 'weightQuantity', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          ) : (
                            <div>
                              <Label className="text-sm">Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="text-sm"
                              />
                            </div>
                          )}

                          <div className='hidden'>
                            <Label className="text-sm">Base Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateOrderItem(index, 'price', parseFloat(e.target.value) || 0)}
                              className="text-sm"
                            />
                          </div>

                          <div>
                            <Label className="text-sm">Unit of Measurement (UOM)</Label>
                            <div className="flex gap-2">
                              <Popover 
                                open={existingItemUomOpen[index] || false} 
                                onOpenChange={(open) => setExistingItemUomOpen(prev => ({ ...prev, [index]: open }))}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={existingItemUomOpen[index] || false}
                                    className="justify-between text-sm flex-1"
                                  >
                                    {(() => {
                                      const uomOptions = ["MT", "Bill of lading", "SET", "KWH", "40KG", "Liter", "SqY", "Bag", "KG", "MMBTU", "Meter", "Pcs", "Carat", "Cubic Metre", "Dozen", "Gram", "Gallon", "Kilogram", "Pound", "Timber Logs", "Numbers, pieces, units", "Packs", "Pair", "Square Foot", "Square Metre", "Thousand Unit", "Mega Watt", "Foot", "Barrels", "NO", "1000 kWh"];
                                      const isCustomUom = item.uom && !uomOptions.includes(item.uom);
                                      return item.uom && uomOptions.includes(item.uom)
                                        ? item.uom
                                        : isCustomUom 
                                          ? "Others"
                                          : item.uom
                                            ? "Others"
                                            : "Select UOM...";
                                    })()}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                                  <Command>
                                    <CommandInput placeholder="Search UOM..." />
                                    <CommandList className="h-[200px]">
                                      <CommandEmpty>No UOM found.</CommandEmpty>
                                      <CommandGroup>
                                        {["MT", "Bill of lading", "SET", "KWH", "40KG", "Liter", "SqY", "Bag", "KG", "MMBTU", "Meter", "Pcs", "Carat", "Cubic Metre", "Dozen", "Gram", "Gallon", "Kilogram", "Pound", "Timber Logs", "Numbers, pieces, units", "Packs", "Pair", "Square Foot", "Square Metre", "Thousand Unit", "Mega Watt", "Foot", "Barrels", "NO", "1000 kWh", "Others (custom)"].map((uom) => (
                                          <CommandItem
                                            key={uom}
                                            value={uom}
                                            onSelect={() => {
                                              if (uom === "Others (custom)") {
                                                updateOrderItem(index, 'uom', "");
                                              } else {
                                                updateOrderItem(index, 'uom', uom);
                                              }
                                              setExistingItemUomOpen(prev => ({ ...prev, [index]: false }));
                                            }}
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 ${item.uom === uom ? "opacity-100" : "opacity-0"}`}
                                            />
                                            {uom}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              {(() => {
                                const uomOptions = ["MT", "Bill of lading", "SET", "KWH", "40KG", "Liter", "SqY", "Bag", "KG", "MMBTU", "Meter", "Pcs", "Carat", "Cubic Metre", "Dozen", "Gram", "Gallon", "Kilogram", "Pound", "Timber Logs", "Numbers, pieces, units", "Packs", "Pair", "Square Foot", "Square Metre", "Thousand Unit", "Mega Watt", "Foot", "Barrels", "NO", "1000 kWh"];
                                const isCustomUom = item.uom && !uomOptions.includes(item.uom);
                                const showCustomInput = item.uom === "" || isCustomUom || (item.uom && !uomOptions.includes(item.uom));
                                return showCustomInput && (
                                  <Input
                                    className="flex-1 text-sm"
                                    type="text"
                                    value={isCustomUom || (item.uom && !uomOptions.includes(item.uom)) ? item.uom : ""}
                                    onChange={(e) => updateOrderItem(index, 'uom', e.target.value)}
                                    placeholder="Enter custom UOM"
                                  />
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Tax & Pricing Details */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h6 className="text-sm font-medium text-muted-foreground">💰 Tax & Pricing Details</h6>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`disable-auto-tax-${index}`}
                                checked={Boolean(item.disableAutoTaxCalculations)}
                                onChange={(e) => updateOrderItem(index, 'disableAutoTaxCalculations', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              />
                              <Label htmlFor={`disable-auto-tax-${index}`} className="text-xs text-muted-foreground cursor-pointer">
                                Disable automatic tax calculations
                              </Label>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <Label className="text-sm">Price Excluding Tax</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.priceExcludingTax || 0}
                                onChange={(e) => updateOrderItem(index, 'priceExcludingTax', parseFloat(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <Label className="text-sm">Tax Percentage</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.taxPercentage || 0}
                                onChange={(e) => updateOrderItem(index, 'taxPercentage', parseFloat(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <Label className="text-sm">Price Including Tax</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.priceIncludingTax || 0}
                                onChange={(e) => updateOrderItem(index, 'priceIncludingTax', parseFloat(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <Label className="text-sm">Tax Amount</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.taxAmount || 0}
                                onChange={(e) => updateOrderItem(index, 'taxAmount', parseFloat(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Additional Tax Fields */}
                        <div className="mb-6">
                          <h6 className="text-sm font-medium mb-3 text-muted-foreground">📊 Additional Tax Fields</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <Label className="text-sm">Extra Tax</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.extraTax || 0}
                                onChange={(e) => updateOrderItem(index, 'extraTax', parseFloat(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <Label className="text-sm">Further Tax 1</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.furtherTax || 0}
                                onChange={(e) => updateOrderItem(index, 'furtherTax', parseFloat(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <Label className="text-sm">FED Payable Tax</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.fedPayableTax || 0}
                                onChange={(e) => updateOrderItem(index, 'fedPayableTax', parseFloat(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <Label className="text-sm">Discount Amount</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.discount || 0}
                                onChange={(e) => updateOrderItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <div>
                              <Label className="text-sm">Fixed Notified Value/Retail Price</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.fixedNotifiedValueOrRetailPrice || 0}
                                onChange={(e) => updateOrderItem(index, 'fixedNotifiedValueOrRetailPrice', parseFloat(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <Label className="text-sm">Sale Type</Label>
                              <Input
                                value={item.saleType || 'Goods at standard rate'}
                                onChange={(e) => updateOrderItem(index, 'saleType', e.target.value)}
                                className="text-sm"
                              />
                            </div>

                            <div className='hidden'>
                              <Label className="text-sm">Total Price</Label>
                              <div className="flex items-center h-9 px-3 py-2 border rounded bg-gray-50 text-sm">
                                {formatCurrency(item.totalPrice)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Product Identification */}
                        <div className="mb-4">
                          <h6 className="text-sm font-medium mb-3 text-muted-foreground">🔍 Product Identification</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <Label className="text-sm">HS Code</Label>
                              <Input
                                value={item.hsCode || ''}
                                onChange={(e) => updateOrderItem(index, 'hsCode', e.target.value)}
                                placeholder="Harmonized System Code"
                                className="text-sm"
                              />
                            </div>

                            <div className=''>
                              <Label className="text-sm">SRO Item Serial No. (FBR)</Label>
                              <Input
                                value={item.serialNumber || ''}
                                onChange={(e) => updateOrderItem(index, 'serialNumber', e.target.value)}
                                placeholder="Product serial number"
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <Label className="text-sm">List Number</Label>
                              <Input
                                value={item.listNumber || ''}
                                onChange={(e) => updateOrderItem(index, 'listNumber', e.target.value)}
                                placeholder="List reference number"
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <Label className="text-sm">BC Number</Label>
                              <Input
                                value={item.bcNumber || ''}
                                onChange={(e) => updateOrderItem(index, 'bcNumber', e.target.value)}
                                placeholder="BC identification number"
                                className="text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <div>
                              <Label className="text-sm">Lot Number</Label>
                              <Input
                                value={item.lotNumber || ''}
                                onChange={(e) => updateOrderItem(index, 'lotNumber', e.target.value)}
                                placeholder="Batch/lot number"
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <Label className="text-sm">Expiry Date</Label>
                              <Input
                                type="date"
                                value={item.expiryDate || ''}
                                onChange={(e) => updateOrderItem(index, 'expiryDate', e.target.value)}
                                className="text-sm"
                              />
                            </div>

                            <div>
                              <Label className="text-sm">Item Serial Number</Label>
                              {!itemCustomItemSerialNumber[index] ? (
                                <div className="flex gap-2">
                                  <Select
                                    value={item.itemSerialNumber || ''}
                                    onValueChange={(value) => {
                                      if (value === 'custom') {
                                        setItemCustomItemSerialNumber(prev => ({...prev, [index]: true}));
                                        updateOrderItem(index, 'itemSerialNumber', '');
                                      } else {
                                        updateOrderItem(index, 'itemSerialNumber', value);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="text-sm">
                                      <SelectValue placeholder="Select Item Serial Number" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="19">19</SelectItem>
                                      <SelectItem value="custom">Custom (Type your own)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <Input
                                    value={item.itemSerialNumber || ''}
                                    onChange={(e) => updateOrderItem(index, 'itemSerialNumber', e.target.value)}
                                    placeholder="Enter custom item serial number"
                                    className="text-sm"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setItemCustomItemSerialNumber(prev => ({...prev, [index]: false}));
                                      updateOrderItem(index, 'itemSerialNumber', '19');
                                    }}
                                    className="px-3 text-xs"
                                  >
                                    Back to Select
                                  </Button>
                                </div>
                              )}
                            </div>

                            <div>
                              <Label className="text-sm">SRO/Schedule Number</Label>
                              {!itemCustomSroScheduleNumber[index] ? (
                                <div className="flex gap-2">
                                  <Select
                                    value={item.sroScheduleNumber || ''}
                                    onValueChange={(value) => {
                                      if (value === 'custom') {
                                        setItemCustomSroScheduleNumber(prev => ({...prev, [index]: true}));
                                        updateOrderItem(index, 'sroScheduleNumber', '');
                                      } else {
                                        updateOrderItem(index, 'sroScheduleNumber', value);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="text-sm">
                                      <SelectValue placeholder="Select SRO/Schedule Number" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="ICTO TABLE I">ICTO TABLE I</SelectItem>
                                      <SelectItem value="custom">Custom (Type your own)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <Input
                                    value={item.sroScheduleNumber || ''}
                                    onChange={(e) => updateOrderItem(index, 'sroScheduleNumber', e.target.value)}
                                    placeholder="Enter custom SRO schedule reference"
                                    className="text-sm"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setItemCustomSroScheduleNumber(prev => ({...prev, [index]: false}));
                                      updateOrderItem(index, 'sroScheduleNumber', 'ICTO TABLE I');
                                    }}
                                    className="px-3 text-xs"
                                  >
                                    Back to Select
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tax Summary Display */}
                        {(Number(item.taxAmount) || Number(item.extraTax) || Number(item.furtherTax) || Number(item.fedPayableTax) || Number(item.discount)) > 0 && (
                          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-sm font-medium text-green-800 mb-2">💰 Tax & Discount Summary:</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {Number(item.priceExcludingTax) > 0 && (
                                <div className="flex justify-between">
                                  <span>Price Excl. Tax:</span>
                                  <span>{formatCurrency(Number(item.priceExcludingTax) * item.quantity)}</span>
                                </div>
                              )}
                              {Number(item.taxAmount) > 0 && (
                                <div className="flex justify-between">
                                  <span>Tax Amount:</span>
                                  <span>{formatCurrency(Number(item.taxAmount) * item.quantity)}</span>
                                </div>
                              )}
                              {Number(item.extraTax) > 0 && (
                                <div className="flex justify-between">
                                  <span>Extra Tax:</span>
                                  <span>{formatCurrency(Number(item.extraTax) * item.quantity)}</span>
                                </div>
                              )}
                              {Number(item.furtherTax) > 0 && (
                                <div className="flex justify-between">
                                  <span>Further Tax:</span>
                                  <span>{formatCurrency(Number(item.furtherTax) * item.quantity)}</span>
                                </div>
                              )}
                              {Number(item.fedPayableTax) > 0 && (
                                <div className="flex justify-between">
                                  <span>FED Tax:</span>
                                  <span>{formatCurrency(Number(item.fedPayableTax) * item.quantity)}</span>
                                </div>
                              )}
                              {Number(item.discount) > 0 && (
                                <div className="flex justify-between text-red-600">
                                  <span>Discount:</span>
                                  <span>-{formatCurrency(Number(item.discount) * item.quantity)}</span>
                                </div>
                              )}
                              {Number(item.priceIncludingTax) > 0 && (
                                <div className="flex justify-between font-medium">
                                  <span>Price Incl. Tax:</span>
                                  <span>{formatCurrency(Number(item.priceIncludingTax) * item.quantity)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Loyalty Points */}
            {loyaltySettings.enabled && orderData.customerId && customerPoints.availablePoints > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>🎁 Loyalty Points</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-800">Available Points:</span>
                      <span className="text-lg font-bold text-purple-600">{customerPoints.availablePoints}</span>
                    </div>
                    <div className="text-xs text-purple-600">
                      Worth up to {formatCurrency(customerPoints.availablePoints * loyaltySettings.redemptionValue)} discount
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Use All Available Points</label>
                        <p className="text-xs text-gray-500">
                          Apply maximum discount (up to {loyaltySettings.maxRedemptionPercent}% of order)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleUseAllPoints}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                          orderData.useAllPoints ? 'bg-purple-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            orderData.useAllPoints ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {!orderData.useAllPoints && (
                      <div>
                        <Label>Points to Redeem</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            min="0"
                            max={customerPoints.availablePoints}
                            value={orderData.pointsToRedeem}
                            onChange={(e) => handlePointsRedemption(parseInt(e.target.value) || 0)}
                            placeholder={`Min: ${loyaltySettings.redemptionMinimum}`}
                          />
                          <Button
                            type="button"
                            onClick={() => handlePointsRedemption(customerPoints.availablePoints)}
                            variant="secondary"
                          >
                            Max
                          </Button>
                        </div>
                        {orderData.pointsToRedeem > 0 && (
                          <div className="mt-2 text-sm text-green-600">
                            Discount: {formatCurrency(orderData.pointsDiscountAmount)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shipping Information */}
            <Card className='hidden'>
              <CardHeader>
                <CardTitle>🚛 Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shippingFirstName">First Name</Label>
                    <Input
                      id="shippingFirstName"
                      value={customerInfo.shippingFirstName}
                      onChange={(e) => setCustomerInfo({...customerInfo, shippingFirstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingLastName">Last Name</Label>
                    <Input
                      id="shippingLastName"
                      value={customerInfo.shippingLastName}
                      onChange={(e) => setCustomerInfo({...customerInfo, shippingLastName: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="shippingAddress1">Address Line 1</Label>
                    <Input
                      id="shippingAddress1"
                      value={customerInfo.shippingAddress1}
                      onChange={(e) => setCustomerInfo({...customerInfo, shippingAddress1: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="shippingAddress2">Address Line 2</Label>
                    <Input
                      id="shippingAddress2"
                      value={customerInfo.shippingAddress2}
                      onChange={(e) => setCustomerInfo({...customerInfo, shippingAddress2: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingCity">City</Label>
                    <Input
                      id="shippingCity"
                      value={customerInfo.shippingCity}
                      onChange={(e) => setCustomerInfo({...customerInfo, shippingCity: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingState">State</Label>
                    <Input
                      id="shippingState"
                      value={customerInfo.shippingState}
                      onChange={(e) => setCustomerInfo({...customerInfo, shippingState: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingPostalCode">Postal Code</Label>
                    <Input
                      id="shippingPostalCode"
                      value={customerInfo.shippingPostalCode}
                      onChange={(e) => setCustomerInfo({...customerInfo, shippingPostalCode: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingCountry">Country</Label>
                    <Select value={customerInfo.shippingCountry} onValueChange={(value) => setCustomerInfo({...customerInfo, shippingCountry: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="PK">Pakistan</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Settings */}
            <Card className='hidden'>
              <CardHeader>
                <CardTitle>⚙️ Order Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Order Status</Label>
                    <Select value={orderData.status} onValueChange={(value) => setOrderData({...orderData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select value={orderData.paymentStatus} onValueChange={(value) => setOrderData({...orderData, paymentStatus: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="shippingAmount">Shipping Amount</Label>
                    <Input
                      id="shippingAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={orderData.shippingAmount}
                      onChange={(e) => setOrderData({...orderData, shippingAmount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="discountAmount">Discount Amount</Label>
                    <Input
                      id="discountAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={orderData.discountAmount}
                      onChange={(e) => setOrderData({...orderData, discountAmount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Order Notes</Label>
                  <Textarea
                    id="notes"
                    value={orderData.notes}
                    onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Seller Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏪 Seller Information
                </CardTitle>
                <CardDescription>
                  Your business information for FBR Digital Invoicing. These fields are auto-filled from environment variables but can be modified if needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="seller-ntn">Seller NTN/CNIC</Label>
                    <Input
                      id="seller-ntn"
                      type="text"
                      value={sellerInfo.sellerNTNCNIC}
                      onChange={(e) => setSellerInfo({...sellerInfo, sellerNTNCNIC: e.target.value})}
                      placeholder="Enter your NTN or CNIC"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seller-business">Business Name</Label>
                    <Input
                      id="seller-business"
                      type="text"
                      value={sellerInfo.sellerBusinessName}
                      onChange={(e) => setSellerInfo({...sellerInfo, sellerBusinessName: e.target.value})}
                      placeholder="Enter your business name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seller-province">Province</Label>
                    <div className="space-y-2">
                      <Select 
                        value={
                          isCustomSellerProvince ? "custom" :
                          ["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Capital Territory", "Azad Jammu and Kashmir", "Gilgit-Baltistan", "N/A"].includes(sellerInfo.sellerProvince || "")
                            ? sellerInfo.sellerProvince 
                            : ""
                        } 
                        onValueChange={(value) => {
                          if (value === "custom") {
                            setIsCustomSellerProvince(true);
                            setSellerInfo({...sellerInfo, sellerProvince: ""});
                          } else {
                            setIsCustomSellerProvince(false);
                            setSellerInfo({...sellerInfo, sellerProvince: value});
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Province" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Punjab">Punjab</SelectItem>
                          <SelectItem value="Sindh">Sindh</SelectItem>
                          <SelectItem value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</SelectItem>
                          <SelectItem value="Balochistan">Balochistan</SelectItem>
                          <SelectItem value="Capital Territory">Islamabad</SelectItem>
                          <SelectItem value="Azad Jammu and Kashmir">Azad Jammu and Kashmir</SelectItem>
                          <SelectItem value="Gilgit-Baltistan">Gilgit-Baltistan</SelectItem>
                          <SelectItem value="N/A">N/A</SelectItem>
                          <SelectItem value="custom">Custom Province...</SelectItem>
                        </SelectContent>
                      </Select>
                      {isCustomSellerProvince && (
                        <Input
                          placeholder="Enter custom province"
                          value={sellerInfo.sellerProvince || ""}
                          onChange={(e) => setSellerInfo({...sellerInfo, sellerProvince: e.target.value})}
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="seller-address">Address</Label>
                    <Input
                      id="seller-address"
                      type="text"
                      value={sellerInfo.sellerAddress}
                      onChange={(e) => setSellerInfo({...sellerInfo, sellerAddress: e.target.value})}
                      placeholder="Enter your business address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fbr-sandbox-token">FBR Sandbox Token</Label>
                    <Input
                      id="fbr-sandbox-token"
                      type="text"
                      value={sellerInfo.fbrSandboxToken}
                      onChange={(e) => setSellerInfo({...sellerInfo, fbrSandboxToken: e.target.value})}
                      placeholder="FBR sandbox token"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fbr-base-url">FBR Base URL</Label>
                    <Input
                      id="fbr-base-url"
                      type="text"
                      value={sellerInfo.fbrBaseUrl}
                      onChange={(e) => setSellerInfo({...sellerInfo, fbrBaseUrl: e.target.value})}
                      placeholder="FBR base URL"
                    />
                  </div>
                </div>

                {(!sellerInfo.sellerNTNCNIC || !sellerInfo.sellerBusinessName || !sellerInfo.fbrSandboxToken || !sellerInfo.fbrBaseUrl) && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <span>⚠️</span>
                      <span className="font-medium">Missing Seller Information</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Please ensure your seller information is complete for FBR Digital Invoicing. 
                      You can set default values in your environment variables (FBR_SELLER_*).
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice & Validation Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🧾 Invoice & Validation
                </CardTitle>
                <CardDescription>
                  Enter invoice details and validation information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoice-type">Invoice Type</Label>
                    <Input
                      id="invoice-type"
                      type="text"
                      value={orderData.invoiceType}
                      onChange={(e) => setOrderData({...orderData, invoiceType: e.target.value})}
                      placeholder="e.g., Sales Invoice, Pro Forma"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoice-ref">Invoice Ref No</Label>
                    <Input
                      id="invoice-ref"
                      type="text"
                      value={orderData.invoiceRefNo}
                      onChange={(e) => setOrderData({...orderData, invoiceRefNo: e.target.value})}
                      placeholder="Reference number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="scenario-id">Scenario ID</Label>
                    <div className="space-y-2">
                      <Select 
                        value={isCustomScenario ? "custom" : orderData.scenarioId} 
                        onValueChange={(value) => {
                          if (value === "custom") {
                            setIsCustomScenario(true);
                            setOrderData({...orderData, scenarioId: ""});
                          } else {
                            setIsCustomScenario(false);
                            setOrderData({...orderData, scenarioId: value});
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select FBR Scenario" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          <SelectItem value="SN001">SN001 - Goods at standard rate (default)</SelectItem>
                          <SelectItem value="SN002">SN002 - Goods at standard rate (with WHT)</SelectItem>
                          <SelectItem value="SN003">SN003 - Goods at standard rate (default)</SelectItem>
                          <SelectItem value="SN004">SN004 - Goods at 5% rate</SelectItem>
                          <SelectItem value="SN005">SN005 - Goods at 1% rate</SelectItem>
                          <SelectItem value="SN006">SN006 - Tax-exempt goods (0% tax)</SelectItem>
                          <SelectItem value="SN007">SN007 - Zero-rate goods (0% tax)</SelectItem>
                          <SelectItem value="SN008">SN008 - 3rd Schedule Goods (requires retail price)</SelectItem>
                          <SelectItem value="SN009">SN009 - Goods at 10% rate</SelectItem>
                          <SelectItem value="SN010">SN010 - Goods at 12% rate</SelectItem>
                          <SelectItem value="SN011">SN011 - Goods at 15% rate</SelectItem>
                          <SelectItem value="SN012">SN012 - Goods at 18% rate</SelectItem>
                          <SelectItem value="SN013">SN013 - Goods at 20% rate</SelectItem>
                          <SelectItem value="SN014">SN014 - Services at standard rate</SelectItem>
                          <SelectItem value="SN015">SN015 - Services at reduced rate</SelectItem>
                          <SelectItem value="SN016">SN016 - Services zero-rated</SelectItem>
                          <SelectItem value="SN017">SN017 - Services with FED</SelectItem>
                          <SelectItem value="SN018">SN018 - Services with FED in ST mode</SelectItem>
                          <SelectItem value="SN019">SN019 - International services</SelectItem>
                          <SelectItem value="SN020">SN020 - Professional services</SelectItem>
                          <SelectItem value="SN021">SN021 - Construction services</SelectItem>
                          <SelectItem value="SN022">SN022 - Transport services</SelectItem>
                          <SelectItem value="SN023">SN023 - Telecommunication services</SelectItem>
                          <SelectItem value="SN024">SN024 - Financial services</SelectItem>
                          <SelectItem value="SN025">SN025 - Insurance services</SelectItem>
                          <SelectItem value="SN026">SN026 - Mixed supplies (goods + services)</SelectItem>
                          <SelectItem value="SN027">SN027 - Retail Supplies (Invoice Level)</SelectItem>
                          <SelectItem value="SN028">SN028 - Retail Supplies (Item Level)</SelectItem>
                          <SelectItem value="custom">Custom Scenario...</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {isCustomScenario && (
                        <Input
                          id="custom-scenario-id"
                          type="text"
                          value={orderData.scenarioId}
                          onChange={(e) => setOrderData({...orderData, scenarioId: e.target.value})}
                          placeholder="Enter custom scenario ID (e.g., SN029)"
                        />
                      )}
                    </div>
                    
                    {orderData.scenarioId && (
                      <div className="text-sm text-muted-foreground">
                        {orderData.scenarioId === "SN001" && "⚠️ Not valid for unregistered buyers"}
                        {orderData.scenarioId === "SN002" && "Requires withholding tax at item level"}
                        {orderData.scenarioId === "SN005" && "Uses 1% tax rate"}
                        {orderData.scenarioId === "SN006" && "Tax-exempt goods (0% tax)"}
                        {orderData.scenarioId === "SN007" && "Zero-rate goods (0% tax)"}
                        {orderData.scenarioId === "SN008" && "Requires fixed retail price"}
                        {orderData.scenarioId === "SN017" && "Requires FED payable amount"}
                        {orderData.scenarioId === "SN018" && "Services with FED in ST mode"}
                        {orderData.scenarioId === "SN026" && "✅ Tested and working for unregistered buyers"}
                        {orderData.scenarioId === "SN027" && "Retail supplies at invoice level"}
                        {orderData.scenarioId === "SN028" && "Retail supplies at item level"}
                      </div>
                    )}
                  </div>
                  <div className='hidden'>
                    <Label htmlFor="invoice-number">Invoice Number</Label>
                    <Input
                      id="invoice-number"
                      type="text"
                      value={orderData.invoiceNumber}
                      onChange={(e) => setOrderData({...orderData, invoiceNumber: e.target.value})}
                      placeholder="Invoice number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoice-date">Invoice Date</Label>
                    <Input
                      id="invoice-date"
                      type="date"
                      value={orderData.invoiceDate ? format(orderData.invoiceDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setOrderData({...orderData, invoiceDate: e.target.value ? new Date(e.target.value) : new Date()})}
                    />
                  </div>
                </div>
                <div className='hidden'>
                  <Label htmlFor="validation-response">Validation Response</Label>
                  <Textarea
                    id="validation-response"
                    value={orderData.validationResponse}
                    onChange={(e) => setOrderData({...orderData, validationResponse: e.target.value})}
                    rows={4}
                    placeholder="Validation response data..."
                  />
                </div>
                
                {/* FBR Submission Control Checkboxes */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700">FBR Submission Options</h4>
                  
                  {/* Skip FBR Submission */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="skip-fbr-submission"
                      checked={skipFbrSubmission}
                      onChange={(e) => setSkipFbrSubmission(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="skip-fbr-submission" className="text-sm">
                      Do not submit invoice to FBR (create order only)
                    </Label>
                  </div>
                  
                  {/* Production Environment Submission */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="production-submission"
                      checked={isProductionSubmission}
                      onChange={(e) => {
                        setIsProductionSubmission(e.target.checked);
                        if (!e.target.checked) {
                          setProductionToken('');
                        }
                      }}
                      className="rounded border-gray-300"
                      disabled={skipFbrSubmission}
                    />
                    <Label htmlFor="production-submission" className="text-sm font-medium text-orange-600">
                      Production Environment Invoice Submission
                    </Label>
                  </div>
                  
                  {/* Production Token Field */}
                  {isProductionSubmission && !skipFbrSubmission && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="production-token" className="text-sm font-medium">
                        Production Environment Token
                      </Label>
                      <Input
                        id="production-token"
                        type="password"
                        value={productionToken}
                        onChange={(e) => setProductionToken(e.target.value)}
                        placeholder="Enter production environment token"
                        className="font-mono text-sm"
                      />
                      <div className="text-xs text-gray-500">
                        ⚠️ This token will be used for live FBR submission
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary - Right Side */}
          <div ref={sidebarContainerRef} className="lg:col-span-1 relative">
            <aside 
              ref={sidebarRef}
              className={`transition-all duration-300 will-change-transform z-30 ${
                isSticky 
                  ? 'fixed top-6 right-6 w-[200px] min-w-56 max-w-[calc(100vw-3rem)]' 
                  : 'sticky top-6'
              } h-fit max-h-[calc(100vh-3rem)] overflow-y-auto`}
            >
              <Card className={`border-2 transition-all duration-300 ${
                isSticky 
                  ? 'shadow-2xl bg-background/95 backdrop-blur-sm border-primary/20 scale-105' 
                  : 'shadow-lg bg-background border-border'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📊 Order Summary
                  </CardTitle>
                  <CardDescription>
                    Review your order details and total
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(totals.subtotal)}</span>
                    </div>
                    
                    {totals.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(totals.discountAmount)}</span>
                      </div>
                    )}
                    
                    {totals.pointsDiscountAmount > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>Points Discount:</span>
                        <span>-{formatCurrency(totals.pointsDiscountAmount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(totals.taxAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{formatCurrency(orderData.shippingAmount)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>{formatCurrency(totals.total)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Items: <strong>{orderItems.length}</strong>
                    </div>
                    <div className="text-sm text-gray-600">
                      Currency: <strong>{orderData.currency}</strong>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviewJson}
                      disabled={orderItems.length === 0}
                      className="w-full"
                    >
                      🔍 Preview JSON Data
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mb-3 border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={handleFbrValidation}
                      disabled={orderItems.length === 0 || fbrValidationLoading}
                    >
                      {fbrValidationLoading ? (
                        <>
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                          Validating...
                        </>
                      ) : (
                        <>🛡️ Validate data for FBR</>
                      )}
                    </Button>
                    
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting || orderItems.length === 0}
                    >
                      {submitting ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Updating Order...
                        </>
                      ) : (
                        'Update Order'
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/orders')}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </form>

      {/* JSON Preview Dialog */}
      <Dialog open={showJsonPreview} onOpenChange={setShowJsonPreview}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔍 FBR JSON Preview</DialogTitle>
            <DialogDescription>
              Preview of the data that will be sent to FBR for validation and submission.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(fbrPreviewData, null, 2)}
            </pre>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowJsonPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Confirmation Dialog with FBR Preview */}
      <Dialog open={showOrderConfirmation} onOpenChange={setShowOrderConfirmation}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📋 Update Order Confirmation {isProductionSubmission && <span className="text-orange-600">- Production Mode</span>}
            </DialogTitle>
            <DialogDescription>
              Please review the order details and FBR invoice data before updating.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Customer:</span> {orderData.email}
                </div>
                <div>
                  <span className="font-medium">Total Amount:</span> {currentCurrency === 'USD' ? '$' : currentCurrency === 'AED' ? 'AED ' : 'Rs. '}{calculateTotals().total.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Items:</span> {orderItems.length}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {orderData.status}
                </div>
              </div>
            </div>

            {/* FBR Invoice Preview */}
            {!skipFbrSubmission && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  🧾 FBR Invoice Data Preview
                  {generatingPreview && <span className="text-sm text-gray-500">(Generating...)</span>}
                </h3>
                
                {generatingPreview ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Generating FBR preview...</span>
                  </div>
                ) : fbrPreviewData ? (
                  <div className="space-y-4">
                    {/* Key Invoice Information */}
                    <div className="grid grid-cols-2 gap-4 text-sm bg-blue-50 p-3 rounded">
                      <div>
                        <span className="font-medium">Invoice Type:</span> {fbrPreviewData.invoiceType}
                      </div>
                      <div>
                        <span className="font-medium">Invoice Date:</span> {fbrPreviewData.invoiceDate}
                      </div>
                      <div>
                        <span className="font-medium">Scenario ID:</span> {fbrPreviewData.scenarioId}
                      </div>
                      <div>
                        <span className="font-medium">Invoice Ref No:</span> {fbrPreviewData.invoiceRefNo || 'N/A'}
                      </div>
                    </div>

                    {/* Seller Information */}
                    <div className="bg-purple-50 p-3 rounded">
                      <h4 className="font-medium text-purple-800 mb-2">📤 Seller Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">NTN/CNIC:</span> {fbrPreviewData.sellerNTNCNIC || 'Not provided'}</div>
                        <div><span className="font-medium">Business Name:</span> {fbrPreviewData.sellerBusinessName || 'Not provided'}</div>
                        <div><span className="font-medium">Province:</span> {fbrPreviewData.sellerProvince || 'Not provided'}</div>
                        <div className="md:col-span-2"><span className="font-medium">Address:</span> {fbrPreviewData.sellerAddress || 'Not provided'}</div>
                      </div>
                    </div>

                    {/* Buyer Information */}
                    <div className="bg-green-50 p-3 rounded">
                      <h4 className="font-medium text-green-800 mb-2">📥 Buyer Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">Buyer Name:</span> {fbrPreviewData.buyerFullName || orderData.buyerFullName || `${customerInfo.billingFirstName} ${customerInfo.billingLastName}`.trim() || 'Not provided'}</div>
                        <div><span className="font-medium">NTN/CNIC:</span> {fbrPreviewData.buyerNTNCNIC || 'Not provided'}</div>
                        <div><span className="font-medium">Business Name:</span> {fbrPreviewData.buyerBusinessName || 'Not provided'}</div>
                        <div><span className="font-medium">Registration Type:</span> {fbrPreviewData.buyerRegistrationType || 'Not provided'}</div>
                        <div><span className="font-medium">Province:</span> {fbrPreviewData.buyerProvince || 'Not provided'}</div>
                        <div className="md:col-span-2"><span className="font-medium">Address:</span> {fbrPreviewData.buyerAddress || 'Not provided'}</div>
                      </div>
                    </div>

                    {/* Items Details */}
                    {fbrPreviewData.items && fbrPreviewData.items.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-medium mb-3">📦 Invoice Items ({fbrPreviewData.items.length})</h4>
                        <div className="space-y-3">
                          {fbrPreviewData.items.map((item: any, index: number) => (
                            <div key={index} className="bg-white p-3 rounded border border-gray-200">
                              <div className="font-medium text-sm mb-2">
                                {item.productDescription || item.itemName || `Item ${index + 1}`}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                <div><span className="font-medium">HS Code:</span> {item.hsCode}</div>
                                <div><span className="font-medium">Quantity:</span> {item.quantity}</div>
                                <div><span className="font-medium">UoM:</span> {item.uoM || item.uom || 'N/A'}</div>
                                <div><span className="font-medium">Rate:</span> {item.rate}</div>
                                {item.priceIncludingTax !== undefined && item.priceIncludingTax !== null && (
                                  <div><span className="font-medium">Price Incl. Tax:</span> {item.priceIncludingTax?.toLocaleString()}</div>
                                )}
                                {item.priceExcludingTax !== undefined && item.priceExcludingTax !== null && (
                                  <div><span className="font-medium">Price Excl. Tax:</span> {item.priceExcludingTax?.toLocaleString()}</div>
                                )}
                                {item.taxPercentage !== undefined && item.taxPercentage !== null && (
                                  <div><span className="font-medium">Tax %:</span> {item.taxPercentage}%</div>
                                )}
                                <div><span className="font-medium">Value Excl. ST:</span> {item.valueSalesExcludingST?.toLocaleString()}</div>
                                <div><span className="font-medium">Sales Tax:</span> {item.salesTaxApplicable?.toLocaleString()}</div>
                                <div><span className="font-medium">FED Payable:</span> {item.fedPayable?.toLocaleString() || 0}</div>
                                <div><span className="font-medium">Total Value:</span> {item.totalValues?.toLocaleString()}</div>
                                {item.saleType && (
                                  <div className="md:col-span-2"><span className="font-medium">Sale Type:</span> {item.saleType}</div>
                                )}
                                {item.discount > 0 && (
                                  <div><span className="font-medium">Discount:</span> {item.discount}</div>
                                )}
                                {item.extraTax && (
                                  <div><span className="font-medium">Extra Tax:</span> {item.extraTax}</div>
                                )}
                                {item.furtherTax > 0 && (
                                  <div><span className="font-medium">Further Tax:</span> {item.furtherTax}</div>
                                )}
                                {item.sroScheduleNo && (
                                  <div><span className="font-medium">SRO Schedule:</span> {item.sroScheduleNo}</div>
                                )}
                                {item.sroItemSerialNo && (
                                  <div><span className="font-medium">SRO Item Serial:</span> {item.sroItemSerialNo}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary Totals */}
                    {fbrPreviewData.items && fbrPreviewData.items.length > 0 && (
                      <div className="bg-indigo-50 p-3 rounded">
                        <h4 className="font-medium text-indigo-800 mb-2">💰 Invoice Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Total Items:</span> {fbrPreviewData.items.length}
                          </div>
                          <div>
                            <span className="font-medium">Total Quantity:</span> {fbrPreviewData.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)}
                          </div>
                          <div>
                            <span className="font-medium">Total Excl. ST:</span> {fbrPreviewData.items.reduce((sum: number, item: any) => sum + (item.valueSalesExcludingST || 0), 0).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Total Sales Tax:</span> {fbrPreviewData.items.reduce((sum: number, item: any) => sum + (item.salesTaxApplicable || 0), 0).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Total FED:</span> {fbrPreviewData.items.reduce((sum: number, item: any) => sum + (item.fedPayable || 0), 0).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Grand Total:</span> {fbrPreviewData.items.reduce((sum: number, item: any) => sum + (item.totalValues || 0), 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FBR JSON Preview - Same as Console Log */}
                    <details className="border rounded p-2 bg-slate-50">
                      <summary className="cursor-pointer font-medium text-sm text-blue-800">
                        🔍 FBR JSON Preview (Same as Console Log)
                      </summary>
                      <div className="mt-3 space-y-2">
                        <div className="text-xs text-gray-600 italic">
                          This is the exact JSON that will be sent to FBR and logged in the console:
                        </div>
                        <div className="bg-black text-green-400 p-3 rounded font-mono text-xs max-h-80 overflow-y-auto">
                          <div className="text-yellow-400">🔍 === FINAL FBR JSON PAYLOAD ===</div>
                          <div className="text-cyan-400">📋 Generated FBR Invoice JSON:</div>
                          <pre className="mt-2 whitespace-pre-wrap">
                            {fbrJsonPreview ? JSON.stringify(fbrJsonPreview, null, 2) : 'No JSON data available'}
                          </pre>
                          <div className="text-yellow-400 mt-2">===============================</div>
                        </div>
                      </div>
                    </details>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    FBR preview could not be generated. The order will be updated without preview.
                  </div>
                )}
              </div>
            )}

            {skipFbrSubmission && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <p className="text-yellow-800 text-sm">
                  ⚠️ FBR submission is disabled for this order update.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowOrderConfirmation(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={updateOrder}
              disabled={submitting}
              className={isProductionSubmission ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              {submitting ? 'Updating Order...' : 'Confirm & Update Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Production Environment Confirmation Dialog */}
      <Dialog open={showProductionConfirmation} onOpenChange={setShowProductionConfirmation}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              ⚠️ Production Environment Confirmation
            </DialogTitle>
            <DialogDescription>
              You are about to update this order and submit the invoice to the production FBR environment.
            </DialogDescription>
            <div className="text-sm bg-orange-50 p-3 rounded border border-orange-200 mt-2">
              <strong>Warning:</strong> This will create a real invoice in the FBR system and cannot be undone. 
              Make sure all information is correct before proceeding.
            </div>
          </DialogHeader>

          {fbrPreviewData && (
            <div className="space-y-4 mt-4">
              {/* Production Warning Banner */}
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                  🚨 PRODUCTION ENVIRONMENT SUBMISSION
                </div>
                <div className="text-sm text-red-700">
                  This invoice will be submitted to the live FBR system. Please ensure all details are accurate.
                </div>
              </div>

              {/* Same order summary as regular confirmation */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-2 rounded">
                    <div className="font-medium text-blue-700 mb-1">📤 Seller</div>
                    <div>{fbrPreviewData.sellerBusinessName || 'Not provided'}</div>
                    <div className="text-xs text-gray-600">{fbrPreviewData.sellerNTNCNIC || 'No NTN'}</div>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <div className="font-medium text-green-700 mb-1">📥 Buyer</div>
                    <div>{fbrPreviewData.buyerFullName || fbrPreviewData.buyerBusinessName || 'Not provided'}</div>
                    <div className="text-xs text-gray-600">{fbrPreviewData.buyerNTNCNIC || 'No NTN/CNIC'}</div>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <div className="font-medium text-purple-700 mb-1">📄 Invoice</div>
                    <div>{fbrPreviewData.invoiceType || 'Sale Invoice'}</div>
                    <div className="text-xs text-gray-600">{fbrPreviewData.scenarioId || 'No scenario'}</div>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <div className="font-medium text-orange-700 mb-1">💰 Total</div>
                    <div className="flex items-center gap-1"><CurrencySymbol />{safeFormatPrice(fbrPreviewData.totalAmount)}</div>
                    <div className="text-xs text-gray-600">{orderItems.length} items</div>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium text-gray-800 mb-2">📦 Order Items ({orderItems.length})</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                      <div>
                        <span className="font-medium">{item.productName}</span>
                        {item.variantTitle && <span className="text-gray-500"> - {item.variantTitle}</span>}
                        <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1"><CurrencySymbol />{safeFormatPrice(item.totalPrice)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Production Environment Details */}
              <div className="bg-orange-50 p-3 rounded border border-orange-200">
                <div className="text-sm text-orange-800">
                  <strong>🏭 Production Submission:</strong> This order will be submitted to FBR production environment.
                  <div className="mt-1 text-xs">
                    Token: {productionToken ? '***' + productionToken.slice(-4) : 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowProductionConfirmation(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={updateOrder}
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {submitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm Production Update'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}