'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '../../components/ImageUploader';
import CurrencySymbol from '../../components/CurrencySymbol';
import RichTextEditor from '../../components/RichTextEditor';
import TagSelector from '../../components/TagSelector';
import VariantManager from '../../../components/VariantManager';
import { formatPrice, generateSlug, isValidSlug } from '../../../utils/priceUtils';

interface DatabaseVariationAttribute {
  id: string;
  name: string;
  slug: string;
  type: string;
  values: Array<{
    id: string;
    value: string;
    slug: string;
    colorCode?: string;
    image?: string;
  }>;
}

interface VariationAttribute {
  id: string;
  name: string;
  type: string;
  slug: string;
  values: Array<{
    id: string;
    value: string;
    slug: string;
    colorCode?: string;
    image?: string;
  }>;
}

interface GeneratedVariant {
  id?: string;
  attributes: Array<{
    attributeId: string;
    attributeName: string;
    valueId: string;
    value: string;
    slug: string;
    colorCode?: string;
    image?: string;
  }>;
  price: string;
  comparePrice: string;
  costPrice: string;
  sku: string;
  weight: string;
  inventoryQuantity: number;
  image: string;
  isActive: boolean;
}

interface Addon {
  id: string;
  title: string;
  price: string;
  description?: string;
  image?: string;
  groupId?: string;
  groupTitle?: string;
  isActive: boolean;
  sortOrder: number;
}

interface SelectedAddon {
  addonId: string;
  addonTitle: string;
  price: string;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
}

interface SelectedTag {
  tagId: string;
  tagName: string;
  groupId: string;
  groupName: string;
  customValue?: string;
  color?: string;
}

export default function AddProduct() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    sku: '',
    price: '',
    comparePrice: '',
    costPrice: '',
    categoryId: '',
    subcategoryId: '',
    supplierId: '',
    weight: '',
    isFeatured: false,
    isActive: true,
    isDigital: false,
    requiresShipping: true,
    taxable: true,
    // Tax and discount fields
    taxAmount: '',
    taxPercentage: '',
    priceIncludingTax: '',
    priceExcludingTax: '',
    extraTax: '',
    furtherTax: '',
    fedPayableTax: '',
    discount: '',
    metaTitle: '',
    metaDescription: '',
    hsCode: '', // Harmonized System Code
    productType: 'simple',
    banner: '', // Banner image URL
    // Weight-based stock management fields
    stockManagementType: 'quantity', // 'quantity' or 'weight'
    pricePerUnit: '', // Price per gram for weight-based products
    baseWeightUnit: 'grams', // 'grams' or 'kg'
    // Cannabis-specific fields
    thc: '',
    cbd: '',
    difficulty: '',
    floweringTime: '',
    yieldAmount: ''
  });
  
  // Variable product specific states
  const [availableAttributes, setAvailableAttributes] = useState<DatabaseVariationAttribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<VariationAttribute[]>([]);
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);
  const [showVariantGeneration, setShowVariantGeneration] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // Group product specific states
  const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  
  // Tag selection state
  const [selectedTags, setSelectedTags] = useState<SelectedTag[]>([]);
  
  const [images, setImages] = useState<string[]>([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.categoryId) {
      fetchSubcategories(formData.categoryId);
    } else {
      setSubcategories([]);
    }
  }, [formData.categoryId]);

  useEffect(() => {
    if (formData.productType === 'variable' && selectedAttributes.length > 0) {
      generateVariants();
    } else {
      setGeneratedVariants([]);
    }
  }, [selectedAttributes, formData.productType]);

  useEffect(() => {
    if (generatedVariants.length > 0) {
      setShowVariantGeneration(true);
      // Auto-expand all sections
      const groupedVariants = generatedVariants.reduce((groups, variant) => {
        const firstAttr = variant.attributes[0];
        const groupKey = firstAttr ? `${firstAttr.attributeName}: ${firstAttr.value}` : 'Default';
        groups[groupKey] = true;
        return groups;
      }, {} as { [key: string]: boolean });
      setExpandedSections(new Set(Object.keys(groupedVariants)));
    }
  }, [generatedVariants]);

  const fetchInitialData = async () => {
    try {
      const [categoriesRes, attributesRes, addonsRes, suppliersRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/variation-attributes'),
        fetch('/api/addons'),
        fetch('/api/suppliers')
      ]);

      const categoriesData = await categoriesRes.json();
      const attributesData = await attributesRes.json();
      const addonsData = await addonsRes.json();
      const suppliersData = await suppliersRes.json();
      
      setCategories(categoriesData);
      setAvailableAttributes(attributesData);
      setAvailableAddons(addonsData.filter((addon: any) => addon.isActive));
      setSuppliers(suppliersData.filter((supplier: any) => supplier.isActive));
    } catch (err) {
      console.error(err);
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const res = await fetch('/api/subcategories');
      const data = await res.json();
      const filtered = data.filter((sub: any) => sub.categoryId === categoryId);
      setSubcategories(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle slug field separately to track manual edits
    if (name === 'slug') {
      setIsSlugManuallyEdited(true);
      setFormData({
        ...formData,
        [name]: generateSlug(value) // Always generate valid slug even when manually edited
      });
      return;
    }
    
    // Auto-generate slug from title if it hasn't been manually edited
    if (name === 'name' && !isSlugManuallyEdited) {
      setFormData({
        ...formData,
        [name]: value,
        slug: generateSlug(value)
      });
      return;
    }

    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle image upload and removal functions (simplified)
  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Gallery image must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setUploadingGallery(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('directory', 'products');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setImages([...images, data.url]);
      
      // Clear the input
      e.target.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const generateVariants = () => {
    if (selectedAttributes.length === 0) {
      setGeneratedVariants([]);
      return;
    }

    const validAttributes = selectedAttributes.filter(attr => attr.values.length > 0);
    if (validAttributes.length === 0) {
      setGeneratedVariants([]);
      return;
    }

    // Generate cartesian product of all attribute values
    const combinations: Array<{ [key: string]: { id: string; value: string; slug: string; colorCode?: string; image?: string; } }> = [];
    
    const generateCombinations = (index: number, current: { [key: string]: { id: string; value: string; slug: string; colorCode?: string; image?: string; } }) => {
      if (index === validAttributes.length) {
        combinations.push({ ...current });
        return;
      }

      const attribute = validAttributes[index];
      for (const valueObj of attribute.values) {
        current[attribute.name] = valueObj;
        generateCombinations(index + 1, current);
      }
    };

    generateCombinations(0, {});

    // Convert combinations to variants
    const variants: GeneratedVariant[] = combinations.map((combination, index) => {
      const attributes = Object.entries(combination).map(([attrName, valueObj]) => {
        const attribute = validAttributes.find(attr => attr.name === attrName);
        return {
          attributeId: attribute?.id || '',
          attributeName: attrName,
          valueId: valueObj.id,
          value: valueObj.value,
          slug: valueObj.slug,
          colorCode: valueObj.colorCode,
          image: valueObj.image
        };
      });

      // Generate variant title and SKU
      const variantTitle = attributes.map(attr => attr.value).join(' - ');
      const baseSku = formData.sku || formData.name.substring(0, 3).toUpperCase();
      const variantSku = `${baseSku}-${attributes.map(attr => attr.slug).join('-')}`;

      return {
        attributes,
        price: formData.price || '0',
        comparePrice: formData.comparePrice || '',
        costPrice: formData.costPrice || '',
        sku: variantSku,
        weight: formData.weight || '',
        inventoryQuantity: 0,
        image: '',
        isActive: true
      };
    });

    setGeneratedVariants(variants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        images,
        tags: selectedTags.length > 0 ? selectedTags : null,
        variationMatrix: formData.productType === 'variable' && generatedVariants.length > 0 ? {
          attributes: selectedAttributes.map(attr => ({
            id: attr.id,
            name: attr.name,
            type: attr.type,
            slug: attr.slug,
            values: attr.values
          })),
          variants: generatedVariants,
          defaultSelections: selectedAttributes.reduce((acc, attr) => {
            if (attr.values.length > 0) {
              acc[attr.id] = attr.values[0].id; // Set first value as default
            }
            return acc;
          }, {} as { [key: string]: string })
        } : null,
        addons: selectedAddons.length > 0 ? selectedAddons : null
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create product');
      }

      router.push('/products');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="max-w-6xl">
        {/* Product Type Selection */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Product Type</h3>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="productType"
                value="simple"
                checked={formData.productType === 'simple'}
                onChange={handleChange}
                className="mr-2"
              />
              Simple Product
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="productType"
                value="variable"
                checked={formData.productType === 'variable'}
                onChange={handleChange}
                className="mr-2"
              />
              Variable Product (with variations)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="productType"
                value="group"
                checked={formData.productType === 'group'}
                onChange={handleChange}
                className="mr-2"
              />
              Group Product (with addons)
            </label>
          </div>
        </div>

        {/* Stock Management Type Selection */}
        <div className="mb-6 p-4 border rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold mb-4">⚖️ Stock Management Type</h3>
          <div className="space-y-4">
            <div className="flex gap-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="stockManagementType"
                  value="quantity"
                  checked={formData.stockManagementType === 'quantity'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="font-medium">📦 Quantity-Based</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="stockManagementType"
                  value="weight"
                  checked={formData.stockManagementType === 'weight'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="font-medium">⚖️ Weight-Based</span>
              </label>
            </div>
            
            <div className="text-sm text-gray-600">
              {formData.stockManagementType === 'quantity' ? (
                <p>📦 <strong>Quantity-based:</strong> Track inventory by individual units/pieces (e.g., 5 shirts, 10 books)</p>
              ) : (
                <p>⚖️ <strong>Weight-based:</strong> Track inventory by weight (e.g., 2.5kg rice, 500g coffee beans)</p>
              )}
            </div>

            {/* Weight-based specific fields */}
            {formData.stockManagementType === 'weight' && (
              <div className="mt-4 p-4 bg-white border rounded-lg">
                <h4 className="font-medium mb-3">Weight-Based Pricing Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="pricePerUnit">
                      Price per {formData.baseWeightUnit === 'kg' ? 'Kilogram' : 'Gram'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="pricePerUnit"
                      name="pricePerUnit"
                      value={formData.pricePerUnit}
                      onChange={handleChange}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                      step={formData.baseWeightUnit === 'kg' ? '0.01' : '0.0001'}
                      min="0"
                      required={formData.stockManagementType === 'weight'}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="baseWeightUnit">
                      Base Weight Unit
                    </label>
                    <select
                      id="baseWeightUnit"
                      name="baseWeightUnit"
                      value={formData.baseWeightUnit}
                      onChange={handleChange}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                    >
                      <option value="grams">Grams (g)</option>
                      <option value="kg">Kilograms (kg)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="name">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="slug">
                Slug <span className="text-sm text-gray-500">(SEO-friendly URL)</span>
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className={`w-full p-2 border rounded focus:outline-none transition-colors ${
                  formData.slug && !isValidSlug(formData.slug) 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="auto-generated-from-product-name"
              />
              {formData.slug && (
                <div className="mt-1">
                  {isValidSlug(formData.slug) ? (
                    <p className="text-sm text-green-600 flex items-center">
                      <span className="mr-1">✓</span>
                      Preview URL: /products/{formData.slug}
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 flex items-center">
                      <span className="mr-1">✗</span>
                      Invalid slug. Only lowercase letters, numbers, and hyphens allowed.
                    </p>
                  )}
                </div>
              )}
              {!isSlugManuallyEdited && (
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated from product name. You can edit it manually.
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="description">
                Description
              </label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Enter a detailed description of your product..."
                height="250px"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="shortDescription">
                Short Description
              </label>
              <textarea
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                rows={2}
              />
            </div>

            {/* Product Gallery Manager */}
            <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Product Gallery</h3>
                  <p className="text-sm text-gray-600">Manage your product images</p>
                </div>
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {images.map((image, index) => (
                  <div key={index} className="group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border-2 border-purple-100">
                    <div className="aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img 
                        src={image} 
                        alt={`Gallery ${index + 1}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {/* Add New Image Card */}
                <div className="aspect-square border-2 border-dashed border-purple-300 rounded-lg flex flex-col items-center justify-center bg-white hover:bg-purple-50 transition-colors duration-300 cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryImageUpload}
                    className="hidden"
                    id="gallery-upload"
                    disabled={submitting || uploadingGallery}
                  />
                  <label htmlFor="gallery-upload" className={`w-full h-full flex flex-col items-center justify-center ${uploadingGallery ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                      {uploadingGallery ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      ) : (
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-purple-700 text-center px-2">
                      {uploadingGallery ? 'Uploading...' : 'Add Image'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Pricing & Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing & Details</h3>
            
            {/* Only show pricing fields for simple products and quantity-based */}
            {formData.productType === 'simple' && formData.stockManagementType === 'quantity' && (
              <>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="price">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="comparePrice">
                    Compare Price <span className="text-sm text-gray-500">(Optional - for showing discounts)</span>
                  </label>
                  <input
                    type="number"
                    id="comparePrice"
                    name="comparePrice"
                    value={formData.comparePrice}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="costPrice">
                    Cost Price <span className="text-sm text-gray-500">(For profit tracking)</span>
                  </label>
                  <input
                    type="number"
                    id="costPrice"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>

                {/* Tax and Discount Fields */}
                <div className="mt-6 p-4 border rounded-lg bg-green-50">
                  <h4 className="text-lg font-semibold mb-4 text-green-800">💰 Tax & Discount Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="taxAmount">
                        Tax Amount
                      </label>
                      <input
                        type="number"
                        id="taxAmount"
                        name="taxAmount"
                        value={formData.taxAmount}
                        onChange={handleChange}
                        className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="taxPercentage">
                        Tax Percentage (%)
                      </label>
                      <input
                        type="number"
                        id="taxPercentage"
                        name="taxPercentage"
                        value={formData.taxPercentage}
                        onChange={handleChange}
                        className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2" htmlFor="discount">
                        Discount Amount
                      </label>
                      <input
                        type="number"
                        id="discount"
                        name="discount"
                        value={formData.discount}
                        onChange={handleChange}
                        className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Base price field for group products */}
            {formData.productType === 'group' && (
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="price">
                  Base Price <span className="text-sm text-gray-500">(Optional - can be 0 if all pricing comes from addons)</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                  step="0.01"
                  min="0"
                />
              </div>
            )}

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="categoryId">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a category</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {subcategories.length > 0 && (
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="subcategoryId">
                  Subcategory
                </label>
                <select
                  id="subcategoryId"
                  name="subcategoryId"
                  value={formData.subcategoryId}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select a subcategory</option>
                  {subcategories.map((subcategory: any) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="supplierId">
                Preferred Supplier
              </label>
              <select
                id="supplierId"
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a supplier (optional)</option>
                {suppliers.map((supplier: any) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} {supplier.companyName && `(${supplier.companyName})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="sku">
                SKU <span className="text-sm text-gray-500">(Stock Keeping Unit)</span>
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                placeholder="e.g., SHIRT-001"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="hsCode">
                Product HS Code
              </label>
              <input
                type="text"
                id="hsCode"
                name="hsCode"
                value={formData.hsCode}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                placeholder="e.g., 1234.56.78"
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">
                Harmonized System Code for customs and tax classification
              </p>
            </div>

            {/* Product Settings */}
            <div className="mt-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="text-lg font-semibold mb-4">Product Settings</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label htmlFor="isFeatured">Featured Product</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label htmlFor="isActive">Active</label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="taxable"
                    name="taxable"
                    checked={formData.taxable}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label htmlFor="taxable">Taxable</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="metaTitle">
                    Meta Title <span className="text-sm text-gray-500">(SEO)</span>
                  </label>
                  <input
                    type="text"
                    id="metaTitle"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                    maxLength={60}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="metaDescription">
                    Meta Description <span className="text-sm text-gray-500">(SEO)</span>
                  </label>
                  <textarea
                    id="metaDescription"
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                    rows={2}
                    maxLength={160}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Variable Product Variations */}
        {formData.productType === 'variable' && (
          <div className="mt-8 p-6 border rounded-lg bg-blue-50">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Product Variations</h3>
            <VariantManager 
              availableAttributes={availableAttributes}
              selectedAttributes={selectedAttributes}
              onAttributeSelectionChange={setSelectedAttributes}
              generatedVariants={generatedVariants}
              onVariantUpdate={(index, field, value) => {
                const updated = [...generatedVariants];
                updated[index] = { ...updated[index], [field]: value };
                setGeneratedVariants(updated);
              }}
            />
          </div>
        )}

        {/* Group Product Addons */}
        {formData.productType === 'group' && (
          <div className="mt-8 p-6 border rounded-lg bg-green-50">
            <h3 className="text-lg font-semibold mb-4 text-green-800">Product Addons</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Available Addons</label>
                <select
                  onChange={(e) => {
                    const addonId = e.target.value;
                    if (addonId && !selectedAddons.find(sa => sa.addonId === addonId)) {
                      const addon = availableAddons.find(a => a.id === addonId);
                      if (addon) {
                        setSelectedAddons([...selectedAddons, {
                          addonId: addon.id,
                          addonTitle: addon.title,
                          price: addon.price,
                          isRequired: false,
                          sortOrder: selectedAddons.length,
                          isActive: true
                        }]);
                      }
                    }
                    e.target.value = '';
                  }}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select an addon to add</option>
                  {availableAddons
                    .filter(addon => !selectedAddons.find(sa => sa.addonId === addon.id))
                    .map(addon => (
                      <option key={addon.id} value={addon.id}>
                        {addon.title} - <CurrencySymbol />{parseFloat(addon.price).toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>

              {selectedAddons.length > 0 && (
                <div className="space-y-4">
                  {selectedAddons.map((selectedAddon) => {
                    const addon = availableAddons.find(a => a.id === selectedAddon.addonId);
                    return (
                      <div key={selectedAddon.addonId} className="p-4 border rounded-lg bg-white">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">{selectedAddon.addonTitle}</h4>
                          <button
                            type="button"
                            onClick={() => setSelectedAddons(selectedAddons.filter(addon => addon.addonId !== selectedAddon.addonId))}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Override Price
                            </label>
                            <input
                              type="number"
                              value={selectedAddon.price}
                              onChange={(e) => {
                                const updated = selectedAddons.map(addon => 
                                  addon.addonId === selectedAddon.addonId 
                                    ? { ...addon, price: e.target.value }
                                    : addon
                                );
                                setSelectedAddons(updated);
                              }}
                              className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                              step="0.01"
                              min="0"
                            />
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              Original price: <CurrencySymbol />{addon ? parseFloat(addon.price).toFixed(2) : '0.00'}
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-center space-y-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedAddon.isRequired}
                                onChange={(e) => {
                                  const updated = selectedAddons.map(addon => 
                                    addon.addonId === selectedAddon.addonId 
                                      ? { ...addon, isRequired: e.target.checked }
                                      : addon
                                  );
                                  setSelectedAddons(updated);
                                }}
                                className="mr-2"
                              />
                              Required Addon
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="mt-8">
          <TagSelector
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </div>

        <div className="flex gap-4 pt-6 border-t mt-8">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/products')}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
