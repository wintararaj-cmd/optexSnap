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
    const { user, logout } = useAuth();

    // Data
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Order Details
    const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
    const [tableNumber, setTableNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');

    useEffect(() => {
        if (user && user.role !== 'salesman' && user.role !== 'admin') {
            router.push('/');
            return;
        }
        fetchMenuItems();
    }, [user]);

    const fetchMenuItems = async () => {
        try {
            const res = await fetch('/api/menu?available=true');
            const data = await res.json();
            if (data.success) {
                setMenuItems(data.data);
                const cats = Array.from(new Set(data.data.map((i: MenuItem) => i.category).filter(Boolean))) as string[];
                setCategories(['all', ...cats]);
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Cart Logic
    const addToCart = (item: MenuItem) => {
        const existing = cart.find(ci => ci.menuItem.id === item.id);
        if (existing) {
            setCart(cart.map(ci => ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci));
        } else {
            setCart([...cart, { menuItem: item, quantity: 1 }]);
        }
    };

    const updateQuantity = (itemId: number, delta: number) => {
        const existing = cart.find(ci => ci.menuItem.id === itemId);
        if (!existing) return;

        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
            setCart(cart.filter(ci => ci.menuItem.id !== itemId));
        } else {
            setCart(cart.map(ci => ci.menuItem.id === itemId ? { ...ci, quantity: newQty } : ci));
        }
    };

    // Calculations
    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (Number(item.menuItem.price) * item.quantity), 0);
    };

    const calculateTax = () => {
        return cart.reduce((sum, item) => {
            const taxRate = (item.menuItem.gst_rate || 5) / 100;
            return sum + (Number(item.menuItem.price) * item.quantity * taxRate);
        }, 0);
    };

    const grandTotal = calculateTotal() + calculateTax();

    const handleSubmitOrder = async () => {
        if (orderType === 'dine-in' && !tableNumber) {
            alert('Please provide Table Number for Dine-in');
            return;
        }
        if (cart.length === 0) {
            alert('Please add items to the order');
            return;
        }

        setSubmitting(true);
        try {
            const orderData = {
                user_id: user?.id,
                customer_name: customerName,
                customer_phone: customerPhone,
                order_type: orderType,
                items: cart,
                subtotal: calculateTotal(),
                tax: calculateTax(),
                total_amount: grandTotal,
                payment_method: paymentMethod,
                discount: 0,
                table_number: tableNumber || null,
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });
            const data = await res.json();

            if (data.success) {
                alert(`Order Placed Successfully! \nInvoice: ${data.data.invoice_number}`);
                setCart([]);
                setTableNumber('');
                setCustomerName('');
                setCustomerPhone('');
                setOrderType('dine-in');
            } else {
                alert(`Failed to create order: ${data.error}`);
            }
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Order creation failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="container" style={{ padding: '2rem 1.5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Salesman Dashboard</h1>
                    <p className="text-muted">Welcome, {user?.name}</p>
                </div>
                <button onClick={logout} className="btn btn-ghost" style={{ color: 'var(--error)' }}>
                    Logout
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2rem' }}>
                {/* LEFT: MENU SECTION */}
                <div>
                    {/* Search & Categories */}
                    <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                        <input
                            className="input"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ marginBottom: '1rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', textTransform: 'capitalize' }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Menu Items Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {loading ? <p>Loading menu...</p> : filteredItems.map(item => (
                            <div key={item.id} className="glass-card" style={{ padding: '1rem', cursor: 'pointer', transition: '0.2s', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} onClick={() => addToCart(item)}>
                                <h4 style={{ margin: 0 }}>{item.name}</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹{Number(item.price).toFixed(0)}</span>
                                    <div style={{ width: '24px', height: '24px', background: 'var(--primary)', borderRadius: '50%', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>+</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: BILLING SECTION */}
                <div style={{ position: 'sticky', top: '1rem' }}>
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 8rem)' }}>
                        <h2 style={{ marginBottom: '1rem', textAlign: 'center', fontFamily: 'serif' }}>Current Bill</h2>

                        {/* Order Controls */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                            <select
                                value={orderType}
                                onChange={(e: any) => setOrderType(e.target.value)}
                                className="input"
                                style={{ padding: '0.5rem' }}
                            >
                                <option value="dine-in">Dine-in</option>
                                <option value="takeaway">Takeaway</option>
                            </select>
                            {orderType === 'dine-in' && (
                                <input
                                    className="input"
                                    placeholder="Table No."
                                    value={tableNumber}
                                    onChange={e => setTableNumber(e.target.value)}
                                    style={{ padding: '0.5rem' }}
                                />
                            )}
                        </div>

                        {/* Cart List */}
                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
                            {cart.length === 0 ? (
                                <p className="text-muted text-center" style={{ marginTop: '2rem' }}>No items added</p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.menuItem.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500 }}>{item.menuItem.name}</div>
                                            <div className="text-muted" style={{ fontSize: '0.85rem' }}>₹{Number(item.menuItem.price).toFixed(0)} x {item.quantity}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <button className="btn btn-ghost" style={{ padding: '2px 8px' }} onClick={(e) => { e.stopPropagation(); updateQuantity(item.menuItem.id, -1); }}>-</button>
                                            <b>{item.quantity}</b>
                                            <button className="btn btn-ghost" style={{ padding: '2px 8px' }} onClick={(e) => { e.stopPropagation(); addToCart(item.menuItem); }}>+</button>
                                        </div>
                                        <div style={{ fontWeight: 'bold', minWidth: '60px', textAlign: 'right' }}>
                                            ₹{(Number(item.menuItem.price) * item.quantity).toFixed(0)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer Section */}
                        <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input
                                    className="input"
                                    placeholder="Customer Name"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    style={{ fontSize: '0.9rem' }}
                                />
                                <input
                                    className="input"
                                    placeholder="Phone"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    style={{ fontSize: '0.9rem' }}
                                    type="tel"
                                />
                            </div>

                            <select
                                className="input"
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                                style={{ marginBottom: '1rem' }}
                            >
                                <option value="cash">Cash Payment</option>
                                <option value="card">Card Payment</option>
                                <option value="upi">UPI / Scan</option>
                            </select>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                <span>Total Pay:</span>
                                <span>₹{grandTotal.toFixed(2)}</span>
                            </div>

                            <button
                                onClick={handleSubmitOrder}
                                className="btn btn-primary"
                                style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}
                                disabled={submitting}
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
