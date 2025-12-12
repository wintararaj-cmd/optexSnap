'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

interface DeliveryLocation {
    id: number;
    location_name: string;
    delivery_charge: number;
    is_active: boolean;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, getCartTotal, clearCart } = useCart();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

    useEffect(() => {
        // Fetch settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.success) setSettings(data.data);
            })
            .catch(err => console.error('Error fetching settings:', err));

        // Fetch delivery locations
        fetch('/api/admin/delivery-locations?active=true')
            .then(res => res.json())
            .then(data => {
                if (data.success) setDeliveryLocations(data.data);
            })
            .catch(err => console.error('Error fetching delivery locations:', err));
    }, []);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        paymentMethod: 'cash' as 'cash' | 'card' | 'upi' | 'wallet',
        notes: '',
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        } else if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                phone: user.phone || '',
                address: user.address || '',
            }));
        }
    }, [user, isAuthenticated, authLoading, router]);

    const subtotal = getCartTotal();

    const calculateTax = () => {
        if (settings?.gstType !== 'regular') return 0;

        return cart.reduce((sum, item) => {
            const itemPrice = item.menuItem.price;
            const gstRate = (item.menuItem.gst_rate || 5) / 100;
            return sum + (itemPrice * item.quantity * gstRate);
        }, 0);
    };

    const getDeliveryCharge = () => {
        if (!selectedLocationId) return 0;
        const location = deliveryLocations.find(loc => loc.id === selectedLocationId);
        return location ? parseFloat(location.delivery_charge.toString()) : 0;
    };

    const tax = calculateTax();
    const deliveryCharge = getDeliveryCharge();
    const total = subtotal + tax + deliveryCharge;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedLocationId) {
            alert('Please select a delivery location');
            return;
        }

        setLoading(true);

        try {
            const orderData = {
                user_id: user?.id,
                customer_name: formData.name,
                customer_phone: formData.phone,
                customer_address: formData.address,
                order_type: 'delivery',
                items: cart,
                subtotal,
                tax,
                discount: 0,
                delivery_location_id: selectedLocationId,
                delivery_charge: deliveryCharge,
                total_amount: total,
                payment_method: formData.paymentMethod,
                notes: formData.notes,
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const data = await response.json();

            if (data.success) {
                clearCart();
                router.push(`/orders?success=true&orderId=${data.data.id}`);
            } else {
                alert('Failed to place order. Please try again.');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        router.push('/cart');
        return null;
    }

    return (
        <main className="container" style={{ padding: '2rem 1.5rem', maxWidth: '900px' }}>
            <div className="fade-in">
                <h1 className="text-center mb-4">Checkout</h1>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gap: '2rem' }}>
                        {/* Customer Details */}
                        <div className="glass-card">
                            <h3 style={{ marginBottom: '1.5rem' }}>Delivery Details</h3>

                            <div style={{ display: 'grid', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        className="input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Enter your phone number"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        Delivery Location *
                                    </label>
                                    <select
                                        required
                                        className="input"
                                        value={selectedLocationId || ''}
                                        onChange={(e) => setSelectedLocationId(e.target.value ? parseInt(e.target.value) : null)}
                                    >
                                        <option value="">Select your delivery location</option>
                                        {deliveryLocations.map(loc => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.location_name} - ₹{parseFloat(loc.delivery_charge.toString()).toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedLocationId && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            📍 Delivery charge: ₹{deliveryCharge.toFixed(2)}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        Delivery Address *
                                    </label>
                                    <textarea
                                        required
                                        className="input"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Enter your complete delivery address"
                                        rows={3}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        Special Instructions (Optional)
                                    </label>
                                    <textarea
                                        className="input"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Any special requests or instructions"
                                        rows={2}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="glass-card">
                            <h3 style={{ marginBottom: '1.5rem' }}>Payment Method</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                {[
                                    { value: 'cash', label: 'Cash on Delivery', icon: '💵' },
                                    { value: 'card', label: 'Card', icon: '💳' },
                                    { value: 'upi', label: 'UPI', icon: '📱' },
                                    { value: 'wallet', label: 'Wallet', icon: '👛' },
                                ].map((method) => (
                                    <button
                                        key={method.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, paymentMethod: method.value as any })}
                                        className={formData.paymentMethod === method.value ? 'btn btn-primary' : 'btn btn-ghost'}
                                        style={{
                                            padding: '1rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                        }}
                                    >
                                        <span style={{ fontSize: '2rem' }}>{method.icon}</span>
                                        <span style={{ fontSize: '0.875rem' }}>{method.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="glass-card">
                            <h3 style={{ marginBottom: '1.5rem' }}>Order Summary</h3>

                            <div style={{ marginBottom: '1.5rem' }}>
                                {cart.map((item) => (
                                    <div
                                        key={item.menuItem.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.75rem',
                                            paddingBottom: '0.75rem',
                                            borderBottom: '1px solid var(--border-color)',
                                        }}
                                    >
                                        <span>
                                            {item.menuItem.name} × {item.quantity}
                                        </span>
                                        <span>₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span className="text-muted">Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                {settings?.gstType === 'regular' && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span className="text-muted">Tax (GST)</span>
                                        <span>₹{tax.toFixed(2)}</span>
                                    </div>
                                )}
                                {deliveryCharge > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span className="text-muted">Delivery Charge</span>
                                        <span>₹{deliveryCharge.toFixed(2)}</span>
                                    </div>
                                )}
                                <div style={{
                                    borderTop: '1px solid var(--border-color)',
                                    paddingTop: '0.75rem',
                                    marginTop: '0.75rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                }}>
                                    <span>Total</span>
                                    <span style={{ color: 'var(--primary)' }}>₹{total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                                style={{ width: '100%', fontSize: '1.125rem', padding: '1rem' }}
                            >
                                {loading ? 'Placing Order...' : 'Place Order'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
}
