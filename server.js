// server.js
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on port ${PORT}`);

// Store rooms and players
let rooms = {};

wss.on('connection', function connection(ws) {
  console.log('New player connected');

  ws.on('message', function incoming(message) {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      console.log('Invalid JSON:', message);
      return;
    }

    // Handle creating/joining room
    if (data.type === 'create') {
      rooms[data.roomId] = rooms[data.roomId] || [];
      rooms[data.roomId].push(ws);
      ws.roomId = data.roomId;
      ws.send(JSON.stringify({ type: 'joined', player: rooms[data.roomId].length }));
    }

    if (data.type === 'join') {
      if (rooms[data.roomId] && rooms[data.roomId].length < 2) {
        rooms[data.roomId].push(ws);
        ws.roomId = data.roomId;
        ws.send(JSON.stringify({ type: 'joined', player: rooms[data.roomId].length }));
        // Notify the other player
        rooms[data.roomId].forEach(p => {
          if (p !== ws) p.send(JSON.stringify({ type: 'ready' }));
        });
      } else {
        ws.send(JSON.stringify({ type: 'full' }));
      }
    }

    // Broadcast movements or bullets
    if (data.type === 'update') {
      if (ws.roomId && rooms[ws.roomId]) {
        rooms[ws.roomId].forEach(p => {
          if (p !== ws) p.send(JSON.stringify(data));
        });
      }
    }
  });

  ws.on('close', function() {
    console.log('Player disconnected');
    if (ws.roomId && rooms[ws.roomId]) {
      rooms[ws.roomId] = rooms[ws.roomId].filter(p => p !== ws);
      if (rooms[ws.roomId].length === 0) delete rooms[ws.roomId];
    }
  });
});
