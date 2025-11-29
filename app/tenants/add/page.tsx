'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddTenantPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [subdomainCheck, setSubdomainCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
    suggestions: string[];
  }>({
    checking: false,
    available: null,
    message: '',
    suggestions: []
  });

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    plan: 'basic',
    status: 'active',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: ''
  });

  const [tenantInfo, setTenantInfo] = useState<any>(null);

  const currentUser = session?.user as any;
  const isSuperAdmin = currentUser?.type === 'super-admin';

  // Only super admins can access this page
  if (!isSuperAdmin) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Access Denied:</strong> Only super administrators can add tenants.
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from name
    if (name === 'name' && !formData.slug) {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 30);
      
      setFormData(prev => ({
        ...prev,
        slug: autoSlug
      }));
    }

    // Check subdomain availability when slug changes
    if (name === 'slug') {
      checkSubdomainAvailability(value);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const checkSubdomainAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSubdomainCheck({
        checking: false,
        available: null,
        message: '',
        suggestions: []
      });
      return;
    }

    setSubdomainCheck(prev => ({ ...prev, checking: true }));

    try {
      const response = await fetch('/api/tenants/check-subdomain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain: slug })
      });

      const result = await response.json();
      
      setSubdomainCheck({
        checking: false,
        available: result.available,
        message: result.message,
        suggestions: result.suggestions || []
      });
    } catch (error) {
      setSubdomainCheck({
        checking: false,
        available: null,
        message: 'Error checking availability',
        suggestions: []
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.adminPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (subdomainCheck.available !== true) {
      setError('Please choose an available subdomain');
      setLoading(false);
      return;
    }

    try {
      // Create tenant
      const tenantResponse = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          email: formData.email,
          phone: formData.phone,
          plan: formData.plan,
          status: formData.status,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode
        })
      });

      const tenantResult = await tenantResponse.json();

      if (!tenantResponse.ok) {
        throw new Error(tenantResult.error || 'Failed to create tenant');
      }

      // Create tenant admin
      const adminResponse = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.adminEmail,
          password: formData.adminPassword,
          name: formData.adminName,
          tenantId: tenantResult.id,
          type: 'admin',
          roleId: 'tenant-admin-role-001' // You might need to create this role first
        })
      });

      const adminResult = await adminResponse.json();

      if (!adminResponse.ok) {
        console.warn('Tenant created but admin creation failed:', adminResult.error);
      }

      setTenantInfo({
        tenant: tenantResult,
        admin: adminResult,
        url: `http://${tenantResult.slug}.localhost:3000`
      });
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, slug: suggestion }));
    checkSubdomainAvailability(suggestion);
  };

  if (success && tenantInfo) {
    return (
      <div className="p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-700">Tenant Created Successfully!</CardTitle>
            <CardDescription>
              The new tenant and admin user have been set up.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Tenant Details:</h3>
              <p className="text-sm text-green-700">
                <strong>Company:</strong> {tenantInfo.tenant.name}
              </p>
              <p className="text-sm text-green-700">
                <strong>Subdomain:</strong> {tenantInfo.tenant.slug}
              </p>
              <p className="text-sm text-green-700">
                <strong>Admin Panel:</strong>{' '}
                <a 
                  href={tenantInfo.url} 
                  className="underline hover:no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tenantInfo.url}
                </a>
              </p>
              <p className="text-sm text-green-700">
                <strong>Status:</strong> {tenantInfo.tenant.status}
              </p>
              <p className="text-sm text-green-700">
                <strong>Plan:</strong> {tenantInfo.tenant.plan}
              </p>
            </div>

            {tenantInfo.admin && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Admin Login Details:</h3>
                <p className="text-sm text-blue-700">
                  <strong>Email:</strong> {formData.adminEmail}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Password:</strong> {formData.adminPassword}
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={() => window.open(tenantInfo.url, '_blank')}
                className="flex-1"
              >
                Visit Tenant Panel
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => router.push('/tenants')}
                className="flex-1"
              >
                Back to Tenants
              </Button>
            </div>
          </CardContent>
        </Card>
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
            <h1 className="text-2xl font-bold">Add New Tenant</h1>
            <p className="text-gray-600">Create a new tenant and admin user</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
            <CardDescription>
              Set up a new tenant with their admin user and configuration.
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

              {/* Tenant Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tenant Details</h3>
                
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
                        className={`flex-1 ${
                          subdomainCheck.available === true 
                            ? 'border-green-500' 
                            : subdomainCheck.available === false 
                            ? 'border-red-500' 
                            : ''
                        }`}
                      />
                      <span className="text-sm text-gray-500">.localhost:3000</span>
                      {subdomainCheck.checking && (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      )}
                      {subdomainCheck.available === true && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {subdomainCheck.available === false && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    
                    {subdomainCheck.message && (
                      <p className={`text-sm mt-1 ${
                        subdomainCheck.available ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {subdomainCheck.message}
                      </p>
                    )}
                    
                    {subdomainCheck.suggestions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-1">Suggestions:</p>
                        <div className="flex flex-wrap gap-1">
                          {subdomainCheck.suggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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

                  <div>
                    <Label htmlFor="plan">Plan</Label>
                    <Select onValueChange={(value) => handleSelectChange('plan', value)} defaultValue={formData.plan}>
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
                    <Select onValueChange={(value) => handleSelectChange('status', value)} defaultValue={formData.status}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Admin User */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Admin User</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adminName">Admin Name *</Label>
                    <Input
                      id="adminName"
                      name="adminName"
                      value={formData.adminName}
                      onChange={handleInputChange}
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="adminEmail">Admin Email *</Label>
                    <Input
                      id="adminEmail"
                      name="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={handleInputChange}
                      required
                      placeholder="john@acmecorp.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="adminPassword">Password *</Label>
                    <Input
                      id="adminPassword"
                      name="adminPassword"
                      type="password"
                      value={formData.adminPassword}
                      onChange={handleInputChange}
                      required
                      placeholder="Min 8 characters"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      placeholder="Confirm password"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Address (Optional)</h3>
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

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || subdomainCheck.available !== true}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating Tenant...
                  </>
                ) : (
                  'Create Tenant'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}