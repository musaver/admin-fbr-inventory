'use client';
import React, { useState } from 'react';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: 'admin@yourdomain.com',
    password: 'SuperAdmin123!',
    name: 'Super Administrator'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/setup/super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to create super admin');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">System Setup</h1>
          <p className="text-gray-600 mt-2">Create the initial super admin user</p>
        </div>

        {!result && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Super Admin'}
            </button>
          </form>
        )}

        {result && (
          <div className="space-y-4">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <strong>✅ Setup Complete!</strong>
              <p className="mt-2">{result.message}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Super Admin Access:</h3>
              <div className="text-sm text-blue-800">
                <p><strong>Email:</strong> {result.superAdmin.email}</p>
                <p><strong>Login URL:</strong> 
                  <a href={result.superAdmin.loginUrl} className="underline ml-1">
                    {result.superAdmin.loginUrl}
                  </a>
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Sample Tenants Created:</h3>
              <div className="space-y-2">
                {result.tenants.map((tenant: any, index: number) => (
                  <div key={index} className="text-sm bg-white p-3 rounded border">
                    <p><strong>{tenant.name}</strong></p>
                    <p>Email: {tenant.adminEmail}</p>
                    <p>Password: {tenant.adminPassword}</p>
                    <p>Login: 
                      <a href={tenant.loginUrl} className="text-blue-600 underline ml-1">
                        {tenant.loginUrl}
                      </a>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>⚠️ Important:</strong> Please change all passwords after first login. 
                For production use, delete this setup page after completion.
              </p>
            </div>

            <a
              href="/login"
              className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Go to Login Page
            </a>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>For security, this setup page should be removed in production.</p>
        </div>
      </div>
    </div>
  );
}