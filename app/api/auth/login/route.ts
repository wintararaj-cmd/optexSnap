import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Hardcoded Demo User
        if (email === 'demo@optexsnap.com' && password === 'demo123') {
            const user = {
                id: 99999,
                name: 'Demo Admin',
                email: 'demo@optexsnap.com',
                role: 'admin',
                plan: 'platinum'
            };
            const token = Buffer.from(`demo-token-${Date.now()}`).toString('base64');

            return NextResponse.json({
                success: true,
                data: { user, token }
            });
        }

        // Check database for user
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const user = result.rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Remove password hash from response
        delete user.password_hash;

        // Fetch Current Plan
        const settingsRes = await query("SELECT value FROM settings WHERE key = 'current_plan'");
        const plan = settingsRes.rows.length > 0 ? settingsRes.rows[0].value : 'platinum'; // Default to platinum if not set

        user.plan = plan;

        // Generate a simple session token
        const token = Buffer.from(`${user.id}-${user.email}-${Date.now()}`).toString('base64');

        return NextResponse.json({
            success: true,
            data: {
                user,
                token,
            },
        });

    } catch (error) {
        console.error('Error during login:', error);
        return NextResponse.json(
            { success: false, error: 'Login failed' },
            { status: 500 }
        );
    }
}
