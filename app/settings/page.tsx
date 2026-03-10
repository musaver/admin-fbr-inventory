'use client';
import React, { useState, useEffect } from 'react';
import CurrencySymbol from '../components/CurrencySymbol';
import { useCurrency } from '@/app/contexts/CurrencyContext';
import { CurrencyCode } from '@/app/contexts/CurrencyContext';
import { Separator } from "@/components/ui/separator";

interface TaxSetting {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  value: number;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Currency context
  const { currentCurrency, availableCurrencies, setCurrency, loading: currencyLoading } = useCurrency();
  
  // Stock management setting
  const [stockManagementEnabled, setStockManagementEnabled] = useState(true);
  
  // Tax settings
  const [vatTax, setVatTax] = useState<TaxSetting>({
    enabled: false,
    type: 'percentage',
    value: 0
  });
  
  const [serviceTax, setServiceTax] = useState<TaxSetting>({
    enabled: false,
    type: 'percentage',
    value: 0
  });

  // Loyalty settings
  const [loyaltySettings, setLoyaltySettings] = useState({
    loyalty_enabled: { value: false, type: 'boolean', description: '' },
    points_earning_rate: { value: 1, type: 'number', description: '' },
    points_earning_basis: { value: 'subtotal', type: 'string', description: '' },
    points_redemption_value: { value: 0.01, type: 'number', description: '' },
    points_expiry_months: { value: 12, type: 'number', description: '' },
    points_minimum_order: { value: 0, type: 'number', description: '' },
    points_max_redemption_percent: { value: 50, type: 'number', description: '' },
    points_redemption_minimum: { value: 100, type: 'number', description: '' }
  });

  // FBR settings
  const [fbrSettings, setFbrSettings] = useState({
    fbrBaseUrl: '',
    fbrSandboxToken: '',
    fbrProductionToken: '',
    fbrSellerNTNCNIC: '',
    fbrSellerBusinessName: '',
    fbrSellerProvince: '',
    fbrSellerAddress: '',
    fbrStrnNumber: ''
  });

  // Logo settings
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [stockRes, taxRes, loyaltyRes, fbrRes, logoRes] = await Promise.all([
        fetch('/api/settings/stock-management'),
        fetch('/api/settings/tax-settings'),
        fetch('/api/settings/loyalty'),
        fetch('/api/settings/fbr'),
        fetch('/api/settings/logo')
      ]);
      
      const stockData = await stockRes.json();
      const taxData = await taxRes.json();
      const loyaltyData = await loyaltyRes.json();
      const fbrData = await fbrRes.json();
      const logoData = await logoRes.json();
      
      setStockManagementEnabled(stockData.stockManagementEnabled);
      setVatTax(taxData.vatTax);
      setServiceTax(taxData.serviceTax);
      
      if (loyaltyData.success) {
        setLoyaltySettings(loyaltyData.settings);
      }
      
      if (fbrData.success) {
        setFbrSettings(fbrData.settings);
      }

      if (logoData.success && logoData.logoUrl) {
        setLogoUrl(logoData.logoUrl);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleStockManagementToggle = async () => {
    try {
      setSaving(true);
      setError('');
      
      const response = await fetch('/api/settings/stock-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !stockManagementEnabled })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update stock management setting');
      }
      
      setStockManagementEnabled(!stockManagementEnabled);
      setSuccess('Stock management setting updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCurrencyChange = async (currency: CurrencyCode) => {
    try {
      setSaving(true);
      setError('');
      
      await setCurrency(currency);
      setSuccess('Currency updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTaxSettingChange = (
    taxType: 'vat' | 'service',
    field: keyof TaxSetting,
    value: any
  ) => {
    const updateFunction = taxType === 'vat' ? setVatTax : setServiceTax;
    const currentSetting = taxType === 'vat' ? vatTax : serviceTax;
    
    updateFunction({
      ...currentSetting,
      [field]: value
    });
  };

  const handleSaveTaxSettings = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Validate settings
      if (vatTax.enabled && vatTax.value <= 0) {
        throw new Error('VAT tax value must be greater than 0 when enabled');
      }
      if (serviceTax.enabled && serviceTax.value <= 0) {
        throw new Error('Service tax value must be greater than 0 when enabled');
      }
      if (vatTax.type === 'percentage' && vatTax.value > 100) {
        throw new Error('VAT tax percentage cannot exceed 100%');
      }
      if (serviceTax.type === 'percentage' && serviceTax.value > 100) {
        throw new Error('Service tax percentage cannot exceed 100%');
      }
      
      const response = await fetch('/api/settings/tax-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vatTax, serviceTax })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update tax settings');
      }
      
      setSuccess('Tax settings updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatTaxPreview = (tax: TaxSetting, baseAmount: number = 100) => {
    if (!tax.enabled) return '0.00';
    
    if (tax.type === 'percentage') {
      return ((baseAmount * tax.value) / 100).toFixed(2);
    } else {
      return tax.value.toFixed(2);
    }
  };

  const handleLoyaltySettingChange = (key: string, value: any) => {
    setLoyaltySettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key as keyof typeof prev],
        value
      }
    }));
  };

  const handleSaveLoyaltySettings = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Validate settings
      if (loyaltySettings.points_earning_rate.value <= 0) {
        throw new Error('Points earning rate must be greater than 0');
      }
      if (loyaltySettings.points_redemption_value.value <= 0) {
        throw new Error('Points redemption value must be greater than 0');
      }
      if (loyaltySettings.points_max_redemption_percent.value > 100) {
        throw new Error('Maximum redemption percentage cannot exceed 100%');
      }
      if (loyaltySettings.points_redemption_minimum.value < 0) {
        throw new Error('Minimum redemption points cannot be negative');
      }
      
      const response = await fetch('/api/settings/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: loyaltySettings })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update loyalty settings');
      }
      
      setSuccess('Loyalty settings updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFbrSettingChange = (key: string, value: string) => {
    setFbrSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('directory', 'logos');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        throw new Error(data.error || 'Failed to upload logo');
      }

      const { url } = await uploadResponse.json();

      // Save logo URL to settings
      const saveResponse = await fetch('/api/settings/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: url }),
      });

      if (!saveResponse.ok) {
        const data = await saveResponse.json();
        throw new Error(data.error || 'Failed to save logo');
      }

      setLogoUrl(url);
      setSuccess('Logo uploaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveFbrSettings = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Validate required fields
      if (!fbrSettings.fbrBaseUrl.trim()) {
        throw new Error('FBR Base URL is required');
      }
      if (!fbrSettings.fbrSandboxToken.trim()) {
        throw new Error('FBR Sandbox Token is required');
      }
      if (!fbrSettings.fbrSellerNTNCNIC.trim()) {
        throw new Error('Seller NTN/CNIC is required');
      }
      if (!fbrSettings.fbrSellerBusinessName.trim()) {
        throw new Error('Seller Business Name is required');
      }
      if (!fbrSettings.fbrSellerProvince.trim()) {
        throw new Error('Seller Province is required');
      }
      if (!fbrSettings.fbrSellerAddress.trim()) {
        throw new Error('Seller Address is required');
      }
      
      const response = await fetch('/api/settings/fbr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: fbrSettings })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update FBR settings');
      }
      
      setSuccess('FBR settings updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg border border-green-200">
          {success}
        </div>
      )}

      <div className="space-y-8">
        {/* Logo Upload Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Tenant Logo</h2>
            <p className="text-gray-600 text-sm mt-1">
              Upload your business logo to personalize your tenant
            </p>
          </div>

          <div className="space-y-4">
            {logoUrl && (
              <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <img 
                  src={logoUrl} 
                  alt="Tenant Logo" 
                  className="max-h-32 object-contain"
                />
              </div>
            )}

            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="hidden"
                id="logo-upload"
              />
              <label 
                htmlFor="logo-upload"
                className={`cursor-pointer flex flex-col items-center ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm font-medium text-gray-700 mb-1">
                  {uploadingLogo ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                </span>
                <span className="text-xs text-gray-500">
                  PNG, JPG, WEBP up to 5MB
                </span>
              </label>
            </div>

            {logoUrl && (
              <div className="text-center">
                <button
                  onClick={() => {
                    setLogoUrl('');
                    // Optionally call API to remove logo
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove Logo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stock Management Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Stock Management</h2>
              <p className="text-gray-600 text-sm mt-1">
                Enable or disable inventory tracking for your products
              </p>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleStockManagementToggle}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  stockManagementEnabled ? 'bg-blue-600' : 'bg-gray-200'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    stockManagementEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {stockManagementEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            {stockManagementEnabled ? (
              <p>✅ Orders will check and update inventory levels automatically</p>
            ) : (
              <p>❌ Orders will be created without inventory validation</p>
            )}
          </div>
        </div>

        {/* Currency Settings Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Currency Settings</h2>
            <p className="text-gray-600 text-sm mt-1">
              Select the currency to display throughout the application
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Currency
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(availableCurrencies).map(([code, currency]) => (
                  <button
                    key={code}
                    onClick={() => handleCurrencyChange(code as CurrencyCode)}
                    disabled={saving || currencyLoading}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      currentCurrency === code
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    } ${saving || currencyLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span 
                          className="text-2xl currency-symbol"
                          dangerouslySetInnerHTML={{ __html: currency.symbol }}
                        />
                        <div className="text-left">
                          <div className="font-medium">{currency.name}</div>
                          <div className="text-sm opacity-75">{currency.code}</div>
                        </div>
                      </div>
                      {currentCurrency === code && (
                        <div className="text-blue-500">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Currency Preview */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Currency Preview</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <div>Sample price: <CurrencySymbol />100.00</div>
                <div>Selected currency: {availableCurrencies[currentCurrency].name} ({availableCurrencies[currentCurrency].code})</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tax Settings Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Tax Configuration</h2>
            <p className="text-gray-600 text-sm mt-1">
              Configure VAT and Service tax rates for your orders
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* VAT Tax Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-700">VAT Tax</h3>
                <button
                  onClick={() => handleTaxSettingChange('vat', 'enabled', !vatTax.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    vatTax.enabled ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      vatTax.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {vatTax.enabled && (
                <div className="space-y-4 pl-4 border-l-2 border-green-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Type
                    </label>
                    <select
                      value={vatTax.type}
                      onChange={(e) => handleTaxSettingChange('vat', 'type', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Value
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={vatTax.value}
                        onChange={(e) => handleTaxSettingChange('vat', 'value', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        min="0"
                        max={vatTax.type === 'percentage' ? '100' : undefined}
                        step={vatTax.type === 'percentage' ? '0.1' : '0.01'}
                        placeholder="0"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">
                          {vatTax.type === 'percentage' ? '%' : <CurrencySymbol />}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm text-green-700">
                      <strong>Preview:</strong> On a <CurrencySymbol />100 order, VAT tax would be{' '}
                      <CurrencySymbol />{formatTaxPreview(vatTax, 100)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Service Tax Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-700">Service Tax</h3>
                <button
                  onClick={() => handleTaxSettingChange('service', 'enabled', !serviceTax.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    serviceTax.enabled ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      serviceTax.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {serviceTax.enabled && (
                <div className="space-y-4 pl-4 border-l-2 border-purple-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Type
                    </label>
                    <select
                      value={serviceTax.type}
                      onChange={(e) => handleTaxSettingChange('service', 'type', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Value
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={serviceTax.value}
                        onChange={(e) => handleTaxSettingChange('service', 'value', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        min="0"
                        max={serviceTax.type === 'percentage' ? '100' : undefined}
                        step={serviceTax.type === 'percentage' ? '0.1' : '0.01'}
                        placeholder="0"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">
                          {serviceTax.type === 'percentage' ? '%' : <CurrencySymbol />}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-3 rounded-md">
                    <p className="text-sm text-purple-700">
                      <strong>Preview:</strong> On a <CurrencySymbol />100 order, Service tax would be{' '}
                      <CurrencySymbol />{formatTaxPreview(serviceTax, 100)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Combined Tax Preview */}
          {(vatTax.enabled || serviceTax.enabled) && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Combined Tax Preview</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>Base Amount: <CurrencySymbol />100.00</div>
                {vatTax.enabled && (
                  <div>VAT Tax: <CurrencySymbol />{formatTaxPreview(vatTax, 100)}</div>
                )}
                {serviceTax.enabled && (
                  <div>Service Tax: <CurrencySymbol />{formatTaxPreview(serviceTax, 100)}</div>
                )}
                <div className="font-medium pt-2 border-t border-blue-300">
                  Total Amount: <CurrencySymbol />
                  {(100 + 
                    (vatTax.enabled ? parseFloat(formatTaxPreview(vatTax, 100)) : 0) + 
                    (serviceTax.enabled ? parseFloat(formatTaxPreview(serviceTax, 100)) : 0)
                  ).toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveTaxSettings}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Tax Settings'}
            </button>
          </div>
        </div>

        {/* Loyalty Points Settings Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Loyalty Points System</h2>
            <p className="text-gray-600 text-sm mt-1">
              Configure loyalty points earning and redemption settings
            </p>
          </div>

          {/* Enable/Disable Loyalty System */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-700">Enable Loyalty Points</h3>
                <p className="text-sm text-gray-500">Allow customers to earn and redeem loyalty points</p>
              </div>
              <button
                onClick={() => handleLoyaltySettingChange('loyalty_enabled', !loyaltySettings.loyalty_enabled.value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  loyaltySettings.loyalty_enabled.value ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    loyaltySettings.loyalty_enabled.value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {loyaltySettings.loyalty_enabled.value && (
            <div className="space-y-6 pl-4 border-l-2 border-purple-200">
              {/* Points Earning Settings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700">Points Earning</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points per Currency Unit
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={loyaltySettings.points_earning_rate.value}
                      onChange={(e) => handleLoyaltySettingChange('points_earning_rate', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      placeholder="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      e.g., 1 = customers earn 1 point per <CurrencySymbol />1 spent
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calculate Points Based On
                    </label>
                    <select
                      value={loyaltySettings.points_earning_basis.value}
                      onChange={(e) => handleLoyaltySettingChange('points_earning_basis', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="subtotal">Subtotal (before tax/shipping)</option>
                      <option value="total">Total Amount (including tax/shipping)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Order Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">
                        <CurrencySymbol />
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={loyaltySettings.points_minimum_order.value}
                        onChange={(e) => handleLoyaltySettingChange('points_minimum_order', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum order amount required to earn points (0 = no minimum)
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700">Points Redemption</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Redemption Value per Point
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">
                        <CurrencySymbol />
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={loyaltySettings.points_redemption_value.value}
                        onChange={(e) => handleLoyaltySettingChange('points_redemption_value', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        placeholder="0.01"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      e.g., 0.01 = 1 point = <CurrencySymbol />0.01 discount
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Points to Redeem
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={loyaltySettings.points_redemption_minimum.value}
                      onChange={(e) => handleLoyaltySettingChange('points_redemption_minimum', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      placeholder="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum points required for redemption
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Redemption Percentage
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={loyaltySettings.points_max_redemption_percent.value}
                      onChange={(e) => handleLoyaltySettingChange('points_max_redemption_percent', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      placeholder="50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum % of order that can be paid with points
                    </p>
                  </div>
                </div>
              </div>

              {/* Points Expiry Settings */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-700 mb-4">Points Expiry</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points Expire After (Months)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={loyaltySettings.points_expiry_months.value}
                    onChange={(e) => handleLoyaltySettingChange('points_expiry_months', parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="12"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of months after which points expire (0 = never expire)
                  </p>
                </div>
              </div>

              {/* Preview Section */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="text-md font-medium text-purple-800 mb-2">Preview</h4>
                <div className="text-sm text-purple-700 space-y-1">
                  <p>• Customer spends <CurrencySymbol />100 → earns {(100 * loyaltySettings.points_earning_rate.value).toFixed(0)} points</p>
                  <p>• {loyaltySettings.points_redemption_minimum.value} points = <CurrencySymbol />{(loyaltySettings.points_redemption_minimum.value * loyaltySettings.points_redemption_value.value).toFixed(2)} discount</p>
                  <p>• Maximum discount on <CurrencySymbol />100 order: <CurrencySymbol />{(100 * loyaltySettings.points_max_redemption_percent.value / 100).toFixed(2)}</p>
                  {loyaltySettings.points_expiry_months.value > 0 && (
                    <p>• Points expire after {loyaltySettings.points_expiry_months.value} months</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveLoyaltySettings}
              disabled={saving}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Loyalty Settings'}
            </button>
          </div>
        </div>

        {/* FBR Settings Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">FBR Digital Invoicing</h2>
            <p className="text-gray-600 text-sm mt-1">
              Configure FBR (Federal Board of Revenue) settings for digital invoicing compliance
            </p>
          </div>

          <div className="space-y-6">
            {/* API Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">API Configuration</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    FBR Base URL
                  </label>
                  <input
                    type="url"
                    value={fbrSettings.fbrBaseUrl}
                    onChange={(e) => handleFbrSettingChange('fbrBaseUrl', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://esp.fbr.gov.pk"
                  />
                  <p className="text-xs text-gray-500">
                    The base URL for FBR API endpoints
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    FBR Sandbox Token
                  </label>
                  <input
                    type="password"
                    value={fbrSettings.fbrSandboxToken}
                    onChange={(e) => handleFbrSettingChange('fbrSandboxToken', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your FBR sandbox token"
                  />
                  <p className="text-xs text-gray-500">
                    Your FBR sandbox API token for testing
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-orange-600">
                    Production Environment Token
                  </label>
                  <input
                    type="password"
                    value={fbrSettings.fbrProductionToken}
                    onChange={(e) => handleFbrSettingChange('fbrProductionToken', e.target.value)}
                    className="w-full p-3 border border-orange-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your FBR production token"
                  />
                  <p className="text-xs text-orange-600">
                    ⚠️ Your FBR production API token for live invoice submissions
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Seller Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Seller Information</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Seller NTN/CNIC
                  </label>
                  <input
                    type="text"
                    value={fbrSettings.fbrSellerNTNCNIC}
                    onChange={(e) => handleFbrSettingChange('fbrSellerNTNCNIC', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your NTN or CNIC number"
                  />
                  <p className="text-xs text-gray-500">
                    Your National Tax Number or Computerized National Identity Card number
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={fbrSettings.fbrSellerBusinessName}
                    onChange={(e) => handleFbrSettingChange('fbrSellerBusinessName', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your registered business name"
                  />
                  <p className="text-xs text-gray-500">
                    Your official business name as registered with FBR
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Province
                  </label>
                  <select
                    value={fbrSettings.fbrSellerProvince}
                    onChange={(e) => handleFbrSettingChange('fbrSellerProvince', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Province</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Capital Territory">Capital Territory</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                    <option value="Azad Jammu and Kashmir">Azad Jammu and Kashmir</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    The province where your business is registered
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Business Address
                  </label>
                  <input
                    type="text"
                    value={fbrSettings.fbrSellerAddress}
                    onChange={(e) => handleFbrSettingChange('fbrSellerAddress', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your complete business address"
                  />
                  <p className="text-xs text-gray-500">
                    Your complete business address for invoicing
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    STRN Number
                  </label>
                  <input
                    type="text"
                    value={fbrSettings.fbrStrnNumber}
                    onChange={(e) => handleFbrSettingChange('fbrStrnNumber', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your STRN number"
                  />
                  <p className="text-xs text-gray-500">
                    Sales Tax Registration Number (STRN) issued by FBR
                  </p>
                </div>
              </div>
            </div>

            {/* Configuration Status */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  {Object.values(fbrSettings).every(value => value.trim() !== '') ? (
                    <div className="text-green-600">✅</div>
                  ) : (
                    <div className="text-yellow-600">⚠️</div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Configuration Status</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    {Object.values(fbrSettings).every(value => value.trim() !== '') 
                      ? 'All FBR settings are configured. Digital invoicing is ready.'
                      : 'Some FBR settings are missing. Please complete all fields to enable digital invoicing.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveFbrSettings}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save FBR Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 