'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCog, ArrowLeft, AlertCircle, Save, Loader2, Building2 } from 'lucide-react';
import { PROVINCES, REGISTRATION_TYPES } from '@/lib/fbr/buyer';

export default function EditUser() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    buyerNTNCNIC: '',
    buyerBusinessName: '',
    buyerProvince: '',
    buyerAddress: '',
    buyerRegistrationType: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const userData = await response.json();
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          password: '', // Don't populate password
          buyerNTNCNIC: userData.buyerNTNCNIC || '',
          buyerBusinessName: userData.buyerBusinessName || '',
          buyerProvince: userData.buyerProvince || '',
          buyerAddress: userData.buyerAddress || '',
          buyerRegistrationType: userData.buyerRegistrationType || '',
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Only include password if it was changed
    const dataToSubmit = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone.trim() || null,
      buyerNTNCNIC: formData.buyerNTNCNIC,
      buyerBusinessName: formData.buyerBusinessName,
      buyerProvince: formData.buyerProvince,
      buyerAddress: formData.buyerAddress,
      buyerRegistrationType: formData.buyerRegistrationType,
      ...(formData.password ? { password: formData.password } : {})
    };

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      router.push('/users');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
          <p className="text-muted-foreground">
            Update the customer&apos;s account and FBR buyer details
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              User Information
            </CardTitle>
            <CardDescription>
              Changes apply to this customer&apos;s future orders and FBR invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Account */}
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Account</h3>
                  <p className="text-sm text-muted-foreground">Basic contact details for this customer</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Customer name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+92 300 1234567"
                      maxLength={20}
                    />
                    <p className="text-xs text-muted-foreground">Used to match this customer when importing orders</p>
                  </div>
                </div>

                <div className="hidden">
                  <Label htmlFor="password">New Password (leave empty to keep current password)</Label>
                  <Input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </section>

              <Separator />

              {/* Buyer details */}
              <section className="space-y-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Buyer Details (FBR)
                  </h3>
                  <p className="text-sm text-muted-foreground">Shown as the buyer on FBR digital invoices</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="buyerNTNCNIC">NTN / CNIC</Label>
                    <Input
                      type="text"
                      id="buyerNTNCNIC"
                      name="buyerNTNCNIC"
                      value={formData.buyerNTNCNIC}
                      onChange={handleChange}
                      placeholder="7-digit NTN or 13-digit CNIC"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyerBusinessName">Business Name</Label>
                    <Input
                      type="text"
                      id="buyerBusinessName"
                      name="buyerBusinessName"
                      value={formData.buyerBusinessName}
                      onChange={handleChange}
                      placeholder="Registered business name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyerProvince">Province</Label>
                    <Select
                      value={formData.buyerProvince}
                      onValueChange={(value) => setFormData({ ...formData, buyerProvince: value })}
                    >
                      <SelectTrigger id="buyerProvince">
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map((province) => (
                          <SelectItem key={province} value={province}>{province}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyerRegistrationType">Registration Type</Label>
                    <Select
                      value={formData.buyerRegistrationType}
                      onValueChange={(value) => setFormData({ ...formData, buyerRegistrationType: value })}
                    >
                      <SelectTrigger id="buyerRegistrationType">
                        <SelectValue placeholder="Select registration type" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGISTRATION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="buyerAddress">Address</Label>
                    <Textarea
                      id="buyerAddress"
                      name="buyerAddress"
                      value={formData.buyerAddress}
                      onChange={handleChange}
                      placeholder="Street, area, city"
                      rows={3}
                      maxLength={500}
                    />
                  </div>
                </div>
              </section>

              <Separator />

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/users')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
