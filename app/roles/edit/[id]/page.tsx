'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const permissionModules = [
  {
    name: 'Users Management',
    permissions: [
      { id: 'users_view', label: 'View Users' },
      { id: 'users_create', label: 'Create Users' },
      { id: 'users_edit', label: 'Edit Users' },
      { id: 'users_delete', label: 'Delete Users' },
    ]
  },
  {
    name: 'Products Management',
    permissions: [
      { id: 'products_view', label: 'View Products' },
      { id: 'products_create', label: 'Create Products' },
      { id: 'products_edit', label: 'Edit Products' },
      { id: 'products_delete', label: 'Delete Products' },
    ]
  },
  {
    name: 'Inventory / Stock Management',
    permissions: [
      { id: 'inventory_view', label: 'View Inventory' },
      { id: 'inventory_create', label: 'Add Stock' },
      { id: 'inventory_edit', label: 'Edit Stock' },
      { id: 'inventory_delete', label: 'Remove Stock' },
      { id: 'stock_movements_view', label: 'View Stock Movements' },
    ]
  },
  {
    name: 'Orders Management',
    permissions: [
      { id: 'orders_view', label: 'View Orders' },
      { id: 'orders_create', label: 'Create Orders' },
      { id: 'orders_edit', label: 'Edit Orders' },
      { id: 'orders_delete', label: 'Delete Orders' },
      { id: 'orders_fulfill', label: 'Fulfill Orders' },
    ]
  },
];

export default function EditRole() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/roles/${roleId}`)
      .then(res => res.json())
      .then(data => {
        setFormData({
          name: data.name || '',
          description: data.description || '',
          permissions: JSON.parse(data.permissions || '[]'),
          isActive: data.isActive !== false,
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load role');
        setLoading(false);
      });
  }, [roleId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const permissionId = name;
      if (checked) {
        setFormData(prev => ({
          ...prev,
          permissions: [...prev.permissions, permissionId]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          permissions: prev.permissions.filter(id => id !== permissionId)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissions: JSON.stringify(formData.permissions),
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      router.push('/roles');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Role</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="name">
            Role Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="description">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-2 border rounded"
            rows={3}
            placeholder="Describe the purpose of this role..."
          />
        </div>
        
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-gray-700">Active Role</span>
          </label>
          <p className="text-sm text-gray-500 mt-1">
            Inactive roles cannot be assigned to admin users
          </p>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Permissions</h3>
          <div className="space-y-6">
            {permissionModules.map((module) => (
              <div key={module.name} className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium mb-3 text-blue-600">{module.name}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {module.permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={permission.id}
                        name={permission.id}
                        onChange={handleChange}
                        checked={formData.permissions.includes(permission.id)}
                        className="mr-2"
                      />
                      <label htmlFor={permission.id} className="text-sm">
                        {permission.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/roles')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 