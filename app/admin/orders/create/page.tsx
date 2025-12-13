'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MenuItem {
    id: number;
    name: string;
    description: string;
    category_name: string;
    price: number;
    gst_rate?: number;
    image_type: string;
    available: boolean;
}

interface CartItem {
    menuItem: MenuItem;
    quantity: number;
}

interface DeliveryLocation {
    id: number;
    location_name: string;
    delivery_charge: number;
    is_active: boolean;
}

export default function CreateOrderPage() {
    const router = useRouter();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Customer details
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [orderType, setOrderType] = useState<'takeaway' | 'delivery' | 'dine-in'>('takeaway');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [notes, setNotes] = useState('');
    const [tableNumber, setTableNumber] = useState('');

    // Delivery location
    const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);



    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }

        // Fetch settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.success) setSettings(data.data);
            })
            .catch(err => console.error('Error fetching settings:', err));

        fetchMenuItems();
        fetchDeliveryLocations();
    }, []); // Empty dependency - only run on mount

    const fetchDeliveryLocations = async () => {
        try {
            const response = await fetch('/api/admin/delivery-locations?active=true');
            const data = await response.json();
            if (data.success) {
                setDeliveryLocations(data.data);
            }
        } catch (error) {
            console.error('Error fetching delivery locations:', error);
        }
    };

    const fetchMenuItems = async () => {
        try {
            const response = await fetch('/api/menu?available=true');
            const data = await response.json();
            if (data.success) {
                setMenuItems(data.data);
            }
        } catch (error) {
            console.error('Error fetching menu items:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category_name).filter(Boolean)))];

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category_name === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const addToCart = (item: MenuItem) => {
        const existingItem = cart.find(ci => ci.menuItem.id === item.id);
        if (existingItem) {
            setCart(cart.map(ci =>
                ci.menuItem.id === item.id
                    ? { ...ci, quantity: ci.quantity + 1 }
                    : ci
            ));
        } else {
            setCart([...cart, { menuItem: item, quantity: 1 }]);
        }
    };

    const updateQuantity = (itemId: number, quantity: number) => {
        if (quantity <= 0) {
            setCart(cart.filter(ci => ci.menuItem.id !== itemId));
        } else {
            setCart(cart.map(ci =>
                ci.menuItem.id === itemId ? { ...ci, quantity } : ci
            ));
        }
    };

    const removeFromCart = (itemId: number) => {
        setCart(cart.filter(ci => ci.menuItem.id !== itemId));
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + (parseFloat(item.menuItem.price.toString()) * item.quantity), 0);
    };

    const calculateTax = () => {
        if (settings?.gstType !== 'regular') return 0;

        // Calculate GST based on individual item rates
        return cart.reduce((sum, item) => {
            const itemPrice = parseFloat(item.menuItem.price.toString());
            const gstRate = (item.menuItem.gst_rate || 5) / 100; // Convert percentage to decimal
            const itemTax = itemPrice * item.quantity * gstRate;
            return sum + itemTax;
        }, 0);
    };

    const getDeliveryCharge = () => {
        if (orderType !== 'delivery' || !selectedLocationId) return 0;
        const location = deliveryLocations.find(loc => loc.id === selectedLocationId);
        return location ? parseFloat(location.delivery_charge.toString()) : 0;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax() + getDeliveryCharge();
    };

    const handleSubmitOrder = async () => {
        // Validation for Dine-in
        if (orderType === 'dine-in' && !tableNumber) {
            alert('Please provide Table Number for Dine-in');
            return;
        }

        // Customer details ONLY required for delivery
        if (orderType === 'delivery' && (!customerName || !customerPhone)) {
            alert('Please provide customer name and phone number for delivery orders');
            return;
        }

        if (orderType === 'delivery' && !customerAddress) {
            alert('Please provide delivery address');
            return;
        }

        if (orderType === 'delivery' && !selectedLocationId) {
            alert('Please select a delivery location');
            return;
        }

        if (cart.length === 0) {
            alert('Please add items to the order');
            return;
        }

        setSubmitting(true);

        try {
            const orderData = {
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_address: orderType === 'delivery' ? customerAddress : null,
                order_type: orderType,
                items: cart,
                subtotal: calculateSubtotal(),
                tax: calculateTax(),
                discount: 0,
                delivery_location_id: orderType === 'delivery' ? selectedLocationId : null,
                delivery_charge: getDeliveryCharge(),
                total_amount: calculateTotal(),
                payment_method: paymentMethod,
                notes: notes || null,
                table_number: orderType === 'dine-in' ? tableNumber : null,
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const data = await response.json();

            if (data.success) {
                alert(`Order created successfully! Invoice: ${data.data.invoice_number}`);
                router.push('/admin/orders');
            } else {
                alert(`Failed to create order: ${data.error}`);
            }
        } catch (error) {
            console.error('Error creating order:', error);
            alert('An error occurred while creating the order');
        } finally {
            setSubmitting(false);
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
                    <h1>Create New Order</h1>
                    <button onClick={() => router.push('/admin/orders')} className="btn btn-ghost">
                        ← Back to Orders
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
                    {/* Menu Items Section */}
                    <div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input"
                                style={{ marginBottom: '1rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={selectedCategory === cat ? 'btn btn-primary' : 'btn btn-ghost'}
                                        style={{ padding: '0.5rem 1rem', textTransform: 'capitalize' }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div key={`${selectedCategory}-${searchQuery}`} style={{ display: 'grid', gap: '1rem' }}>
                            {filteredItems.map(item => {
                                const price = parseFloat(item.price);
                                return (
                                    <div key={item.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ marginBottom: '0.25rem' }}>{item.name}</h3>
                                            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                                {item.description}
                                            </p>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                                                    ₹{price.toFixed(2)}
                                                </span>
                                                <span className="badge">{item.category_name}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => addToCart(item)}
                                            className="btn btn-primary"
                                            style={{ minWidth: '100px' }}
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Order Summary & Customer Details Section */}
                    <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
                        <div className="glass-card" style={{ marginBottom: '1rem' }}>
                            <h2 style={{ marginBottom: '1rem' }}>Order Summary</h2>

                            {cart.length === 0 ? (
                                <p className="text-muted text-center" style={{ padding: '2rem 0' }}>
                                    No items in cart
                                </p>
                            ) : (
                                <>
                                    <div style={{ marginBottom: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                                        {cart.map(item => {
                                            const price = parseFloat(item.menuItem.price);
                                            return (
                                                <div key={item.menuItem.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 500 }}>{item.menuItem.name}</div>
                                                        <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                                                            ₹{price.toFixed(2)} × {item.quantity}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        <button
                                                            onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                                                            className="btn btn-ghost"
                                                            style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                                                        >
                                                            −
                                                        </button>
                                                        <span style={{ minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                                                            className="btn btn-ghost"
                                                            style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                                                        >
                                                            +
                                                        </button>
                                                        <button
                                                            onClick={() => removeFromCart(item.menuItem.id)}
                                                            className="btn btn-ghost"
                                                            style={{ padding: '0.25rem 0.5rem', minWidth: 'auto', color: 'var(--danger)' }}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span>Subtotal:</span>
                                            <span>₹{calculateSubtotal().toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span>Tax (GST):</span>
                                            <span>₹{calculateTax().toFixed(2)}</span>
                                        </div>
                                        {orderType === 'delivery' && getDeliveryCharge() > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span>Delivery Charge:</span>
                                                <span>₹{getDeliveryCharge().toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                                            <span>Total:</span>
                                            <span>₹{calculateTotal().toFixed(2)}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="glass-card">
                            <h3 style={{ marginBottom: '1rem' }}>Customer Details</h3>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Order Type
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setOrderType('dine-in')}
                                        className={orderType === 'dine-in' ? 'btn btn-primary' : 'btn btn-ghost'}
                                    >
                                        Dine-in
                                    </button>
                                    <button
                                        onClick={() => setOrderType('takeaway')}
                                        className={orderType === 'takeaway' ? 'btn btn-primary' : 'btn btn-ghost'}
                                    >
                                        Takeaway
                                    </button>
                                    <button
                                        onClick={() => setOrderType('delivery')}
                                        className={orderType === 'delivery' ? 'btn btn-primary' : 'btn btn-ghost'}
                                    >
                                        Delivery
                                    </button>
                                </div>
                            </div>

                            {orderType === 'dine-in' && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        Table Number *
                                    </label>
                                    <input
                                        type="text"
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(e.target.value)}
                                        className="input"
                                        placeholder="e.g. T-5"
                                        required
                                    />
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Customer Name {orderType === 'delivery' ? '*' : '(Optional)'}
                                </label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="input"
                                    placeholder={orderType === 'delivery' ? "Enter customer name" : "Enter customer name (optional)"}
                                    required={orderType === 'delivery'}
                                    style={{ borderColor: orderType === 'delivery' && !customerName ? 'var(--danger)' : undefined }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Phone Number {orderType === 'delivery' ? '*' : '(Optional)'}
                                </label>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="input"
                                    placeholder={orderType === 'delivery' ? "Enter phone number" : "Enter phone number (optional)"}
                                    required={orderType === 'delivery'}
                                    pattern="[0-9]{10}"
                                    title="Please enter a valid 10-digit phone number"
                                    style={{ borderColor: orderType === 'delivery' && !customerPhone ? 'var(--danger)' : undefined }}
                                />
                            </div>

                            {orderType === 'delivery' && (
                                <>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                            Delivery Location *
                                        </label>
                                        <select
                                            value={selectedLocationId || ''}
                                            onChange={(e) => setSelectedLocationId(e.target.value ? parseInt(e.target.value) : null)}
                                            className="input"
                                        >
                                            <option value="">Select delivery location</option>
                                            {deliveryLocations.map(loc => (
                                                <option key={loc.id} value={loc.id}>
                                                    {loc.location_name} - ₹{parseFloat(loc.delivery_charge.toString()).toFixed(2)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                            Delivery Address *
                                        </label>
                                        <textarea
                                            value={customerAddress}
                                            onChange={(e) => setCustomerAddress(e.target.value)}
                                            className="input"
                                            placeholder="Enter delivery address"
                                            rows={3}
                                        />
                                    </div>
                                </>
                            )}

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Payment Method
                                </label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="input"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="upi">UPI</option>
                                    <option value="wallet">Wallet</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="input"
                                    placeholder="Special instructions..."
                                    rows={2}
                                />
                            </div>

                            <button
                                onClick={handleSubmitOrder}
                                disabled={submitting || cart.length === 0}
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                            >
                                {submitting ? 'Creating Order...' : 'Create Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
