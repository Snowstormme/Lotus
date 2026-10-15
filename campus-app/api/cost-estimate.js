const { estimateMonthlyCost } = require('../lib/_costs');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  try {
    const query = req.query || {};
    if (query.user_id !== undefined) {
      const userId = Number(query.user_id);
      if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ error: 'user_id must be a positive integer.' });
    }
    const result = estimateMonthlyCost(query);
    if (!result.valid) return res.status(400).json({ error: result.message });
    return res.status(200).json({ total_azn: result.total_azn, breakdown: result.breakdown, is_estimate: true });
  } catch (err) {
    console.error('Could not calculate cost estimate:', err);
    return res.status(500).json({ error: 'Could not calculate the cost estimate.' });
  }
};
