// Script to delete all financial data (orders, invoices, expenses)
// This will preserve menu items, categories, users, and settings
// Run with: node scripts/delete_financial_data.js

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'restaurant_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

async function deleteFinancialData() {
    const client = await pool.connect();

    try {
        console.log('🗑️  Starting financial data deletion...\n');
        console.log('⚠️  WARNING: This will delete:');
        console.log('   - All orders');
        console.log('   - All invoices');
        console.log('   - All expenses (if exists)');
        console.log('   - All payouts (if exists)');
        console.log('\n✅ This will PRESERVE:');
        console.log('   - Menu items');
        console.log('   - Categories');
        console.log('   - Users (customers, admin, staff)');
        console.log('   - Delivery locations');
        console.log('   - Settings');
        console.log('\n');

        // Start transaction
        await client.query('BEGIN');

        // Count records before deletion
        const ordersCount = await client.query('SELECT COUNT(*) FROM orders');
        const invoicesCount = await client.query('SELECT COUNT(*) FROM invoices');

        let expensesCount = { rows: [{ count: 0 }] };
        let payoutsCount = { rows: [{ count: 0 }] };

        // Check if expenses table exists
        const expensesTableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'expenses'
            );
        `);

        if (expensesTableExists.rows[0].exists) {
            expensesCount = await client.query('SELECT COUNT(*) FROM expenses');
        }

        // Check if payouts table exists
        const payoutsTableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'payouts'
            );
        `);

        if (payoutsTableExists.rows[0].exists) {
            payoutsCount = await client.query('SELECT COUNT(*) FROM payouts');
        }

        console.log('📊 Current data:');
        console.log(`   Orders: ${ordersCount.rows[0].count}`);
        console.log(`   Invoices: ${invoicesCount.rows[0].count}`);
        console.log(`   Expenses: ${expensesCount.rows[0].count}`);
        console.log(`   Payouts: ${payoutsCount.rows[0].count}`);
        console.log('\n');

        // Delete financial data
        console.log('🗑️  Deleting invoices...');
        const deletedInvoices = await client.query('DELETE FROM invoices');
        console.log(`   ✅ Deleted ${deletedInvoices.rowCount} invoices`);

        console.log('🗑️  Deleting orders...');
        const deletedOrders = await client.query('DELETE FROM orders');
        console.log(`   ✅ Deleted ${deletedOrders.rowCount} orders`);

        if (expensesTableExists.rows[0].exists) {
            console.log('🗑️  Deleting expenses...');
            const deletedExpenses = await client.query('DELETE FROM expenses');
            console.log(`   ✅ Deleted ${deletedExpenses.rowCount} expenses`);
        }

        if (payoutsTableExists.rows[0].exists) {
            console.log('🗑️  Deleting payouts...');
            const deletedPayouts = await client.query('DELETE FROM payouts');
            console.log(`   ✅ Deleted ${deletedPayouts.rowCount} payouts`);
        }

        // Reset sequences (auto-increment IDs)
        console.log('\n🔄 Resetting ID sequences...');
        await client.query('ALTER SEQUENCE orders_id_seq RESTART WITH 1');
        console.log('   ✅ Orders ID sequence reset');

        await client.query('ALTER SEQUENCE invoices_id_seq RESTART WITH 1');
        console.log('   ✅ Invoices ID sequence reset');

        if (expensesTableExists.rows[0].exists) {
            await client.query('ALTER SEQUENCE expenses_id_seq RESTART WITH 1');
            console.log('   ✅ Expenses ID sequence reset');
        }

        if (payoutsTableExists.rows[0].exists) {
            await client.query('ALTER SEQUENCE payouts_id_seq RESTART WITH 1');
            console.log('   ✅ Payouts ID sequence reset');
        }

        // Commit transaction
        await client.query('COMMIT');

        console.log('\n✅ Financial data deletion completed successfully!');
        console.log('\n📊 Verification:');

        const finalOrdersCount = await client.query('SELECT COUNT(*) FROM orders');
        const finalInvoicesCount = await client.query('SELECT COUNT(*) FROM invoices');

        console.log(`   Orders remaining: ${finalOrdersCount.rows[0].count}`);
        console.log(`   Invoices remaining: ${finalInvoicesCount.rows[0].count}`);

        // Verify preserved data
        const menuItemsCount = await client.query('SELECT COUNT(*) FROM menu_items');
        const categoriesCount = await client.query('SELECT COUNT(*) FROM categories');
        const usersCount = await client.query('SELECT COUNT(*) FROM users');

        console.log('\n✅ Preserved data:');
        console.log(`   Menu items: ${menuItemsCount.rows[0].count}`);
        console.log(`   Categories: ${categoriesCount.rows[0].count}`);
        console.log(`   Users: ${usersCount.rows[0].count}`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error deleting financial data:', error.message);
        console.error('   Transaction rolled back. No data was deleted.');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the deletion
deleteFinancialData()
    .then(() => {
        console.log('\n🎉 Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Failed:', error.message);
        process.exit(1);
    });
