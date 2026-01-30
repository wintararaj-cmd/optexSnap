import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { restaurantName, adminName, email, password, plan, payment } = body;

        // Basic Validation
        if (!restaurantName || !adminName || !email || !password || !plan) {
            return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
        }

        const validPlans = ['silver', 'gold', 'platinum'];
        if (!validPlans.includes(plan)) {
            return NextResponse.json({ success: false, error: 'Invalid plan selected' }, { status: 400 });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 1. Update Restaurant Settings
        await query(
            `INSERT INTO settings (key, value, description) 
             VALUES 
                ('restaurant_name', $1, 'Name of the restaurant'),
                ('current_plan', $2, 'Subscription Plan')
             ON CONFLICT (key) DO UPDATE 
             SET value = EXCLUDED.value`,
            [restaurantName, plan]
        );

        // Also update email in setting
        await query(
            `INSERT INTO settings (key, value, description) 
             VALUES ('restaurant_email', $1, 'Email address')
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
            [email]
        );

        // 2. Update/Create Admin User
        // Check if admin user exists (role='admin')
        const existingAdmin = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");

        let userId;

        if (existingAdmin.rows.length > 0) {
            // Update existing admin
            const updatedUser = await query(
                `UPDATE users 
                 SET name = $1, email = $2, password_hash = $3
                 WHERE role = 'admin' 
                 RETURNING id`,
                [adminName, email, hashedPassword]
            );
            userId = updatedUser.rows[0].id;
        } else {
            // Create new admin
            const newUser = await query(
                `INSERT INTO users (name, email, password_hash, role) 
                 VALUES ($1, $2, $3, 'admin') 
                 RETURNING id`,
                [adminName, email, hashedPassword]
            );
            userId = newUser.rows[0].id;
        }

        return NextResponse.json({
            success: true,
            message: 'Account setup successful',
            data: { userId }
        });

    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
    }
}
