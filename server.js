const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const moment = require('moment'); // Ensure moment is imported

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();

wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.set(ws, {});

  ws.send(JSON.stringify({ type: 'systemMessage', message: 'Welcome to the WebSocket chat!' }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'setNickname') {
        clients.get(ws).nickname = data.nickname;
        ws.send(JSON.stringify({ type: 'systemMessage', message: `Your nickname has been set to ${data.nickname}` }));
      } else if (data.type === 'chatMessage') {
        const nickname = clients.get(ws).nickname || 'Anonymous';
        const timestamp = moment().format('HH:mm:ss');
        const chatMessage = {
          type: 'chatMessage',
          nickname: nickname,
          message: data.message,
          timestamp: timestamp
        };
        // Broadcast message to all clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(chatMessage));
          }
        });
      }
    } catch (error) {
      console.error('Error parsing message', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

app.get('/', (req, res) => {
  res.send('WebSocket server is running');
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
