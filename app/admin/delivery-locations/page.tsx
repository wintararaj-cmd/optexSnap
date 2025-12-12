'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DeliveryLocation {
    id: number;
    location_name: string;
    delivery_charge: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function DeliveryLocationsPage() {
    const router = useRouter();
    const [locations, setLocations] = useState<DeliveryLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState<DeliveryLocation | null>(null);

    // Form state
    const [locationName, setLocationName] = useState('');
    const [deliveryCharge, setDeliveryCharge] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const response = await fetch('/api/admin/delivery-locations');
            const data = await response.json();
            if (data.success) {
                setLocations(data.data);
            }
        } catch (error) {
            console.error('Error fetching delivery locations:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingLocation(null);
        setLocationName('');
        setDeliveryCharge('');
        setIsActive(true);
        setShowModal(true);
    };

    const openEditModal = (location: DeliveryLocation) => {
        setEditingLocation(location);
        setLocationName(location.location_name);
        setDeliveryCharge(location.delivery_charge.toString());
        setIsActive(location.is_active);
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!locationName.trim()) {
            alert('Please enter a location name');
            return;
        }

        if (!deliveryCharge || parseFloat(deliveryCharge) < 0) {
            alert('Please enter a valid delivery charge');
            return;
        }

        setSubmitting(true);

        try {
            const url = editingLocation
                ? `/api/admin/delivery-locations/${editingLocation.id}`
                : '/api/admin/delivery-locations';

            const method = editingLocation ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location_name: locationName.trim(),
                    delivery_charge: parseFloat(deliveryCharge),
                    is_active: isActive,
                }),
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message || 'Location saved successfully');
                setShowModal(false);
                fetchLocations();
            } else {
                alert(data.error || 'Failed to save location');
            }
        } catch (error) {
            console.error('Error saving location:', error);
            alert('An error occurred while saving');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/delivery-locations/${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                alert('Location deleted successfully');
                fetchLocations();
            } else {
                alert(data.error || 'Failed to delete location');
            }
        } catch (error) {
            console.error('Error deleting location:', error);
            alert('An error occurred while deleting');
        }
    };

    const toggleActive = async (location: DeliveryLocation) => {
        try {
            const response = await fetch(`/api/admin/delivery-locations/${location.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_active: !location.is_active,
                }),
            });

            const data = await response.json();

            if (data.success) {
                fetchLocations();
            } else {
                alert(data.error || 'Failed to update location');
            }
        } catch (error) {
            console.error('Error updating location:', error);
            alert('An error occurred while updating');
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
                    <h1>Delivery Locations</h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={openAddModal} className="btn btn-primary">
                            + Add Location
                        </button>
                        <button onClick={() => router.push('/admin/dashboard')} className="btn btn-ghost">
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>

                {/* Locations Table */}
                <div className="glass-card">
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Location Name</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>Delivery Charge</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locations.map((location) => (
                                    <tr key={location.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 500 }}>{location.location_name}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <span style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary)' }}>
                                                ₹{parseFloat(location.delivery_charge.toString()).toFixed(2)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <button
                                                onClick={() => toggleActive(location)}
                                                className="badge"
                                                style={{
                                                    background: location.is_active ? 'var(--success)' : 'var(--danger)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    border: 'none',
                                                    padding: '0.375rem 0.75rem',
                                                }}
                                            >
                                                {location.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => openEditModal(location)}
                                                    className="btn btn-ghost"
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(location.id, location.location_name)}
                                                    className="btn btn-ghost"
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'var(--danger)' }}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {locations.length === 0 && (
                            <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                                <p className="text-muted">No delivery locations found. Add one to get started!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="glass-card"
                        style={{ maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ marginBottom: '1.5rem' }}>
                            {editingLocation ? 'Edit Location' : 'Add New Location'}
                        </h2>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Location Name *
                            </label>
                            <input
                                type="text"
                                value={locationName}
                                onChange={(e) => setLocationName(e.target.value)}
                                className="input"
                                placeholder="e.g., City Center, North Zone"
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Delivery Charge (₹) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={deliveryCharge}
                                onChange={(e) => setDeliveryCharge(e.target.value)}
                                className="input"
                                placeholder="0.00"
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Active</span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn btn-ghost"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="btn btn-primary"
                                disabled={submitting}
                                style={{ minWidth: '120px' }}
                            >
                                {submitting ? 'Saving...' : editingLocation ? 'Update' : 'Add Location'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
