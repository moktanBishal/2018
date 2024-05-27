const express = require('express');
const http = require('http');
const path = require('path');
const send = require('send');
const { handleWebSocketConnection } = require('./websocketHandler');


const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);

// const server = http.createServer((req, res) => {
//     // let filePath = req.url === '/' ? '/chat.html' : req.url;
//     // filePath = path.join(__dirname, '../frontend', filePath);
//     // send(req, filePath)
//     //     .on('error', (err) => {
//     //         console.error(err);
//     //         res.writeHead(404, { 'Content-Type': 'text/plain' });
//     //         res.end('404 Not Found');
//     //     })
//     //     .pipe(res);
// });

// Initialize WebSocket connection handler
handleWebSocketConnection(server);

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}/`);
});
