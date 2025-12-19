import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all expenses
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const category = searchParams.get('category');

        let sql = `
            SELECT e.*, i.id as image_id 
            FROM expenses e
            LEFT JOIN images i ON e.receipt_image_id = i.id
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (startDate) {
            sql += ` AND e.date >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            sql += ` AND e.date <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        if (category && category !== 'All') {
            sql += ` AND e.category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        sql += ' ORDER BY e.date DESC, e.created_at DESC';

        const result = await query(sql, params);

        return NextResponse.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch expenses' },
            { status: 500 }
        );
    }
}

// POST create new expense
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { description, amount, category, date, payment_method, notes, image_id } = body;

        if (!description || amount === undefined || amount === null || !category || !date) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await query(
            `INSERT INTO expenses (description, amount, category, expense_date, payment_method, notes, receipt_image_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [description, amount, category, date, payment_method, notes, image_id || null]
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error: any) {
        console.error('Error creating expense:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create expense',
                details: error.message
            },
            { status: 500 }
        );
    }
}
