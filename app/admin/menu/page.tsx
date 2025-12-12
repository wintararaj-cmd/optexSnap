'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MenuItem } from '@/types';

export default function AdminMenuPage() {
    const router = useRouter();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category_id: '' as number | '',
        price: '',
        gst_rate: '5',
        available: true,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        fetchMenuItems();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchMenuItems = async () => {
        try {
            const response = await fetch('/api/menu');
            const data = await response.json();
            if (data.success) {
                setMenuItems(data.data);
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            let imageData = null;

            // Upload image if selected
            if (imageFile) {
                const formDataImg = new FormData();
                formDataImg.append('image', imageFile);

                const imgResponse = await fetch('/api/images', {
                    method: 'POST',
                    body: formDataImg,
                });

                const imgData = await imgResponse.json();
                if (imgData.success) {
                    imageData = { id: imgData.data.id, type: imgData.data.image_type };
                } else {
                    alert('Failed to upload image: ' + (imgData.error || 'Unknown error'));
                    setUploading(false);
                    return;
                }
            }

            const url = editingItem ? `/api/menu/${editingItem.id}` : '/api/menu';
            const method = editingItem ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    gst_rate: parseFloat(formData.gst_rate),
                    ...(imageData && { image_id: imageData.id, image_type: imageData.type }),
                }),
            });

            const data = await response.json();

            if (data.success) {
                alert(editingItem ? 'Menu item updated successfully!' : 'Menu item added successfully!');
                fetchMenuItems();
                setShowAddModal(false);
                setEditingItem(null);
                setFormData({ name: '', description: '', category_id: '', price: '', gst_rate: '5', available: true });
                setImageFile(null);
                setImagePreview('');
            } else {
                alert('Failed to save menu item: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving menu item:', error);
            alert('Error saving menu item: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (item: MenuItem) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description,
            category_id: item.category_id,
            price: item.price.toString(),
            gst_rate: (item.gst_rate || 5).toString(),
            available: item.available,
        });
        // Set image preview if item has image
        if (item.image_id) {
            setImagePreview(`/api/images/${item.image_id}`);
        } else {
            setImagePreview('');
        }
        setImageFile(null);
        setShowAddModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            const response = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
            const data = await response.json();

            if (data.success) {
                fetchMenuItems();
            }
        } catch (error) {
            console.error('Error deleting menu item:', error);
        }
    };

    const toggleAvailability = async (item: MenuItem) => {
        try {
            const response = await fetch(`/api/menu/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ available: !item.available }),
            });

            const data = await response.json();

            if (data.success) {
                fetchMenuItems();
            }
        } catch (error) {
            console.error('Error updating availability:', error);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1>Menu Management</h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => router.push('/admin/dashboard')} className="btn btn-ghost">
                            ← Back to Dashboard
                        </button>
                        <button onClick={() => router.push('/admin/categories')} className="btn btn-ghost">
                            Manage Categories
                        </button>
                        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                            + Add Item
                        </button>
                    </div>
                </div>

                <div className="grid grid-3">
                    {menuItems.map((item) => (
                        <div key={item.id} className="glass-card">
                            <div style={{
                                width: '100%',
                                height: '150px',
                                background: item.image_id ? 'transparent' : 'linear-gradient(135deg, rgba(255,100,50,0.2) 0%, rgba(150,50,255,0.2) 100%)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '3rem',
                                overflow: 'hidden',
                            }}>
                                {item.image_id ? (
                                    <img
                                        src={`/api/images/${item.image_id}`}
                                        alt={item.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    '🍽️'
                                )}
                            </div>

                            <h3 style={{ marginBottom: '0.5rem' }}>{item.name}</h3>
                            <p className="text-muted" style={{ fontSize: '0.9375rem', marginBottom: '1rem' }}>
                                {item.description}
                            </p>

                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <span className="badge badge-primary">₹{item.price}</span>
                                <span className="badge badge-success">{item.category_name || 'Unknown'}</span>
                                <span className={`badge ${item.available ? 'badge-success' : 'badge-error'}`}>
                                    {item.available ? 'Available' : 'Unavailable'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleEdit(item)} className="btn btn-ghost" style={{ flex: 1, padding: '0.625rem' }}>
                                    Edit
                                </button>
                                <button onClick={() => toggleAvailability(item)} className="btn btn-ghost" style={{ flex: 1, padding: '0.625rem' }}>
                                    {item.available ? 'Disable' : 'Enable'}
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="btn btn-ghost" style={{ padding: '0.625rem', color: 'var(--error)' }}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add/Edit Modal */}
                {showAddModal && (
                    <div className="modal-overlay" onClick={() => {
                        setShowAddModal(false);
                        setEditingItem(null);
                        setFormData({ name: '', description: '', category_id: '', price: '', gst_rate: '5', available: true });
                    }}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                                Item Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="input"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                                Description
                                            </label>
                                            <textarea
                                                className="input"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={3}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                                Category *
                                            </label>
                                            <select
                                                required
                                                className="input"
                                                value={formData.category_id}
                                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : '' })}
                                                style={{ width: '100%' }}
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                                Price (₹) *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                step="0.01"
                                                className="input"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                                GST Rate (%) *
                                            </label>
                                            <select
                                                required
                                                className="input"
                                                value={formData.gst_rate}
                                                onChange={(e) => setFormData({ ...formData, gst_rate: e.target.value })}
                                                style={{ width: '100%' }}
                                            >
                                                <option value="0">0% - Exempt</option>
                                                <option value="5">5% - Essential Items</option>
                                                <option value="12">12% - Processed Foods</option>
                                                <option value="18">18% - Restaurant Services</option>
                                                <option value="28">28% - Luxury Items</option>
                                            </select>
                                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                Select the applicable GST rate for this item
                                            </p>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                                Product Image
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="input"
                                                style={{ padding: '0.5rem' }}
                                            />
                                            {imagePreview && (
                                                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        style={{
                                                            maxWidth: '100%',
                                                            maxHeight: '200px',
                                                            borderRadius: 'var(--radius-md)',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <input
                                                type="checkbox"
                                                id="available"
                                                checked={formData.available}
                                                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                                                style={{ width: '20px', height: '20px' }}
                                            />
                                            <label htmlFor="available" style={{ fontWeight: 500, cursor: 'pointer' }}>
                                                Available for ordering
                                            </label>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddModal(false);
                                                setEditingItem(null);
                                                setFormData({ name: '', description: '', category_id: '', price: '', gst_rate: '5', available: true });
                                            }}
                                            className="btn btn-ghost"
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={uploading}>
                                            {uploading ? 'Uploading...' : editingItem ? 'Update' : 'Add'} Item
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
