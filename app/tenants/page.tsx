'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tenants');
      const data = await res.json();
      if (res.ok) {
        setTenants(data);
      } else {
        console.error('Error fetching tenants:', data.error);
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const currentUser = session?.user as any;
  const isSuperAdmin = currentUser?.type === 'super-admin';

  // Only super admins can access this page
  if (!isSuperAdmin) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Access Denied:</strong> Only super administrators can view this page.
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-4">Loading tenants...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tenant Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Super Admin View - Manage all tenants in the system
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchTenants}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <Link 
            href="/tenants/add" 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add New Tenant
          </Link>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">Name</th>
              <th className="border p-3 text-left">Subdomain</th>
              <th className="border p-3 text-left">Email</th>
              <th className="border p-3 text-left">Status</th>
              <th className="border p-3 text-left">Plan</th>
              <th className="border p-3 text-left">Created</th>
              <th className="border p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length > 0 ? (
              tenants.map((tenant: any) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="border p-3 font-medium">{tenant.name}</td>
                  <td className="border p-3">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {tenant.slug}
                    </code>
                  </td>
                  <td className="border p-3">{tenant.email}</td>
                  <td className="border p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      tenant.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : tenant.status === 'suspended'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="border p-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {tenant.plan || 'basic'}
                    </span>
                  </td>
                  <td className="border p-3 text-sm text-gray-600">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="border p-3">
                    <div className="flex gap-2">
                      <Link 
                        href={`http://${tenant.slug}.localhost:3000`}
                        target="_blank"
                        className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Visit
                      </Link>
                      <Link 
                        href={`/tenants/edit/${tenant.id}`}
                        className="px-2 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleSuspend(tenant.id, tenant.status)}
                        className={`px-2 py-1 rounded text-sm ${
                          tenant.status === 'active'
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {tenant.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="border p-4 text-center text-gray-500">
                  No tenants found. Click "Add New Tenant" to create the first tenant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{tenants.length}</div>
          <div className="text-sm text-gray-600">Total Tenants</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-xl font-bold text-green-600">
            {tenants.filter((t: any) => t.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Tenants</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-red-600">
            {tenants.filter((t: any) => t.status === 'suspended').length}
          </div>
          <div className="text-sm text-gray-600">Suspended Tenants</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-yellow-600">
            {tenants.filter((t: any) => t.status === 'trial').length}
          </div>
          <div className="text-sm text-gray-600">Trial Tenants</div>
        </div>
      </div>
    </div>
  );

  async function handleSuspend(tenantId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    if (confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'suspend' : 'activate'} this tenant?`)) {
      try {
        const res = await fetch(`/api/tenants/${tenantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (res.ok) {
          fetchTenants(); // Refresh the list
        } else {
          console.error('Error updating tenant status');
        }
      } catch (error) {
        console.error('Error updating tenant status:', error);
      }
    }
  }
}