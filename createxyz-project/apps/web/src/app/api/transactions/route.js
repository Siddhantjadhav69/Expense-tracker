import sql from "@/app/api/utils/sql";

// Get all transactions with optional filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const limit = searchParams.get('limit') || '50';

    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (type) {
      paramCount++;
      query += ` AND transaction_type = $${paramCount}`;
      params.push(type);
    }

    query += ` ORDER BY transaction_date DESC LIMIT $${paramCount + 1}`;
    params.push(parseInt(limit));

    const transactions = await sql(query, params);
    
    return Response.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return Response.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// Create a new transaction
export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, transaction_type, description, merchant, category, balance_after } = body;

    if (!amount || !transaction_type) {
      return Response.json({ error: 'Amount and transaction type are required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO transactions (amount, transaction_type, description, merchant, category, balance_after)
      VALUES (${amount}, ${transaction_type}, ${description || null}, ${merchant || null}, ${category || null}, ${balance_after || null})
      RETURNING *
    `;

    return Response.json({ transaction: result[0] });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return Response.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}