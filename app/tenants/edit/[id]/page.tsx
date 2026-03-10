'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function EditTenantPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    plan: 'basic',
    status: 'active',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: ''
  });

  const [originalData, setOriginalData] = useState<any>(null);

  const currentUser = session?.user as any;
  const isSuperAdmin = currentUser?.type === 'super-admin';
  const tenantId = params.id as string;

  // Only super admins can access this page
  if (!isSuperAdmin) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Access Denied:</strong> Only super administrators can edit tenants.
        </div>
      </div>
    );
  }

  // Fetch tenant data
  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const response = await fetch(`/api/tenants/${tenantId}`);
        if (response.ok) {
          const tenant = await response.json();
          setFormData({
            name: tenant.name || '',
            slug: tenant.slug || '',
            email: tenant.email || '',
            phone: tenant.phone || '',
            plan: tenant.plan || 'basic',
            status: tenant.status || 'active',
            address: tenant.address || '',
            city: tenant.city || '',
            state: tenant.state || '',
            country: tenant.country || '',
            postalCode: tenant.postalCode || ''
          });
          setOriginalData(tenant);
        } else {
          setError('Failed to fetch tenant data');
        }
      } catch (error) {
        setError('Error loading tenant data');
      } finally {
        setFetchLoading(false);
      }
    };

    if (tenantId) {
      fetchTenant();
    }
  }, [tenantId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Tenant updated successfully!');
        setOriginalData(result);
        
        // If status was changed to suspended, show a warning
        if (formData.status === 'suspended' && originalData?.status !== 'suspended') {
          setSuccess('Tenant suspended successfully! They will no longer be able to login.');
        } else if (formData.status === 'active' && originalData?.status === 'suspended') {
          setSuccess('Tenant activated successfully! They can now login again.');
        }
      } else {
        setError(result.error || 'Failed to update tenant');
      }
    } catch (error: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone and will remove all tenant data.')) {
      return;
    }

    if (!confirm('This will permanently delete all data for this tenant. Type "DELETE" to confirm.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/tenants?deleted=true');
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to delete tenant');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading tenant data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!originalData) {
    return (
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Tenant not found or you don't have permission to view it.</AlertDescription>
          </Alert>
          <Link href="/tenants" className="inline-block mt-4">
            <Button variant="outline">Back to Tenants</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/tenants">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tenants
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Tenant</h1>
            <p className="text-gray-600">Update tenant information and settings</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
            <CardDescription>
              Update tenant details, plan, and status. Setting status to "suspended" will prevent tenant login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              {/* Tenant Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Acme Corp"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="slug">Subdomain *</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">https://</span>
                      <Input
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        required
                        placeholder="acme-corp"
                        disabled // Subdomain shouldn't be changed after creation
                        className="bg-gray-50"
                      />
                      <span className="text-sm text-gray-500">.localhost:3000</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Subdomain cannot be changed after creation
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="email">Company Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="admin@acmecorp.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Plan and Status */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Plan & Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan">Plan</Label>
                    <Select onValueChange={(value) => handleSelectChange('plan', value)} value={formData.plan}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic ($29/mo)</SelectItem>
                        <SelectItem value="premium">Premium ($79/mo)</SelectItem>
                        <SelectItem value="enterprise">Enterprise ($199/mo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select onValueChange={(value) => handleSelectChange('status', value)} value={formData.status}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.status === 'suspended' 
                        ? 'Suspended tenants cannot login' 
                        : 'Active tenants can login normally'
                      }
                    </p>
                  </div>
                </div>

                {/* Status Warning */}
                {formData.status === 'suspended' && originalData?.status !== 'suspended' && (
                  <Alert className="mt-4 border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-700">
                      <strong>Warning:</strong> Setting status to "suspended" will immediately prevent all tenant users from logging in.
                    </AlertDescription>
                  </Alert>
                )}

                {formData.status === 'active' && originalData?.status === 'suspended' && (
                  <Alert className="mt-4 border-green-200 bg-green-50">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      Changing status to "active" will restore login access for tenant users.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Address */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main St"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="NY"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="United States"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button 
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Tenant
                </Button>

                <Button 
                  type="submit" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Tenant
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">Tenant ID</Label>
                <p className="font-mono bg-gray-100 p-2 rounded">{originalData.id}</p>
              </div>
              <div>
                <Label className="text-gray-600">Created</Label>
                <p>{new Date(originalData.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-gray-600">Last Updated</Label>
                <p>{new Date(originalData.updatedAt).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-gray-600">Access URL</Label>
                <p>
                  <a 
                    href={`http://${originalData.slug}.localhost:3000`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {originalData.slug}.localhost:3000
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}