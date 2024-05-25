const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  console.log('New client connected');
  ws.send(JSON.stringify({ type: 'systemMessage', message: 'Hello from WebSocket server!' }));

  ws.on('message', message => {
    console.log(`Received: ${message}`);
    try {
      const parsedMessage = JSON.parse(message);

      if (parsedMessage.type === 'chatMessage') {
        const response = {
          type: 'chatMessage',
          message: `Server received: ${parsedMessage.message}`
        };
        ws.send(JSON.stringify(response));
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

app.get('/', (req, res) => {
  res.send('WebSocket server is running');
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
