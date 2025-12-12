'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface InvoiceData {
    id: number;
    order_id: number;
    invoice_number: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    generated_at: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    items: any[];
    payment_method: string;
    payment_status: string;
    order_type: string;
    order_date: string;
}

export default function InvoicePage() {
    const router = useRouter();
    const params = useParams();
    const [invoice, setInvoice] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }

        // Fetch settings from API
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSettings(data.data);
                } else {
                    // Fallback to defaults if API fails
                    setSettings(defaultSettings);
                }
            })
            .catch(err => {
                console.error('Error fetching settings:', err);
                setSettings(defaultSettings);
            });

        if (params.id) {
            fetchInvoice(params.id as string);
        }
    }, [params.id]);

    const defaultSettings = {
        restaurantName: 'Ruchi Restaurant',
        restaurantAddress: '123 Main Street, City, State 12345',
        restaurantPhone: '+91 1234567890',
        restaurantEmail: 'info@ruchi.com',
        gstNumber: '',
        gstType: 'regular',
        printerType: 'thermal',
        paperWidth: '80mm',
        footerText: 'Thank you for your business!',
        showLogo: true,
    };

    const fetchInvoice = async (id: string) => {
        try {
            // Fetch invoice by order_id
            const response = await fetch(`/api/invoices?orderId=${id}`);
            const data = await response.json();
            if (data.success && data.data.length > 0) {
                setInvoice(data.data[0]);
            } else {
                alert('Invoice not found for this order');
                router.push('/admin/orders');
            }
        } catch (error) {
            console.error('Error fetching invoice:', error);
            alert('Failed to load invoice');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleWhatsAppShare = () => {
        if (!invoice) return;

        // Format items list
        const itemsList = invoice.items.map((item: any, idx: number) => {
            const price = parseFloat(item.menuItem.price);
            const quantity = parseInt(item.quantity);
            const total = price * quantity;
            return `${idx + 1}. ${item.menuItem.name} x${quantity} - ₹${total.toFixed(2)}`;
        }).join('\n');

        // Title
        const invoiceTitle = settings?.gstType === 'regular' ? 'TAX INVOICE' : 'BILL OF SUPPLY';

        // Create formatted message
        const message = `🧾 *${invoiceTitle} - ${invoice.invoice_number}*\n\n` +
            `📅 *Date:* ${new Date(invoice.order_date).toLocaleDateString()}\n` +
            `👤 *Customer:* ${invoice.customer_name}\n` +
            `📞 *Phone:* ${invoice.customer_phone}\n` +
            `${invoice.customer_address ? `📍 *Address:* ${invoice.customer_address}\n` : ''}` +
            `🛵 *Order Type:* ${invoice.order_type.charAt(0).toUpperCase() + invoice.order_type.slice(1)}\n\n` +
            `*━━━━━━━━━━━━━━━━*\n` +
            `*ITEMS:*\n${itemsList}\n` +
            `*━━━━━━━━━━━━━━━━*\n\n` +
            `💰 *Subtotal:* ₹${parseFloat(invoice.subtotal.toString()).toFixed(2)}\n` +
            (settings?.gstType === 'regular' ? `📊 *Tax:* ₹${parseFloat(invoice.tax.toString()).toFixed(2)}\n` : '') +
            `${invoice.discount > 0 ? `🎁 *Discount:* -₹${parseFloat(invoice.discount.toString()).toFixed(2)}\n` : ''}` +
            `*━━━━━━━━━━━━━━━━*\n` +
            `💳 *TOTAL:* ₹${parseFloat(invoice.total.toString()).toFixed(2)}\n\n` +
            `💳 *Payment Method:* ${invoice.payment_method.charAt(0).toUpperCase() + invoice.payment_method.slice(1)}\n` +
            `✅ *Payment Status:* ${invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1)}\n\n` +
            `🏪 *${settings?.restaurantName || 'Ruchi Restaurant'}*\n` +
            `${settings?.restaurantPhone || '+91 1234567890'}\n\n` +
            `_Thank you for your order!_ 🙏`;

        // Encode message for URL
        const encodedMessage = encodeURIComponent(message);

        // Open WhatsApp with pre-filled message
        // Use customer's phone number if available
        const phoneNumber = invoice.customer_phone.replace(/\D/g, ''); // Remove non-digits
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <main className="container" style={{ padding: '2rem 1.5rem' }}>
                <div className="glass-card text-center" style={{ padding: '3rem 2rem' }}>
                    <p className="text-muted">Invoice not found</p>
                    <button onClick={() => router.push('/admin/orders')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Back to Orders
                    </button>
                </div>
            </main>
        );
    }

    return (
        <>
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    
                    /* Hide unnecessary elements globally in print */
                    .no-print {
                        display: none !important;
                    }

                    /* Global resets to ensure pure white background */
                    body {
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    /* Hide the background pattern pseudo-element */
                    body::before {
                        display: none !important;
                    }

                    /* Remove all card/glass effects */
                    .invoice-container, .glass-card {
                        box-shadow: none !important;
                        background: white !important;
                        backdrop-filter: none !important;
                        border: none !important;
                        max-width: 100% !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* Specific rules for Thermal Printer */
                    ${settings?.printerType === 'thermal' ? `
                        /* Hide navigation for thermal prints */
                        .navbar {
                            display: none !important;
                        }

                        /* Thermal Receipt Container */
                        .thermal-receipt {
                            width: ${settings?.paperWidth === '58mm' ? '58mm' : '80mm'} !important;
                            font-family: 'Courier New', Courier, monospace !important; /* Monospace for text-only look */
                            font-size: 12px !important;
                            line-height: 1.2 !important;
                            padding: 2mm !important;
                            margin: 0 auto !important;
                            color: black !important;
                        }

                        /* Ensure everything in the receipt is black */
                        .thermal-receipt * {
                            color: black !important;
                            text-shadow: none !important;
                            visibility: visible !important;
                        }

                        /* Header styling for thermal */
                        .thermal-receipt h1 {
                            font-size: 16px !important;
                            font-weight: bold !important;
                            margin: 0 0 5px 0 !important;
                            text-transform: uppercase;
                        }
                        
                        .thermal-receipt h2, .thermal-receipt h3 {
                            font-size: 13px !important;
                            font-weight: bold !important;
                            margin: 5px 0 !important;
                        }

                        /* Table styling */
                        .thermal-receipt table {
                            width: 100% !important;
                            font-size: 12px !important;
                            border-collapse: collapse !important;
                        }
                        
                        .thermal-receipt th {
                            text-align: left;
                            border-bottom: 1px dashed black !important;
                            padding: 2px 0 !important;
                            font-weight: bold;
                        }
                        
                        .thermal-receipt td {
                            padding: 2px 0 !important;
                        }


                        /* Dividers */
                        .thermal-receipt .divider {
                            border-top: 1px dashed black !important;
                            margin: 5px 0 !important;
                            opacity: 1 !important;
                        }
                        
                        /* Force visibility of the invoice container and its parents */
                        /* We saw an issue where 'div.fade-in' was being hidden because it wasn't the invoice container directly */
                        .invoice-container {
                            display: block !important;
                            visibility: visible !important;
                        }
                        
                        /* Hide only specific known non-printable areas if they aren't already hidden by no-print */
                        /* (The no-print class handles most UI elements) */
                     ` : ''}
                }
            `}</style>

            <main className="container" style={{ padding: '2rem 1.5rem' }}>
                <div className="fade-in">
                    <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h1>Invoice Details</h1>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={handleWhatsAppShare} className="btn btn-secondary">
                                📱 Send via WhatsApp
                            </button>
                            <button onClick={handlePrint} className="btn btn-primary">
                                🖨️ Print Invoice
                            </button>
                            <button onClick={() => router.push('/admin/orders')} className="btn btn-ghost">
                                ← Back to Orders
                            </button>
                        </div>
                    </div>

                    <div className={`glass-card invoice-container ${settings?.printerType === 'thermal' ? 'thermal-receipt' : ''}`} style={settings?.printerType === 'thermal' ? { maxWidth: settings.paperWidth, margin: '0 auto', padding: '1rem', fontSize: '0.875rem' } : { maxWidth: '800px', margin: '0 auto', padding: '3rem' }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: settings?.printerType === 'thermal' ? '0.5rem' : '2rem', paddingBottom: settings?.printerType === 'thermal' ? '0.5rem' : '1.5rem', borderBottom: settings?.printerType === 'thermal' ? '1px dashed #000' : '2px solid var(--border-color)' }}>
                            <h1 style={{ fontSize: settings?.printerType === 'thermal' ? '1.25rem' : '2rem', marginBottom: '0.25rem' }}>{settings?.restaurantName || 'Ruchi Restaurant'}</h1>
                            <p style={{ fontWeight: 700, margin: '0.25rem 0', textTransform: 'uppercase', fontSize: settings?.printerType === 'thermal' ? '0.875rem' : '1rem' }}>
                                {settings?.gstType === 'regular' ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
                            </p>
                            {settings?.printerType === 'thermal' && (
                                <>
                                    <p style={{ fontSize: '0.75rem', margin: '0.25rem 0' }}>{settings?.restaurantAddress}</p>
                                    <p style={{ fontSize: '0.75rem', margin: '0.25rem 0' }}>Ph: {settings?.restaurantPhone}</p>
                                    {settings?.gstNumber && <p style={{ fontSize: '0.75rem', margin: '0.25rem 0' }}>GST: {settings?.gstNumber}</p>}
                                </>
                            )}
                            <p style={{ fontSize: settings?.printerType === 'thermal' ? '0.875rem' : '1.25rem', fontWeight: 600, marginTop: '0.5rem' }}>
                                {invoice.invoice_number}
                            </p>
                        </div>

                        {settings?.printerType !== 'thermal' && (
                            <>
                                {/* Restaurant & Customer Info - A4 Layout */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                    <div>
                                        <h3 style={{ marginBottom: '0.75rem', fontSize: '1.125rem' }}>From:</h3>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{settings?.restaurantName || 'Ruchi Restaurant'}</p>
                                        <p className="text-muted" style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>
                                            {settings?.restaurantAddress || '123 Main Street, City, State 12345'}<br />
                                            Phone: {settings?.restaurantPhone || '+91 1234567890'}<br />
                                            Email: {settings?.restaurantEmail || 'info@ruchi.com'}
                                            {settings?.gstNumber && <><br />GST: {settings.gstNumber}</>}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 style={{ marginBottom: '0.75rem', fontSize: '1.125rem' }}>To:</h3>
                                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{invoice.customer_name}</p>
                                        <p className="text-muted" style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>
                                            Phone: {invoice.customer_phone}<br />
                                            {invoice.customer_address && (
                                                <>Address: {invoice.customer_address}<br /></>
                                            )}
                                            Order Type: <span style={{ textTransform: 'capitalize' }}>{invoice.order_type}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Invoice Details - A4 Layout */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                                    <div>
                                        <p className="text-muted" style={{ fontSize: '0.875rem' }}>Invoice Date</p>
                                        <p style={{ fontWeight: 500 }}>{new Date(invoice.generated_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted" style={{ fontSize: '0.875rem' }}>Order Date</p>
                                        <p style={{ fontWeight: 500 }}>{new Date(invoice.order_date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted" style={{ fontSize: '0.875rem' }}>Payment Method</p>
                                        <p style={{ fontWeight: 500, textTransform: 'capitalize' }}>{invoice.payment_method}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted" style={{ fontSize: '0.875rem' }}>Payment Status</p>
                                        <p style={{ fontWeight: 500, textTransform: 'capitalize', color: invoice.payment_status === 'paid' ? 'var(--success)' : 'var(--warning)' }}>
                                            {invoice.payment_status}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        {settings?.printerType === 'thermal' && (
                            <>
                                {/* Customer Info - Thermal Layout */}
                                <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                                    <div className="divider" style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }}></div>
                                    <p style={{ margin: '0.125rem 0' }}><strong>Customer:</strong> {invoice.customer_name}</p>
                                    <p style={{ margin: '0.125rem 0' }}><strong>Phone:</strong> {invoice.customer_phone}</p>
                                    {invoice.customer_address && <p style={{ margin: '0.125rem 0' }}><strong>Address:</strong> {invoice.customer_address}</p>}
                                    <p style={{ margin: '0.125rem 0' }}><strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{invoice.order_type}</span></p>
                                    <p style={{ margin: '0.125rem 0' }}><strong>Date:</strong> {new Date(invoice.order_date).toLocaleString()}</p>
                                    <p style={{ margin: '0.125rem 0' }}><strong>Payment:</strong> <span style={{ textTransform: 'capitalize' }}>{invoice.payment_method}</span></p>
                                    <div className="divider" style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }}></div>
                                </div>
                            </>
                        )}

                        {/* Items Table */}
                        <div style={{ marginBottom: settings?.printerType === 'thermal' ? '0.5rem' : '2rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: settings?.printerType === 'thermal' ? '0.75rem' : 'inherit' }}>
                                <thead>
                                    <tr style={{ borderBottom: settings?.printerType === 'thermal' ? '1px dashed #000' : '2px solid var(--border-color)' }}>
                                        <th style={{ textAlign: 'left', padding: settings?.printerType === 'thermal' ? '0.25rem 0' : '0.75rem 0', fontWeight: 600 }}>Item</th>
                                        <th style={{ textAlign: 'center', padding: settings?.printerType === 'thermal' ? '0.25rem 0' : '0.75rem 0', fontWeight: 600 }}>Qty</th>
                                        {settings?.printerType !== 'thermal' && <th style={{ textAlign: 'right', padding: '0.75rem 0', fontWeight: 600 }}>Price</th>}
                                        <th style={{ textAlign: 'right', padding: settings?.printerType === 'thermal' ? '0.25rem 0' : '0.75rem 0', fontWeight: 600 }}>Amt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(Array.isArray(invoice.items) ? invoice.items : []).map((item: any, idx: number) => {
                                        const price = parseFloat(item.menuItem.price);
                                        const quantity = parseInt(item.quantity);
                                        return (
                                            <tr key={idx} style={{ borderBottom: settings?.printerType === 'thermal' ? 'none' : '1px solid var(--border-color)' }}>
                                                <td style={{ padding: settings?.printerType === 'thermal' ? '0.25rem 0' : '0.75rem 0' }}>
                                                    <div style={{ fontWeight: 500 }}>{item.menuItem.name}</div>
                                                    {settings?.printerType === 'thermal' && (
                                                        <div style={{ fontSize: '0.7rem', color: '#666' }}>@₹{price.toFixed(2)}</div>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center', padding: settings?.printerType === 'thermal' ? '0.25rem 0' : '0.75rem 0' }}>{quantity}</td>
                                                {settings?.printerType !== 'thermal' && <td style={{ textAlign: 'right', padding: '0.75rem 0' }}>₹{price.toFixed(2)}</td>}
                                                <td style={{ textAlign: 'right', padding: settings?.printerType === 'thermal' ? '0.25rem 0' : '0.75rem 0' }}>₹{(price * quantity).toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div style={{ marginLeft: settings?.printerType === 'thermal' ? '0' : 'auto', maxWidth: settings?.printerType === 'thermal' ? '100%' : '300px' }}>
                            {settings?.printerType === 'thermal' && <div className="divider" style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }}></div>}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', padding: settings?.printerType === 'thermal' ? '0.125rem 0' : '0.5rem 0', fontSize: settings?.printerType === 'thermal' ? '0.75rem' : 'inherit' }}>
                                <span>Subtotal:</span>
                                <span>₹{parseFloat(invoice.subtotal.toString()).toFixed(2)}</span>
                            </div>
                            {settings?.gstType === 'regular' && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', padding: settings?.printerType === 'thermal' ? '0.125rem 0' : '0.5rem 0', fontSize: settings?.printerType === 'thermal' ? '0.75rem' : 'inherit' }}>
                                    <span>Tax:</span>
                                    <span>₹{parseFloat(invoice.tax.toString()).toFixed(2)}</span>
                                </div>
                            )}
                            {invoice.discount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', padding: settings?.printerType === 'thermal' ? '0.125rem 0' : '0.5rem 0', color: 'var(--success)', fontSize: settings?.printerType === 'thermal' ? '0.75rem' : 'inherit' }}>
                                    <span>Discount:</span>
                                    <span>-₹{parseFloat(invoice.discount.toString()).toFixed(2)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: settings?.printerType === 'thermal' ? '0.25rem 0' : '1rem 0', borderTop: settings?.printerType === 'thermal' ? '1px dashed #000' : '2px solid var(--border-color)', fontSize: settings?.printerType === 'thermal' ? '0.875rem' : '1.25rem', fontWeight: 700 }}>
                                <span>Total:</span>
                                <span>₹{parseFloat(invoice.total.toString()).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ marginTop: settings?.printerType === 'thermal' ? '0.5rem' : '3rem', paddingTop: settings?.printerType === 'thermal' ? '0.5rem' : '1.5rem', borderTop: settings?.printerType === 'thermal' ? '1px dashed #000' : '1px solid var(--border-color)', textAlign: 'center' }}>
                            <p style={{ fontSize: settings?.printerType === 'thermal' ? '0.75rem' : '0.875rem', margin: '0.25rem 0' }}>
                                {settings?.footerText || 'Thank you for your business!'}
                            </p>
                            {settings?.printerType !== 'thermal' && (
                                <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                                    This is a computer-generated invoice and does not require a signature.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
