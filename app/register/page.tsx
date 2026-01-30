'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function RegisterForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialPlan = searchParams.get('plan') || 'gold';

    const [formData, setFormData] = useState({
        restaurantName: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        plan: initialPlan,
        agreeToTerms: false
    });

    const [paymentData, setPaymentData] = useState({
        method: 'card', // 'card' or 'upi'
        cardName: '',
        cardNumber: '',
        expiry: '',
        cvc: '',
        upiId: ''
    });

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Update plan if URL changes
    useEffect(() => {
        const planFromUrl = searchParams.get('plan');
        if (planFromUrl && ['silver', 'gold', 'platinum'].includes(planFromUrl)) {
            setFormData(prev => ({ ...prev, plan: planFromUrl }));
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'cardNumber') {
            // Simple formatting for card number
            const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
            setPaymentData(prev => ({ ...prev, [name]: formatted }));
            return;
        }
        setPaymentData(prev => ({ ...prev, [name]: value }));
    };

    const handlePlanSelect = (plan: string) => {
        setFormData(prev => ({ ...prev, plan }));
        window.history.replaceState(null, '', `?plan=${plan}`);
    };

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 1) {
            if (!formData.restaurantName || !formData.name || !formData.email || !formData.password) {
                setError('Please fill in all account fields');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError("Passwords don't match");
                return;
            }
            if (formData.password.length < 6) {
                setError("Password must be at least 6 characters");
                return;
            }
            setError('');
            setStep(2);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.agreeToTerms) {
            setError("You must agree to the Terms of Service");
            return;
        }

        if (paymentData.method === 'card') {
            if (paymentData.cardNumber.length < 15 || !paymentData.cvc || !paymentData.expiry) {
                setError("Please enter valid card details");
                return;
            }
        } else {
            if (!paymentData.upiId || !paymentData.upiId.includes('@')) {
                setError("Please enter a valid UPI ID");
                return;
            }
        }

        setLoading(true);

        // Simulate Payment Delay
        await new Promise(r => setTimeout(r, 1500));

        try {
            const res = await fetch('/api/setup-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantName: formData.restaurantName,
                    adminName: formData.name,
                    email: formData.email,
                    password: formData.password,
                    plan: formData.plan,
                    payment: {
                        status: 'success',
                        method: paymentData.method,
                        last4: paymentData.method === 'card' ? paymentData.cardNumber.slice(-4) : 'UPI',
                        details: paymentData.method === 'card' ? 'Credit Card' : paymentData.upiId
                    }
                })
            });

            const data = await res.json();

            if (data.success) {
                alert('Payment Successful! Account created. Please login.');
                router.push('/login');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const plans = [
        { id: 'silver', name: 'Silver', price: '₹2,500', desc: 'Admin Only', features: ['Admin Dashboard', 'Basic Reporting'] },
        { id: 'gold', name: 'Gold', price: '₹4,300', desc: 'Growth', features: ['Admin + Salesman Apps', 'Table Management'] },
        { id: 'platinum', name: 'Platinum', price: '₹7,900', desc: 'Enterprise', features: ['Full Suite', 'Delivery Fleet Tracking'] }
    ];

    const currentPlanDetails = plans.find(p => p.id === formData.plan);

    return (
        <div style={{
            display: 'flex',
            width: '100%',
            maxWidth: '1200px',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            minHeight: '700px',
            flexDirection: 'row',
            alignItems: 'stretch'
        }} className="register-container">
            {/* Left Side: Plan Selection */}
            <div style={{
                flex: '0.8',
                background: '#0f172a',
                padding: '40px',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
            }} className="plan-panel">
                {/* Decorative Background */}
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 50%)',
                    pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 10 }}>
                    <Link href="/" style={{ fontSize: '24px', fontWeight: '800', color: 'white', textDecoration: 'none', display: 'block', marginBottom: '32px' }}>
                        OptexSnap
                    </Link>
                    <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px' }}>Select your plan</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Choose the perfect toolkit for your restaurant.</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {plans.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => handlePlanSelect(p.id)}
                                style={{
                                    padding: '20px',
                                    borderRadius: '16px',
                                    border: `2px solid ${formData.plan === p.id ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                                    background: formData.plan === p.id ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700', textTransform: 'capitalize' }}>{p.name}</h3>
                                    <span style={{ fontSize: '20px', fontWeight: '700' }}>{p.price}<span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '400' }}>/yr</span></span>
                                </div>
                                <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>{p.desc}</p>
                                <ul style={{ fontSize: '12px', color: '#cbd5e1', listStyle: 'none', padding: 0 }}>
                                    {p.features.map((f, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{ color: '#818cf8', marginRight: '8px' }}>✓</span>{f}
                                        </li>
                                    ))}
                                </ul>
                                {formData.plan === p.id && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '20px',
                                        right: '20px',
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: '#6366f1',
                                        boxShadow: '0 0 10px rgba(99,102,241,0.5)'
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 10, marginTop: '32px', fontSize: '12px', color: '#64748b' }}>
                    Need help deciding? Contact <a href="#" style={{ color: '#818cf8', textDecoration: 'underline' }}>Sales</a>
                </div>
            </div>

            {/* Right Side: Form */}
            <div style={{
                flex: '1.2',
                padding: '48px',
                background: '#ffffff',
                color: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }} className="form-panel">

                {/* Step Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: step >= 1 ? '#4f46e5' : '#e2e8f0', color: step >= 1 ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>1</div>
                    <div style={{ flex: 1, height: '2px', background: step >= 2 ? '#4f46e5' : '#e2e8f0' }}></div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: step >= 2 ? '#4f46e5' : '#e2e8f0', color: step >= 2 ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>2</div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                        {step === 1 ? 'Setup your account' : 'Billing Information'}
                    </h2>
                    <p style={{ color: '#64748b' }}>
                        {step === 1 ? 'Start your 14-day free trial.' : `Complete subscription for ${currentPlanDetails?.name} Plan.`}
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: '#fef2f2',
                        color: '#ef4444',
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        border: '1px solid #fee2e2',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px'
                    }}>
                        <span style={{ marginRight: '8px', fontSize: '18px' }}>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={step === 1 ? handleNext : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {step === 1 ? (
                        /* STEP 1: ACCOUNT DETAILS */
                        <>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: '6px' }}>Restaurant Name</label>
                                <input
                                    type="text"
                                    name="restaurantName"
                                    required
                                    style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', outline: 'none', transition: 'border 0.2s', color: '#0f172a' }}
                                    placeholder="e.g. Tasty Bites Bistro"
                                    value={formData.restaurantName}
                                    onChange={handleChange}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="grid-split">
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: '6px' }}>Owner Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', outline: 'none', color: '#0f172a' }}
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: '6px' }}>Work Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', outline: 'none', color: '#0f172a' }}
                                        placeholder="john@restaurant.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="grid-split">
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: '6px' }}>Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', outline: 'none', color: '#0f172a' }}
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: '6px' }}>Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        required
                                        style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', outline: 'none', color: '#0f172a' }}
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    background: '#4f46e5',
                                    color: 'white',
                                    fontWeight: '700',
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    marginTop: '8px',
                                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                                    transition: 'background 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                Continue to Payment <span>→</span>
                            </button>
                        </>
                    ) : (
                        /* STEP 2: PAYMENT DETAILS */
                        <>
                            {/* Payment Method Toggle */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <button
                                    type="button"
                                    onClick={() => setPaymentData(prev => ({ ...prev, method: 'card' }))}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: paymentData.method === 'card' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                                        background: paymentData.method === 'card' ? '#e0e7ff' : '#f8fafc',
                                        color: paymentData.method === 'card' ? '#4f46e5' : '#64748b',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    💳 Credit/Debit Card
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentData(prev => ({ ...prev, method: 'upi' }))}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: paymentData.method === 'upi' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                                        background: paymentData.method === 'upi' ? '#e0e7ff' : '#f8fafc',
                                        color: paymentData.method === 'upi' ? '#4f46e5' : '#64748b',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    📱 UPI
                                </button>
                            </div>

                            {paymentData.method === 'card' ? (
                                <>
                                    {/* Card Preview */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        color: 'white',
                                        marginBottom: '16px',
                                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>CREDIT CARD</div>
                                            <div>💳</div>
                                        </div>
                                        <div style={{ fontSize: '24px', letterSpacing: '2px', marginBottom: '20px', fontFamily: 'monospace' }}>
                                            {paymentData.cardNumber || '•••• •••• •••• ••••'}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontSize: '10px', opacity: 0.7 }}>CARD HOLDER</div>
                                                <div style={{ fontSize: '14px' }}>{paymentData.cardName || 'YOUR NAME'}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', opacity: 0.7 }}>EXPIRES</div>
                                                <div style={{ fontSize: '14px' }}>{paymentData.expiry || 'MM/YY'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: '6px' }}>Card Name</label>
                                        <input
                                            type="text"
                                            name="cardName"
                                            required
                                            style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', outline: 'none', color: '#0f172a' }}
                                            placeholder="Name on Card"
                                            value={paymentData.cardName}
                                            onChange={handlePaymentChange}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: '6px' }}>Card Number</label>
                                        <input
                                            type="text"
                                            name="cardNumber"
                                            maxLength={19}
                                            required
                                            style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', outline: 'none', color: '#0f172a', fontFamily: 'monospace' }}
                                            placeholder="0000 0000 0000 0000"
                                            value={paymentData.cardNumber}
                                            onChange={handlePaymentChange}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: '6px' }}>Expiry Date</label>
                                            <input
                                                type="text"
                                                name="expiry"
                                                placeholder="MM/YY"
                                                maxLength={5}
                                                required
                                                style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', outline: 'none', color: '#0f172a' }}
                                                value={paymentData.expiry}
                                                onChange={handlePaymentChange}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: '6px' }}>CVC</label>
                                            <input
                                                type="text"
                                                name="cvc"
                                                placeholder="123"
                                                maxLength={3}
                                                required
                                                style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', outline: 'none', color: '#0f172a' }}
                                                value={paymentData.cvc}
                                                onChange={handlePaymentChange}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* UPI Form */
                                <div style={{ padding: '20px 0' }}>
                                    <div style={{
                                        padding: '20px',
                                        background: '#f0f9ff',
                                        border: '1px solid #bae6fd',
                                        borderRadius: '12px',
                                        marginBottom: '20px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{ fontSize: '48px' }}>📱</div>
                                        <div style={{ textAlign: 'center', color: '#0369a1' }}>
                                            Scan QR Code or Enter UPI ID to pay <strong>{currentPlanDetails?.price}</strong> securely.
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: '6px' }}>UPI ID / VPA</label>
                                        <input
                                            type="text"
                                            name="upiId"
                                            required
                                            style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', outline: 'none', color: '#0f172a' }}
                                            placeholder="username@upi"
                                            value={paymentData.upiId}
                                            onChange={handlePaymentChange}
                                        />
                                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Examples: mobile@paytm, user@oksbi</p>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '8px' }}>
                                <input
                                    id="terms"
                                    name="agreeToTerms"
                                    type="checkbox"
                                    style={{ width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
                                    checked={formData.agreeToTerms}
                                    onChange={handleChange}
                                />
                                <label htmlFor="terms" style={{ marginLeft: '8px', fontSize: '14px', color: '#64748b' }}>
                                    I agree to the <a href="#" style={{ color: '#4f46e5', textDecoration: 'none' }}>Terms of Service</a> and <a href="#" style={{ color: '#4f46e5', textDecoration: 'none' }}>Privacy Policy</a>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    background: loading ? '#94a3b8' : '#4f46e5',
                                    color: 'white',
                                    fontWeight: '700',
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontSize: '16px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    marginTop: '8px',
                                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                                    transition: 'background 0.2s'
                                }}
                            >
                                {loading ? 'Processing Payment...' : `Pay ${currentPlanDetails?.price} & Create Account`}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', textAlign: 'center', marginTop: '10px' }}
                            >
                                ← Back to Details
                            </button>
                        </>
                    )}

                    {!loading && <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '16px' }}>
                        By clicking "Create Account", you agree to receive marketing updates.
                    </p>}
                </form>
            </div>

            <style jsx>{`
                @media (max-width: 1024px) {
                    .register-container {
                        flex-direction: column !important;
                        height: auto !important;
                        min-height: auto !important;
                    }
                    .plan-panel {
                        padding: 32px !important;
                    }
                    .form-panel {
                        padding: 32px !important;
                    }
                }
                @media (max-width: 640px) {
                    .grid-split {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Inter', sans-serif",
            background: '#f1f5f9',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background decoration */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '800px', height: '800px', background: 'rgba(224, 231, 255, 0.5)', borderRadius: '50%', filter: 'blur(120px)', transform: 'translate(30%, -30%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '600px', height: '600px', background: 'rgba(219, 234, 254, 0.5)', borderRadius: '50%', filter: 'blur(100px)', transform: 'translate(-30%, 30%)' }} />
            </div>

            <div style={{ position: 'relative', zIndex: 10, width: '100%', display: 'flex', justifyContent: 'center' }}>
                <Suspense fallback={<div style={{ color: '#64748b' }}>Loading registration...</div>}>
                    <RegisterForm />
                </Suspense>
            </div>
        </div>
    );
}
