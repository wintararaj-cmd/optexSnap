import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Fetch all delivery locations
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') === 'true';

        let queryText = 'SELECT * FROM delivery_locations';
        if (activeOnly) {
            queryText += ' WHERE is_active = true';
        }
        queryText += ' ORDER BY location_name ASC';

        const result = await query(queryText);

        return NextResponse.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Error fetching delivery locations:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch delivery locations' },
            { status: 500 }
        );
    }
}

// POST - Create a new delivery location
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { location_name, delivery_charge, is_active } = body;

        // Validation
        if (!location_name || location_name.trim() === '') {
            return NextResponse.json(
                { success: false, error: 'Location name is required' },
                { status: 400 }
            );
        }

        if (delivery_charge === undefined || delivery_charge === null || delivery_charge < 0) {
            return NextResponse.json(
                { success: false, error: 'Valid delivery charge is required' },
                { status: 400 }
            );
        }

        const result = await query(
            `INSERT INTO delivery_locations (location_name, delivery_charge, is_active) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [location_name.trim(), delivery_charge, is_active !== false]
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
            message: 'Delivery location created successfully',
        });
    } catch (error: any) {
        console.error('Error creating delivery location:', error);

        // Handle unique constraint violation
        if (error.code === '23505') {
            return NextResponse.json(
                { success: false, error: 'A location with this name already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to create delivery location' },
            { status: 500 }
        );
    }
}
