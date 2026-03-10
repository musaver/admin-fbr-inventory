'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function AdminsList() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admins');
      const data = await res.json();
      setAdmins(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this admin user?')) {
      try {
        await fetch(`/api/admins/${id}`, { method: 'DELETE' });
        setAdmins(admins.filter((admin: any) => admin.id !== id));
      } catch (error) {
        console.error('Error deleting admin user:', error);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  const currentUser = session?.user as any;
  const isSuperAdmin = currentUser?.type === 'super-admin';

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Users</h1>
          {isSuperAdmin && (
            <p className="text-sm text-gray-600 mt-1">
              Super Admin View - Showing all admins across all tenants
            </p>
          )}
          {!isSuperAdmin && currentUser?.tenantSlug && (
            <p className="text-sm text-gray-600 mt-1">
              Tenant: {currentUser.tenantSlug} - Showing admins for your tenant only
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAdmins}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <Link 
            href="/admins/add" 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add New Admin
          </Link>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">Type</th>
              <th className="border p-2 text-left">Role</th>
              <th className="border p-2 text-left">Permissions</th>
              {isSuperAdmin && <th className="border p-2 text-left">Tenant</th>}
              <th className="border p-2 text-left">Created At</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length > 0 ? (
              admins.map((admin: any) => (
                <tr key={admin.id}>
                  <td className="border p-2">
                    <div className="font-medium">{admin.name}</div>
                  </td>
                  <td className="border p-2">{admin.email}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      admin.type === 'super-admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {admin.type === 'super-admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="border p-2">
                    <div>
                      <div className="font-medium">{admin.roleDetails?.name || admin.role || 'Unknown'}</div>
                      {admin.roleDetails?.description && (
                        <div className="text-xs text-gray-500">{admin.roleDetails.description}</div>
                      )}
                      {admin.roleDetails?.isActive === false && (
                        <span className="text-xs bg-red-100 text-red-800 px-1 rounded">Inactive</span>
                      )}
                    </div>
                  </td>
                  <td className="border p-2">
                    <div className="text-sm">
                      {admin.roleDetails?.permissions 
                        ? JSON.parse(admin.roleDetails.permissions).length + ' permissions'
                        : 'No permissions'
                      }
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td className="border p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        admin.tenantId === 'super-admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {admin.tenantId === 'super-admin' ? 'System' : admin.tenantId}
                      </span>
                    </td>
                  )}
                  <td className="border p-2">
                    <div className="text-sm">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <Link 
                        href={`/admins/edit/${admin.id}`}
                        className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(admin.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isSuperAdmin ? 8 : 7} className="border p-2 text-center">No admin users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 