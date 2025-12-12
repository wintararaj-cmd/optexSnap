
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { delivery_boy_id, amount, notes } = body;

        if (!delivery_boy_id || !amount) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create Payout Record
        const payoutRes = await query(
            'INSERT INTO payouts (delivery_boy_id, amount, notes) VALUES ($1, $2, $3) RETURNING id',
            [delivery_boy_id, amount, notes]
        );
        const payoutId = payoutRes.rows[0].id;

        // 2. Create Expense Record automatically
        // Assuming user 1 (Admin) is creating this expense for now, or just leave updated_by null if not strictly enforced
        await query(
            `INSERT INTO expenses (title, amount, category, date, description, payout_id) 
             VALUES ($1, $2, 'Staff Salary', CURRENT_DATE, $3, $4)`,
            [`Payout to Delivery Boy #${delivery_boy_id}`, amount, notes || 'Commission Payout', payoutId]
        );

        return NextResponse.json({ success: true, message: 'Payout recorded and expense created' });

    } catch (error) {
        console.error('Error creating payout:', error);
        return NextResponse.json({ success: false, error: 'Failed to process payout' }, { status: 500 });
    }
}

export async function GET() {
    try {
        // Report: Delivery Boy Wise Payable
        // Total Earned (Sum of order commissions) - Total Paid (Sum of payouts) = Due Amount

        const reportQuery = `
            SELECT 
                u.id, 
                u.name, 
                u.phone,
                u.commission_rate,
                u.commission_type,
                COALESCE(SUM(o.driver_commission), 0) as total_earned,
                COALESCE((SELECT SUM(amount) FROM payouts WHERE delivery_boy_id = u.id), 0) as total_paid
            FROM users u
            LEFT JOIN orders o ON u.id = o.delivery_boy_id AND o.order_status = 'delivered'
            WHERE u.role = 'delivery_boy'
            GROUP BY u.id
        `;

        const result = await query(reportQuery);

        const data = result.rows.map(row => ({
            ...row,
            due_amount: (parseFloat(row.total_earned) - parseFloat(row.total_paid)).toFixed(2)
        }));

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error('Error fetching payout report:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch report' }, { status: 500 });
    }
}
