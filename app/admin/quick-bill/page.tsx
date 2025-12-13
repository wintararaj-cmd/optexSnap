'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItem {
    id: number;
    name: string;
    description: string;
    category_name: string;
    price: number;
    available: boolean;
    gst_rate: number;
}

interface CartItem {
    menuItem: MenuItem;
    quantity: number;
}

export default function QuickBillPage() {
    const router = useRouter();
    const { user } = useAuth();

    // Data
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<string[]>([]);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Customer Details (Optional for Quick Bill)
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');

    // Receipt Data for Printing
    const [receiptData, setReceiptData] = useState<any>(null);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMenuItems();
    }, []);

    const fetchMenuItems = async () => {
        try {
            const res = await fetch('/api/menu?available=true');
            const data = await res.json();
            if (data.success) {
                setMenuItems(data.data);
                const cats = Array.from(new Set(data.data.map((i: MenuItem) => i.category_name).filter(Boolean))) as string[];
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
        const matchesCategory = selectedCategory === 'all' || item.category_name === selectedCategory;
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

    // Handlers
    const handleBillAction = async (action: 'print' | 'whatsapp' | 'save') => {
        if (cart.length === 0) return alert('Cart is empty!');

        setSubmitting(true);

        try {
            // Create completed order
            const orderPayload = {
                customer_name: customerName || 'Walk-in Customer',
                customer_phone: customerPhone || 'N/A',
                items: cart,
                subtotal: calculateTotal(),
                tax: calculateTax(),
                total_amount: grandTotal,
                payment_method: paymentMethod,
                order_type: 'takeaway', // Default for Quick Bill
                order_status: 'delivered', // Immediate complete
                payment_status: 'paid',   // Immediate paid
                discount: 0,
                delivery_charge: 0
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });

            const data = await res.json();

            if (data.success) {
                const order = data.data;

                if (action === 'print') {
                    setReceiptData(order);
                    // Wait for state update then print
                    setTimeout(() => window.print(), 100);
                } else if (action === 'whatsapp') {
                    sendWhatsApp(order);
                } else {
                    alert('Bill Saved Successfully!');
                }

                // Clear cart after success
                setCart([]);
                setCustomerName('');
                setCustomerPhone('');
            } else {
                alert('Failed to create bill: ' + data.error);
            }
        } catch (error) {
            console.error('Billing error:', error);
            alert('Error creating bill');
        } finally {
            setSubmitting(false);
        }
    };

    const sendWhatsApp = (order: any) => {
        if (!customerPhone || customerPhone.length < 10) {
            alert('Please enter a valid phone number for WhatsApp');
            return;
        }

        const itemsList = cart.map(i => `${i.menuItem.name} x${i.quantity} = ₹${(Number(i.menuItem.price) * i.quantity).toFixed(0)}`).join('%0A');

        const message = `*Ruchi Restaurant - Bill Receipt*%0A` +
            `Invoice: ${order.invoice_number}%0A` +
            `Date: ${new Date().toLocaleDateString()}%0A%0A` +
            `*Items:*%0A${itemsList}%0A` +
            `------------------------%0A` +
            `*Total Amount: ₹${grandTotal.toFixed(2)}*%0A` +
            `Thank you for dining with us!`;

        window.open(`https://wa.me/91${customerPhone}?text=${message}`, '_blank');
    };

    return (
        <main className="container" style={{ padding: '2rem 1.5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* NO-PRINT HEADER */}
            <div className="no-print">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1>Quick Bill</h1>
                    <button onClick={() => router.push('/admin/dashboard')} className="btn btn-ghost">
                        Dashboard
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2rem' }}>
                    {/* LEFT COLUMN: MENU */}
                    <div>
                        {/* Search & Filters */}
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

                        {/* Menu Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {loading ? <p>Loading menu...</p> : filteredItems.map(item => (
                                <div key={item.id} className="glass-card" style={{ padding: '1rem', cursor: 'pointer', transition: '0.2s' }} onClick={() => addToCart(item)}>
                                    <h4 style={{ margin: 0 }}>{item.name}</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹{Number(item.price).toFixed(0)}</span>
                                        <div style={{ width: '24px', height: '24px', background: 'var(--primary)', borderRadius: '50%', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>+</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: BILLING */}
                    <div style={{ position: 'sticky', top: '1rem' }}>
                        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)' }}>
                            <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Current Bill</h2>

                            {/* Scrollable Cart Interface */}
                            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
                                {cart.length === 0 ? (
                                    <p className="text-muted text-center">No items added</p>
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

                            {/* Totals & Inputs */}
                            <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <input
                                        className="input"
                                        placeholder="Customer Name (Optional)"
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                        style={{ fontSize: '0.9rem' }}
                                    />
                                    <input
                                        className="input"
                                        placeholder="Mobile (For WhatsApp)"
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
                                    <option value="upi">UPI / Scan</option>
                                    <option value="card">Card</option>
                                </select>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                    <span>Total Pay:</span>
                                    <span>₹{grandTotal.toFixed(2)}</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleBillAction('print')}
                                        className="btn btn-primary"
                                        disabled={submitting}
                                    >
                                        🖨️ Save & Print
                                    </button>
                                    <button
                                        onClick={() => handleBillAction('whatsapp')}
                                        className="btn btn-success"
                                        style={{ background: '#25D366', color: 'white', borderColor: '#25D366' }}
                                        disabled={submitting}
                                    >
                                        📱 WhatsApp
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRINT RECEIPT TEMPLATE (Hidden unless printing) */}
            {receiptData && (
                <div id="receipt-area" style={{ display: 'none' }}>
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            #receipt-area, #receipt-area * { visibility: visible; }
                            #receipt-area {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 80mm; /* Thermal paper width */
                                padding: 5px;
                                font-family: 'Courier New', Courier, monospace;
                                font-size: 12px;
                                display: block !important;
                                color: black;
                                background: white;
                            }
                            .no-print { display: none !important; }
                            .glass-card { box-shadow: none; border: none; background: none; }
                        }
                    `}</style>
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <h2 style={{ margin: '5px 0' }}>Ruchi Restaurant</h2>
                        <p style={{ margin: 0 }}>Tel: +91 9876543210</p>
                        <p style={{ margin: 0 }}>Date: {new Date().toLocaleString()}</p>
                        <hr style={{ borderTop: '1px dashed black', margin: '10px 0' }} />
                    </div>

                    <div>
                        <p><strong>Order #: {receiptData.invoice_number}</strong></p>
                        <p>Customer: {receiptData.customer_name}</p>
                    </div>
                    <hr style={{ borderTop: '1px dashed black' }} />

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left' }}>
                                <th>Item</th>
                                <th style={{ textAlign: 'right' }}>Qty</th>
                                <th style={{ textAlign: 'right' }}>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receiptData.items && JSON.parse(JSON.stringify(receiptData.items)).map((item: any, i: number) => (
                                <tr key={i}>
                                    <td>{item.menuItem.name}</td>
                                    <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'right' }}>{(item.menuItem.price * item.quantity).toFixed(0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <hr style={{ borderTop: '1px dashed black' }} />

                    <div style={{ textAlign: 'right', lineHeight: '1.5' }}>
                        <p style={{ margin: 0 }}>Subtotal: {Number(receiptData.subtotal).toFixed(2)}</p>
                        <p style={{ margin: 0 }}>Tax: {Number(receiptData.tax).toFixed(2)}</p>
                        <h3 style={{ margin: '5px 0' }}>Total: ₹{Number(receiptData.total_amount).toFixed(2)}</h3>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <p>*** Thank You Visit Again ***</p>
                    </div>
                </div>
            )}
        </main>
    );
}
