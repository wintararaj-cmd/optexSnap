'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItem {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    gst_rate?: number;
    image_type: string;
    available: boolean;
}

interface CartItem {
    menuItem: MenuItem;
    quantity: number;
}

export default function SalesmanDashboard() {
    const router = useRouter();
    const { user, logout } = useAuth(); // Use AuthContext for logout and user info
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Order details
    const [tableNumber, setTableNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in'); // Salesman mostly does dine-in/takeaway
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        // Auth check is handled by AuthContext, but we can double check role
        if (user && user.role !== 'salesman' && user.role !== 'admin') {
            router.push('/');
            return;
        }
        fetchMenuItems();
    }, [user]);

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

    const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
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
        return cart.reduce((sum, item) => {
            const itemPrice = parseFloat(item.menuItem.price.toString());
            const gstRate = (item.menuItem.gst_rate || 5) / 100;
            const itemTax = itemPrice * item.quantity * gstRate;
            return sum + itemTax;
        }, 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    const handleSubmitOrder = async () => {
        // Validation
        if (orderType === 'dine-in' && !tableNumber) {
            alert('Please provide Table Number for Dine-in');
            return;
        }

        // Customer details only required for delivery orders
        // For dine-in/takeaway, they're optional
        if (orderType === 'delivery' && (!customerName || !customerPhone)) {
            alert('Please provide customer name and phone number for delivery orders');
            return;
        }

        if (cart.length === 0) {
            alert('Please add items to the order');
            return;
        }

        setSubmitting(true);

        try {
            const orderData = {
                user_id: user?.id, // Link to salesman ID if possible? No, schema uses user_id for CUSTOMER link.
                // If salesman takes order, user_id is usually NULL or the salesman's ID? 
                // Schema: user_id REFERENCES users. If salesman is a user, we CAN store it.
                // But usually user_id implies "who owns the order" (customer). 
                // If we put salesman ID, it looks like the salesman Bought the food.
                // We should probably leave user_id NULL for generic walk-ins, unless we have a specific 'salesman_id' column.
                // For now, let's leave user_id NULL (walk-in customer).
                // But the prompt says "salesman can login... and create order".
                // We might want to track WHICH salesman created it. 
                // Schema doesn't have 'created_by'. I won't change schema again right now unless critical.
                // I'll leave user_id null.

                customer_name: customerName,
                customer_phone: customerPhone,
                order_type: orderType,
                items: cart,
                subtotal: calculateSubtotal(),
                tax: calculateTax(),
                discount: 0,
                total_amount: calculateTotal(),
                payment_method: paymentMethod,
                notes: notes || null,
                table_number: tableNumber || null,
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const data = await response.json();

            if (data.success) {
                alert(`Order Placed Successfully! \nInvoice: ${data.data.invoice_number}`);
                // Reset form
                setCart([]);
                setTableNumber('');
                setCustomerName('');
                setCustomerPhone('');
                setNotes('');
                setOrderType('dine-in');
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

    if (loading) return <div className="text-center p-5">Loading menu...</div>;

    return (
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>Salesman Dashboard</h1>
                        <p className="text-muted">Welcome, {user?.name}</p>
                    </div>
                    <button onClick={logout} className="btn btn-ghost" style={{ color: 'var(--error)' }}>
                        Logout
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                    {/* Left: Menu */}
                    <div>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input"
                                style={{ flex: 1 }}
                            />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="input"
                                style={{ width: 'auto' }}
                            >
                                {categories.filter(Boolean).map(cat => <option key={cat} value={cat}>{(cat || '').charAt(0).toUpperCase() + (cat || '').slice(1)}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-3">
                            {filteredItems.map(item => (
                                <div key={item.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{parseFloat(item.price.toString()).toFixed(2)}</span>
                                        <button
                                            onClick={() => addToCart(item)}
                                            className="btn btn-primary"
                                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Order Form */}
                    <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
                        <div className="glass-card">
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Current Order</h2>

                            {/* Table & Type */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '0.75rem' }}>Type</label>
                                    <select
                                        value={orderType}
                                        onChange={(e: any) => setOrderType(e.target.value)}
                                        className="input"
                                        style={{ padding: '0.5rem' }}
                                    >
                                        <option value="dine-in">Dine-in</option>
                                        <option value="takeaway">Takeaway</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-muted" style={{ fontSize: '0.75rem' }}>Table No.</label>
                                    <input
                                        type="text"
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(e.target.value)}
                                        className="input"
                                        style={{ padding: '0.5rem' }}
                                        placeholder="T-10"
                                        disabled={orderType === 'takeaway'}
                                    />
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div style={{ marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder={orderType === 'delivery' ? 'Customer Name *' : 'Customer Name (Optional)'}
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="input mb-1"
                                    style={{ padding: '0.5rem', borderColor: orderType === 'delivery' && !customerName ? 'var(--danger)' : undefined }}
                                    required={orderType === 'delivery'}
                                />
                                <input
                                    type="tel"
                                    placeholder={orderType === 'delivery' ? 'Phone *' : 'Phone (Optional)'}
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="input"
                                    style={{ padding: '0.5rem', borderColor: orderType === 'delivery' && !customerPhone ? 'var(--danger)' : undefined }}
                                    required={orderType === 'delivery'}
                                    pattern="[0-9]{10}"
                                    title="Please enter a valid 10-digit phone number"
                                />
                            </div>

                            {/* Cart Items */}
                            <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '1rem', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '0.5rem 0' }}>
                                {cart.length === 0 ? (
                                    <p className="text-muted text-center" style={{ fontSize: '0.875rem' }}>Cart is empty</p>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.menuItem.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <div style={{ fontSize: '0.875rem', flex: 1 }}>
                                                <div>{item.menuItem.name}</div>
                                                <div className="text-muted">₹{item.menuItem.price} x {item.quantity}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <button onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)} className="btn btn-ghost" style={{ padding: '0 0.5rem' }}>-</button>
                                                <button onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)} className="btn btn-ghost" style={{ padding: '0 0.5rem' }}>+</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Totals */}
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
                                    <span>Total:</span>
                                    <span style={{ color: 'var(--primary)' }}>₹{calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>

                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="input mb-2"
                            >
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="upi">UPI</option>
                            </select>

                            <button
                                onClick={handleSubmitOrder}
                                disabled={submitting || cart.length === 0}
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                            >
                                {submitting ? 'Placing Order...' : 'Place Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
