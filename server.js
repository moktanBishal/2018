const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const moment = require('moment');
// const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();

// Serve static files from the "public" directory
// app.use(express.static(path.join(__dirname, '../frontend')));

function broadcastUserCount() {
  const userCount = clients.size;
  const message = JSON.stringify({ type: 'userCount', count: userCount });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.set(ws, {});

  ws.send(JSON.stringify({ type: 'systemMessage', message: 'Welcome to the WebSocket chat!' }));
  broadcastUserCount();

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
    broadcastUserCount();
  });
});

app.get('/', (req, res) => {
  res.send('Websocket is running properly.')
  // res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
