'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Restaurant {
    id: number;
    restaurant_name: string;
    owner_name: string;
    email: string;
    phone: string;
    plan_type: 'silver' | 'gold' | 'platinum';
    created_at: string;
    subscription_expiry: string;
    status: 'active' | 'inactive' | 'suspended';
    total_orders: string;
}

export default function SuperAdminDashboard() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('superAdminToken');
        if (!token) {
            router.push('/superadmin');
            return;
        }

        fetch('/api/superadmin/restaurants')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setRestaurants(data.data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const logout = () => {
        localStorage.removeItem('superAdminToken');
        router.push('/superadmin');
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Loading Dashboard...
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: "'Inter', sans-serif" }}>
            {/* Top Bar */}
            <div style={{
                height: '70px',
                background: 'rgba(30, 41, 59, 0.5)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 32px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #4f46e5, #9333ea)', borderRadius: '8px' }}></div>
                    <span style={{ fontWeight: '700', fontSize: '18px' }}>OptexSnap <span style={{ opacity: 0.5, fontWeight: '400' }}>SuperAdmin</span></span>
                </div>
                <button
                    onClick={logout}
                    style={{
                        padding: '8px 16px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Logout
                </button>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Registered Restaurants</h1>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ padding: '24px', background: '#1e293b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', minWidth: '200px' }}>
                            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>Total Clients</div>
                            <div style={{ fontSize: '32px', fontWeight: '700' }}>{restaurants.length}</div>
                        </div>
                        <div style={{ padding: '24px', background: '#1e293b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', minWidth: '200px' }}>
                            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>Active Revenue (Est)</div>
                            <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
                                ₹{restaurants.reduce((acc, r) => acc + (r.plan_type === 'platinum' ? 7900 : r.plan_type === 'gold' ? 4300 : 2500), 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.2)', color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '20px 24px', fontWeight: '600' }}>Restaurant</th>
                                <th style={{ padding: '20px 24px', fontWeight: '600' }}>Contact</th>
                                <th style={{ padding: '20px 24px', fontWeight: '600' }}>Plan</th>
                                <th style={{ padding: '20px 24px', fontWeight: '600' }}>Joined</th>
                                <th style={{ padding: '20px 24px', fontWeight: '600' }}>Renews On</th>
                                <th style={{ padding: '20px 24px', fontWeight: '600' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {restaurants.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: '600', color: 'white' }}>{r.restaurant_name}</div>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>Owned by {r.owner_name}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontSize: '14px', color: '#e2e8f0' }}>{r.email}</div>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>{r.phone}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '999px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            textTransform: 'capitalize',
                                            background: r.plan_type === 'platinum' ? 'rgba(147, 51, 234, 0.2)' : r.plan_type === 'gold' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                                            color: r.plan_type === 'platinum' ? '#c084fc' : r.plan_type === 'gold' ? '#facc15' : '#cbd5e1',
                                            border: `1px solid ${r.plan_type === 'platinum' ? 'rgba(147, 51, 234, 0.3)' : r.plan_type === 'gold' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`
                                        }}>
                                            {r.plan_type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 24px', color: '#cbd5e1', fontSize: '14px' }}>
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '20px 24px', fontSize: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: '#fff' }}>
                                                {r.subscription_expiry ? new Date(r.subscription_expiry).toLocaleDateString() : 'Lifetime'}
                                            </span>
                                            {r.subscription_expiry && new Date(r.subscription_expiry) < new Date(new Date().setMonth(new Date().getMonth() + 1)) && (
                                                <span title="Expiring soon" style={{ fontSize: '16px' }}>⚠️</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <span style={{
                                            color: r.status === 'active' ? '#4ade80' : '#f87171',
                                            fontWeight: '500',
                                            fontSize: '14px'
                                        }}>
                                            ● {r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Active'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
