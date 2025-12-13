'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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
    const { user } = useAuth();

    // Data
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter UI
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Order State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const [orderType, setOrderType] = useState<'takeaway' | 'delivery' | 'dine-in'>('takeaway');
    const [tableNumber, setTableNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch Menu
                const menuRes = await fetch('/api/menu?available=true');
                const menuData = await menuRes.json();
                if (menuData.success) {
                    setMenuItems(menuData.data);
                    const cats = Array.from(new Set(menuData.data.map((i: MenuItem) => i.category_name).filter(Boolean))) as string[];
                    setCategories(['all', ...cats]);
                }

                // Fetch Locations
                const locRes = await fetch('/api/admin/delivery-locations?active=true');
                const locData = await locRes.json();
                if (locData.success) {
                    setDeliveryLocations(locData.data);
                }
            } catch (error) {
                console.error("Error loading data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category_name === selectedCategory;
        return matchesSearch && matchesCategory;
    });

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
    const calculateSubtotal = () => cart.reduce((sum, item) => sum + (Number(item.menuItem.price) * item.quantity), 0);

    const calculateTax = () => cart.reduce((sum, item) => {
        const taxRate = (item.menuItem.gst_rate || 5) / 100;
        return sum + (Number(item.menuItem.price) * item.quantity * taxRate);
    }, 0);

    const getDeliveryCharge = () => {
        if (orderType !== 'delivery' || !selectedLocationId) return 0;
        const location = deliveryLocations.find(loc => loc.id === selectedLocationId);
        return location ? Number(location.delivery_charge) : 0;
    };

    const grandTotal = calculateSubtotal() + calculateTax() + getDeliveryCharge();

    const handleSubmitOrder = async () => {
        // Validation
        if (orderType === 'dine-in' && !tableNumber) return alert('Please provide Table Number for Dine-in');
        if (orderType === 'delivery') {
            if (!customerName || !customerPhone) return alert('Customer Name and Phone required for Delivery');
            if (!customerAddress) return alert('Delivery Address required');
            if (!selectedLocationId) return alert('Delivery Location required');
        }
        if (cart.length === 0) return alert('Cart is empty');

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
                total_amount: grandTotal,
                payment_method: paymentMethod,
                notes: notes || null,
                table_number: orderType === 'dine-in' ? tableNumber : null,
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });
            const data = await res.json();

            if (data.success) {
                alert(`Order Created! Invoice: ${data.data.invoice_number}`);
                router.push('/admin/orders');
            } else {
                alert(`Failed: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error creating order');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center p-5">Loading...</div>;

    return (
        <main className="container" style={{ padding: '2rem 1.5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Create Order</h1>
                <button onClick={() => router.push('/admin/orders')} className="btn btn-ghost">← Back to Orders</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2rem' }}>
                {/* LEFT: Menu */}
                <div>
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

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {filteredItems.map(item => (
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

                {/* RIGHT: Invoice Form */}
                <div style={{ position: 'sticky', top: '1rem' }}>
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content', maxHeight: 'calc(100vh - 4rem)' }}>
                        <h2 style={{ marginBottom: '1rem', textAlign: 'center', fontFamily: 'serif' }}>Current Order</h2>

                        {/* Order Type Selector */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.25rem', marginBottom: '1rem' }}>
                            {(['dine-in', 'takeaway', 'delivery'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setOrderType(type)}
                                    className={`btn ${orderType === type ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{ padding: '0.5rem', fontSize: '0.8rem', textTransform: 'capitalize' }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Contextual Inputs */}
                        {orderType === 'dine-in' && (
                            <div style={{ marginBottom: '1rem' }}>
                                <input className="input" placeholder="Table Number (e.g. T-5)" value={tableNumber} onChange={e => setTableNumber(e.target.value)} />
                            </div>
                        )}
                        {orderType === 'delivery' && (
                            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                <select className="input" value={selectedLocationId || ''} onChange={e => setSelectedLocationId(Number(e.target.value))}>
                                    <option value="">Select Location</option>
                                    {deliveryLocations.map(l => (
                                        <option key={l.id} value={l.id}>{l.location_name} (+₹{l.delivery_charge})</option>
                                    ))}
                                </select>
                                <textarea className="input" placeholder="Delivery Address" rows={2} value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                            </div>
                        )}

                        {/* Cart List */}
                        <div style={{ flex: 1, overflowY: 'auto', minHeight: '150px', marginBottom: '1rem', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '0.5rem 0' }}>
                            {cart.length === 0 ? <p className="text-muted text-center py-5">Empty Cart</p> : cart.map(item => (
                                <div key={item.menuItem.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ flex: 1 }}>{item.menuItem.name} <br /><span className="text-muted text-sm">₹{item.menuItem.price} x {item.quantity}</span></div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <button className="btn btn-ghost px-2" onClick={(e) => { e.stopPropagation(); updateQuantity(item.menuItem.id, -1) }}>-</button>
                                        <span>{item.quantity}</span>
                                        <button className="btn btn-ghost px-2" onClick={(e) => { e.stopPropagation(); addToCart(item.menuItem) }}>+</button>
                                    </div>
                                    <div style={{ minWidth: '50px', textAlign: 'right', fontWeight: 'bold' }}>₹{(item.menuItem.price * item.quantity).toFixed(0)}</div>
                                </div>
                            ))}
                        </div>

                        {/* Totals & Footer */}
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input className="input" placeholder="Cust. Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                                <input className="input" placeholder="Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} type="tel" />
                            </div>

                            <select className="input mb-3" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="upi">UPI</option>
                            </select>

                            {orderType === 'delivery' && selectedLocationId && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.9rem' }}>
                                    <span>Delivery Charge:</span>
                                    <span>₹{getDeliveryCharge()}</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                <span>Total:</span>
                                <span>₹{grandTotal.toFixed(2)}</span>
                            </div>

                            <button onClick={handleSubmitOrder} className="btn btn-primary w-full" disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
