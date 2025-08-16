const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

let rooms = {}; // { roomId: [player1, player2] }

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    let data = JSON.parse(message);

    if (data.type === 'createRoom') {
      let roomId = Math.random().toString(36).substr(2, 5);
      rooms[roomId] = [ws];
      ws.roomId = roomId;
      ws.send(JSON.stringify({ type: 'roomCreated', roomId }));
    }

    if (data.type === 'joinRoom') {
      let room = rooms[data.roomId];
      if (room && room.length === 1) {
        room.push(ws);
        ws.roomId = data.roomId;
        room.forEach(p => p.send(JSON.stringify({ type: 'startGame' })));
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Room full or not found' }));
      }
    }

    if (data.type === 'gameUpdate') {
      // send positions & actions to other player
      let room = rooms[ws.roomId];
      if (room) {
        room.forEach(p => {
          if (p !== ws) p.send(JSON.stringify(data));
        });
      }
    }
  });

  ws.on('close', function() {
    let room = rooms[ws.roomId];
    if (room) {
      rooms[ws.roomId] = room.filter(p => p !== ws);
      room.forEach(p => p.send(JSON.stringify({ type: 'playerDisconnected' })));
    }
  });
});

console.log(`WebSocket server running on port ${PORT}`);
