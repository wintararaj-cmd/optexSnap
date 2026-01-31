'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function SaaS_LandingPage() {
    // FAQ State
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <main style={{
            minHeight: '100vh',
            fontFamily: "'Inter', sans-serif",
            backgroundColor: '#050507',
            color: '#ffffff',
            overflowX: 'hidden'
        }}>
            {/* Navbar */}
            <nav style={{
                position: 'fixed',
                top: 0,
                width: '100%',
                background: 'rgba(5, 5, 7, 0.8)',
                backdropFilter: 'blur(12px)',
                zIndex: 1000,
                borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 24px',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            fontSize: '24px',
                            fontWeight: '800',
                            background: 'linear-gradient(to right, #4f46e5, #9333ea)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            OptexSnap
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }} className="nav-links">
                        <Link href="#features" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '15px', fontWeight: '500', transition: 'color 0.2s' }}>Features</Link>
                        <Link href="#pricing" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '15px', fontWeight: '500', transition: 'color 0.2s' }}>Pricing</Link>
                        <Link href="#faq" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '15px', fontWeight: '500', transition: 'color 0.2s' }}>FAQ</Link>
                        <Link href="/login" style={{ color: '#fff', textDecoration: 'none', fontSize: '15px', fontWeight: '500' }}>Login</Link>
                        <Link href="/register?plan=platinum" style={{
                            padding: '10px 24px',
                            background: '#4f46e5',
                            color: 'white',
                            borderRadius: '9999px',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)'
                        }} className="hover-btn">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{ paddingTop: '160px', paddingBottom: '100px', position: 'relative' }}>
                {/* Background Glows */}
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '1000px',
                    height: '500px',
                    background: 'radial-gradient(circle at center, rgba(79, 70, 229, 0.15) 0%, transparent 70%)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }} />

                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        background: 'rgba(79, 70, 229, 0.1)',
                        border: '1px solid rgba(79, 70, 229, 0.2)',
                        borderRadius: '9999px',
                        marginBottom: '32px'
                    }}>
                        <span style={{ color: '#818cf8', fontSize: '14px', fontWeight: '600' }}>✨ V2.0 is now live</span>
                    </div>

                    <h1 style={{
                        fontSize: '64px',
                        lineHeight: '1.1',
                        fontWeight: '800',
                        letterSpacing: '-0.02em',
                        marginBottom: '32px',
                        background: 'linear-gradient(to bottom, #ffffff, #94a3b8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        The Operating System for <br />
                        <span style={{ color: '#4f46e5', WebkitTextFillColor: '#6366f1' }}>Modern Restaurants</span>
                    </h1>

                    <p style={{
                        fontSize: '20px',
                        lineHeight: '1.6',
                        color: '#94a3b8',
                        maxWidth: '640px',
                        margin: '0 auto 48px'
                    }}>
                        Streamline orders, manage staff, and boost sales with OptexSnap.
                        The all-in-one, fully mobile-compatible platform designed for growth.
                    </p>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '80px' }}>
                        <Link href="#pricing" style={{
                            padding: '16px 40px',
                            background: '#4f46e5',
                            color: 'white',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            fontSize: '18px',
                            fontWeight: '600',
                            boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)'
                        }} className="hover-scale">
                            Start Free Trial
                        </Link>
                        <Link href="/restaurant" style={{
                            padding: '16px 40px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            fontSize: '18px',
                            fontWeight: '600'
                        }} className="hover-scale">
                            Live Demo
                        </Link>
                    </div>

                    {/* Dashboard Preview */}
                    <div style={{
                        position: 'relative',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(20, 20, 24, 0.6)',
                        padding: '12px',
                        boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.7)'
                    }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: '#0f172a',
                            borderRadius: '16px',
                            display: 'flex',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)'
                        }}>
                            {/* Mock Sidebar */}
                            <div style={{ width: '150px', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(0,0,0,0.2)' }}>
                                <div style={{ height: '12px', width: '80%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', opacity: i === 1 ? 1 : 0.5 }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: i === 1 ? '#4f46e5' : 'rgba(255,255,255,0.1)' }} />
                                            <div style={{ height: '8px', width: '60%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Mock Main Content */}
                            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ height: '24px', width: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                                    </div>
                                </div>

                                {/* Stats Cards */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    {[{ label: 'Total Revenue', val: '$12,450', color: '#10b981' }, { label: 'Active Orders', val: '24', color: '#f59e0b' }, { label: 'Total Customers', val: '1,205', color: '#3b82f6' }].map((stat, i) => (
                                        <div key={i} style={{ padding: '16px', background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>{stat.label}</div>
                                            <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>{stat.val}</div>
                                            <div style={{ marginTop: '8px', height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: '70%', height: '100%', background: stat.color }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Mock Chart & List */}
                                <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                                    {/* Chart */}
                                    <div style={{ flex: 2, background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
                                        {[40, 70, 45, 90, 60, 75, 50, 80, 55, 95].map((h, i) => (
                                            <div key={i} style={{
                                                width: '100%',
                                                height: `${h}%`,
                                                background: 'linear-gradient(to top, #4f46e5, #818cf8)',
                                                borderRadius: '4px 4px 0 0',
                                                opacity: 0.8
                                            }} />
                                        ))}
                                    </div>
                                    {/* List */}
                                    <div style={{ flex: 1, background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ height: '8px', width: '80%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '4px' }} />
                                                    <div style={{ height: '6px', width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" style={{ padding: '120px 0', background: '#08080a' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '24px' }}>Everything you need</h2>
                        <p style={{ fontSize: '20px', color: '#94a3b8' }}>From POS to Delivery Management, we've got you covered.</p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '32px'
                    }}>
                        {[
                            { icon: '⚡', title: 'Lightning Fast POS', desc: 'Process orders in seconds with our optimized Point of Sale system designed for high-volume environments.' },
                            { icon: '📲', title: 'Mobile Billing & POS', desc: 'Complete mobile compatibility. Bill customers and accept payments directly from any smartphone or tablet.' },
                            { icon: '📱', title: 'Digital Menu & QR', desc: 'Contactless ordering with beautiful digital menus. Update prices and items instantly.' },
                            { icon: '🛵', title: 'Delivery Management', desc: 'Track drivers in real-time and manage your own delivery fleet efficiently.' },
                            { icon: '📈', title: 'Advanced Analytics', desc: 'Deep insights into your sales, best-selling items, and staff performance.' },
                            { icon: '👥', title: 'Staff Roles', desc: 'Granular permissions for Admins, Managers, Waiters, and Delivery Staff.' },
                            { icon: '💳', title: 'Integrated Payments', desc: 'Accept credit cards, UPI, and digital wallets directly through the platform.' }
                        ].map((feature, idx) => (
                            <div key={idx} style={{
                                padding: '40px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '24px',
                                transition: 'transform 0.2s',
                            }} className="feature-card">
                                <div style={{ fontSize: '40px', marginBottom: '24px' }}>{feature.icon}</div>
                                <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>{feature.title}</h3>
                                <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#94a3b8' }}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" style={{ padding: '120px 0', position: 'relative' }}>
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    right: '0',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.1) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />

                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '24px' }}>Transparent Pricing</h2>
                        <p style={{ fontSize: '20px', color: '#94a3b8' }}>Choose the plan that fits your business scale.</p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '32px',
                        alignItems: 'center'
                    }}>
                        {/* Silver */}
                        <div style={{
                            padding: '40px',
                            background: '#0a0a0c',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '32px',
                        }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Silver</h3>
                            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '32px' }}>For small cafes & QSRs</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '32px' }}>
                                <span style={{ fontSize: '48px', fontWeight: '800' }}>₹2,500</span>
                                <span style={{ color: '#94a3b8', marginLeft: '8px' }}>/yr</span>
                            </div>
                            <Link href="/register?plan=silver" style={{
                                display: 'block',
                                width: '100%',
                                padding: '16px',
                                textAlign: 'center',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                borderRadius: '16px',
                                textDecoration: 'none',
                                fontWeight: '600',
                                marginBottom: '40px'
                            }} className="hover-btn-outline">
                                Choose Silver
                            </Link>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {['Admin Dashboard', 'Menu Management', 'Basic POS', 'Sales Reports'].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', color: '#e2e8f0' }}>
                                        <span style={{ color: '#4ade80', marginRight: '12px' }}>✓</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Gold */}
                        <div style={{
                            padding: '48px 40px',
                            background: '#131318',
                            border: '2px solid #4f46e5',
                            borderRadius: '32px',
                            position: 'relative',
                            transform: 'scale(1.05)'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '-14px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#4f46e5',
                                color: 'white',
                                padding: '6px 16px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: '700',
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase'
                            }}>Most Popular</div>
                            <h3 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Gold</h3>
                            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '32px' }}>For growing restaurants</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '32px' }}>
                                <span style={{ fontSize: '56px', fontWeight: '800' }}>₹4,300</span>
                                <span style={{ color: '#94a3b8', marginLeft: '8px' }}>/yr</span>
                            </div>
                            <Link href="/register?plan=gold" style={{
                                display: 'block',
                                width: '100%',
                                padding: '18px',
                                textAlign: 'center',
                                background: '#4f46e5',
                                color: 'white',
                                borderRadius: '16px',
                                textDecoration: 'none',
                                fontWeight: '600',
                                marginBottom: '40px',
                                boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)'
                            }} className="hover-scale">
                                Choose Gold
                            </Link>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {['Everything in Silver', 'Salesman App', 'Table Management', 'KDS', 'Waiter Features'].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', color: '#fff' }}>
                                        <span style={{ color: '#4f46e5', marginRight: '12px' }}>✓</span> <b>{item}</b>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Platinum */}
                        <div style={{
                            padding: '40px',
                            background: '#0a0a0c',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '32px',
                        }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Platinum</h3>
                            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '32px' }}>For chains & fleets</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '32px' }}>
                                <span style={{ fontSize: '48px', fontWeight: '800' }}>₹7,900</span>
                                <span style={{ color: '#94a3b8', marginLeft: '8px' }}>/yr</span>
                            </div>
                            <Link href="/register?plan=platinum" style={{
                                display: 'block',
                                width: '100%',
                                padding: '16px',
                                textAlign: 'center',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                borderRadius: '16px',
                                textDecoration: 'none',
                                fontWeight: '600',
                                marginBottom: '40px'
                            }} className="hover-btn-outline">
                                Choose Platinum
                            </Link>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {['Everything in Gold', 'Delivery Boy App', 'Fleet Tracking', 'Multi-Branch', 'Priority Support'].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', color: '#e2e8f0' }}>
                                        <span style={{ color: '#9333ea', marginRight: '12px' }}>✓</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ background: '#030304', padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '16px', display: 'block' }}>OptexSnap</span>
                        <p style={{ color: '#94a3b8', maxWidth: '300px', lineHeight: '1.6' }}>Empowering restaurants with next-generation technology. Scale your business with the most reliable restaurant OS.</p>
                    </div>
                    <div>
                        <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '24px' }}>Product</h4>
                        <ul style={{ listStyle: 'none', padding: 0, color: '#94a3b8', display: 'grid', gap: '12px' }}>
                            <li><Link href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</Link></li>
                            <li><Link href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</Link></li>
                            <li><Link href="/restaurant" style={{ color: 'inherit', textDecoration: 'none' }}>Live Demo</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '24px' }}>Legal</h4>
                        <ul style={{ listStyle: 'none', padding: 0, color: '#94a3b8', display: 'grid', gap: '12px' }}>
                            <li><Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link></li>
                            <li><Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link></li>
                            <li><Link href="/help" style={{ color: 'inherit', textDecoration: 'none' }}>Help</Link></li>
                        </ul>
                    </div>
                </div>
            </footer>

            {/* Global Hover Effects */}
            <style jsx global>{`
                html, body {
                    scroll-behavior: smooth;
                    background: #050507 !important;
                }
                .hover-scale { transition: transform 0.2s; }
                .hover-scale:hover { transform: scale(1.05); }
                .hover-btn-outline { transition: all 0.2s; }
                .hover-btn-outline:hover { background: rgba(255,255,255,0.1) !important; border-color: white !important; }
                .feature-card:hover { border-color: rgba(79, 70, 229, 0.4) !important; transform: translateY(-5px) !important; }
            `}</style>
        </main>
    );
}
