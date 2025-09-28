import sql from "@/app/api/utils/sql";

// Parse transaction messages and extract transaction data
export async function POST(request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Parse the message to extract transaction information
    const parsedTransaction = parseTransactionMessage(message);

    if (!parsedTransaction) {
      return Response.json({ error: 'Could not parse transaction from message' }, { status: 400 });
    }

    // Save the parsed transaction to database
    const result = await sql`
      INSERT INTO transactions (amount, transaction_type, description, merchant, category, balance_after, source)
      VALUES (${parsedTransaction.amount}, ${parsedTransaction.type}, ${parsedTransaction.description}, 
              ${parsedTransaction.merchant}, ${parsedTransaction.category}, ${parsedTransaction.balance}, 'sms')
      RETURNING *
    `;

    return Response.json({ 
      transaction: result[0],
      parsed: parsedTransaction
    });
  } catch (error) {
    console.error('Error parsing message:', error);
    return Response.json({ error: 'Failed to parse message' }, { status: 500 });
  }
}

function parseTransactionMessage(message) {
  const text = message.toLowerCase();
  
  // Common patterns for transaction messages
  const patterns = {
    // Debit patterns
    debit: [
      /debited.*?(\d+\.?\d*)/,
      /spent.*?(\d+\.?\d*)/,
      /paid.*?(\d+\.?\d*)/,
      /withdrawn.*?(\d+\.?\d*)/,
      /purchase.*?(\d+\.?\d*)/
    ],
    // Credit patterns
    credit: [
      /credited.*?(\d+\.?\d*)/,
      /received.*?(\d+\.?\d*)/,
      /deposited.*?(\d+\.?\d*)/,
      /salary.*?(\d+\.?\d*)/,
      /refund.*?(\d+\.?\d*)/
    ],
    // Balance patterns
    balance: [
      /balance.*?(\d+\.?\d*)/,
      /available.*?(\d+\.?\d*)/,
      /bal.*?(\d+\.?\d*)/
    ]
  };

  let amount = null;
  let type = null;
  let balance = null;

  // Try to find amount and type
  for (const [transactionType, regexList] of Object.entries(patterns)) {
    if (transactionType === 'balance') continue;
    
    for (const regex of regexList) {
      const match = text.match(regex);
      if (match) {
        amount = parseFloat(match[1]);
        type = transactionType;
        break;
      }
    }
    if (amount) break;
  }

  // Try to find balance
  for (const regex of patterns.balance) {
    const match = text.match(regex);
    if (match) {
      balance = parseFloat(match[1]);
      break;
    }
  }

  if (!amount || !type) {
    return null;
  }

  // Extract merchant/description
  let merchant = null;
  let description = message;

  // Common merchant patterns
  const merchantPatterns = [
    /at\s+([a-zA-Z\s]+?)(?:\s|$)/,
    /from\s+([a-zA-Z\s]+?)(?:\s|$)/,
    /to\s+([a-zA-Z\s]+?)(?:\s|$)/
  ];

  for (const pattern of merchantPatterns) {
    const match = message.match(pattern);
    if (match) {
      merchant = match[1].trim();
      break;
    }
  }

  // Categorize transaction
  const category = categorizeTransaction(message, merchant);

  return {
    amount,
    type,
    description,
    merchant,
    category,
    balance
  };
}

function categorizeTransaction(message, merchant) {
  const text = message.toLowerCase();
  
  const categories = {
    'Food': ['restaurant', 'cafe', 'food', 'grocery', 'supermarket', 'starbucks', 'mcdonald', 'pizza'],
    'Transportation': ['gas', 'fuel', 'uber', 'taxi', 'metro', 'bus', 'parking'],
    'Entertainment': ['movie', 'cinema', 'netflix', 'spotify', 'game', 'entertainment'],
    'Shopping': ['amazon', 'store', 'mall', 'shop', 'retail'],
    'Bills': ['electric', 'water', 'internet', 'phone', 'utility', 'bill'],
    'Healthcare': ['hospital', 'pharmacy', 'doctor', 'medical', 'health'],
    'Income': ['salary', 'wage', 'payment', 'refund', 'cashback']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    for (const keyword of keywords) {
      if (text.includes(keyword) || (merchant && merchant.toLowerCase().includes(keyword))) {
        return category;
      }
    }
  }

  return 'Other';
}