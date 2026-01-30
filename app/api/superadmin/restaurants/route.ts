import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const result = await query(`
            SELECT 
                r.id, 
                r.restaurant_name, 
                r.owner_name, 
                r.email, 
                r.phone, 
                r.plan_type, 
                r.created_at,
                r.subscription_expiry,
                r.status,
                (SELECT COUNT(*) FROM orders o WHERE o.restaurant_id = r.id) as total_orders
            FROM restaurants r
            ORDER BY r.created_at DESC
        `);

        return NextResponse.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Super Admin Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch restaurants' }, { status: 500 });
    }
}
