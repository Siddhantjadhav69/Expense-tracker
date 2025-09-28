import sql from "@/app/api/utils/sql";

// Update user settings
export async function POST(request) {
  try {
    const body = await request.json();
    const { low_balance_threshold, monthly_budget } = body;

    if (low_balance_threshold === undefined && monthly_budget === undefined) {
      return Response.json({ error: 'At least one setting must be provided' }, { status: 400 });
    }

    // Check if settings exist
    const existingSettings = await sql`
      SELECT * FROM user_settings ORDER BY id DESC LIMIT 1
    `;

    let result;
    if (existingSettings.length > 0) {
      // Update existing settings
      const updateFields = [];
      const updateValues = [];
      let paramCount = 0;

      if (low_balance_threshold !== undefined) {
        paramCount++;
        updateFields.push(`low_balance_threshold = $${paramCount}`);
        updateValues.push(low_balance_threshold);
      }

      if (monthly_budget !== undefined) {
        paramCount++;
        updateFields.push(`monthly_budget = $${paramCount}`);
        updateValues.push(monthly_budget);
      }

      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      updateValues.push(new Date().toISOString());

      paramCount++;
      updateValues.push(existingSettings[0].id);

      const query = `UPDATE user_settings SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      result = await sql(query, updateValues);
    } else {
      // Create new settings
      result = await sql`
        INSERT INTO user_settings (low_balance_threshold, monthly_budget)
        VALUES (${low_balance_threshold || 100}, ${monthly_budget || 1000})
        RETURNING *
      `;
    }

    return Response.json({ settings: result[0] });
  } catch (error) {
    console.error('Error updating settings:', error);
    return Response.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}