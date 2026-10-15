const path = require('path');
const express = require('express');
require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Campus app running on http://localhost:${port}`);
});
