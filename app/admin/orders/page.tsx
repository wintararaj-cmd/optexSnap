'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ReceiptPrinter } from '@/lib/receipt-printer';

export default function AdminOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [printingOrderId, setPrintingOrderId] = useState<number | null>(null);

    const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        fetchOrders();
        fetchDeliveryBoys();
    }, []);

    const fetchDeliveryBoys = async () => {
        try {
            const response = await fetch('/api/admin/delivery-boys');
            const data = await response.json();
            if (data.success) {
                setDeliveryBoys(data.data);
            }
        } catch (error) {
            console.error('Error fetching delivery boys:', error);
        }
    };

    const updateDeliveryBoy = async (orderId: number, deliveryBoyId: string) => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ delivery_boy_id: deliveryBoyId ? parseInt(deliveryBoyId) : null }),
            });

            if (response.ok) {
                fetchOrders();
                alert('Delivery Boy Assigned Updated');
            } else {
                alert('Failed to update assignment');
            }
        } catch (error) {
            console.error('Error updating delivery boy:', error);
        }
    };



    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders');
            const data = await response.json();
            if (data.success) {
                setOrders(data.data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: number, status: string) => {
        try {
            console.log('Updating order status:', orderId, status);
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_status: status }),
            });

            const data = await response.json();
            console.log('Update response:', data);

            if (data.success) {
                fetchOrders();
                alert(`Order status updated to: ${status}`);
            } else {
                alert(`Failed to update order: ${data.error}`);
            }
        } catch (error) {
            console.error('Error updating order:', error);
            alert('An error occurred while updating the order. Check console for details.');
        }
    };

    const updatePaymentStatus = async (orderId: number, status: string) => {
        try {
            console.log('Updating payment status:', orderId, status);
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payment_status: status }),
            });

            const data = await response.json();
            console.log('Update response:', data);

            if (data.success) {
                fetchOrders();
                alert(`Payment status updated to: ${status}`);
            } else {
                alert(`Failed to update payment: ${data.error}`);
            }
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('An error occurred while updating payment. Check console for details.');
        }
    };

    const printKOTFallback = (order: any) => {
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) {
            alert('Please allow popups to print the KOT.');
            return;
        }

        const itemsHtml = (Array.isArray(order.items) ? order.items : []).map((item: any) => `
            <tr>
                <td style="padding: 2px 0;">${item.menuItem.name}</td>
                <td style="text-align: right; padding: 2px 0;">${item.quantity}</td>
            </tr>
        `).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>KOT #${order.id}</title>
                <style>
                    @page { margin: 0; size: 80mm auto; }
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        width: 72mm;
                        margin: 0 auto;
                        padding: 10px;
                        font-size: 14px;
                        font-weight: bold;
                        color: black;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .bold { font-weight: 900; }
                    .divider { border-top: 2px dashed black; margin: 5px 0; }
                    table { width: 100%; border-collapse: collapse; }
                </style>
            </head>
            <body>
                <div class="text-center bold" style="font-size: 16px;">KITCHEN ORDER TICKET</div>
                <div class="divider"></div>
                
                <div>Order #: ${order.id}</div>
                <div>Type: ${order.order_type.toUpperCase()}</div>
                ${order.table_number ? `<div>Table No: ${order.table_number}</div>` : ''}
                <div>Date: ${new Date(order.created_at).toLocaleString()}</div>
                
                <div class="divider"></div>
                
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">ITEM</th>
                            <th style="text-align: right;">QTY</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                <div class="divider"></div>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.onafterprint = () => {
                printWindow.close();
            };
        }, 500);
    };

    const handlePrintKOT = async (order: any) => {
        setPrintingOrderId(order.id);
        try {
            // @ts-ignore
            if (!navigator.usb) {
                // If WebUSB is not supported, fallback immediately
                printKOTFallback(order);
                return;
            }

            // @ts-ignore
            const device = await navigator.usb.requestDevice({ filters: [] });
            await device.open();
            await device.selectConfiguration(1);
            await device.claimInterface(0);

            const printer = new ReceiptPrinter();
            printer.alignCenter();
            printer.bold(true).textLine('KITCHEN ORDER TICKET').bold(false);
            printer.feed(1);

            printer.alignLeft();
            printer.textLine(`Order #: ${order.id}`);
            printer.textLine(`Type: ${order.order_type.toUpperCase()}`);
            if (order.table_number) printer.textLine(`Table No: ${order.table_number}`);
            printer.textLine(`Date: ${new Date(order.created_at).toLocaleString()}`);
            printer.line('-');

            printer.textLine('ITEM                     QTY');
            printer.line('-');

            if (Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                    const name = item.menuItem.name.substring(0, 24).padEnd(24, ' ');
                    const qty = item.quantity.toString().padStart(3, ' ');
                    printer.textLine(`${name} ${qty}`);
                });
            }

            printer.feed(3);
            printer.cut();

            const data = printer.getData();
            // @ts-ignore
            await device.transferOut(1, data);
            // @ts-ignore
            await device.close();

        } catch (error: any) {
            console.warn('USB Printing failed, falling back to browser print:', error);
            // Fallback for any error (cancelled, security, driver conflict)
            printKOTFallback(order);
        } finally {
            setPrintingOrderId(null);
        }
    };

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(o => o.order_status === filter);

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
                    <h1>Order Management</h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => router.push('/admin/orders/create')} className="btn btn-primary">
                            + Create New Order
                        </button>
                        <button onClick={() => router.push('/admin/dashboard')} className="btn btn-ghost">
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <strong>Order Status:</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={filter === status ? 'btn btn-primary' : 'btn btn-ghost'}
                                style={{ padding: '0.625rem 1.25rem', textTransform: 'capitalize' }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders */}
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="glass-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0 }}>Order #{order.id}</h3>
                                        <span className="badge" style={{
                                            background: order.order_type === 'takeaway' ? 'var(--success)' : 'var(--info)',
                                            color: 'white',
                                            textTransform: 'capitalize'
                                        }}>
                                            {order.order_type || 'delivery'}
                                            {order.table_number && ` (Table: ${order.table_number})`}
                                        </span>
                                    </div>
                                    <p className="text-muted" style={{ fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
                                        {new Date(order.created_at).toLocaleString()}
                                    </p>
                                    <p style={{ marginBottom: 0 }}>
                                        <strong>{order.customer_name}</strong> • {order.customer_phone}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                        ₹{parseFloat(order.total_amount).toFixed(2)}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => handlePrintKOT(order)}
                                            className="btn btn-warning"
                                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                                            disabled={printingOrderId === order.id}
                                        >
                                            {printingOrderId === order.id ? '🖨️...' : '🖨️ Print Order'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                const phoneNumber = order.customer_phone.replace(/\D/g, '');
                                                const message = `Hello ${order.customer_name}! 👋\n\nYour order #${order.id} is being processed.\n\nTotal Amount: ₹${parseFloat(order.total_amount).toFixed(2)}\n\nView your invoice: ${window.location.origin}/admin/invoices/${order.id}\n\nThank you for ordering from us! 🙏`;
                                                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                                                window.open(whatsappUrl, '_blank');
                                            }}
                                            className="btn btn-ghost"
                                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', color: '#25D366' }}
                                            title="Send via WhatsApp"
                                        >
                                            📱 WhatsApp
                                        </button>
                                        <button
                                            onClick={() => router.push(`/admin/invoices/${order.id}`)}
                                            className="btn btn-ghost"
                                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                                        >
                                            📄 View Invoice
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                borderTop: '1px solid var(--border-color)',
                                borderBottom: '1px solid var(--border-color)',
                                padding: '1rem 0',
                                margin: '1rem 0',
                            }}>
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <strong>Items:</strong>
                                </div>
                                {(Array.isArray(order.items) ? order.items : []).map((item: any, idx: number) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.5rem',
                                            paddingLeft: '1rem',
                                        }}
                                    >
                                        <span className="text-muted">
                                            {item.menuItem.name} × {item.quantity}
                                        </span>
                                        <span>₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            {order.customer_address && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                        Delivery Address
                                    </div>
                                    <div>{order.customer_address}</div>
                                    {order.delivery_location_name && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <span className="badge" style={{ background: 'var(--info)', color: 'white' }}>
                                                📍 {order.delivery_location_name}
                                            </span>
                                            {order.delivery_charge > 0 && (
                                                <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                    Delivery Charge: ₹{parseFloat(order.delivery_charge).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {order.notes && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                        Special Instructions
                                    </div>
                                    <div>{order.notes}</div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        Order Status
                                    </label>
                                    <select
                                        value={order.order_status}
                                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                        className="input"
                                        style={{ textTransform: 'capitalize' }}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="preparing">Preparing</option>
                                        <option value="ready">Ready</option>
                                        <option value="out_for_delivery">Out for Delivery</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        Payment Status
                                    </label>
                                    <select
                                        value={order.payment_status}
                                        onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                                        className="input"
                                        style={{ textTransform: 'capitalize' }}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        Delivery Boy
                                    </label>
                                    {order.order_type === 'delivery' ? (
                                        <select
                                            value={order.delivery_boy_id || ''}
                                            onChange={(e) => updateDeliveryBoy(order.id, e.target.value)}
                                            className="input"
                                        >
                                            <option value="">Unassigned</option>
                                            {deliveryBoys.map(db => (
                                                <option key={db.id} value={db.id}>{db.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="input" style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                                            N/A ({order.order_type === 'takeaway' ? 'Takeaway' : 'Dine-in'})
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredOrders.length === 0 && (
                        <div className="glass-card text-center" style={{ padding: '3rem 2rem' }}>
                            <p className="text-muted">No orders found for this filter.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
