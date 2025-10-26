'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CurrencySymbol from '../../components/CurrencySymbol';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Plus, UserPlus, PackagePlus, Loader } from "lucide-react";
import { 
  formatWeightAuto, 
  isWeightBasedProduct, 
  convertToGrams,
  parseWeightInput,
  calculateWeightBasedPrice,
  getWeightUnits
} from '@/utils/weightUtils';
import { safeFormatPrice } from '@/utils/priceUtils';
import { useCurrency } from '@/app/contexts/CurrencyContext';

interface Product {
  id: string;
  name: string;
  description?: string; // Product description
  sku?: string;
  price: number;
  productType: string;
  isActive: boolean;
  supplierId?: string;
  variants?: ProductVariant[];
  addons?: ProductAddon[];
  hsCode?: string; // Harmonized System Code
  // Weight-based fields
  stockManagementType?: string;
  pricePerUnit?: number;
  baseWeightUnit?: string;
  // Tax and discount fields
  taxAmount?: number;
  taxPercentage?: number;
  priceIncludingTax?: number;
  priceExcludingTax?: number;
  extraTax?: number;
  furtherTax?: number;
  fedPayableTax?: number;
  discount?: number;
  // Product identification fields
  serialNumber?: string;
  listNumber?: string;
  bcNumber?: string;
  lotNumber?: string;
  expiryDate?: string;
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
  id?: string; // Unique identifier for tracking updates
  productId: string;
  variantId?: string;
  productName: string;
  productDescription?: string; // Product description
  variantTitle?: string;
  sku?: string;
  hsCode?: string; // Harmonized System Code
  price: number;
  quantity: number;
  totalPrice: number;
  addons?: SelectedAddon[];
  // Weight-based fields
  weightQuantity?: number; // Weight in grams
  weightUnit?: string; // Display unit (grams, kg)
  isWeightBased?: boolean;
  // UOM for non-weight based products
  uom?: string;
  // Additional fields
  itemSerialNumber?: string; // Item serial number
  sroScheduleNumber?: string; // SRO / Schedule Number
  // Product identification fields
  serialNumber?: string; // Product serial number
  listNumber?: string; // List reference number
  bcNumber?: string; // BC identification number
  lotNumber?: string; // Batch/lot number
  expiryDate?: string; // Expiry date
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
  // Buyer fields
  buyerNTNCNIC?: string;
  buyerBusinessName?: string;
  buyerProvince?: string;
  buyerAddress?: string;
  buyerRegistrationType?: string;
}

// Helper function to format date for FBR without timezone conversion
const formatDateForFbr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AddOrder() {
  const router = useRouter();
  const { currentCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stockManagementEnabled, setStockManagementEnabled] = useState(true);
  
  // Error scroll reference
  const errorRef = useRef<HTMLDivElement>(null);
  
  // Debug JSON display state
  const [debugJson, setDebugJson] = useState<{
    orderData?: any;
    fbrPayload?: any;
    fbrError?: any;
    showDebug: boolean;
  }>({
    showDebug: false
  });
  
  // Sticky sidebar state
  const [isSticky, setIsSticky] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
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
  
  // Order form data
  // FBR scenario management
  const [isCustomScenario, setIsCustomScenario] = useState(false);
  
  // Seller information (auto-filled from env but editable)
  const [sellerInfo, setSellerInfo] = useState({
    sellerNTNCNIC: '',
    sellerBusinessName: '',
    sellerProvince: '',
    sellerAddress: '',
    fbrSandboxToken: '',
    fbrBaseUrl: ''
  });

  // Email and FBR submission control checkboxes
  const [skipCustomerEmail, setSkipCustomerEmail] = useState(true);
  const [skipSellerEmail, setSkipSellerEmail] = useState(true);
  const [skipFbrSubmission, setSkipFbrSubmission] = useState(false);
  
  // Production environment submission
  const [isProductionSubmission, setIsProductionSubmission] = useState(false);
  const [productionToken, setProductionToken] = useState('');
  const [showProductionConfirmation, setShowProductionConfirmation] = useState(false);
  
  // FBR invoice preview
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [fbrPreviewData, setFbrPreviewData] = useState<any>(null);
  const [fbrJsonPreview, setFbrJsonPreview] = useState<any>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  
  const [orderData, setOrderData] = useState({
    customerId: '',
    email: '',
    phone: '',
    status: 'completed',
    paymentStatus: 'pending',
    notes: '',
    shippingAmount: 0,
    taxRate: 0, // 10%
    discountAmount: 0,
    discountType: 'amount', // 'amount' or 'percentage'
    currency: currentCurrency,
    // Driver assignment fields
    assignedDriverId: '',
    deliveryStatus: 'pending',
    assignmentType: 'manual',
    // Loyalty points fields
    pointsToRedeem: 0,
    pointsDiscountAmount: 0,
    useAllPoints: false,
    // Supplier field
    supplierId: '' as string,
    // Invoice and validation fields
    invoiceType: 'Sale Invoice',
    invoiceRefNo: '',
    scenarioId: '',
    invoiceNumber: '',
    invoiceDate: new Date() as Date | undefined,
    validationResponse: '',
    // Buyer fields (from selected user)
    buyerFirstName: '',
    buyerLastName: '',
    buyerFullName: '',
    buyerNTNCNIC: '',
    buyerBusinessName: '',
    buyerProvince: '',
    buyerAddress: '',
    buyerRegistrationType: ''
  });

  // State for custom province input
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
    sameAsBilling: true
  });

  // Product selection
  const [productSelection, setProductSelection] = useState({
    selectedProductId: '',
    selectedVariantId: '',
    quantity: 1,
    customPrice: '',
    // Weight-based fields
    weightInput: '',
    weightUnit: 'grams' as 'grams' | 'kg',
    // UOM field for non-weight based products
    uom: '',
    // Additional editable fields
    hsCode: '',
    itemSerialNumber: '',
    sroScheduleNumber: '',
    productName: '',
    productDescription: '',
    // Editable tax and price fields
    taxAmount: 0,
    taxPercentage: 0,
    priceIncludingTax: 0,
    priceExcludingTax: 0,
    extraTax: 0,
    furtherTax: 0,
    fedPayableTax: 0,
    discountAmount: 0,
    // Additional tax fields
    fixedNotifiedValueOrRetailPrice: 0,
    saleType: 'Goods at standard rate',
    // Product identification fields
    serialNumber: '',
    listNumber: '',
    bcNumber: '',
    lotNumber: '',
    expiryDate: ''
  });

  // Group product addon selection
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);

  // Driver selection
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  
  // Flag to prevent auto-population when editing an item
  const [isEditingItem, setIsEditingItem] = useState(false);
  
  // Tax calculation loading state
  const [isTaxCalculating, setIsTaxCalculating] = useState(false);
  
  // Loading state for adding products
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  // State for updating product data in database
  const [updateProductData, setUpdateProductData] = useState(false);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [updatingItemIds, setUpdatingItemIds] = useState<Set<string>>(new Set());

  // Dialog states for adding new items
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  
  // Combobox states
  const [customerComboboxOpen, setCustomerComboboxOpen] = useState(false);
  const [productComboboxOpen, setProductComboboxOpen] = useState(false);
  const [uomComboboxOpen, setUomComboboxOpen] = useState(false);
  
  // New user/product form data
  const [newUserData, setNewUserData] = useState({
    ntn: '',
    businessName: ''
  });
  const [newProductData, setNewProductData] = useState({
    name: '',
    price: '',
    stockQuantity: ''
  });
  
  // Loading states for adding new items
  const [addingUser, setAddingUser] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);

  // Normalize HS Code to pattern XXXX.YYYY (pad or insert zeros as needed)
  const normalizeHsCode = (raw: string | number | null | undefined): string => {
    if (raw === null || raw === undefined) return '';
    const str = String(raw).trim();
    if (!str) return '';
    // If contains a dot, pad decimals to 4 and cap integer part to 4 digits
    if (str.includes('.')) {
      const [left, right = ''] = str.split('.');
      const intDigits = (left || '').replace(/\D/g, '');
      const decDigits = right.replace(/\D/g, '');
      const intPart = (intDigits + '0000').slice(0, 4);
      const decPart = (decDigits + '0000').slice(0, 4);
      return `${intPart}.${decPart}`;
    }
    // No dot: use first 4 as left, remaining as right, then pad right to 4
    const digitsOnly = str.replace(/\D/g, '');
    if (!digitsOnly) return '';
    const intPart = (digitsOnly + '0000').slice(0, 4);
    const rest = digitsOnly.slice(4, 8);
    const decPart = (rest + '0000').slice(0, 4);
    return `${intPart}.${decPart}`;
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Clear selected addons when product changes and populate editable fields
  useEffect(() => {
    // Skip auto-population if we're editing an item (data should already be loaded)
    if (isEditingItem) {
      setIsEditingItem(false); // Reset flag after skipping
      return;
    }
    
    setSelectedAddons([]);
    
    // Populate editable fields when product is selected
    if (productSelection.selectedProductId) {
      const product = products.find(p => p.id === productSelection.selectedProductId);
      if (product) {
        const normalizedHs = normalizeHsCode(product.hsCode || '');
        setProductSelection(prev => ({
          ...prev,
          // Populate additional fields from product
          hsCode: normalizedHs,
          productName: product.name || '',
          productDescription: product.description || product.name || '', // Use description if available, fallback to name
          // Keep existing values for fields that should be manually entered
          itemSerialNumber: prev.itemSerialNumber,
          sroScheduleNumber: prev.sroScheduleNumber,
          // Populate tax and price fields
          taxAmount: product.taxAmount || 0,
          taxPercentage: product.taxPercentage || 0,
          priceIncludingTax: product.priceIncludingTax || 0,
          priceExcludingTax: product.priceExcludingTax || 0,
          extraTax: product.extraTax || 0,
          furtherTax: product.furtherTax || 0,
          fedPayableTax: product.fedPayableTax || 0,
          discountAmount: product.discount || 0,
          // Additional tax fields (reset to defaults)
          fixedNotifiedValueOrRetailPrice: 0,
          saleType: 'Goods at standard rate',
          // Populate product identification fields from product
          serialNumber: product.serialNumber || '',
          listNumber: product.listNumber || '',
          bcNumber: product.bcNumber || '',
          lotNumber: product.lotNumber || '',
          expiryDate: product.expiryDate || '',
          // Populate UOM from product
          uom: product.uom || ''
        }));
      }
    } else {
      // Reset editable fields when no product is selected
      setProductSelection(prev => ({
        ...prev,
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
        // Additional tax fields (reset to defaults)
        fixedNotifiedValueOrRetailPrice: 0,
        saleType: 'Goods at standard rate',
        // Reset product identification fields
        serialNumber: '',
        listNumber: '',
        bcNumber: '',
        lotNumber: '',
        expiryDate: ''
      }));
    }
  }, [productSelection.selectedProductId, products, isEditingItem]);

  // Scroll detection for sticky sidebar
  useEffect(() => {
    const handleScroll = () => {
      if (sidebarContainerRef.current && sidebarRef.current) {
        const containerRect = sidebarContainerRef.current.getBoundingClientRect();
        const shouldStick = containerRect.top <= 24; // 24px offset for top spacing
        setIsSticky(shouldStick);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchInitialData = async () => {
    try {
      const [productsRes, customersRes, stockSettingRes, driversRes, loyaltyRes, sellerInfoRes, fbrSettingsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/users'),
        fetch('/api/settings/stock-management'),
        fetch('/api/drivers/available?includeAll=true'),
        fetch('/api/settings/loyalty'),
        fetch('/api/seller-info'),
        fetch('/api/settings/fbr')
      ]);

      const productsData = await productsRes.json();
      const customersData = await customersRes.json();
      const stockData = await stockSettingRes.json();
      const driversData = await driversRes.json();
      const loyaltyData = await loyaltyRes.json();
      const sellerInfoData = await sellerInfoRes.json();
      const fbrSettingsData = await fbrSettingsRes.json();

      // Process products to include variants
      const processedProducts = await Promise.all(
        productsData.map(async (productItem: any) => {
          const product = productItem.product;
          
          // Convert price to number
          product.price = Number(product.price) || 0;
          
          if (product.productType === 'variable') {
            const variantsRes = await fetch(`/api/product-variants?productId=${product.id}`);
            const variantsData = await variantsRes.json();
            product.variants = variantsData.map((v: any) => ({
              ...v.variant,
              price: Number(v.variant.price) || 0 // Convert variant price to number
            }));
          } else if (product.productType === 'group') {
            const addonsRes = await fetch(`/api/product-addons?productId=${product.id}`);
            const addonsData = await addonsRes.json();
            product.addons = addonsData.map((a: any) => ({
              ...a.productAddon,
              price: Number(a.productAddon.price) || 0, // Convert addon price to number
              addon: {
                ...a.addon,
                price: Number(a.addon.price) || 0
              }
            }));
          }
          
          return product;
        })
      );

      setProducts(processedProducts);
      setCustomers(customersData);
      setStockManagementEnabled(stockData.stockManagementEnabled ?? true);
      setAvailableDrivers(driversData.drivers || []);
      
      // Set loyalty settings
      console.log('Loyalty API response:', loyaltyData);
      if (loyaltyData.success) {
        const newSettings = {
          enabled: loyaltyData.settings.loyalty_enabled?.value === 'true' || loyaltyData.settings.loyalty_enabled?.value === true,
          earningRate: Number(loyaltyData.settings.points_earning_rate?.value) || 1,
          earningBasis: loyaltyData.settings.points_earning_basis?.value || 'subtotal',
          redemptionValue: Number(loyaltyData.settings.points_redemption_value?.value) || 0.01,
          maxRedemptionPercent: Number(loyaltyData.settings.points_max_redemption_percent?.value) || 50,
          redemptionMinimum: Number(loyaltyData.settings.points_redemption_minimum?.value) || 100,
          minimumOrder: Number(loyaltyData.settings.points_minimum_order?.value) || 0
        };
        console.log('Setting loyalty settings:', newSettings);
        setLoyaltySettings(newSettings);
      } else {
        console.log('Loyalty settings fetch failed:', loyaltyData);
      }
      
      // Set seller information from environment variables
      if (sellerInfoData && !sellerInfoData.error) {
        console.log('Setting seller info:', sellerInfoData);
        setSellerInfo(sellerInfoData);
        
        // Set custom seller province flag if the loaded province is not in predefined list
        const predefinedSellerProvinces = ["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Capital Territory", "Azad Jammu and Kashmir", "Gilgit-Baltistan", "N/A"];
        if (sellerInfoData.sellerProvince && !predefinedSellerProvinces.includes(sellerInfoData.sellerProvince)) {
          setIsCustomSellerProvince(true);
        }
      } else {
        console.log('Seller info fetch failed or empty:', sellerInfoData);
      }

      // Set production token from FBR settings
      if (fbrSettingsData && fbrSettingsData.success && fbrSettingsData.settings) {
        console.log('Setting production token from FBR settings');
        setProductionToken(fbrSettingsData.settings.fbrProductionToken || '');
      } else {
        console.log('FBR settings fetch failed or empty:', fbrSettingsData);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  // Addon management functions
  const addSelectedAddon = (addonId: string, addonTitle: string, price: number) => {
    const isAlreadySelected = selectedAddons.some(addon => addon.addonId === addonId);
    if (isAlreadySelected) return;

    setSelectedAddons([...selectedAddons, {
      addonId,
      addonTitle,
      price,
      quantity: 1
    }]);
  };

  const updateAddonQuantity = (addonId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedAddons(selectedAddons.filter(addon => addon.addonId !== addonId));
      return;
    }

    setSelectedAddons(selectedAddons.map(addon => 
      addon.addonId === addonId 
        ? { ...addon, quantity }
        : addon
    ));
  };

  const removeSelectedAddon = (addonId: string) => {
    setSelectedAddons(selectedAddons.filter(addon => addon.addonId !== addonId));
  };

  const clearSelectedAddons = () => {
    setSelectedAddons([]);
  };

  // Helper function to clean numeric values (avoid 0.00 for empty fields)
  const cleanNumericValue = (value: any) => {
    if (value === undefined || value === null || value === '' || value === 0) {
      return null;
    }
    // Convert string values to numbers
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }
    return value;
  };

  // Function to calculate tax amount with loading indicator
  const calculateTaxAmount = async (priceExcludingTax: number, taxPercentage: number) => {
    if (priceExcludingTax <= 0 || taxPercentage <= 0) {
      return 0;
    }

    setIsTaxCalculating(true);
    
    // Add a small delay to show loading indicator
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const taxAmount = (priceExcludingTax * taxPercentage) / 100;
    const roundedTaxAmount = Math.round(taxAmount * 100) / 100; // Round to 2 decimal places
    
    setIsTaxCalculating(false);
    return roundedTaxAmount;
  };

  // Function to update product data in database
  const updateProductInDatabase = async (productId: string, itemId?: string) => {
    if (itemId) {
      setUpdatingItemIds(prev => new Set(prev).add(itemId));
    } else {
      setIsUpdatingProduct(true);
    }
    
    try {
      const updateData = {
        hsCode: productSelection.hsCode || null,
        description: productSelection.productDescription || null,
        taxAmount: cleanNumericValue(productSelection.taxAmount),
        taxPercentage: cleanNumericValue(productSelection.taxPercentage),
        priceIncludingTax: cleanNumericValue(productSelection.priceIncludingTax),
        priceExcludingTax: cleanNumericValue(productSelection.priceExcludingTax),
        extraTax: cleanNumericValue(productSelection.extraTax),
        furtherTax: cleanNumericValue(productSelection.furtherTax),
        fedPayableTax: cleanNumericValue(productSelection.fedPayableTax),
        fixedNotifiedValueOrRetailPrice: cleanNumericValue(productSelection.fixedNotifiedValueOrRetailPrice),
        saleType: productSelection.saleType || 'Goods at standard rate',
        uom: productSelection.uom || null
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      // Update the local products array to reflect the changes
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, ...updateData }
            : product
        )
      );

      console.log('Product updated successfully in database');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product data in database. Please try again.');
      throw error; // Re-throw to handle in calling function
    } finally {
      if (itemId) {
        setUpdatingItemIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      } else {
        setIsUpdatingProduct(false);
      }
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    setOrderData({ ...orderData, customerId });
    
    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setOrderData(prev => ({ 
          ...prev, 
          email: customer.email, 
          phone: customer.phone || '',
          // Buyer name from user table name; fallback to first/last
          buyerFirstName: (customer.name && customer.name.trim()) ? customer.name : (customer.firstName || ''),
          buyerLastName: customer.lastName || '',
          buyerFullName: (customer.name && customer.name.trim()) ? customer.name : `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
          // Populate buyer fields from selected customer's buyer information
          buyerNTNCNIC: customer.buyerNTNCNIC || '',
          buyerBusinessName: customer.buyerBusinessName || '',
          buyerProvince: customer.buyerProvince || '',
          buyerAddress: customer.buyerAddress || '',
          buyerRegistrationType: customer.buyerRegistrationType || ''
        }));
          
          // Set custom province flag if the loaded province is not in predefined list
          const predefinedProvinces = ["Punjab", "Sindh", "Khyber Pakhtunkhwa (KPK)", "Balochistan", "Capital Territory", "Azad Jammu & Kashmir (AJK)", "Gilgit-Baltistan (GB)", "N/A"];
          if (customer.buyerProvince && !predefinedProvinces.includes(customer.buyerProvince)) {
            setIsCustomProvince(true);
          }
        setCustomerInfo(prev => ({
          ...prev,
          isGuest: false,
          billingFirstName: customer.firstName || '',
          billingLastName: customer.lastName || '',
          billingAddress1: customer.address || '',
          billingCity: customer.city || '',
          billingState: customer.state || '',
          billingPostalCode: customer.postalCode || '',
          billingCountry: customer.country || 'US'
        }));
        
        // Fetch customer loyalty points if loyalty is enabled
        if (loyaltySettings.enabled) {
          fetchCustomerPoints(customerId);
        }
      }
    } else {
      setCustomerInfo(prev => ({ ...prev, isGuest: true }));
      setOrderData(prev => ({ ...prev, email: '', phone: '', pointsToRedeem: 0, pointsDiscountAmount: 0, useAllPoints: false }));
      setCustomerPoints({ availablePoints: 0, totalPointsEarned: 0, totalPointsRedeemed: 0 });
    }
  };

  // Fetch customer loyalty points (simplified)
  const fetchCustomerPoints = async (customerId: string) => {
    try {
      const response = await fetch(`/api/loyalty/points-simple?userId=${customerId}`);
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

  // Helper function to get price per gram based on product's base weight unit
  const getPricePerGram = (product: Product): number => {
    const pricePerUnit = Number(product.pricePerUnit) || 0;
    if (product.baseWeightUnit === 'kg') {
      // If stored per kg, convert to per gram
      return pricePerUnit / 1000;
    }
    // If stored per gram or undefined, use as is
    return pricePerUnit;
  };

  // Driver assignment functions
  const handleDriverAssignmentTypeChange = (type: 'manual' | 'automatic') => {
    setOrderData(prev => ({
      ...prev,
      assignmentType: type,
      assignedDriverId: type === 'automatic' ? '' : prev.assignedDriverId
    }));
  };

  const handleAssignDriver = async (orderId: string) => {
    if (!orderId) return;

    try {
      const response = await fetch('/api/drivers/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          driverId: orderData.assignmentType === 'manual' ? orderData.assignedDriverId : null,
          assignedBy: 'admin', // This should be the current admin user ID
          assignmentType: orderData.assignmentType,
          priority: 'normal'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Driver assigned successfully:', data);
        return data;
      } else {
        console.warn('Failed to assign driver:', data.error || 'Unknown error');
        // Don't throw error - just log warning and continue
        return null;
      }
    } catch (error) {
      console.warn('Error in driver assignment request:', error);
      // Don't throw error - just log and continue
      return null;
    }
  };

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

    // Validate quantity or weight based on product type
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

    // For group products, validate that addons are selected if base price is 0
    if (product.productType === 'group') {
      const basePrice = Number(product.price) || 0;
      if (basePrice === 0 && selectedAddons.length === 0) {
        alert('Please select at least one addon for this group product');
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

    // Handle weight-based pricing
    if (isWeightBased) {
      weightInGrams = convertToGrams(parseFloat(weightInput), weightUnit);
      const pricePerGram = getPricePerGram(product);
      price = calculateWeightBasedPrice(weightInGrams, pricePerGram);
      finalQuantity = 1; // For weight-based products, quantity is always 1 (the weight is the measure)
    }

    // Use custom price if provided (overrides weight-based calculation)
    if (customPrice) {
      price = parseFloat(customPrice);
    }

    // Stock validation when stock management is enabled
    if (stockManagementEnabled) {
      // Check if we have inventory information for this product/variant
      const inventoryKey = selectedVariantId ? `${selectedProductId}-${selectedVariantId}` : selectedProductId;
      
      // For now, we'll add a warning but allow the order to proceed
      // The actual validation will happen on the server side
      if (variant && variant.inventoryQuantity !== undefined) {
        if (variant.inventoryQuantity < quantity) {
          if (!confirm(`Warning: Requested quantity (${quantity}) exceeds available stock (${variant.inventoryQuantity}). Do you want to continue? This may fail when creating the order.`)) {
            setIsAddingProduct(false);
            return;
          }
        }
      }
    }

    // Calculate total price including addons for group products
    // Check if we have manually configured tax values in productSelection (already include quantity)
    const priceIncludingTax = typeof productSelection.priceIncludingTax === 'string' 
      ? parseFloat(productSelection.priceIncludingTax) || 0 
      : productSelection.priceIncludingTax || 0;
    const priceExcludingTax = typeof productSelection.priceExcludingTax === 'string' 
      ? parseFloat(productSelection.priceExcludingTax) || 0 
      : productSelection.priceExcludingTax || 0;
    const taxAmount = typeof productSelection.taxAmount === 'string' 
      ? parseFloat(productSelection.taxAmount) || 0 
      : productSelection.taxAmount || 0;
    
    // If we have manually configured values, use them exactly as they are (no quantity multiplication)
    const hasManualPricing = priceIncludingTax > 0 || priceExcludingTax > 0 || taxAmount > 0;
    
    let totalPrice;
    if (hasManualPricing) {
      // Use the manually configured values exactly as they are - they already include all calculations
      totalPrice = priceIncludingTax || (priceExcludingTax + taxAmount);
      
      // For group products with addons, still need to add addon costs
      if (product.productType === 'group' && selectedAddons.length > 0) {
        const addonsPrice = selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
        totalPrice = totalPrice + (addonsPrice * finalQuantity);
      }
    } else {
      // Fall back to automatic calculation based on base price
      totalPrice = price * finalQuantity;
      
      // Handle addons for group products
      if (product.productType === 'group' && selectedAddons.length > 0) {
        const addonsPrice = selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
        totalPrice = (price + addonsPrice) * finalQuantity;
      }
    }

    // Generate a unique ID for this item to track updates
    const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newItem: OrderItem = {
      id: itemId, // Add unique ID for tracking
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
      addons: product.productType === 'group' && selectedAddons.length > 0 ? [...selectedAddons] : undefined,
      // Weight-based fields
      isWeightBased,
      weightQuantity: isWeightBased ? weightInGrams : undefined,
      weightUnit: isWeightBased ? weightUnit : undefined,
      // UOM for non-weight based products
      uom: !isWeightBased ? productSelection.uom : undefined,
      // Additional editable fields
      itemSerialNumber: productSelection.itemSerialNumber || undefined,
      sroScheduleNumber: productSelection.sroScheduleNumber || undefined,
      // Product identification fields
      serialNumber: productSelection.serialNumber || undefined,
      listNumber: productSelection.listNumber || undefined,
      bcNumber: productSelection.bcNumber || undefined,
      lotNumber: productSelection.lotNumber || undefined,
      expiryDate: productSelection.expiryDate || undefined,
      // Tax and discount fields from editable selection
      taxAmount: productSelection.taxAmount || 0,
      taxPercentage: productSelection.taxPercentage || 0,
      priceIncludingTax: productSelection.priceIncludingTax || 0,
      priceExcludingTax: productSelection.priceExcludingTax || 0,
      extraTax: productSelection.extraTax || 0,
      furtherTax: productSelection.furtherTax || 0,
      fedPayableTax: productSelection.fedPayableTax || 0,
      discount: productSelection.discountAmount || 0,
      // Additional tax fields
      fixedNotifiedValueOrRetailPrice: productSelection.fixedNotifiedValueOrRetailPrice || 0,
      saleType: productSelection.saleType || 'Goods at standard rate'
    };

    // Add item to the list immediately
    setOrderItems([...orderItems, newItem]);
    
    // Set supplier_id from the product if not already set
    if (product.supplierId && !orderData.supplierId) {
      setOrderData(prev => ({...prev, supplierId: product.supplierId || ''}));
    }
    
    // Reset selection immediately so user can continue adding products
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
      // Additional tax fields (reset to defaults)
      fixedNotifiedValueOrRetailPrice: 0,
      saleType: 'Goods at standard rate',
      // Reset product identification fields
      serialNumber: '',
      listNumber: '',
      bcNumber: '',
      lotNumber: '',
      expiryDate: ''
    });
    clearSelectedAddons();
    
    // Reset the update checkbox after successful add
    const shouldUpdateDatabase = updateProductData;
    setUpdateProductData(false);
    
    // Update product data in database in the background if checkbox was checked
    if (shouldUpdateDatabase && selectedProductId) {
      // Don't await this - let it run in background
      updateProductInDatabase(selectedProductId, itemId).catch(error => {
        console.error('Background database update failed:', error);
        // Remove the item from updating state on error
        setUpdatingItemIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      });
    }
    
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };


  const handleEditItem = (index: number) => {
    const item = orderItems[index];
    
    // Set flag to prevent auto-population from product data
    setIsEditingItem(true);
    
    // Load the item's data into the form for editing
    setProductSelection(prevSelection => {
      return {
        // Start with current form state to preserve any unsaved manual entries
        ...prevSelection,
        
        // Core item identification - always load from item
        selectedProductId: item.productId,
        selectedVariantId: item.variantId || '',
        quantity: item.quantity,
        
        // Weight data - load from item if available
        weightInput: item.isWeightBased && item.weightQuantity ? String(item.weightQuantity) : prevSelection.weightInput,
        weightUnit: (item.weightUnit as 'grams' | 'kg') || prevSelection.weightUnit,
        
        // UOM - load from item if available
        uom: item.uom || prevSelection.uom,
        
        // Product-specific fields - load from item, but keep manual entries if they exist and are different
        hsCode: item.hsCode || prevSelection.hsCode,
        itemSerialNumber: item.itemSerialNumber || prevSelection.itemSerialNumber,
        sroScheduleNumber: item.sroScheduleNumber || prevSelection.sroScheduleNumber,
        productName: item.productName || prevSelection.productName,
        productDescription: item.productDescription || prevSelection.productDescription,
        
        // Tax and pricing data - load from item
        taxAmount: item.taxAmount !== undefined ? item.taxAmount : prevSelection.taxAmount,
        taxPercentage: item.taxPercentage !== undefined ? item.taxPercentage : prevSelection.taxPercentage,
        priceIncludingTax: item.priceIncludingTax !== undefined ? item.priceIncludingTax : prevSelection.priceIncludingTax,
        priceExcludingTax: item.priceExcludingTax !== undefined ? item.priceExcludingTax : prevSelection.priceExcludingTax,
        extraTax: item.extraTax !== undefined ? item.extraTax : prevSelection.extraTax,
        furtherTax: item.furtherTax !== undefined ? item.furtherTax : prevSelection.furtherTax,
        fedPayableTax: item.fedPayableTax !== undefined ? item.fedPayableTax : prevSelection.fedPayableTax,
        discountAmount: item.discount !== undefined ? item.discount : prevSelection.discountAmount,
        fixedNotifiedValueOrRetailPrice: item.fixedNotifiedValueOrRetailPrice !== undefined ? item.fixedNotifiedValueOrRetailPrice : prevSelection.fixedNotifiedValueOrRetailPrice,
        saleType: item.saleType || prevSelection.saleType,
      };
    });
    
    // Handle addons - only replace if item has addons, otherwise preserve existing
    if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
      setSelectedAddons([...item.addons]);
    }
    // Note: Don't clear selectedAddons if item has no addons - preserve existing selection
    
    // Remove the item from the list so it can be re-added after editing
    handleRemoveItem(index);
  };

  const getAddonTitle = (addon: any, index: number) => {
    return addon.addonTitle || addon.title || addon.name || `Addon ${index + 1}`;
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
    const currentTotals = calculateTotals();
    const maxAllowedDiscount = (currentTotals.subtotal - currentTotals.discountAmount) * (loyaltySettings.maxRedemptionPercent / 100);
    
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
      const currentTotals = calculateTotals();
      const maxAllowedDiscount = (currentTotals.subtotal - currentTotals.discountAmount) * (loyaltySettings.maxRedemptionPercent / 100);
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

  const calculatePointsToEarn = () => {
    console.log('calculatePointsToEarn called:', {
      loyaltyEnabled: loyaltySettings.enabled,
      customerId: orderData.customerId,
      loyaltySettings,
      orderData: { customerId: orderData.customerId, status: orderData.status }
    });

    if (!loyaltySettings.enabled) {
      console.log('Points calculation skipped - loyalty disabled');
      return 0;
    }
    
    const totals = calculateTotals();
    const baseAmount = loyaltySettings.earningBasis === 'total' ? totals.totalAmount : totals.subtotal;
    
    console.log('Points calculation:', {
      totals,
      baseAmount,
      earningBasis: loyaltySettings.earningBasis,
      earningRate: loyaltySettings.earningRate,
      minimumOrder: loyaltySettings.minimumOrder
    });
    
    if (baseAmount < loyaltySettings.minimumOrder) {
      console.log('Points calculation skipped - below minimum order amount');
      return 0;
    }
    
    const points = Math.floor(baseAmount * loyaltySettings.earningRate);
    console.log('Points to earn:', points);
    return points;
  };

  const calculateTotals = () => {
    // Calculate total using 'Price including tax' for each product
    const totalAmount = orderItems.reduce((sum, item) => {
      // Use priceIncludingTax if available, otherwise fall back to regular price
      // Ensure numeric values by parsing strings to numbers
      const priceIncludingTax = typeof item.priceIncludingTax === 'string' 
        ? parseFloat(item.priceIncludingTax) || 0 
        : item.priceIncludingTax || 0;
      
      // If we have priceIncludingTax, it's already a total (includes quantity), so use it directly
      // Only multiply by quantity if we're using the unit price fallback
      let itemTotal;
      if (priceIncludingTax > 0) {
        itemTotal = priceIncludingTax; // Already a total amount
      } else {
        itemTotal = item.price * item.quantity; // Calculate from unit price
      }
      
      // Add addon prices for group products
      if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
        const addonsTotal = item.addons.reduce((addonSum, addon) => 
          addonSum + (addon.price * addon.quantity), 0
        );
        itemTotal += addonsTotal * item.quantity;
      }
      
      return sum + itemTotal;
    }, 0);
    
    // Apply order-level discounts
    const discountAmount = orderData.discountType === 'percentage' 
      ? totalAmount * (orderData.discountAmount / 100)
      : orderData.discountAmount;
    
    // Apply points discount
    const pointsDiscountAmount = orderData.pointsDiscountAmount || 0;
    
    // Final total after all discounts
    const finalTotal = Math.max(0, totalAmount - discountAmount - pointsDiscountAmount);

    return {
      totalAmount: finalTotal,
      discountAmount,
      pointsDiscountAmount,
      // Keep these for backward compatibility but they're not used in new summary
      subtotal: totalAmount,
      taxAmount: 0,
      afterPointsDiscount: finalTotal
    };
  };

  // Add new user function
  const handleAddNewUser = async () => {
    if (!newUserData.ntn && !newUserData.businessName) {
      alert('Please fill in at least NTN/CNIC or business name');
      return;
    }

    setAddingUser(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserData.businessName || `Customer-${newUserData.ntn}` || `Customer-${Date.now()}`,
          email: `customer-${Date.now()}@temp.local`, // Temporary email since it's not provided
          firstName: newUserData.businessName || 'Customer',
          lastName: '',
          buyerNTNCNIC: newUserData.ntn,
          buyerBusinessName: newUserData.businessName,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const newUser = await response.json();
      
      // Add to customers list and select it
      setCustomers(prev => [...prev, newUser]);
      setOrderData(prev => ({ 
        ...prev, 
        customerId: newUser.id,
        email: newUser.email || '', // Allow empty email
        phone: newUser.phone || '',
        // Auto-fill buyer section with the newly created user info
        buyerNTNCNIC: newUserData.ntn,
        buyerBusinessName: newUserData.businessName,
        buyerFirstName: newUserData.businessName || '',
        buyerLastName: '',
        buyerFullName: newUserData.businessName || '',
      }));
      
      // Reset form and close dialog
      setNewUserData({ ntn: '', businessName: '' });
      setShowAddUserDialog(false);
      setCustomerComboboxOpen(false);
    } catch (error: any) {
      alert('Error creating user: ' + error.message);
    } finally {
      setAddingUser(false);
    }
  };

  // Add new product function
  const handleAddNewProduct = async () => {
    if (!newProductData.name || !newProductData.price) {
      alert('Please fill in both name and price');
      return;
    }

    const price = parseFloat(newProductData.price);
    if (isNaN(price) || price < 0) {
      alert('Please enter a valid price');
      return;
    }

    const stockQuantity = parseFloat(newProductData.stockQuantity) || 0;
    if (stockQuantity < 0) {
      alert('Please enter a valid stock quantity (0 or greater)');
      return;
    }

    setAddingProduct(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductData.name,
          price: price,
          productType: 'simple',
          isActive: true,
          stockManagementType: 'quantity',
          initialStock: stockQuantity
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      const responseData = await response.json();
      const newProduct = responseData.product || responseData;
      
      // Add to products list and select it
      setProducts(prev => [...prev, newProduct]);
      setProductSelection(prev => ({ 
        ...prev, 
        selectedProductId: newProduct.id,
        productName: newProduct.name
      }));
      
      // Reset form and close dialog
      setNewProductData({ name: '', price: '', stockQuantity: '' });
      setShowAddProductDialog(false);
      setProductComboboxOpen(false);
    } catch (error: any) {
      alert('Error creating product: ' + error.message);
    } finally {
      setAddingProduct(false);
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

    const totals = calculateTotals();
    
    const submitData = {
      userId: orderData.customerId || null,
      email: orderData.email,
      phone: orderData.phone,
      status: orderData.status,
      paymentStatus: orderData.paymentStatus,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      shippingAmount: orderData.shippingAmount,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
      currency: orderData.currency,
      notes: orderData.notes,
      
      // Supplier field
      supplierId: orderData.supplierId || null,
      
      // Invoice and validation fields
      invoiceType: orderData.invoiceType || null,
      invoiceRefNo: orderData.invoiceRefNo || null,
      scenarioId: orderData.scenarioId || null,
      invoiceNumber: orderData.invoiceNumber || null,
      invoiceDate: orderData.invoiceDate || null,
      validationResponse: orderData.validationResponse || null,
      
      // Driver assignment fields
      assignedDriverId: orderData.assignedDriverId || null,
      deliveryStatus: orderData.deliveryStatus,
      
      // Loyalty points fields
      pointsToRedeem: orderData.pointsToRedeem,
      pointsDiscountAmount: orderData.pointsDiscountAmount,
      
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
      
      // Order items
      items: orderItems,
      
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
      skipFbrSubmission
    };

    // Show the JSON preview
    setDebugJson({
      orderData: submitData,
      fbrPayload: null,
      fbrError: null,
      showDebug: false
    });
    
    setError(''); // Clear any existing errors
  };

  const performOrderSubmission = async () => {
    setSubmitting(true);
    setError('');

    if (orderItems.length === 0) {
      setError('Please add at least one product to the order');
      setSubmitting(false);
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

    if (!orderData.email) {
      setError('Please provide customer email');
      setSubmitting(false);
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

    // Validate production token if production mode is enabled
    if (isProductionSubmission && !skipFbrSubmission && !productionToken.trim()) {
      setError('Please provide production environment token');
      setSubmitting(false);
      setTimeout(() => {
        if (errorRef.current) {
          errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    try {
      const totals = calculateTotals();
      
      const submitData = {
        userId: orderData.customerId || null,
        email: orderData.email,
        phone: orderData.phone,
        status: orderData.status,
        paymentStatus: orderData.paymentStatus,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        shippingAmount: orderData.shippingAmount,
        discountAmount: totals.discountAmount,
        totalAmount: totals.totalAmount,
        currency: orderData.currency,
        notes: orderData.notes,
        
        // Supplier field
        supplierId: orderData.supplierId || null,
        
        // Invoice and validation fields
        invoiceType: orderData.invoiceType || null,
        invoiceRefNo: orderData.invoiceRefNo || null,
        scenarioId: orderData.scenarioId || null,
        invoiceNumber: orderData.invoiceNumber || null,
        invoiceDate: orderData.invoiceDate || null,
        validationResponse: orderData.validationResponse || null,
        
        // Driver assignment fields
        assignedDriverId: orderData.assignedDriverId || null,
        deliveryStatus: orderData.deliveryStatus,
        
        // Loyalty points fields
        pointsToRedeem: orderData.pointsToRedeem,
        pointsDiscountAmount: orderData.pointsDiscountAmount,
        
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
        
        // Order items
        items: orderItems,
        
        // Buyer fields (from selected customer)
        buyerNTNCNIC: orderData.buyerNTNCNIC || null,
        buyerBusinessName: orderData.buyerBusinessName || null,
        buyerProvince: orderData.buyerProvince || null,
        buyerAddress: orderData.buyerAddress || null,
        buyerRegistrationType: orderData.buyerRegistrationType || null,
        
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
        productionToken: isProductionSubmission ? productionToken : null
      };

      // 🔍 DEBUG: Capture the order data for display
      setDebugJson(prev => ({
        ...prev,
        orderData: submitData,
        fbrPayload: null,
        fbrError: null,
        showDebug: false
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const data = await response.json();
        
        // 🔍 DEBUG: Capture FBR error data for display
        if (data.step === 'fbr_validation' || data.step === 'fbr_connection') {
          setDebugJson(prev => ({
            ...prev,
            fbrError: data.fbrError,
            fbrPayload: data.fbrError?.fbrInvoice || null
          }));
        }
        
        // Handle FBR-specific errors with more detail
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
        
        throw new Error(data.error || 'Failed to create order');
      }

      const orderResponse = await response.json();
      const orderId = orderResponse.orderId;

      // Create driver assignment record if driver is assigned
      if (orderData.assignedDriverId && orderData.assignmentType === 'manual') {
        try {
          await handleAssignDriver(orderId);
        } catch (driverError) {
          console.warn('Order created but driver assignment failed:', driverError);
          // Don't fail the order creation if driver assignment fails
          // The order is still created successfully, just without driver assignment
        }
      }

      // Redeem loyalty points if any were used
      if (orderData.pointsToRedeem > 0 && orderData.customerId) {
        try {
          const pointsResponse = await fetch('/api/loyalty/points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'redeem_points',
              userId: orderData.customerId,
              orderId: orderId,
              pointsToRedeem: orderData.pointsToRedeem,
              discountAmount: orderData.pointsDiscountAmount,
              description: `Redeemed at checkout for order #${orderResponse.orderNumber || orderId}`
            })
          });
          
          if (!pointsResponse.ok) {
            console.warn('Order created but points redemption failed:', await pointsResponse.text());
          }
        } catch (pointsError) {
          console.warn('Order created but points redemption failed:', pointsError);
          // Don't fail the order creation if points redemption fails
        }
      }

      // Show success message and redirect to invoice page
      if (orderResponse.fbrInvoiceNumber) {
        console.log('✅ Order created with FBR Digital Invoice:', {
          orderNumber: orderResponse.orderNumber,
          fbrInvoiceNumber: orderResponse.fbrInvoiceNumber,
          orderId: orderResponse.orderId || orderId
        });
        
        // Show success message and redirect to invoice page
        //alert(`Order created successfully!\n\nOrder Number: ${orderResponse.orderNumber}\nFBR Invoice Number: ${orderResponse.fbrInvoiceNumber}\n\nRedirecting to invoice page...`);
        router.push(`/orders/${orderResponse.orderId || orderId}/invoice`);
      } else {
        console.log('✅ Order created successfully (no FBR submission):', {
          orderNumber: orderResponse.orderNumber,
          orderId: orderResponse.orderId || orderId
        });
        
        // Redirect to invoice page even without FBR
       //alert(`Order created successfully!\n\nOrder Number: ${orderResponse.orderNumber}\n\nRedirecting to invoice page...`);
        router.push(`/orders/${orderResponse.orderId || orderId}/invoice`);
      }
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false); // Only set to false on error
      
      // Scroll to error after a brief delay to ensure the error is rendered
      setTimeout(() => {
        if (errorRef.current) {
          errorRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        } else {
          // Fallback: scroll to top if error ref is not available
          window.scrollTo({ 
            top: 0, 
            behavior: 'smooth' 
          });
        }
      }, 100);
    }
    // Don't set submitting to false on success - let it stay until redirect
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
        invoiceDate: orderData.invoiceDate ? formatDateForFbr(orderData.invoiceDate) : undefined,
        invoiceRefNo: orderData.invoiceRefNo,
        subtotal: parseFloat(totals.subtotal.toString()),
        totalAmount: parseFloat(totals.totalAmount.toString()),
        taxAmount: parseFloat((totals.taxAmount || 0).toString()),
        currency: orderData.currency,
        items: orderItems,
        buyerFirstName: orderData.buyerFirstName || customerInfo.billingFirstName || customerInfo.shippingFirstName || '',
        buyerLastName: orderData.buyerLastName || customerInfo.billingLastName || customerInfo.shippingLastName || '',
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

      // Generate FBR preview by calling the mapper
      const response = await fetch('/api/fbr/submit?preview=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderForPreview)
      });

      if (response.ok) {
        const result = await response.json();
        const raw = result.fbrInvoice || result;
        // Enhance preview with quantity-adjusted totals for display
        const enhanced = { ...raw } as any;
        // Ensure buyer name exists in preview
        const computedBuyerName = (orderData.buyerFullName || `${(customerInfo.billingFirstName || customerInfo.shippingFirstName || '').trim()} ${(customerInfo.billingLastName || customerInfo.shippingLastName || '').trim()}`.trim()) || '';
        if (!enhanced.buyerFullName) enhanced.buyerFullName = computedBuyerName;
        if (!enhanced.buyerFirstName) enhanced.buyerFirstName = orderData.buyerFirstName || customerInfo.billingFirstName || customerInfo.shippingFirstName || '';
        if (!enhanced.buyerLastName) enhanced.buyerLastName = orderData.buyerLastName || customerInfo.billingLastName || customerInfo.shippingLastName || '';
        if (Array.isArray(enhanced.items)) {
          enhanced.items = enhanced.items.map((it: any, idx: number) => {
            const src = orderItems[idx] || {} as any;
            const qty = Number(src.quantity ?? it.quantity ?? 1) || 1;
            const pct = Number(src.taxPercentage ?? it.taxPercentage ?? 0) || 0;
            
            // Use stored total values directly (they are already calculated with quantity)
            const totalEx = Number(src.priceExcludingTax ?? it.priceExcludingTax ?? 0) || 0;
            const totalInc = Number(src.priceIncludingTax ?? it.priceIncludingTax ?? 0) || 0;
            const totalTax = Number(src.taxAmount ?? it.taxAmount ?? 0) || 0;
            
            // If we don't have total values, fall back to calculating from unit price
            const finalTotalEx = totalEx > 0 ? totalEx : ((Number(src.price ?? it.rate ?? 0) || 0) * qty);
            const finalTotalTax = totalTax > 0 ? totalTax : (finalTotalEx * pct / 100);
            const finalTotalInc = totalInc > 0 ? totalInc : (finalTotalEx + finalTotalTax);
            
            return {
              ...it,
              quantity: qty,
              priceExcludingTaxTotal: finalTotalEx,
              priceIncludingTaxTotal: finalTotalInc,
              salesTaxApplicable: finalTotalTax, // for display
              valueSalesExcludingST: finalTotalEx,
              totalValues: finalTotalInc,
              taxPercentage: pct, // Ensure taxPercentage is a number, not string
            };
          });
        }
        setFbrPreviewData(enhanced);
        setFbrJsonPreview(enhanced); // Store adjusted JSON for display
      } else {
        console.error('Failed to generate FBR preview');
        setFbrPreviewData(null);
        setFbrJsonPreview(null);
      }
    } catch (error) {
      console.error('Error generating FBR preview:', error);
      setFbrPreviewData(null);
      setFbrJsonPreview(null);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

  const handleProductionConfirm = async () => {
    setShowProductionConfirmation(false);
    await performOrderSubmission();
  };

  const handleProductionCancel = () => {
    setShowProductionConfirmation(false);
  };

  const handleOrderConfirm = async () => {
    setShowOrderConfirmation(false);
    await performOrderSubmission();
  };

  const handleOrderCancel = () => {
    setShowOrderConfirmation(false);
    setFbrPreviewData(null);
    setFbrJsonPreview(null);
  };

  const selectedProduct = products.find(p => p.id === productSelection.selectedProductId);
  const totals = calculateTotals();

  if (loading) return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🛒 Create New Order</h1>
          <p className="text-muted-foreground mt-1">Add products and configure order details</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/orders')}
          className="gap-2"
        >
          ← Back to Orders
        </Button>
      </div>

      {error && (
        <Card ref={errorRef} className="mb-6 border-destructive">
          <CardContent className="">
            <div className="flex items-center gap-2 text-destructive">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🔍 DEBUG: JSON Display */}
      {(debugJson.orderData || debugJson.fbrPayload || debugJson.fbrError) && (
        <div className="mb-6">
          {!debugJson.showDebug ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebugJson(prev => ({ ...prev, showDebug: true }))}
                className="border-muted bg-muted/30"
              >
                Show Debug
              </Button>
            </div>
          ) : (
            <Card className="border-muted bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900">🔍 Debug: FBR Submission Data</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDebugJson(prev => ({ ...prev, showDebug: false }))}
                  >
                    Hide Debug
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {debugJson.orderData && (
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">📤 Order Data (Input to FBR Mapper):</h4>
                      <pre className=" p-3 rounded border text-xs overflow-auto max-h-96">
                        {JSON.stringify(debugJson.orderData, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {debugJson.fbrPayload && (
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">📋 Generated FBR JSON Payload:</h4>
                      <pre className=" p-3 rounded border text-xs overflow-auto max-h-96">
                        {JSON.stringify(debugJson.fbrPayload, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {debugJson.fbrError && (
                    <div>
                      <h4 className="font-medium text-red-800 mb-2">❌ FBR Error Response:</h4>
                      <pre className="bg-muted p-3 rounded border text-xs overflow-auto max-h-96">
                        {JSON.stringify(debugJson.fbrError, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
{/*
      {!stockManagementEnabled && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h3 className="font-medium text-orange-800">Stock Management Disabled</h3>
                <p className="text-sm text-orange-700 mt-1">
                Orders can be created without stock limitations. Products will not show inventory levels or availability warnings.
              </p>
            </div>
          </div>
          </CardContent>
        </Card>
      )}
*/}
      {stockManagementEnabled ? (
        <Card className="mb-6 border-muted bg-muted/30">
          <CardContent className="">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h3 className="font-medium text-blue-800">Stock Management Enabled</h3>
                <p className="text-sm text-blue-700 mt-1">
                Orders will check inventory levels where available. Products without inventory records can still be ordered.
              </p>
            </div>
          </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h3 className="font-medium text-orange-800">Stock Management Disabled</h3>
                <p className="text-sm text-orange-700 mt-1">
                Orders will be created without checking or reducing inventory levels. Stock quantities will remain unchanged.
              </p>
            </div>
          </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {/* Main Order Form - Left Side */}
        <div className="lg:col-span-2 space-y-6 min-h-0">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👤 Customer Information
              </CardTitle>
              <CardDescription>
                Select an existing customer or add a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-select">Select Customer</Label>
                <Popover open={customerComboboxOpen} onOpenChange={setCustomerComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerComboboxOpen}
                      className="w-full justify-between"
                    >
                      {orderData.customerId
                        ? customers.find((customer) => customer.id === orderData.customerId)?.name || 
                          `${customers.find((customer) => customer.id === orderData.customerId)?.firstName} ${customers.find((customer) => customer.id === orderData.customerId)?.lastName}` ||
                          customers.find((customer) => customer.id === orderData.customerId)?.buyerNTNCNIC ||
                          customers.find((customer) => customer.id === orderData.customerId)?.email
                        : "Select customer..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search customer..." />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              handleCustomerChange({ target: { value: '' } } as any);
                              setCustomerComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${orderData.customerId === '' ? "opacity-100" : "opacity-0"}`}
                            />
                            Guest Customer
                          </CommandItem>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={`${customer.name || `${customer.firstName} ${customer.lastName}`} ${customer.buyerNTNCNIC || customer.email}`}
                              onSelect={() => {
                                handleCustomerChange({ target: { value: customer.id } } as any);
                                setCustomerComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${orderData.customerId === customer.id ? "opacity-100" : "opacity-0"}`}
                              />
                      {customer.name || `${customer.firstName} ${customer.lastName}`} ({customer.buyerNTNCNIC || customer.email || 'No NTN/CNIC'})
                            </CommandItem>
                          ))}
                          <CommandItem
                            onSelect={() => {
                              setShowAddUserDialog(true);
                              setCustomerComboboxOpen(false);
                            }}
                            className="text-blue-600 font-medium"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add New Customer
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="customer-email"
                  type="email"
                  value={orderData.email}
                  onChange={(e) => setOrderData({...orderData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">Phone</Label>
                  <Input
                    id="customer-phone"
                  type="tel"
                  value={orderData.phone}
                  onChange={(e) => setOrderData({...orderData, phone: e.target.value})}
                />
              </div>
                <div className="space-y-2">
                  <Label htmlFor="order-status">Order Status</Label>
                  <Select value={orderData.status} onValueChange={(value) => setOrderData({...orderData, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
            </div>
            
            {/* Email Options */}
            <div className="flex items-center space-x-2 pt-4 border-t">
              <input
                type="checkbox"
                id="skip-customer-email"
                checked={skipCustomerEmail}
                onChange={(e) => setSkipCustomerEmail(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="skip-customer-email" className="text-sm">
                Do not send email to customer
              </Label>
            </div>
            </CardContent>
          </Card>

          {/* Seller Information - Auto-filled from environment variables */}
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
                <div className="space-y-2">
                  <Label htmlFor="seller-ntn">Seller NTN/CNIC</Label>
                  <Input
                    id="seller-ntn"
                    type="text"
                    value={sellerInfo.sellerNTNCNIC}
                    onChange={(e) => setSellerInfo({...sellerInfo, sellerNTNCNIC: e.target.value})}
                    placeholder="Enter your NTN or CNIC"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seller-business">Business Name</Label>
                  <Input
                    id="seller-business"
                    type="text"
                    value={sellerInfo.sellerBusinessName}
                    onChange={(e) => setSellerInfo({...sellerInfo, sellerBusinessName: e.target.value})}
                    placeholder="Enter your business name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
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
                            <SelectItem value="Capital Territory">Capital Territory</SelectItem>
                        <SelectItem value="Azad Jammu and Kashmir">Azad Jammu and Kashmir</SelectItem>
                        <SelectItem value="Gilgit-Baltistan">Gilgit-Baltistan</SelectItem>
                        <SelectItem value="N/A">N/A</SelectItem>
                        <SelectItem value="custom">Other (Type below)</SelectItem>
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
                <div className="space-y-2">
                  <Label htmlFor="seller-address">Business Address</Label>
                  <Input
                    id="seller-address"
                    type="text"
                    value={sellerInfo.sellerAddress}
                    onChange={(e) => setSellerInfo({...sellerInfo, sellerAddress: e.target.value})}
                    placeholder="Enter your complete business address"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fbr-base-url">FBR Base URL</Label>
                  <Input
                    id="fbr-base-url"
                    type="url"
                    value={sellerInfo.fbrBaseUrl}
                    onChange={(e) => setSellerInfo({...sellerInfo, fbrBaseUrl: e.target.value})}
                    placeholder={isProductionSubmission ? "https://gw.fbr.gov.pk/di_data/v1/di" : "https://sandbox-api.fbr.gov.pk/di_data/v1/di"}
                  />
                  <p className="text-sm text-muted-foreground">
                    FBR API base URL. {isProductionSubmission ? "Production: https://gw.fbr.gov.pk/di_data/v1/di" : "Sandbox: https://sandbox-api.fbr.gov.pk/di_data/v1/di"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fbr-token">FBR Sandbox Token</Label>
                  <Input
                    id="fbr-token"
                    type="password"
                    value={sellerInfo.fbrSandboxToken}
                    onChange={(e) => setSellerInfo({...sellerInfo, fbrSandboxToken: e.target.value})}
                    placeholder="Enter your FBR sandbox token"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your FBR sandbox token for API authentication. Auto-filled from settings.
                  </p>
                </div>
              </div>
              
              {(!sellerInfo.sellerNTNCNIC || !sellerInfo.sellerBusinessName || !sellerInfo.fbrSandboxToken || !sellerInfo.fbrBaseUrl) && (
                <div className="p-4 bg-muted/50 border rounded-lg">
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
              
              {/* Email Options */}
              <div className="flex items-center space-x-2 pt-4 border-t">
                <input
                  type="checkbox"
                  id="skip-seller-email"
                  checked={skipSellerEmail}
                  onChange={(e) => setSkipSellerEmail(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="skip-seller-email" className="text-sm">
                  Do not send email to seller
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Buyer Information - Show only when customer is selected */}
          {orderData.customerId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏢 Buyer Information
                </CardTitle>
                <CardDescription>
                These fields are populated from the selected customer's buyer profile. You can modify them for this order.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyer-first-name">Buyer Name</Label>
                    <Input
                      id="buyer-first-name"
                      type="text"
                      value={orderData.buyerFirstName}
                      onChange={(e) => setOrderData({...orderData, buyerFirstName: e.target.value, buyerFullName: `${e.target.value} ${orderData.buyerLastName}`.trim()})}
                      placeholder="Enter buyer first name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="buyer-ntn">Buyer NTN/CNIC</Label>
                    <Input
                      id="buyer-ntn"
                    type="text"
                    value={orderData.buyerNTNCNIC}
                    onChange={(e) => setOrderData({...orderData, buyerNTNCNIC: e.target.value})}
                    placeholder="Enter NTN or CNIC"
                  />
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyer-business">Buyer Business Name</Label>
                    <Input
                      id="buyer-business"
                    type="text"
                    value={orderData.buyerBusinessName}
                    onChange={(e) => setOrderData({...orderData, buyerBusinessName: e.target.value})}
                    placeholder="Enter business name"
                  />
                </div>
              </div>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyer-province">Buyer Province</Label>
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
                          <SelectItem value="custom">Other (Type below)</SelectItem>
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
                  <div className="space-y-2">
                    <Label htmlFor="buyer-address">Buyer Address</Label>
                    <Input
                      id="buyer-address"
                    type="text"
                    value={orderData.buyerAddress}
                    onChange={(e) => setOrderData({...orderData, buyerAddress: e.target.value})}
                    placeholder="Enter buyer address"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="buyer-registration-type">Buyer Registration Type</Label>
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
              </CardContent>
            </Card>
          )}

          {/* Loyalty Points Redemption */}
          {loyaltySettings.enabled && orderData.customerId && customerPoints.availablePoints > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎁 Loyalty Points
                </CardTitle>
                <CardDescription>
                  Redeem customer loyalty points for discount
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-800">Available Points:</span>
                    <Badge variant="secondary" className="text-lg font-bold text-purple-600 bg-purple-100">
                      {customerPoints.availablePoints}
                    </Badge>
                </div>
                <div className="text-xs text-purple-600">
                  Worth up to <CurrencySymbol />{(customerPoints.availablePoints * loyaltySettings.redemptionValue).toFixed(2)} discount
                </div>
              </div>

              <div className="space-y-4">
                {/* Use All Points Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg">
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

                {/* Manual Points Input */}
                {!orderData.useAllPoints && (
                  <div className="space-y-2">
                    <Label htmlFor="points-redeem">Points to Redeem</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="points-redeem"
                        type="number"
                        min="0"
                        max={customerPoints.availablePoints}
                        value={orderData.pointsToRedeem}
                        onChange={(e) => handlePointsRedemption(parseInt(e.target.value) || 0)}
                        placeholder={`Min: ${loyaltySettings.redemptionMinimum}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handlePointsRedemption(customerPoints.availablePoints)}
                      >
                        Max
                      </Button>
                    </div>
                    {orderData.pointsToRedeem > 0 && (
                      <div className="mt-2 text-sm text-green-600">
                        Discount: <CurrencySymbol />{orderData.pointsDiscountAmount.toFixed(2)}
                      </div>
                    )}
                    {orderData.pointsToRedeem > 0 && orderData.pointsToRedeem < loyaltySettings.redemptionMinimum && (
                      <div className="mt-2 text-sm text-red-600">
                        Minimum {loyaltySettings.redemptionMinimum} points required for redemption
                      </div>
                    )}
                  </div>
                )}

                {/* Points Summary */}
                {orderData.pointsToRedeem > 0 && (
                  <div className="bg-muted/50 border rounded-lg p-3">
                    <div className="text-sm text-green-800">
                      <div className="flex justify-between">
                        <span>Points to redeem:</span>
                        <span className="font-medium">{orderData.pointsToRedeem}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount amount:</span>
                        <span className="font-medium"><CurrencySymbol />{orderData.pointsDiscountAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-green-600 mt-1">
                        <span>Remaining points:</span>
                        <span>{customerPoints.availablePoints - orderData.pointsToRedeem}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            </Card>
          )}

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
                <div className="space-y-2">
                  <Label htmlFor="invoice-type">Invoice Type</Label>
                  <Input
                    id="invoice-type"
                  type="text"
                  value={orderData.invoiceType}
                  onChange={(e) => setOrderData({...orderData, invoiceType: e.target.value})}
                  placeholder="e.g., Sales Invoice, Pro Forma"
                />
              </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-ref">Invoice Ref No</Label>
                  <Input
                    id="invoice-ref"
                  type="text"
                  value={orderData.invoiceRefNo}
                  onChange={(e) => setOrderData({...orderData, invoiceRefNo: e.target.value})}
                  placeholder="Reference number"
                />
              </div>
                <div className="space-y-2">
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
                        <SelectItem value="SN004">SN004 - Goods at standard rate (default)</SelectItem>
                        <SelectItem value="SN005">SN005 - Goods at Reduced Rate</SelectItem>
                        <SelectItem value="SN006">SN006 - Exempt goods</SelectItem>
                        <SelectItem value="SN007">SN007 - Goods at zero-rate</SelectItem>
                        <SelectItem value="SN008">SN008 - 3rd Schedule Goods</SelectItem>
                        <SelectItem value="SN009">SN009 - Cotton ginners</SelectItem>
                        <SelectItem value="SN010">SN010 - Ship breaking</SelectItem>
                        <SelectItem value="SN011">SN011 - Steel Melters / Re-Rollers</SelectItem>
                        <SelectItem value="SN012">SN012 - Petroleum products</SelectItem>
                        <SelectItem value="SN013">SN013 - Natural Gas / CNG</SelectItem>
                        <SelectItem value="SN014">SN014 - Electric power / Electricity</SelectItem>
                        <SelectItem value="SN015">SN015 - Telecommunication services</SelectItem>
                        <SelectItem value="SN016">SN016 - Processing / Conversion of Goods</SelectItem>
                        <SelectItem value="SN017">SN017 - Goods liable to FED in ST mode</SelectItem>
                        <SelectItem value="SN018">SN018 - Services with FED in ST mode</SelectItem>
                        <SelectItem value="SN019">SN019 - Services rendered or provided</SelectItem>
                        <SelectItem value="SN020">SN020 - Mobile phones (9th Schedule)</SelectItem>
                        <SelectItem value="SN021">SN021 - Drugs at fixed rate (Eighth Schedule)</SelectItem>
                        <SelectItem value="SN022">SN022 - Services (ICT Ordinance)</SelectItem>
                        <SelectItem value="SN023">SN023 - Services liable to FED in ST mode</SelectItem>
                        <SelectItem value="SN024">SN024 - Non-Adjustable Supplies</SelectItem>
                        <SelectItem value="SN025">SN025 - Drugs at fixed ST rate (Eighth Schedule)</SelectItem>
                        <SelectItem value="SN026">SN026 - Goods at standard rate (Tested ✅)</SelectItem>
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
                <div className="space-y-2 hidden">
                  <Label htmlFor="invoice-number">Invoice Number</Label>
                  <Input
                    id="invoice-number"
                  type="text"
                  value={orderData.invoiceNumber}
                  onChange={(e) => setOrderData({...orderData, invoiceNumber: e.target.value})}
                  placeholder="Invoice number"
                />
              </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-date">Invoice Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {orderData.invoiceDate ? format(orderData.invoiceDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={orderData.invoiceDate}
                        onSelect={(date) => setOrderData({...orderData, invoiceDate: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
            </div>

              <div className="space-y-2 hidden">
                <Label htmlFor="validation-response">Validation Response</Label>
                <Input
                  id="validation-response"
                value={orderData.validationResponse}
                onChange={(e) => setOrderData({...orderData, validationResponse: e.target.value})}
                placeholder="Validation response data..."
              />
              </div>
            
            {/* FBR Submission Options */}
            <div className="space-y-3 border-t">
              <div className="flex items-center space-x-2 hidden">
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
                    // Auto-set the correct base URL for production mode
                    if (e.target.checked) {
                      setSellerInfo(prev => ({
                        ...prev,
                        fbrBaseUrl: 'https://gw.fbr.gov.pk/di_data/v1/di'
                      }));
                    } else {
                      setSellerInfo(prev => ({
                        ...prev,
                        fbrBaseUrl: 'https://sandbox-api.fbr.gov.pk/di_data/v1/di'
                      }));
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
                    placeholder="Enter production FBR token..."
                    className="max-w-md"
                  />
                  <p className="text-xs text-orange-600">
                    ⚠️ This will submit to production FBR environment
                  </p>
                </div>
              )}
            </div>
            </CardContent>
          </Card>

          {/* Billing Address */}
          <div className="bg-white border rounded-lg p-6 hidden">
            <h3 className="text-lg font-semibold mb-4">📍 Billing Address</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={customerInfo.billingFirstName}
                  onChange={(e) => setCustomerInfo({...customerInfo, billingFirstName: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={customerInfo.billingLastName}
                  onChange={(e) => setCustomerInfo({...customerInfo, billingLastName: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Address Line 1</label>
                <input
                  type="text"
                  value={customerInfo.billingAddress1}
                  onChange={(e) => setCustomerInfo({...customerInfo, billingAddress1: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={customerInfo.billingCity}
                  onChange={(e) => setCustomerInfo({...customerInfo, billingCity: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={customerInfo.billingState}
                  onChange={(e) => setCustomerInfo({...customerInfo, billingState: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Postal Code</label>
                <input
                  type="text"
                  value={customerInfo.billingPostalCode}
                  onChange={(e) => setCustomerInfo({...customerInfo, billingPostalCode: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  value={customerInfo.billingCountry}
                  onChange={(e) => setCustomerInfo({...customerInfo, billingCountry: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={customerInfo.sameAsBilling}
                  onChange={(e) => setCustomerInfo({...customerInfo, sameAsBilling: e.target.checked})}
                  className="mr-2"
                />
                Shipping address same as billing
              </label>
            </div>
          </div>

          {/* Add Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📦 Add Products
              </CardTitle>
              <CardDescription>
                Select products and configure their details for this order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-select">Product</Label>
                <Popover open={productComboboxOpen} onOpenChange={setProductComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={productComboboxOpen}
                      className="w-full justify-between"
                    >
                      {productSelection.selectedProductId
                        ? (() => {
                            const product = products.find((p) => p.id === productSelection.selectedProductId);
                            if (!product) return "Select a product...";
                            return `${product.name} - ${
                        isWeightBasedProduct(product.stockManagementType || 'quantity')
                          ? product.baseWeightUnit === 'kg'
                            ? `${Number(product.pricePerUnit).toFixed(2)}/kg`
                            : `${(Number(product.pricePerUnit) * 1000).toFixed(2)}/kg`
                          : `${Number(product.price).toFixed(2)}`
                            }`;
                          })()
                        : "Select a product..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search product..." />
                      <CommandList>
                        <CommandEmpty>No product found.</CommandEmpty>
                        <CommandGroup>
                          {products.map((product) => {
                            const displayText = `${product.name} - ${
                              isWeightBasedProduct(product.stockManagementType || 'quantity')
                                ? product.baseWeightUnit === 'kg'
                                  ? `${Number(product.pricePerUnit).toFixed(2)}/kg`
                                  : `${(Number(product.pricePerUnit) * 1000).toFixed(2)}/kg`
                                : `${Number(product.price).toFixed(2)}`
                            }${product.productType === 'group' && Number(product.price) === 0 ? ' (Group Product - Price from addons)' : ''}${isWeightBasedProduct(product.stockManagementType || 'quantity') ? ' (Weight-based)' : ''}${!stockManagementEnabled ? ' (No stock limit)' : ''}`;
                            
                            return (
                              <CommandItem
                                key={product.id}
                                value={displayText}
                                onSelect={() => {
                                  setProductSelection({...productSelection, selectedProductId: product.id, selectedVariantId: ''});
                                  setProductComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${productSelection.selectedProductId === product.id ? "opacity-100" : "opacity-0"}`}
                                />
                                {displayText}
                              </CommandItem>
                            );
                          })}
                          <CommandItem
                            onSelect={() => {
                              setShowAddProductDialog(true);
                              setProductComboboxOpen(false);
                            }}
                            className="text-blue-600 font-medium"
                          >
                            <PackagePlus className="mr-2 h-4 w-4" />
                            Add New Product
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedProduct && selectedProduct.productType === 'variable' && selectedProduct.variants && (
                <div>
                  <label className="block text-gray-700 mb-2">Variant</label>
                  <select
                    value={productSelection.selectedVariantId}
                    onChange={(e) => setProductSelection({...productSelection, selectedVariantId: e.target.value})}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select variant...</option>
                    {selectedProduct.variants?.filter(v => v.isActive).map(variant => (
                      <option key={variant.id} value={variant.id}>
                        {variant.title} - {Number(variant.price).toFixed(2)}
                        {stockManagementEnabled && variant.inventoryQuantity !== undefined 
                          ? ` (Stock: ${variant.inventoryQuantity})` 
                          : !stockManagementEnabled ? ' (No stock limit)' : ''
                        }
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedProduct && selectedProduct.productType === 'group' && selectedProduct.addons && (
                <div className="md:col-span-4">
                  <label className="block text-gray-700 mb-2">🧩 Available Addons</label>
                  <div className="border rounded p-3 bg-gray-50">
                    {selectedProduct.addons.length > 0 ? (
                      <div className="space-y-2">
                        {selectedProduct.addons
                          .filter(pa => pa.isActive && pa.addon.isActive)
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map(productAddon => {
                            const isSelected = selectedAddons.some(sa => sa.addonId === productAddon.addonId);
                            const selectedAddon = selectedAddons.find(sa => sa.addonId === productAddon.addonId);
                            
                            return (
                              <div key={productAddon.id} className="flex items-center justify-between p-2 border rounded bg-white">
                                <div className="flex items-center flex-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        removeSelectedAddon(productAddon.addonId);
                                      } else {
                                        addSelectedAddon(
                                          productAddon.addonId, 
                                          productAddon.addon.title, 
                                          productAddon.price
                                        );
                                      }
                                    }}
                                    className={`px-3 py-1 rounded text-sm mr-3 ${
                                      isSelected 
                                        ? 'bg-green-500 text-white hover:bg-green-600' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                  >
                                    {isSelected ? '✓ Added' : '+ Add'}
                                  </button>
                                  
                                  <div className="flex-1">
                                    <div className="font-medium">{productAddon.addon.title}</div>
                                    <div className="text-sm text-gray-600">
                                      <span className="flex items-center gap-1"><CurrencySymbol />{productAddon.price.toFixed(2)}</span>
                                      {productAddon.isRequired && (
                                        <span className="ml-2 text-red-500 text-xs">Required</span>
                                      )}
                                    </div>
                                    {productAddon.addon.description && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {productAddon.addon.description}
                                      </div>
                                    )}
                                  </div>

                                  {productAddon.addon.image && (
                                    <img 
                                      src={productAddon.addon.image} 
                                      alt={productAddon.addon.title}
                                      className="w-12 h-12 object-cover rounded ml-2"
                                    />
                                  )}
                                </div>

                                {isSelected && (
                                  <div className="flex items-center ml-3">
                                    <label className="text-sm text-gray-600 mr-2">Qty:</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={selectedAddon?.quantity || 1}
                                      onChange={(e) => updateAddonQuantity(
                                        productAddon.addonId, 
                                        parseInt(e.target.value) || 1
                                      )}
                                      className="w-16 p-1 border rounded text-center"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-4">
                        No addons available for this product
                      </div>
                    )}

                    {selectedAddons.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Selected Addons Summary:
                        </div>
                        <div className="space-y-1">
                          {selectedAddons.map(addon => (
                            <div key={addon.addonId} className="flex justify-between text-sm">
                              <span>{addon.addonTitle} (x{addon.quantity})</span>
                              <span className="flex items-center gap-1"><CurrencySymbol />{(addon.price * addon.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-medium text-sm border-t pt-1">
                            <span>Total Addons:</span>
                            <span className="flex items-center gap-1"><CurrencySymbol />{selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quantity or Weight input based on product type */}
              {selectedProduct && isWeightBasedProduct(selectedProduct.stockManagementType || 'quantity') ? (
                <div>
                  <label className="block text-gray-700 mb-2">
                                         Weight 
                     {selectedProduct.pricePerUnit && (
                       <span className="text-sm text-gray-500">
                         (<CurrencySymbol />{
                           selectedProduct.baseWeightUnit === 'kg'
                             ? `${Number(selectedProduct.pricePerUnit).toFixed(2)}/kg`
                             : `${(Number(selectedProduct.pricePerUnit) * 1000).toFixed(2)}/kg`
                         })
                       </span>
                     )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={productSelection.weightInput}
                      onChange={(e) => setProductSelection({...productSelection, weightInput: e.target.value})}
                      className="flex-1 p-2 border rounded focus:border-blue-500 focus:outline-none"
                      placeholder="Enter weight"
                    />
                    <select
                      value={productSelection.weightUnit}
                      onChange={(e) => setProductSelection({...productSelection, weightUnit: e.target.value as 'grams' | 'kg'})}
                      className="p-2 border rounded focus:border-blue-500 focus:outline-none"
                    >
                      <option value="grams">g</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                                     {productSelection.weightInput && selectedProduct.pricePerUnit && (
                    <div className="mt-1 text-sm text-green-600">
                      Price: <CurrencySymbol />{calculateWeightBasedPrice(
                        convertToGrams(parseFloat(productSelection.weightInput) || 0, productSelection.weightUnit),
                        getPricePerGram(selectedProduct)
                      ).toFixed(2)}
                    </div>
                  )}
                </div>
              ) : null}

              <div className="space-y-2 hidden">
                <Label htmlFor="custom-price">Custom Price (optional)</Label>
                <Input
                  id="custom-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productSelection.customPrice}
                  onChange={(e) => setProductSelection({...productSelection, customPrice: e.target.value})}
                  placeholder="Override price"
                />
              </div>

              {/* UOM field for non-weight based products */}
              {selectedProduct && !isWeightBasedProduct(selectedProduct.stockManagementType || 'quantity') && (() => {
                const uomOptions = ["MT", "Bill of lading", "SET", "KWH", "40KG", "Liter", "SqY", "Bag", "KG", "MMBTU", "Meter", "Pcs", "Carat", "Cubic Metre", "Dozen", "Gram", "Gallon", "Kilogram", "Pound", "Timber Logs", "Numbers, pieces, units", "Packs", "Pair", "Square Foot", "Square Metre", "Thousand Unit", "Mega Watt", "Foot", "Barrels", "NO", "1000 kWh"];
                const isCustomUom = productSelection.uom && !uomOptions.includes(productSelection.uom);
                
                return (
                  <div className="space-y-2">
                    <Label htmlFor="uom">Unit of Measurement (UOM)</Label>
                    <div className="flex gap-2">
                      <Popover open={uomComboboxOpen} onOpenChange={setUomComboboxOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={uomComboboxOpen}
                            className="justify-between"
                          >
                            {productSelection.uom && uomOptions.includes(productSelection.uom)
                              ? productSelection.uom
                              : isCustomUom 
                                ? "Others"
                                : productSelection.uom
                                  ? "Others"
                                  : "Select UOM..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                          <Command>
                            <CommandInput placeholder="Search UOM..." />
                            <CommandList className="h-[200px]">
                              <CommandEmpty>No UOM found.</CommandEmpty>
                              <CommandGroup>
                                {uomOptions.map((uom) => (
                                  <CommandItem
                                    key={uom}
                                    value={uom}
                                    onSelect={() => {
                                      setProductSelection({...productSelection, uom: uom});
                                      setUomComboboxOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${productSelection.uom === uom ? "opacity-100" : "opacity-0"}`}
                                    />
                                    {uom}
                                  </CommandItem>
                                ))}
                                <CommandItem
                                  value="Others"
                                  onSelect={() => {
                                    setProductSelection({...productSelection, uom: ""});
                                    setUomComboboxOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${isCustomUom || (productSelection.uom && !uomOptions.includes(productSelection.uom)) ? "opacity-100" : "opacity-0"}`}
                                  />
                                  Others (Custom)
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {(productSelection.uom === "" || isCustomUom || (productSelection.uom && !uomOptions.includes(productSelection.uom))) && (
                        <Input
                          className="flex-1"
                          type="text"
                          value={isCustomUom || (productSelection.uom && !uomOptions.includes(productSelection.uom)) ? productSelection.uom : ""}
                          onChange={(e) => setProductSelection({...productSelection, uom: e.target.value})}
                          placeholder="Enter custom UOM"
                        />
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Editable Product and Tax Fields */}
            {selectedProduct && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">📋 Product & Tax Details (Editable)</CardTitle>
                  <CardDescription>
                    These values are pre-populated from the product but can be modified before adding to the order.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                {/* Product Details Section */}
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
                        <Label htmlFor="product-description-edit" className="text-sm">Product Description</Label>
                        <Input
                          id="product-description-edit"
                          type="text"
                          value={productSelection.productDescription}
                          onChange={(e) => setProductSelection({...productSelection, productDescription: e.target.value})}
                          placeholder="Product description"
                          className="text-sm"
                        />
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
                    
                      <div className="space-y-2">
                        <Label htmlFor="serial-number-edit" className="text-sm">SRO Item Serial No. (FBR)</Label>
                        <Input
                          id="serial-number-edit"
                        type="text"
                        value={productSelection.itemSerialNumber}
                        onChange={(e) => setProductSelection({...productSelection, itemSerialNumber: e.target.value})}
                        placeholder="Serial number"
                          className="text-sm"
                      />
                    </div>
                    
                      <div className="space-y-2">
                        <Label htmlFor="sro-schedule-edit" className="text-sm">SRO / Schedule No.</Label>
                        <Input
                          id="sro-schedule-edit"
                        type="text"
                        value={productSelection.sroScheduleNumber}
                        onChange={(e) => setProductSelection({...productSelection, sroScheduleNumber: e.target.value})}
                        placeholder="SRO or Schedule number"
                          className="text-sm"
                      />
                    </div>
                    
                      <div className="space-y-2">
                        <Label htmlFor="product-serial-number-edit" className="text-sm">Product Serial No.</Label>
                        <Input
                          id="product-serial-number-edit"
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
                        placeholder="Batch or lot number"
                          className="text-sm"
                      />
                    </div>
                    
                      <div className="space-y-2">
                        <Label htmlFor="expiry-date-edit" className="text-sm">Expiry Date</Label>
                        <Input
                          id="expiry-date-edit"
                        type="date"
                        value={productSelection.expiryDate}
                        onChange={(e) => setProductSelection({...productSelection, expiryDate: e.target.value})}
                        placeholder="YYYY-MM-DD"
                          className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                  <Separator />

                {/* Tax and Price Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-muted-foreground">Tax & Pricing Information</h5>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="update-product-data"
                          checked={updateProductData}
                          onChange={(e) => setUpdateProductData(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <Label htmlFor="update-product-data" className="text-xs text-muted-foreground cursor-pointer">
                          Update data into database of this product
                        </Label>
                      </div>
                    </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tax-amount-edit" className="text-sm">Tax Amount</Label>
                        <div className="relative">
                          <Input
                            id="tax-amount-edit"
                            type="text"
                            value={productSelection.taxAmount === 0 ? '' : productSelection.taxAmount}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow empty string, numbers, and decimal point
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                setProductSelection({...productSelection, taxAmount: value === '' ? 0 : value});
                              }
                            }}
                            placeholder="Enter amount"
                            className="text-sm"
                            disabled={isTaxCalculating}
                          />
                          {isTaxCalculating && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            </div>
                          )}
                        </div>
                      </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="tax-percentage-edit" className="text-sm">Tax Percentage (%)</Label>
                        <Input
                          id="tax-percentage-edit"
                      type="text"
                      value={productSelection.taxPercentage === 0 ? '' : productSelection.taxPercentage}
                      onChange={async (e) => {
                        const value = e.target.value;
                        // Allow empty string, numbers, and decimal point
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          const taxPercentage = value === '' ? 0 : parseFloat(value) || 0;
                          
                          // Update tax percentage immediately
                          setProductSelection(prev => ({...prev, taxPercentage: value === '' ? 0 : value}));
                          
                          // Calculate tax amount and price including tax if we have both values (only if value is a complete number)
                          if (taxPercentage > 0 && productSelection.priceExcludingTax > 0 && !value.endsWith('.')) {
                            const priceExcludingTaxNum = parseFloat(productSelection.priceExcludingTax.toString());
                            const calculatedTaxAmount = await calculateTaxAmount(priceExcludingTaxNum, taxPercentage);
                            const calculatedPriceIncludingTax = priceExcludingTaxNum + calculatedTaxAmount;
                            setProductSelection(prev => ({
                              ...prev, 
                              taxAmount: calculatedTaxAmount,
                              priceIncludingTax: Math.round(calculatedPriceIncludingTax * 100) / 100 // Round to 2 decimal places
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
                      onChange={async (e) => {
                        const value = e.target.value;
                        // Allow empty string, numbers, and decimal point
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          // Store as string if ending with decimal, otherwise store as number
                          const priceIncludingTax = value.endsWith('.') ? value : (value === '' ? 0 : parseFloat(value) || 0);
                          
                          // Update price including tax immediately
                          setProductSelection(prev => ({...prev, priceIncludingTax: priceIncludingTax}));
                          
                          // Only perform calculations if value is a complete number (not ending with decimal point)
                          if (!value.endsWith('.') && value !== '') {
                            // If we have tax percentage and price excluding tax, use our calculation method
                            if (productSelection.taxPercentage > 0 && productSelection.priceExcludingTax > 0) {
                              const priceExcludingTaxNum = parseFloat(productSelection.priceExcludingTax.toString());
                              const taxPercentageNum = parseFloat(productSelection.taxPercentage.toString());
                              const calculatedTaxAmount = await calculateTaxAmount(priceExcludingTaxNum, taxPercentageNum);
                              setProductSelection(prev => ({...prev, taxAmount: calculatedTaxAmount}));
                            }
                            // Otherwise, calculate tax percentage and amount from price difference (backward compatibility)
                            else if (typeof priceIncludingTax === 'number' && priceIncludingTax > 0 && productSelection.priceExcludingTax > 0) {
                              const priceExcludingTaxNum = parseFloat(productSelection.priceExcludingTax.toString());
                              const taxAmount = priceIncludingTax - priceExcludingTaxNum;
                              const taxPercentage = (taxAmount / priceExcludingTaxNum) * 100;
                              setProductSelection(prev => ({
                                ...prev,
                                taxAmount: Math.round(taxAmount * 100) / 100, // Round to 2 decimal places
                                taxPercentage: Math.round(taxPercentage * 100) / 100 // Round to 2 decimal places
                              }));
                            }
                          }
                        }
                      }}
                      placeholder="Enter price"
                          className="text-sm"
                    />
                  </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="price-excluding-tax-edit" className="text-sm">Price Excluding Tax</Label>
                        <Input
                          id="price-excluding-tax-edit"
                      type="text"
                      value={productSelection.priceExcludingTax === 0 ? '' : productSelection.priceExcludingTax.toString()}
                      onChange={async (e) => {
                        const value = e.target.value;
                        // Allow empty string, numbers, and decimal point
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          // Store as string if ending with decimal, otherwise store as number
                          const priceExcludingTax = value.endsWith('.') ? value : (value === '' ? 0 : parseFloat(value) || 0);
                          
                          // Update price excluding tax immediately
                          setProductSelection(prev => ({...prev, priceExcludingTax: priceExcludingTax}));
                          
                          // Only perform calculations if value is a complete number (not ending with decimal point)
                          if (!value.endsWith('.') && value !== '') {
                            // Calculate tax amount and price including tax if we have tax percentage
                            if (typeof priceExcludingTax === 'number' && priceExcludingTax > 0 && productSelection.taxPercentage > 0) {
                              const taxPercentageNum = parseFloat(productSelection.taxPercentage.toString());
                              const calculatedTaxAmount = await calculateTaxAmount(priceExcludingTax, taxPercentageNum);
                              const calculatedPriceIncludingTax = priceExcludingTax + calculatedTaxAmount;
                              setProductSelection(prev => ({
                                ...prev, 
                                taxAmount: calculatedTaxAmount,
                                priceIncludingTax: Math.round(calculatedPriceIncludingTax * 100) / 100 // Round to 2 decimal places
                              }));
                            }
                            // Auto-calculate tax percentage if both prices are available but no existing tax percentage
                            else if (typeof priceExcludingTax === 'number' && priceExcludingTax > 0 && productSelection.priceIncludingTax > 0 && productSelection.taxPercentage === 0) {
                              const priceIncludingTaxNum = parseFloat(productSelection.priceIncludingTax.toString());
                              const taxAmount = priceIncludingTaxNum - priceExcludingTax;
                              const taxPercentage = (taxAmount / priceExcludingTax) * 100;
                              setProductSelection(prev => ({
                                ...prev,
                                taxAmount: Math.round(taxAmount * 100) / 100, // Round to 2 decimal places
                                taxPercentage: Math.round(taxPercentage * 100) / 100 // Round to 2 decimal places
                              }));
                            }
                          }
                        }
                      }}
                      placeholder="Enter price"
                          className="text-sm"
                    />
                  </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="extra-tax-edit" className="text-sm">Extra Tax</Label>
                        <Input
                          id="extra-tax-edit"
                      type="text"
                      value={productSelection.extraTax === 0 ? '' : productSelection.extraTax}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string, numbers, and decimal point
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
                        // Allow empty string, numbers, and decimal point
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
                        // Allow empty string, numbers, and decimal point
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setProductSelection({...productSelection, fedPayableTax: value === '' ? 0 : value});
                        }
                      }}
                      placeholder="Enter amount"
                          className="text-sm"
                    />

                  </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="discount-amount-edit" className="text-sm">Discount Amount</Label>
                        <Input
                          id="discount-amount-edit"
                      type="text"
                      value={productSelection.discountAmount === 0 ? '' : productSelection.discountAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string, numbers, and decimal point
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setProductSelection({...productSelection, discountAmount: value === '' ? 0 : value});
                        }
                      }}
                      placeholder="Enter amount"
                          className="text-sm"
                    />
                  </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="fixed-notified-value-edit" className={`text-sm ${orderData.scenarioId === 'SN008' ? 'text-red-600 font-medium' : ''}`}>
                          Fixed Notified Value/Retail Price
                          {orderData.scenarioId === 'SN008' && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                          id="fixed-notified-value-edit"
                          type="text"
                          value={productSelection.fixedNotifiedValueOrRetailPrice === 0 ? '' : productSelection.fixedNotifiedValueOrRetailPrice}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string, numbers, and decimal point
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setProductSelection({...productSelection, fixedNotifiedValueOrRetailPrice: value === '' ? 0 : value});
                            }
                          }}
                          placeholder={orderData.scenarioId === 'SN008' ? 'Required for 3rd Schedule Goods' : 'Enter value'}
                          className={`text-sm ${orderData.scenarioId === 'SN008' ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                          required={orderData.scenarioId === 'SN008'}
                        />
                        {orderData.scenarioId === 'SN008' && (
                          <p className="text-xs text-red-600">
                            💡 This field is mandatory for 3rd Schedule Goods (SN008). If not specified, the item price will be used.
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sale-type-edit" className="text-sm">Sale Type</Label>
                        <Input
                          id="sale-type-edit"
                          type="text"
                          value={productSelection.saleType}
                          onChange={(e) => setProductSelection({...productSelection, saleType: e.target.value})}
                          placeholder="Goods at standard rate (default)"
                          className="text-sm"
                        />
                      </div>

                      {/* Quantity field - moved from above */}
                      {selectedProduct && !isWeightBasedProduct(selectedProduct.stockManagementType || 'quantity') && (
                        <div className="space-y-2">
                          <Label htmlFor="quantity-edit" className="text-sm">Quantity</Label>
                          <Input
                            id="quantity-edit"
                            type="number"
                            min="1"
                            value={productSelection.quantity}
                            onChange={async (e) => {
                              const newQty = parseInt(e.target.value) || 1;
                              const oldQty = productSelection.quantity;
                              
                              setProductSelection(prev => {
                                const updatedSelection = { ...prev, quantity: newQty };
                                
                                // If we have price excluding tax set, update it proportionally with quantity change
                                if (prev.priceExcludingTax > 0) {
                                  const perUnitPriceExcludingTax = prev.priceExcludingTax / oldQty;
                                  const newTotalPriceExcludingTax = perUnitPriceExcludingTax * newQty;
                                  updatedSelection.priceExcludingTax = Math.round(newTotalPriceExcludingTax * 100) / 100;
                                  
                                  // Also update related tax calculations if we have tax percentage
                                  if (prev.taxPercentage > 0) {
                                    const taxPercentageNum = parseFloat(prev.taxPercentage.toString());
                                    calculateTaxAmount(newTotalPriceExcludingTax, taxPercentageNum).then(calculatedTaxAmount => {
                                      const calculatedPriceIncludingTax = newTotalPriceExcludingTax + calculatedTaxAmount;
                                      setProductSelection(current => ({
                                        ...current,
                                        taxAmount: Math.round(calculatedTaxAmount * 100) / 100,
                                        priceIncludingTax: Math.round(calculatedPriceIncludingTax * 100) / 100
                                      }));
                                    });
                                  }
                                }
                                
                                // If we have price including tax set, update it proportionally with quantity change
                                if (prev.priceIncludingTax > 0) {
                                  const perUnitPriceIncludingTax = prev.priceIncludingTax / oldQty;
                                  const newTotalPriceIncludingTax = perUnitPriceIncludingTax * newQty;
                                  updatedSelection.priceIncludingTax = Math.round(newTotalPriceIncludingTax * 100) / 100;
                                }
                                
                                // If we have tax amount set, update it proportionally with quantity change
                                if (prev.taxAmount > 0) {
                                  const perUnitTaxAmount = prev.taxAmount / oldQty;
                                  const newTotalTaxAmount = perUnitTaxAmount * newQty;
                                  updatedSelection.taxAmount = Math.round(newTotalTaxAmount * 100) / 100;
                                }
                                
                                return updatedSelection;
                              });
                            }}
                            className="text-sm"
                          />
                        </div>
                      )}
                  </div>
                </div>
                </CardContent>
              </Card>
            )}

            <Button
              type="button"
              onClick={handleAddProduct}
              className="mt-4"
              size="lg"
              disabled={isAddingProduct}
            >
              {isAddingProduct ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Product...
                </>
              ) : (
                '➕ Add Product'
              )}
            </Button>

            {/* Order Items List */}
            {orderItems.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Order Items</h4>
                  {orderData.supplierId && (
                    <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded">
                      🏢 Supplier Products
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    <div key={index} className="p-3 rounded">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{item.productName}</div>
                          {item.productDescription && (
                            <div className="text-sm text-gray-600 italic">{item.productDescription}</div>
                          )}
                          {item.variantTitle && (
                            <div className="text-sm text-gray-600">{item.variantTitle}</div>
                          )}
                          {item.sku && (
                            <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                          )}
                          {item.hsCode && (
                            <div className="text-sm text-gray-500">HS Code: {item.hsCode}</div>
                          )}
                          {item.isWeightBased && item.weightQuantity && (
                            <div className="text-sm text-blue-600">
                              ⚖️ Weight: {formatWeightAuto(item.weightQuantity).formattedString}
                            </div>
                          )}
                          {item.uom && !item.isWeightBased && (
                            <div className="text-sm text-purple-600">
                              📏 UOM: {item.uom}
                            </div>
                          )}
                          {item.itemSerialNumber && (
                            <div className="text-sm text-orange-600">
                              🔢 Serial No: {item.itemSerialNumber}
                            </div>
                          )}
                          {item.sroScheduleNumber && (
                            <div className="text-sm text-teal-600">
                              📄 SRO/Schedule: {item.sroScheduleNumber}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm">
                            {item.addons && Array.isArray(item.addons) && item.addons.length > 0 ? (
                              <div className="text-right">
                                                <div className="flex items-center gap-1">Price Inc. Tax: <CurrencySymbol />{safeFormatPrice(item.priceIncludingTax || item.price)}</div>
                <div className="flex items-center gap-1">Addons: <CurrencySymbol />{safeFormatPrice(item.addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0))}</div>
                <div className="font-medium border-t pt-1 flex items-center gap-1">
                  <CurrencySymbol />{safeFormatPrice((item.priceIncludingTax || item.price) + item.addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0))} x 
                  <span className="mx-1 font-medium">{item.quantity}</span>
                  = <CurrencySymbol />{safeFormatPrice(item.totalPrice)}
                </div>
                              </div>
                            ) : item.isWeightBased ? (
                              <div className="flex items-center gap-1">
                                Price Inc. Tax: <CurrencySymbol />{safeFormatPrice(item.priceIncludingTax || item.price)} (for {formatWeightAuto(item.weightQuantity || 0).formattedString})
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                Price Inc. Tax: <CurrencySymbol />{safeFormatPrice(item.priceIncludingTax || item.price)} x 
                                <span className="mx-1 font-medium">{item.quantity}</span>
                                = <CurrencySymbol />{safeFormatPrice(item.totalPrice)}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleEditItem(index)}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            Remove
                          </button>
                          
                          {/* Show loading indicator if this item is being updated */}
                          {item.id && updatingItemIds.has(item.id) && (
                            <div className="flex items-center ml-2 text-xs text-blue-600">
                              <svg className="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating DB...
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Display addons for group products */}
                      {item.addons && Array.isArray(item.addons) && item.addons.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-blue-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">🧩 Addons:</div>
                          <div className="space-y-1">
                            {item.addons.map((addon, addonIndex) => (
                              <div key={addon.addonId} className="flex justify-between text-sm text-gray-600">
                                <span>• {getAddonTitle(addon, addonIndex)} (x{addon.quantity})</span>
                                <span className="flex items-center gap-1"><CurrencySymbol />{safeFormatPrice(addon.price * addon.quantity)} each</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-sm font-medium text-gray-700 border-t pt-1 mt-2">
                              <span>Addons subtotal per product:</span>
                              <span className="flex items-center gap-1"><CurrencySymbol />{safeFormatPrice(item.addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0))}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Display tax and discount information */}
                      {(Number(item.taxAmount) || Number(item.taxPercentage) || Number(item.discount) || Number(item.extraTax) || Number(item.furtherTax) || Number(item.fedPayableTax) || Number(item.priceIncludingTax) || Number(item.priceExcludingTax)) > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-green-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">💰 Tax & Discount Details:</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {(() => {
                              const qty = Number(item.quantity) || 1;
                              const pct = Number(item.taxPercentage) || 0;
                              
                              // Use stored total values directly (they are already calculated with quantity)
                              const totalEx = Number(item.priceExcludingTax) || 0;
                              const totalInc = Number(item.priceIncludingTax) || 0;
                              const totalTax = Number(item.taxAmount) || 0;
                              
                              // If we don't have total values, fall back to calculating from unit price
                              const finalTotalEx = totalEx > 0 ? totalEx : ((Number(item.price) || 0) * qty);
                              const finalTotalTax = totalTax > 0 ? totalTax : (finalTotalEx * pct / 100);
                              const finalTotalInc = totalInc > 0 ? totalInc : (finalTotalEx + finalTotalTax);
                              
                              return (
                                <>
                                  {(finalTotalTax > 0) && (
                                    <div className="flex justify-between">
                                      <span>Tax Amount:</span>
                                      <span className="flex items-center gap-1"><CurrencySymbol />{safeFormatPrice(finalTotalTax)}</span>
                                    </div>
                                  )}
                                  {(pct > 0) && (
                                    <div className="flex justify-between">
                                      <span>Tax %:</span>
                                      <span>{safeFormatPrice(pct)}%</span>
                                    </div>
                                  )}
                                  {(finalTotalInc > 0) && (
                                    <div className="flex justify-between">
                                      <span>Price Inc. Tax:</span>
                                      <span className="flex items-center gap-1"><CurrencySymbol />{safeFormatPrice(finalTotalInc)}</span>
                                    </div>
                                  )}
                                  {(finalTotalEx > 0) && (
                                    <div className="flex justify-between">
                                      <span>Price Ex. Tax:</span>
                                      <span className="flex items-center gap-1"><CurrencySymbol />{safeFormatPrice(finalTotalEx)}</span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                            {(Number(item.extraTax) || 0) > 0 && (
                              <div className="flex justify-between">
                                <span>Extra Tax:</span>
                                <span className="flex items-center gap-1"><CurrencySymbol />{safeFormatPrice(item.extraTax || 0)}</span>
                              </div>
                            )}
                            {(Number(item.furtherTax) || 0) > 0 && (
                              <div className="flex justify-between">
                                <span>Further Tax:</span>
                                <span className="flex items-center gap-1"><CurrencySymbol />{safeFormatPrice(item.furtherTax || 0)}</span>
                              </div>
                            )}
                            {(Number(item.fedPayableTax) || 0) > 0 && (
                              <div className="flex justify-between">
                                <span>FED Tax:</span>
                                <span className="flex items-center gap-1"><CurrencySymbol />{Number(item.fedPayableTax || 0).toFixed(2)}</span>
                              </div>
                            )}
                            {(Number(item.discount) || 0) > 0 && (
                              <div className="flex justify-between">
                                <span>Discount:</span>
                                <span className="flex items-center gap-1"><CurrencySymbol />{Number(item.discount || 0).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            </CardContent>
          </Card>

          {/* Order Settings */}
          <div className="bg-white border rounded-lg p-6 hidden">
            <h3 className="text-lg font-semibold mb-4">⚙️ Order Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Payment Status</label>
                <select
                  value={orderData.paymentStatus}
                  onChange={(e) => setOrderData({...orderData, paymentStatus: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Shipping Amount</label>
                <input
                  type="text"
                  value={orderData.shippingAmount === 0 ? '' : orderData.shippingAmount}
                  onChange={(e) => setOrderData({...orderData, shippingAmount: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Tax Rate (%)</label>
                <input
                  type="text"
                  value={orderData.taxRate === 0 ? '' : orderData.taxRate}
                  onChange={(e) => setOrderData({...orderData, taxRate: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Discount</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={orderData.discountAmount === 0 ? '' : orderData.discountAmount}
                    onChange={(e) => setOrderData({...orderData, discountAmount: parseFloat(e.target.value) || 0})}
                    className="flex-1 p-2 border rounded focus:border-blue-500 focus:outline-none"
                    placeholder="0.00"
                  />
                  <select
                    value={orderData.discountType}
                    onChange={(e) => setOrderData({...orderData, discountType: e.target.value})}
                    className="p-2 border rounded focus:border-blue-500 focus:outline-none currency-symbol"
                  >
                    <option value="amount">Currency</option>
                    <option value="percentage">%</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-gray-700 mb-2">Order Notes</label>
              <textarea
                value={orderData.notes}
                onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                rows={3}
                placeholder="Internal notes about this order..."
              />
            </div>
          </div>

          

          {/* Driver Assignment */}
          <div className="bg-white border rounded-lg p-6 hidden">
            <h3 className="text-lg font-semibold mb-4">🚚 Driver Assignment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Assignment Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="manual"
                      checked={orderData.assignmentType === 'manual'}
                      onChange={(e) => handleDriverAssignmentTypeChange(e.target.value as 'manual')}
                      className="mr-2"
                    />
                    Manual Assignment
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="automatic"
                      checked={orderData.assignmentType === 'automatic'}
                      onChange={(e) => handleDriverAssignmentTypeChange(e.target.value as 'automatic')}
                      className="mr-2"
                    />
                    Automatic (Nearest Driver)
                  </label>
                </div>
              </div>

              {orderData.assignmentType === 'manual' && (
                <div>
                  <label className="block text-gray-700 mb-2">Select Driver</label>
                  <select
                    value={orderData.assignedDriverId}
                    onChange={(e) => setOrderData({...orderData, assignedDriverId: e.target.value})}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Select a driver --</option>
                    {availableDrivers.map((driverData) => (
                      <option key={driverData.driver.id} value={driverData.driver.id}>
                        {driverData.user.name} - {driverData.driver.vehicleType} ({driverData.driver.vehiclePlateNumber}) - {driverData.driver.status}
                      </option>
                    ))}
                  </select>
                  {availableDrivers.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">No drivers available</p>
                  )}
                </div>
              )}

              {orderData.assignmentType === 'automatic' && (
                <div className="bg-muted/50 p-3 rounded">
                  <p className="text-sm text-blue-700">
                    📍 The system will automatically assign the nearest available driver based on the delivery address.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-gray-700 mb-2">Delivery Status</label>
                <select
                  value={orderData.deliveryStatus}
                  onChange={(e) => setOrderData({...orderData, deliveryStatus: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary - Right Side */}
        <div ref={sidebarContainerRef} className="lg:col-span-1 relative">
          <aside 
            ref={sidebarRef}
            className={`transition-all duration-300 will-change-transform z-30 ${
              isSticky 
                ? 'fixed top-6 right-6 w-80 max-w-[calc(100vw-3rem)]' 
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
            <div className="space-y-3">
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                      <span className="flex items-center gap-1 font-medium">-<CurrencySymbol />{totals.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              {totals.pointsDiscountAmount > 0 && (
                <div className="flex justify-between text-purple-600">
                  <span>Points Discount ({orderData.pointsToRedeem} pts):</span>
                      <span className="flex items-center gap-1 font-medium">-<CurrencySymbol />{totals.pointsDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="flex items-center gap-1"><CurrencySymbol />{totals.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Points Preview */}
              {loyaltySettings.enabled && (
                  <>
                    <Separator />
                    <div className="bg-muted/50 border rounded-lg p-3">
                      <div className="text-sm font-medium mb-1 flex items-center gap-2">
                        🎁 Loyalty Points
                      </div>
                    <div className="text-sm text-muted-foreground">
                      {orderData.customerId ? (
                          <>Customer will earn: <Badge variant="secondary" className="ml-1">{calculatePointsToEarn()} points</Badge></>
                      ) : (
                          <>This order will earn: <Badge variant="secondary" className="ml-1">{calculatePointsToEarn()} points</Badge> (requires customer)</>
                      )}
                      {calculatePointsToEarn() === 0 && loyaltySettings.minimumOrder > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          (Minimum order: <CurrencySymbol />{loyaltySettings.minimumOrder})
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {orderData.status === 'completed' ? (
                        <span className="text-green-600 dark:text-green-400">✅ Points will be available immediately</span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400">⏳ Points will be pending until completed</span>
                      )}
                    </div>
                    {!orderData.customerId && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        ⚠️ Select a customer above to award points for this order
                      </div>
                    )}
                  </div>
                  </>
                )}

                <Separator />

                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                  <strong>{orderItems.length}</strong> item(s) in order
                </div>
                
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviewJson}
                    disabled={orderItems.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    🔍 Preview JSON Data
                  </Button>
                
                  <Button
                  onClick={handleSubmit}
                  disabled={submitting || orderItems.length === 0}
                    className="w-full"
                    size="lg"
                >
                  {submitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? 'Creating Order...' : 'Create Order'}
                  </Button>
                
                  <Button
                  type="button"
                    variant="outline"
                  onClick={() => router.push('/orders')}
                    className="w-full"
                    size="lg"
                >
                  Cancel
                  </Button>
              </div>
              </CardContent>
            </Card>
          </aside>
            </div>
          </div>

      {/* Add New User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer for your order. Enter their NTN/CNIC and business information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="ntn" className="text-right">
                NTN/CNIC
              </label>
              <input
                id="ntn"
                value={newUserData.ntn}
                onChange={(e) => setNewUserData({...newUserData, ntn: e.target.value})}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter NTN or CNIC"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="businessName" className="text-right">
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                value={newUserData.businessName}
                onChange={(e) => setNewUserData({...newUserData, businessName: e.target.value})}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter business name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowAddUserDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleAddNewUser}
              disabled={addingUser}
            >
              {addingUser ? 'Adding...' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Product Dialog */}
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product to add to your order. Enter the basic product information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="productName" className="text-right">
                Name
              </label>
              <input
                id="productName"
                value={newProductData.name}
                onChange={(e) => setNewProductData({...newProductData, name: e.target.value})}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Product name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="productPrice" className="text-right">
                Price
              </label>
              <input
                id="productPrice"
                type="number"
                step="0.01"
                min="0"
                value={newProductData.price}
                onChange={(e) => setNewProductData({...newProductData, price: e.target.value})}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="stockQuantity" className="text-right">
                Stock Qty
              </label>
              <input
                id="stockQuantity"
                type="number"
                min="0"
                value={newProductData.stockQuantity}
                onChange={(e) => setNewProductData({...newProductData, stockQuantity: e.target.value})}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowAddProductDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleAddNewProduct}
              disabled={addingProduct}
            >
              {addingProduct ? 'Adding...' : 'Add Product'}
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
              You are about to submit this invoice to the production FBR environment.
            </DialogDescription>
            <div className="text-sm bg-orange-50 p-3 rounded border border-orange-200 mt-2">
              <strong>Warning:</strong> This will create a real invoice in the FBR system and cannot be undone. 
              Make sure all information is correct before proceeding.
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Order Summary */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Customer:</span> {orderData.email}
                </div>
                <div>
                  <span className="font-medium">Total Amount:</span> {currentCurrency === 'USD' ? '$' : currentCurrency === 'AED' ? 'AED ' : 'Rs. '}{calculateTotals().totalAmount.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Items:</span> {orderItems.length}
                </div>
                <div>
                  <span className="font-medium">Mode:</span> <span className="text-orange-600 font-semibold">Production</span>
                </div>
              </div>
            </div>

            {/* FBR Invoice Preview */}
            {fbrPreviewData && (
              <div className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                <h3 className="font-semibold mb-3 text-orange-800">🧾 FBR Production Invoice Preview</h3>
                <div className="space-y-3">
                  {/* Key Invoice Information */}
                  <div className="grid grid-cols-2 gap-2 text-sm bg-white p-2 rounded">
                    <div><span className="font-medium">Invoice Type:</span> {fbrPreviewData.invoiceType}</div>
                    <div><span className="font-medium">Date:</span> {fbrPreviewData.invoiceDate}</div>
                    <div><span className="font-medium">Scenario ID:</span> {fbrPreviewData.scenarioId}</div>
                    <div><span className="font-medium">Ref No:</span> {fbrPreviewData.invoiceRefNo || 'N/A'}</div>
                  </div>

                    {/* Seller/Buyer Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="bg-white p-2 rounded">
                      <div className="font-medium text-purple-700 mb-1">📤 Seller</div>
                      <div>{fbrPreviewData.sellerBusinessName || 'Not provided'}</div>
                      <div className="text-xs text-gray-600">{fbrPreviewData.sellerNTNCNIC || 'No NTN/CNIC'}</div>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <div className="font-medium text-green-700 mb-1">📥 Buyer</div>
                        <div>{fbrPreviewData.buyerFullName || orderData.buyerFullName || `${customerInfo.billingFirstName} ${customerInfo.billingLastName}`.trim() || fbrPreviewData.buyerBusinessName || 'Not provided'}</div>
                      <div className="text-xs text-gray-600">{fbrPreviewData.buyerNTNCNIC || 'No NTN/CNIC'}</div>
                    </div>
                  </div>

                  {/* Items Summary */}
                  {fbrPreviewData.items && fbrPreviewData.items.length > 0 && (
                    <div className="bg-white p-2 rounded text-sm">
                      <div className="font-medium mb-1">📦 Items Summary</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-xs">
                        <div><span className="font-medium">Items:</span> {fbrPreviewData.items.length}</div>
                        <div><span className="font-medium">Total Qty:</span> {fbrPreviewData.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)}</div>
                        <div><span className="font-medium">Total Excl. ST:</span> {fbrPreviewData.items.reduce((sum: number, item: any) => sum + (item.valueSalesExcludingST || 0), 0).toLocaleString()}</div>
                        <div><span className="font-medium">Grand Total:</span> {fbrPreviewData.items.reduce((sum: number, item: any) => sum + (item.totalValues || 0), 0).toLocaleString()}</div>
                      </div>
                    </div>
                  )}

                  {/* First Item Preview */}
                  {fbrPreviewData.items && fbrPreviewData.items.length > 0 && (
                    <div className="bg-white p-2 rounded text-sm">
                      <div className="font-medium mb-1">🔍 First Item Details</div>
                      <div className="text-xs space-y-1">
                        <div><span className="font-medium">Description:</span> {fbrPreviewData.items[0].productDescription || fbrPreviewData.items[0].itemName || 'N/A'}</div>
                        <div className="grid grid-cols-2 gap-1">
                          <div><span className="font-medium">HS Code:</span> {fbrPreviewData.items[0].hsCode}</div>
                          <div><span className="font-medium">Quantity:</span> {fbrPreviewData.items[0].quantity}</div>
                          <div><span className="font-medium">Rate:</span> {fbrPreviewData.items[0].rate}</div>
                          <div><span className="font-medium">Sale Type:</span> {fbrPreviewData.items[0].saleType || 'N/A'}</div>
                        </div>
                        {fbrPreviewData.items.length > 1 && (
                          <div className="text-gray-500">...and {fbrPreviewData.items.length - 1} more items</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* FBR JSON Preview for Production */}
                  {fbrJsonPreview && (
                    <details className="border rounded p-2 bg-white mt-2">
                      <summary className="cursor-pointer font-medium text-xs text-orange-700">
                        🔍 View Production FBR JSON (Console Log Preview)
                      </summary>
                      <div className="mt-2">
                        <div className="bg-black text-green-400 p-2 rounded font-mono text-xs max-h-48 overflow-y-auto">
                          <div className="text-yellow-400">🔍 === FINAL FBR JSON PAYLOAD ===</div>
                          <div className="text-cyan-400">📋 Generated FBR Invoice JSON:</div>
                          <pre className="mt-1 whitespace-pre-wrap text-xs">
                            {JSON.stringify(fbrJsonPreview, null, 2)}
                          </pre>
                          <div className="text-yellow-400 mt-1">===============================</div>
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            )}
            
            <p className="text-sm text-center text-orange-700">
              Are you sure you want to continue with production submission?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleProductionCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProductionConfirm}
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {submitting ? 'Submitting...' : 'Yes, Submit to Production'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Confirmation Dialog with FBR Preview */}
      <Dialog open={showOrderConfirmation} onOpenChange={setShowOrderConfirmation}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📋 Order Confirmation {isProductionSubmission && <span className="text-orange-600">- Production Mode</span>}
            </DialogTitle>
            <DialogDescription>
              Please review the order details and FBR invoice data before submitting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-muted/50 p-4 rounded-lg border">
              <h3 className="font-semibold mb-2 text-foreground">Order Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Customer:</span> <span className="text-foreground">{orderData.email}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Total Amount:</span> <span className="text-foreground">{currentCurrency === 'USD' ? '$' : currentCurrency === 'AED' ? 'AED ' : 'Rs. '}{calculateTotals().totalAmount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Items:</span> <span className="text-foreground">{orderItems.length}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Status:</span> <span className="text-foreground">{orderData.status}</span>
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
                    <div className="grid grid-cols-2 gap-4 text-sm bg-primary/5 border border-primary/20 p-3 rounded">
                      <div>
                        <span className="font-medium text-muted-foreground">Invoice Type:</span> <span className="text-foreground">{fbrPreviewData.invoiceType}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Invoice Date:</span> <span className="text-foreground">{fbrPreviewData.invoiceDate}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Scenario ID:</span> <span className="text-foreground">{fbrPreviewData.scenarioId}</span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Invoice Ref No:</span> <span className="text-foreground">{fbrPreviewData.invoiceRefNo || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Seller Information */}
                    <div className="bg-secondary/50 border border-secondary p-3 rounded">
                      <h4 className="font-medium text-secondary-foreground mb-2">📤 Seller Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium text-muted-foreground">NTN/CNIC:</span> <span className="text-foreground">{fbrPreviewData.sellerNTNCNIC || 'Not provided'}</span></div>
                        <div><span className="font-medium text-muted-foreground">Business Name:</span> <span className="text-foreground">{fbrPreviewData.sellerBusinessName || 'Not provided'}</span></div>
                        <div><span className="font-medium text-muted-foreground">Province:</span> <span className="text-foreground">{fbrPreviewData.sellerProvince || 'Not provided'}</span></div>
                        <div className="md:col-span-2"><span className="font-medium text-muted-foreground">Address:</span> <span className="text-foreground">{fbrPreviewData.sellerAddress || 'Not provided'}</span></div>
                      </div>
                    </div>

                    {/* Buyer Information */}
                    <div className="bg-accent/30 border border-accent p-3 rounded">
                      <h4 className="font-medium text-accent-foreground mb-2">📥 Buyer Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium text-muted-foreground">Buyer Name:</span> <span className="text-foreground">{fbrPreviewData.buyerFullName || orderData.buyerFullName || `${customerInfo.billingFirstName} ${customerInfo.billingLastName}`.trim() || 'Not provided'}</span></div>
                        <div><span className="font-medium text-muted-foreground">NTN/CNIC:</span> <span className="text-foreground">{fbrPreviewData.buyerNTNCNIC || 'Not provided'}</span></div>
                        <div><span className="font-medium text-muted-foreground">Business Name:</span> <span className="text-foreground">{fbrPreviewData.buyerBusinessName || 'Not provided'}</span></div>
                        <div><span className="font-medium text-muted-foreground">Registration Type:</span> <span className="text-foreground">{fbrPreviewData.buyerRegistrationType || 'Not provided'}</span></div>
                        <div><span className="font-medium text-muted-foreground">Province:</span> <span className="text-foreground">{fbrPreviewData.buyerProvince || 'Not provided'}</span></div>
                        <div className="md:col-span-2"><span className="font-medium text-muted-foreground">Address:</span> <span className="text-foreground">{fbrPreviewData.buyerAddress || 'Not provided'}</span></div>
                      </div>
                    </div>

                    {/* Items Details */}
                    {fbrPreviewData.items && fbrPreviewData.items.length > 0 && (
                      <div className="bg-muted/30 border p-3 rounded">
                        <h4 className="font-medium mb-3 text-foreground">📦 Invoice Items ({fbrPreviewData.items.length})</h4>
                        <div className="space-y-3">
                          {fbrPreviewData.items.map((item: any, index: number) => (
                            <div key={index} className="bg-card p-3 rounded border">
                              <div className="font-medium text-sm mb-2 text-foreground">
                                {item.productDescription || item.itemName || `Item ${index + 1}`}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                <div><span className="font-medium text-muted-foreground">HS Code:</span> <span className="text-foreground">{item.hsCode}</span></div>
                                <div><span className="font-medium text-muted-foreground">Quantity:</span> <span className="text-foreground">{item.quantity}</span></div>
                                <div><span className="font-medium text-muted-foreground">UoM:</span> <span className="text-foreground">{item.uoM || item.uom || 'N/A'}</span></div>
                                <div><span className="font-medium text-muted-foreground">Rate:</span> <span className="text-foreground">{item.rate}</span></div>
                                {item.priceIncludingTax !== undefined && item.priceIncludingTax !== null && (
                                  <div><span className="font-medium text-muted-foreground">Price Incl. Tax:</span> <span className="text-foreground">{item.priceIncludingTax?.toLocaleString()}</span></div>
                                )}
                                {item.priceExcludingTax !== undefined && item.priceExcludingTax !== null && (
                                  <div><span className="font-medium text-muted-foreground">Price Excl. Tax:</span> <span className="text-foreground">{item.priceExcludingTax?.toLocaleString()}</span></div>
                                )}
                                {item.taxPercentage !== undefined && item.taxPercentage !== null && (
                                  <div><span className="font-medium text-muted-foreground">Tax %:</span> <span className="text-foreground">{item.taxPercentage}%</span></div>
                                )}
                                <div><span className="font-medium text-muted-foreground">Value Excl. ST:</span> <span className="text-foreground">{item.valueSalesExcludingST?.toLocaleString()}</span></div>
                                <div><span className="font-medium text-muted-foreground">Sales Tax:</span> <span className="text-foreground">{item.salesTaxApplicable?.toLocaleString()}</span></div>
                                <div><span className="font-medium text-muted-foreground">FED Payable:</span> <span className="text-foreground">{item.fedPayable?.toLocaleString() || 0}</span></div>
                                <div><span className="font-medium text-muted-foreground">Total Value:</span> <span className="text-foreground">{item.totalValues?.toLocaleString()}</span></div>
                                {item.saleType && (
                                  <div className="md:col-span-2"><span className="font-medium text-muted-foreground">Sale Type:</span> <span className="text-foreground">{item.saleType}</span></div>
                                )}
                                {item.discount > 0 && (
                                  <div><span className="font-medium text-muted-foreground">Discount:</span> <span className="text-foreground">{item.discount}</span></div>
                                )}
                                {item.extraTax && (
                                  <div><span className="font-medium text-muted-foreground">Extra Tax:</span> <span className="text-foreground">{item.extraTax}</span></div>
                                )}
                                {item.furtherTax > 0 && (
                                  <div><span className="font-medium text-muted-foreground">Further Tax:</span> <span className="text-foreground">{item.furtherTax}</span></div>
                                )}
                                {item.sroScheduleNo && (
                                  <div><span className="font-medium text-muted-foreground">SRO Schedule:</span> <span className="text-foreground">{item.sroScheduleNo}</span></div>
                                )}
                                {item.sroItemSerialNo && (
                                  <div><span className="font-medium text-muted-foreground">SRO Item Serial:</span> <span className="text-foreground">{item.sroItemSerialNo}</span></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary Totals */}
                    {fbrPreviewData.items && fbrPreviewData.items.length > 0 && (
                      <div className="bg-primary/10 border border-primary/30 p-3 rounded">
                        <h4 className="font-medium text-primary mb-2">💰 Invoice Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Total Items:</span> <span className="text-foreground">{fbrPreviewData.items.length}</span>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Total Quantity:</span> <span className="text-foreground">{fbrPreviewData.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Total Excl. ST:</span> <span className="text-foreground">{fbrPreviewData.items.reduce((sum: number, item: any) => sum + (item.valueSalesExcludingST || 0), 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Total Sales Tax:</span> <span className="text-foreground">{fbrPreviewData.items.reduce((sum: number, item: any) => sum + (item.salesTaxApplicable || 0), 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Total FED:</span> <span className="text-foreground">{fbrPreviewData.items.reduce((sum: number, item: any) => sum + (item.fedPayable || 0), 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Grand Total:</span> <span className="text-foreground font-semibold">{fbrPreviewData.items.reduce((sum: number, item: any) => sum + (item.totalValues || 0), 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FBR JSON Preview - Same as Console Log */}
                    <details className="border rounded p-2 bg-muted/20">
                      <summary className="cursor-pointer font-medium text-sm text-primary hover:text-primary/80">
                        🔍 FBR JSON Preview (Same as Console Log)
                      </summary>
                      <div className="mt-3 space-y-2">
                        <div className="text-xs text-muted-foreground italic">
                          This is the exact JSON that will be sent to FBR and logged in the console:
                        </div>
                        <div className="bg-card border p-3 rounded font-mono text-xs max-h-80 overflow-y-auto">
                          <div className="text-primary font-semibold">🔍 === FINAL FBR JSON PAYLOAD ===</div>
                          <div className="text-secondary-foreground font-medium">📋 Generated FBR Invoice JSON:</div>
                          <pre className="mt-2 whitespace-pre-wrap text-foreground bg-muted/30 p-2 rounded text-[10px] leading-relaxed">
                            {fbrJsonPreview ? JSON.stringify(fbrJsonPreview, null, 2) : 'No JSON data available'}
                          </pre>
                          <div className="text-primary font-semibold mt-2">===============================</div>
                        </div>
                      </div>
                    </details>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm bg-muted/30 p-3 rounded border">
                    FBR preview could not be generated. The order will be submitted without preview.
                  </div>
                )}
              </div>
            )}

            {skipFbrSubmission && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-3 rounded">
                <p className="text-amber-800 dark:text-amber-200 text-sm">
                  ⚠️ FBR submission is disabled for this order.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleOrderCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleOrderConfirm}
              disabled={submitting}
              className={isProductionSubmission ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              {submitting ? 'Creating Order...' : 'Confirm & Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 