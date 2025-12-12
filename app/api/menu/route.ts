import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all menu items
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const available = searchParams.get('available');

        let queryText = `
            SELECT DISTINCT ON (m.id)
                m.id, 
                m.name, 
                m.description, 
                m.category_id, 
                c.name as category_name,
                m.price, 
                m.gst_rate,
                m.image_type, 
                m.available, 
                m.created_at, 
                m.updated_at,
                i.id as image_id
            FROM menu_items m
            LEFT JOIN categories c ON m.category_id = c.id
            LEFT JOIN images i ON m.image_data = i.image_data AND m.image_type = i.image_type
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramCount = 1;

        if (category) {
            queryText += ` AND m.category_id = $${paramCount}`;
            params.push(parseInt(category));
            paramCount++;
        }

        if (available !== null && available !== undefined) {
            queryText += ` AND m.available = $${paramCount}`;
            params.push(available === 'true');
            paramCount++;
        }

        queryText += ' ORDER BY m.id, c.sort_order, c.name, m.name, i.id DESC';

        const result = await query(queryText, params);

        return NextResponse.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch menu items' },
            { status: 500 }
        );
    }
}

// POST create new menu item (admin only)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, category_id, price, gst_rate, image_id, image_type, available } = body;

        if (!name || !category_id || !price) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate category_id exists
        const categoryCheck = await query(
            'SELECT id FROM categories WHERE id = $1',
            [category_id]
        );
        if (categoryCheck.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid category_id' },
                { status: 400 }
            );
        }

        // If image_id is provided, fetch the image data from images table
        let imageData = null;
        let imageType = image_type || null;

        if (image_id) {
            const imageResult = await query(
                'SELECT image_data, image_type FROM images WHERE id = $1',
                [image_id]
            );
            if (imageResult.rows.length > 0) {
                imageData = imageResult.rows[0].image_data;
                imageType = imageResult.rows[0].image_type;
            }
        }

        const result = await query(
            `INSERT INTO menu_items (name, description, category_id, price, gst_rate, image_data, image_type, available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, description, category_id, price, gst_rate, image_type, available, created_at, updated_at`,
            [name, description, category_id, price, gst_rate || 5, imageData, imageType, available ?? true]
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Error creating menu item:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create menu item' },
            { status: 500 }
        );
    }
}
