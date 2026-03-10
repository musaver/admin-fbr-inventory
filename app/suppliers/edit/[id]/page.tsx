'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeftIcon, SaveIcon } from 'lucide-react';

interface SupplierFormData {
  name: string;
  companyName: string;
  email: string;
  phone: string;
  fax: string;
  website: string;
  taxId: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  primaryContactMobile: string;
  secondaryContactName: string;
  secondaryContactEmail: string;
  secondaryContactPhone: string;
  secondaryContactMobile: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentTerms: string;
  currency: string;
  notes: string;
  sellerNTNCNIC: string;
  sellerBusinessName: string;
  sellerProvince: string;
  sellerAddress: string;
  isActive: boolean;
}

interface EditSupplierPageProps {
  params: Promise<{ id: string }>;
}

export default function EditSupplierPage({ params }: EditSupplierPageProps) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    fax: '',
    website: '',
    taxId: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    primaryContactMobile: '',
    secondaryContactName: '',
    secondaryContactEmail: '',
    secondaryContactPhone: '',
    secondaryContactMobile: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    paymentTerms: '',
    currency: 'USD',
    notes: '',
    sellerNTNCNIC: '',
    sellerBusinessName: '',
    sellerProvince: '',
    sellerAddress: '',
    isActive: true,
  });

  useEffect(() => {
    const initPage = async () => {
      const resolvedParams = await params;
      setSupplierId(resolvedParams.id);
      await fetchSupplier(resolvedParams.id);
    };
    initPage();
  }, [params]);

  const fetchSupplier = async (id: string) => {
    try {
      const response = await fetch(`/api/suppliers/${id}`);
      if (response.ok) {
        const supplier = await response.json();
        setFormData({
          name: supplier.name || '',
          companyName: supplier.companyName || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          fax: supplier.fax || '',
          website: supplier.website || '',
          taxId: supplier.taxId || '',
          primaryContactName: supplier.primaryContactName || '',
          primaryContactEmail: supplier.primaryContactEmail || '',
          primaryContactPhone: supplier.primaryContactPhone || '',
          primaryContactMobile: supplier.primaryContactMobile || '',
          secondaryContactName: supplier.secondaryContactName || '',
          secondaryContactEmail: supplier.secondaryContactEmail || '',
          secondaryContactPhone: supplier.secondaryContactPhone || '',
          secondaryContactMobile: supplier.secondaryContactMobile || '',
          address: supplier.address || '',
          city: supplier.city || '',
          state: supplier.state || '',
          postalCode: supplier.postalCode || '',
          country: supplier.country || '',
          paymentTerms: supplier.paymentTerms || '',
          currency: supplier.currency || 'USD',
          notes: supplier.notes || '',
          sellerNTNCNIC: supplier.sellerNTNCNIC || '',
          sellerBusinessName: supplier.sellerBusinessName || '',
          sellerProvince: supplier.sellerProvince || '',
          sellerAddress: supplier.sellerAddress || '',
          isActive: supplier.isActive,
        });
      } else {
        console.error('Failed to fetch supplier');
        router.push('/suppliers');
      }
    } catch (error) {
      console.error('Error fetching supplier:', error);
      router.push('/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/suppliers');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update supplier');
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      alert('Failed to update supplier');
    } finally {
      setSaving(false);
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
        <Link href="/suppliers">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Suppliers
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Supplier</h1>
          <p className="text-muted-foreground">
            Update supplier information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Essential supplier details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Supplier Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter supplier name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium">
                  Company Name
                </label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="fax" className="text-sm font-medium">
                  Fax Number
                </label>
                <Input
                  id="fax"
                  name="fax"
                  value={formData.fax}
                  onChange={handleInputChange}
                  placeholder="Enter fax number"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="website" className="text-sm font-medium">
                  Website
                </label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="taxId" className="text-sm font-medium">
                  Tax ID / Business Registration
                </label>
                <Input
                  id="taxId"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  placeholder="Enter tax ID"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Persons</CardTitle>
            <CardDescription>
              Primary and secondary contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-4">Primary Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="primaryContactName" className="text-sm font-medium">
                    Contact Name
                  </label>
                  <Input
                    id="primaryContactName"
                    name="primaryContactName"
                    value={formData.primaryContactName}
                    onChange={handleInputChange}
                    placeholder="Enter contact name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="primaryContactEmail" className="text-sm font-medium">
                    Contact Email
                  </label>
                  <Input
                    id="primaryContactEmail"
                    name="primaryContactEmail"
                    type="email"
                    value={formData.primaryContactEmail}
                    onChange={handleInputChange}
                    placeholder="Enter contact email"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="primaryContactPhone" className="text-sm font-medium">
                    Office Phone
                  </label>
                  <Input
                    id="primaryContactPhone"
                    name="primaryContactPhone"
                    value={formData.primaryContactPhone}
                    onChange={handleInputChange}
                    placeholder="Enter office phone"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="primaryContactMobile" className="text-sm font-medium">
                    Mobile Phone
                  </label>
                  <Input
                    id="primaryContactMobile"
                    name="primaryContactMobile"
                    value={formData.primaryContactMobile}
                    onChange={handleInputChange}
                    placeholder="Enter mobile phone"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-4">Secondary Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="secondaryContactName" className="text-sm font-medium">
                    Contact Name
                  </label>
                  <Input
                    id="secondaryContactName"
                    name="secondaryContactName"
                    value={formData.secondaryContactName}
                    onChange={handleInputChange}
                    placeholder="Enter contact name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="secondaryContactEmail" className="text-sm font-medium">
                    Contact Email
                  </label>
                  <Input
                    id="secondaryContactEmail"
                    name="secondaryContactEmail"
                    type="email"
                    value={formData.secondaryContactEmail}
                    onChange={handleInputChange}
                    placeholder="Enter contact email"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="secondaryContactPhone" className="text-sm font-medium">
                    Office Phone
                  </label>
                  <Input
                    id="secondaryContactPhone"
                    name="secondaryContactPhone"
                    value={formData.secondaryContactPhone}
                    onChange={handleInputChange}
                    placeholder="Enter office phone"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="secondaryContactMobile" className="text-sm font-medium">
                    Mobile Phone
                  </label>
                  <Input
                    id="secondaryContactMobile"
                    name="secondaryContactMobile"
                    value={formData.secondaryContactMobile}
                    onChange={handleInputChange}
                    placeholder="Enter mobile phone"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
            <CardDescription>
              Supplier's business address and location details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Street Address
              </label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter street address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium">
                  City
                </label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="state" className="text-sm font-medium">
                  State/Province
                </label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="Enter state/province"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="postalCode" className="text-sm font-medium">
                  Postal Code
                </label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="Enter postal code"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="country" className="text-sm font-medium">
                  Country
                </label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Terms</CardTitle>
            <CardDescription>
              Payment terms and other business details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="paymentTerms" className="text-sm font-medium">
                  Payment Terms
                </label>
                <Input
                  id="paymentTerms"
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleInputChange}
                  placeholder="e.g., Net 30, Net 60"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="currency" className="text-sm font-medium">
                  Currency
                </label>
                <Input
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  placeholder="USD"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="Additional notes about the supplier..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded border-input"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active Supplier
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seller Information</CardTitle>
            <CardDescription>
              Additional seller details and identification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="sellerNTNCNIC" className="text-sm font-medium">
                  NTN or CNIC of Seller
                </label>
                <Input
                  id="sellerNTNCNIC"
                  name="sellerNTNCNIC"
                  value={formData.sellerNTNCNIC}
                  onChange={handleInputChange}
                  placeholder="Enter NTN or CNIC"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="sellerBusinessName" className="text-sm font-medium">
                  Business Name of Seller
                </label>
                <Input
                  id="sellerBusinessName"
                  name="sellerBusinessName"
                  value={formData.sellerBusinessName}
                  onChange={handleInputChange}
                  placeholder="Enter business name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="sellerProvince" className="text-sm font-medium">
                Province Name
              </label>
              <Input
                id="sellerProvince"
                name="sellerProvince"
                value={formData.sellerProvince}
                onChange={handleInputChange}
                placeholder="Enter province name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="sellerAddress" className="text-sm font-medium">
                Address of Seller
              </label>
              <textarea
                id="sellerAddress"
                name="sellerAddress"
                value={formData.sellerAddress}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="Enter seller's complete address"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/suppliers">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            ) : (
              <SaveIcon className="mr-2 h-4 w-4" />
            )}
            Update Supplier
          </Button>
        </div>
      </form>
    </div>
  );
}
