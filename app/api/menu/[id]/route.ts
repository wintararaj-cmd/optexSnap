import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET single menu item
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const result = await query(
            `SELECT DISTINCT ON (m.id)
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
            WHERE m.id = $1
            ORDER BY m.id, i.id DESC`,
            [params.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Menu item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Error fetching menu item:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch menu item' },
            { status: 500 }
        );
    }
}

// PUT update menu item (admin only)
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { name, description, category_id, price, gst_rate, image_data, image_type, available } = body;

        // Validate category_id if provided
        if (category_id !== undefined && category_id !== null) {
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
        }

        // Handle image data if provided (base64 -> buffer)
        let imageBuffer = undefined; // undefined means "do not update" in COALESCE, null means "set to null"? No, COALESCE(undefined, old) works. 
        // Wait, COALESCE($6, image_data) implies if $6 is null, keep old.
        // If user wants to DELETE image, they might send null. 
        // But usually in this form, if image_data is provided, we update it.
        // If not provided (undefined), we keep old.

        if (image_data && typeof image_data === 'string') {
            const base64Data = image_data.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else if (image_data === null) {
            // Explicit null to remove image? 
            imageBuffer = null;
            // Note: COALESCE($6, image_data) will ignore null if we pass null!
            // So if we want to delete, we need logic. 
            // For now, let's assume if image_data is sent, it's a new image. If undefined, ignore.
        }

        // If imageBuffer is undefined, we pass null to parameter? No, passing undefined to pg might be error.
        // We should handle the SQL dynamically or pass a value that COALESCE treats as "skip".
        // In PG, COALESCE(NULL, col) returns col. So passing NULL skips update.
        // So imageBuffer = null by default is correct for "skip".

        // However, if we actually want to update it to new image, `imageBuffer` will be a Buffer.
        // If we want to strictly keep logic simple:
        const bufferToUse = imageBuffer !== undefined ? imageBuffer : null;
        // Wait, if imageBuffer is Buffer, that's fine. If it's null (default), COALESCE sees NULL and keeps old value.

        // What if user wants to delete image? We don't have that feature yet in UI.

        const result = await query(
            `UPDATE menu_items 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category_id = COALESCE($3, category_id),
           price = COALESCE($4, price),
           gst_rate = COALESCE($5, gst_rate),
           image_data = COALESCE($6, image_data),
           image_type = COALESCE($7, image_type),
           available = COALESCE($8, available),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING id, name, description, category_id, price, gst_rate, image_type, available, created_at, updated_at`,
            [name, description, category_id, price, gst_rate, imageBuffer === undefined ? null : imageBuffer, image_type, available, params.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Menu item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Error updating menu item:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update menu item' },
            { status: 500 }
        );
    }
}

// DELETE menu item (admin only)
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const result = await query(
            'DELETE FROM menu_items WHERE id = $1 RETURNING id',
            [params.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Menu item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Menu item deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete menu item' },
            { status: 500 }
        );
    }
}
