const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static('dist'));

// OpenAI proxy endpoint
app.post('/api/openai/*', createProxyMiddleware({
  target: 'https://api.openai.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/openai': '',
  },
  onProxyReq: (proxyReq) => {
    proxyReq.setHeader('Authorization', `Bearer ${process.env.OPENAI_API_KEY}`);
  },
}));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
