const { estimateMonthlyCost } = require('./_costs');

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed.' });

  try {
    const query = event.queryStringParameters || {};
    if (query.user_id !== undefined) {
      const userId = Number(query.user_id);
      if (!Number.isInteger(userId) || userId <= 0) return json(400, { error: 'user_id must be a positive integer.' });
    }

    const result = estimateMonthlyCost(query);
    if (!result.valid) return json(400, { error: result.message });
    return json(200, {
      total_azn: result.total_azn,
      breakdown: result.breakdown,
      is_estimate: true
    });
  } catch (err) {
    console.error('Could not calculate cost estimate:', err);
    return json(500, { error: 'Could not calculate the cost estimate.' });
  }
};
