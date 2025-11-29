'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    companyName: '',
    subdomain: '',
    email: '',
    phone: '',
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
  const [selectedPlan, setSelectedPlan] = useState('basic');

  // Get plan from URL parameters
  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan && ['basic', 'premium', 'enterprise'].includes(plan)) {
      setSelectedPlan(plan);
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate subdomain from company name
    if (name === 'companyName' && !formData.subdomain) {
      const autoSubdomain = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 30);
      
      setFormData(prev => ({
        ...prev,
        subdomain: autoSubdomain
      }));
    }

    // Check subdomain availability when it changes
    if (name === 'subdomain') {
      checkSubdomainAvailability(value);
    }
  };

  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
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
        body: JSON.stringify({ subdomain })
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
      const response = await fetch('/api/tenants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          subdomain: formData.subdomain,
          email: formData.email,
          phone: formData.phone,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode,
          plan: selectedPlan
        })
      });

      const result = await response.json();

      if (response.ok) {
        setTenantInfo(result);
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to create account');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, subdomain: suggestion }));
    checkSubdomainAvailability(suggestion);
  };

  if (success && tenantInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-700">Account Created!</CardTitle>
            <CardDescription>
              Your inventory management system is ready to use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Your Details:</h3>
              <p className="text-sm text-green-700">
                <strong>Company:</strong> {tenantInfo.tenant.name}
              </p>
              <p className="text-sm text-green-700">
                <strong>Admin Panel:</strong>{' '}
                <a 
                  href={tenantInfo.tenant.url} 
                  className="underline hover:no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tenantInfo.tenant.url}
                </a>
              </p>
              <p className="text-sm text-green-700">
                <strong>Trial Period:</strong> 14 days free trial
              </p>
            </div>
            
            <Button 
              onClick={() => window.open(tenantInfo.tenant.url, '_blank')}
              className="w-full"
            >
              Access Your Admin Panel
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Inventory System
          </h1>
          <p className="text-gray-600">
            Start your 14-day free trial. No credit card required.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Your Inventory System</CardTitle>
            <CardDescription>
              Tell us about your business to set up your personalized inventory system.
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

              {/* Plan Selection */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-lg mb-3">Choose Your Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div 
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedPlan === 'basic' ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => setSelectedPlan('basic')}
                  >
                    <div className="text-center">
                      <h4 className="font-semibold">Basic</h4>
                      <p className="text-2xl font-bold text-blue-600">$29/mo</p>
                      <p className="text-sm text-gray-600">1,000 products</p>
                    </div>
                  </div>
                  
                  <div 
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-colors relative ${
                      selectedPlan === 'premium' ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => setSelectedPlan('premium')}
                  >
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Popular</span>
                    </div>
                    <div className="text-center">
                      <h4 className="font-semibold">Premium</h4>
                      <p className="text-2xl font-bold text-blue-600">$79/mo</p>
                      <p className="text-sm text-gray-600">10,000 products</p>
                    </div>
                  </div>
                  
                  <div 
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedPlan === 'enterprise' ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => setSelectedPlan('enterprise')}
                  >
                    <div className="text-center">
                      <h4 className="font-semibold">Enterprise</h4>
                      <p className="text-2xl font-bold text-blue-600">$199/mo</p>
                      <p className="text-sm text-gray-600">Unlimited</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 text-center mt-2">
                  All plans include a 14-day free trial. You can change plans anytime.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    placeholder="Acme Corp"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="subdomain">Your Admin URL *</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">https://</span>
                    <Input
                      id="subdomain"
                      name="subdomain"
                      value={formData.subdomain}
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
                    <span className="text-sm text-gray-500">
                      .{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'yourdomain.com'}
                    </span>
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
              </div>

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
                    Creating Account...
                  </>
                ) : (
                  'Create Account & Start Free Trial'
                )}
              </Button>

              <p className="text-sm text-gray-600 text-center">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
