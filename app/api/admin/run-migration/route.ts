import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// This is a one-time migration endpoint
// Visit: /api/admin/run-migration to execute
export async function GET(request: Request) {
    try {
        console.log('🔄 Starting customer details optional migration...');

        // Step 1: Make customer_name nullable
        await query('ALTER TABLE orders ALTER COLUMN customer_name DROP NOT NULL');
        console.log('✅ customer_name is now nullable');

        // Step 2: Make customer_phone nullable
        await query('ALTER TABLE orders ALTER COLUMN customer_phone DROP NOT NULL');
        console.log('✅ customer_phone is now nullable');

        // Step 3: Update existing NULL values
        const result1 = await query(
            "UPDATE orders SET customer_name = 'Walk-in Customer' WHERE customer_name IS NULL OR customer_name = ''"
        );
        console.log(`✅ Updated ${result1.rowCount} rows for customer_name`);

        const result2 = await query(
            "UPDATE orders SET customer_phone = 'N/A' WHERE customer_phone IS NULL OR customer_phone = ''"
        );
        console.log(`✅ Updated ${result2.rowCount} rows for customer_phone`);

        // Verify the changes
        const verify = await query(`
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name IN ('customer_name', 'customer_phone')
        `);

        console.log('🎉 Migration completed successfully!');

        return NextResponse.json({
            success: true,
            message: 'Migration completed successfully!',
            changes: {
                customer_name_nullable: true,
                customer_phone_nullable: true,
                rows_updated_name: result1.rowCount,
                rows_updated_phone: result2.rowCount,
            },
            verification: verify.rows,
        });

    } catch (error: any) {
        console.error('❌ Migration failed:', error);

        // Check if columns are already nullable
        if (error.message?.includes('does not exist') || error.message?.includes('already')) {
            return NextResponse.json({
                success: true,
                message: 'Migration already applied or columns already nullable',
                error: error.message,
            });
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Migration failed',
                details: error.message,
            },
            { status: 500 }
        );
    }
}
