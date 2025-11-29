'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, ArrowLeft, AlertCircle } from 'lucide-react';

export default function AddUser() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    buyerNTNCNIC: '',
    buyerBusinessName: '',
    buyerProvince: '',
    buyerAddress: '',
    buyerRegistrationType: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      router.push('/users');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Add New User</h1>
          <p className="text-muted-foreground">Create a new customer account</p>
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
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            User Information
          </CardTitle>
          <CardDescription>Enter the customer details below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter customer name"
                required
              />
            </div>
        
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
              />
            </div>
        
            <div className="space-y-2 hidden">
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerNTNCNIC">NTN/CNIC</Label>
              <Input
                type="text"
                id="buyerNTNCNIC"
                name="buyerNTNCNIC"
                value={formData.buyerNTNCNIC}
                onChange={handleChange}
                placeholder="Enter NTN or CNIC number"
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
                placeholder="Enter business name (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerProvince">Province</Label>
              <Select value={formData.buyerProvince} onValueChange={(value) => setFormData({...formData, buyerProvince: value})}>
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerAddress">Address</Label>
              <Input
                type="text"
                id="buyerAddress"
                name="buyerAddress"
                value={formData.buyerAddress}
                onChange={handleChange}
                placeholder="Enter complete address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerRegistrationType">Registration Type</Label>
              <Select value={formData.buyerRegistrationType} onValueChange={(value) => setFormData({...formData, buyerRegistrationType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Registration Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Registered">Registered</SelectItem>
                  <SelectItem value="Unregistered">Unregistered</SelectItem>
                </SelectContent>
              </Select>
            </div>
        
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create User'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/users')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 