import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET single order
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const result = await query(
            'SELECT * FROM orders WHERE id = $1',
            [params.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch order' },
            { status: 500 }
        );
    }
}

// PUT update order status (admin only)
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { order_status, payment_status, delivery_boy_id } = body;

        let driverCommission = null;

        // If status is changing to 'delivered', calculate commission
        if (order_status === 'delivered') {
            // First get the order details to know the total amount and assigned delivery boy
            const orderRes = await query('SELECT total_amount, delivery_boy_id FROM orders WHERE id = $1', [params.id]);
            if (orderRes.rows.length > 0) {
                const order = orderRes.rows[0];
                const dbId = delivery_boy_id || order.delivery_boy_id; // Use new ID if provided, else existing

                if (dbId) {
                    // Fetch delivery boy commission settings
                    const dbRes = await query('SELECT commission_rate, commission_type FROM users WHERE id = $1', [dbId]);
                    if (dbRes.rows.length > 0) {
                        const { commission_rate, commission_type } = dbRes.rows[0];
                        if (commission_type === 'percent') {
                            driverCommission = (parseFloat(order.total_amount) * parseFloat(commission_rate)) / 100;
                        } else {
                            driverCommission = parseFloat(commission_rate);
                        }
                    }
                }
            }
        }

        const result = await query(
            `UPDATE orders 
       SET order_status = COALESCE($1, order_status),
           payment_status = COALESCE($2, payment_status),
           delivery_boy_id = COALESCE($3, delivery_boy_id),
           driver_commission = COALESCE($4, driver_commission),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
            [order_status, payment_status, delivery_boy_id, driverCommission, params.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update order' },
            { status: 500 }
        );
    }
}
