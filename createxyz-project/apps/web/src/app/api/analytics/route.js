import sql from "@/app/api/utils/sql";

// Get spending analytics and balance insights
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    // Get current balance (latest transaction balance)
    const latestTransaction = await sql`
      SELECT balance_after FROM transactions 
      WHERE balance_after IS NOT NULL 
      ORDER BY transaction_date DESC 
      LIMIT 1
    `;

    const currentBalance = latestTransaction[0]?.balance_after || 0;

    // Get user settings for thresholds
    const settings = await sql`
      SELECT * FROM user_settings ORDER BY id DESC LIMIT 1
    `;
    
    const lowBalanceThreshold = settings[0]?.low_balance_threshold || 100;
    const monthlyBudget = settings[0]?.monthly_budget || 1000;

    // Get spending by category for the period
    const categorySpending = await sql`
      SELECT 
        category,
        SUM(amount) as total_spent,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE transaction_type = 'debit' 
        AND transaction_date >= NOW() - INTERVAL '${period} days'
        AND category IS NOT NULL
      GROUP BY category
      ORDER BY total_spent DESC
    `;

    // Get total spending for the period
    const totalSpending = await sql`
      SELECT 
        SUM(amount) as total_spent,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE transaction_type = 'debit' 
        AND transaction_date >= NOW() - INTERVAL '${period} days'
    `;

    // Get total income for the period
    const totalIncome = await sql`
      SELECT 
        SUM(amount) as total_income,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE transaction_type = 'credit' 
        AND transaction_date >= NOW() - INTERVAL '${period} days'
    `;

    // Check if balance is low
    const isLowBalance = currentBalance < lowBalanceThreshold;

    // Calculate monthly spending rate
    const monthlySpending = totalSpending[0]?.total_spent || 0;
    const isOverBudget = monthlySpending > monthlyBudget;

    return Response.json({
      currentBalance,
      lowBalanceThreshold,
      monthlyBudget,
      isLowBalance,
      isOverBudget,
      totalSpending: totalSpending[0]?.total_spent || 0,
      totalIncome: totalIncome[0]?.total_income || 0,
      categorySpending,
      period: parseInt(period)
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}