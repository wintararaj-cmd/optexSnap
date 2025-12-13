import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all orders or user-specific orders
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');

        let queryText = `
            SELECT o.*, dl.location_name as delivery_location_name 
            FROM orders o
            LEFT JOIN delivery_locations dl ON o.delivery_location_id = dl.id
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramCount = 1;

        if (userId) {
            queryText += ` AND o.user_id = $${paramCount}`;
            params.push(userId);
            paramCount++;
        }

        if (status) {
            queryText += ` AND o.order_status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        queryText += ' ORDER BY o.created_at DESC';

        const result = await query(queryText, params);

        return NextResponse.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}

// POST create new order
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            user_id,
            customer_name,
            customer_phone,
            customer_address,
            order_type,
            items,
            subtotal,
            tax,
            discount,
            delivery_location_id,
            delivery_charge,
            total_amount,
            payment_method,

            notes,
            table_number,
            order_status,
            payment_status,
        } = body;

        // Validate required fields
        if (!items || !total_amount || !payment_method) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // For delivery orders, customer details and address are required
        if (order_type === 'delivery') {
            if (!customer_name || !customer_phone) {
                return NextResponse.json(
                    { success: false, error: 'Customer name and phone are required for delivery orders' },
                    { status: 400 }
                );
            }
            if (!customer_address) {
                return NextResponse.json(
                    { success: false, error: 'Address is required for delivery orders' },
                    { status: 400 }
                );
            }
        }

        const result = await query(
            `INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, order_type, items, subtotal, tax, discount, delivery_location_id, delivery_charge, total_amount, payment_method, notes, table_number, order_status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
            [
                user_id || null,
                customer_name || 'Walk-in Customer',
                customer_phone || 'N/A',
                customer_address || null,
                order_type || 'delivery',
                JSON.stringify(items),
                subtotal,
                tax || 0,
                discount || 0,
                delivery_location_id || null,
                delivery_charge || 0,
                total_amount,
                payment_method,
                notes || null,
                table_number || null,
                order_status || 'pending',
                payment_status || 'pending',
            ]
        );

        // Auto-generate invoice
        const order = result.rows[0];
        const invoiceDate = new Date().toISOString().split('T')[0].replace(/-/g, '');

        // Get count of invoices created today for sequential numbering
        const invoiceCountResult = await query(
            `SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE $1`,
            [`INV-${invoiceDate}-%`]
        );
        const invoiceCount = parseInt(invoiceCountResult.rows[0].count) + 1;
        const invoiceNumber = `INV-${invoiceDate}-${String(invoiceCount).padStart(4, '0')}`;

        await query(
            `INSERT INTO invoices (order_id, invoice_number, subtotal, tax, discount, total)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [order.id, invoiceNumber, subtotal, tax || 0, discount || 0, total_amount]
        );

        return NextResponse.json({
            success: true,
            data: { ...order, invoice_number: invoiceNumber },
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create order' },
            { status: 500 }
        );
    }
}
