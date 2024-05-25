const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Log server start
console.log('Starting WebSocket server');

wss.on('connection', ws => {
  console.log('New client connected');
  ws.send(JSON.stringify({ message: 'Hello from WebSocket server!' }));

  ws.on('message', message => {
    console.log(`Received: ${message}`);
    ws.send(`Server received: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('WebSocket server is running');
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
