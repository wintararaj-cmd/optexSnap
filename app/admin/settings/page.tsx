'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Settings {
    restaurantName: string;
    restaurantAddress: string;
    restaurantPhone: string;
    restaurantEmail: string;
    gstNumber: string;
    gstType: 'regular' | 'composite' | 'unregistered';
    printerType: 'thermal' | 'a4';
    paperWidth: '58mm' | '80mm';
    showLogo: boolean;
    footerText: string;
    paymentGatewayProvider: 'razorpay' | 'stripe';
    paymentGatewayKey: string;
    paymentGatewaySecret: string;
    paymentGatewayEnabled: boolean;
}

const defaultSettings: Settings = {
    restaurantName: 'OptexSnap',
    restaurantAddress: '123 Main Street, City, State 12345',
    restaurantPhone: '+91 1234567890',
    restaurantEmail: 'info@optexsnap.com',
    gstNumber: '',
    gstType: 'regular',
    printerType: 'thermal',
    paperWidth: '80mm',
    showLogo: true,
    footerText: 'Thank you for your business!',
    paymentGatewayProvider: 'razorpay',
    paymentGatewayKey: '',
    paymentGatewaySecret: '',
    paymentGatewayEnabled: false,
};

export default function SettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            if (data.success) {
                setSettings(data.data);
                // Also update localStorage for fallback/legacy support if needed
                localStorage.setItem('printerSettings', JSON.stringify(data.data));
            }
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setSaved(true);
                // Update local storage as well for sync in other pages that might still read it
                localStorage.setItem('printerSettings', JSON.stringify(settings));
                setTimeout(() => setSaved(false), 3000);
            } else {
                alert('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('An error occurred while saving');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm('Reset to default settings?')) {
            setSettings(defaultSettings);
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
                    <h1>Settings</h1>
                    <button onClick={() => router.push('/admin/dashboard')} className="btn btn-ghost">
                        ← Back to Dashboard
                    </button>
                </div>

                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Restaurant Information</h2>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Restaurant Name
                                </label>
                                <input
                                    type="text"
                                    value={settings.restaurantName}
                                    onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                                    className="input"
                                    placeholder="Enter restaurant name"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Address
                                </label>
                                <textarea
                                    value={settings.restaurantAddress}
                                    onChange={(e) => setSettings({ ...settings, restaurantAddress: e.target.value })}
                                    className="input"
                                    placeholder="Enter restaurant address"
                                    rows={2}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={settings.restaurantPhone}
                                        onChange={(e) => setSettings({ ...settings, restaurantPhone: e.target.value })}
                                        className="input"
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={settings.restaurantEmail}
                                        onChange={(e) => setSettings({ ...settings, restaurantEmail: e.target.value })}
                                        className="input"
                                        placeholder="Enter email"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        GST Number (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.gstNumber}
                                        onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                                        className="input"
                                        placeholder="Enter GST number"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        GST Type
                                    </label>
                                    <select
                                        value={settings.gstType}
                                        onChange={(e) => setSettings({ ...settings, gstType: e.target.value as any })}
                                        className="input"
                                    >
                                        <option value="regular">Regular (Tax Invoice)</option>
                                        <option value="composite">Composite (Bill of Supply)</option>
                                        <option value="unregistered">Unregistered (Bill of Supply)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Printer Configuration</h2>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Printer Type
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setSettings({ ...settings, printerType: 'thermal' })}
                                        className={settings.printerType === 'thermal' ? 'btn btn-primary' : 'btn btn-ghost'}
                                    >
                                        🖨️ Thermal Printer
                                    </button>
                                    <button
                                        onClick={() => setSettings({ ...settings, printerType: 'a4' })}
                                        className={settings.printerType === 'a4' ? 'btn btn-primary' : 'btn btn-ghost'}
                                    >
                                        📄 A4 Printer
                                    </button>
                                </div>
                            </div>

                            {settings.printerType === 'thermal' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        Paper Width
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => setSettings({ ...settings, paperWidth: '58mm' })}
                                            className={settings.paperWidth === '58mm' ? 'btn btn-primary' : 'btn btn-ghost'}
                                        >
                                            58mm
                                        </button>
                                        <button
                                            onClick={() => setSettings({ ...settings, paperWidth: '80mm' })}
                                            className={settings.paperWidth === '80mm' ? 'btn btn-primary' : 'btn btn-ghost'}
                                        >
                                            80mm
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Footer Text
                                </label>
                                <input
                                    type="text"
                                    value={settings.footerText}
                                    onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                                    className="input"
                                    placeholder="Enter footer text"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Payment Gateway</h2>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: settings.paymentGatewayEnabled ? '#10b981' : '#64748b' }}>
                                    {settings.paymentGatewayEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <div
                                    style={{
                                        width: '40px',
                                        height: '24px',
                                        background: settings.paymentGatewayEnabled ? '#10b981' : '#e2e8f0',
                                        borderRadius: '12px',
                                        position: 'relative',
                                        transition: 'background 0.2s'
                                    }}
                                    onClick={() => setSettings({ ...settings, paymentGatewayEnabled: !settings.paymentGatewayEnabled })}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        background: 'white',
                                        borderRadius: '50%',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        position: 'absolute',
                                        top: '2px',
                                        left: settings.paymentGatewayEnabled ? '18px' : '2px',
                                        transition: 'left 0.2s',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }} />
                                </div>
                            </label>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem', opacity: settings.paymentGatewayEnabled ? 1 : 0.6, pointerEvents: settings.paymentGatewayEnabled ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Provider
                                </label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => setSettings({ ...settings, paymentGatewayProvider: 'razorpay' })}
                                        className={settings.paymentGatewayProvider === 'razorpay' ? 'btn btn-primary' : 'btn btn-ghost'}
                                        style={{ flex: 1, justifyContent: 'center' }}
                                    >
                                        Razorpay
                                    </button>
                                    <button
                                        onClick={() => setSettings({ ...settings, paymentGatewayProvider: 'stripe' })}
                                        className={settings.paymentGatewayProvider === 'stripe' ? 'btn btn-primary' : 'btn btn-ghost'}
                                        style={{ flex: 1, justifyContent: 'center' }}
                                    >
                                        Stripe
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        API Key / Key ID
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.paymentGatewayKey}
                                        onChange={(e) => setSettings({ ...settings, paymentGatewayKey: e.target.value })}
                                        className="input"
                                        placeholder={`Enter ${settings.paymentGatewayProvider === 'razorpay' ? 'rzp_test_...' : 'pk_test_...'}`}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        Secret Key
                                    </label>
                                    <input
                                        type="password"
                                        value={settings.paymentGatewaySecret}
                                        onChange={(e) => setSettings({ ...settings, paymentGatewaySecret: e.target.value })}
                                        className="input"
                                        placeholder="••••••••••••••••"
                                    />
                                </div>
                            </div>

                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.875rem', color: '#d97706', display: 'flex', gap: '8px' }}>
                                <span>⚠️</span>
                                <div>
                                    Ensuring your payment gateway credentials are correct is your responsibility.
                                    Incorrect keys will result in failed transactions on your customer app.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button onClick={handleReset} className="btn btn-ghost">
                            Reset to Default
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-primary"
                            style={{ minWidth: '150px' }}
                        >
                            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
