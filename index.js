const { createServer } = require('http');
const { Server } = require('socket.io');
const express = require('express');

const app = express();
const server = createServer(app);
const io = new Server(server);

const players = {};

// Serve a default message for root (optional)
app.get('/', (req, res) => {
    res.send('Cursor Party backend is running!');
});

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Initialize a new player
    players[socket.id] = { x: 0, y: 0, clicks: 0, color: 'red' };

    // Send the list of players to the new client
    socket.emit('initialize', players);

    // Notify other players of the new player
    socket.broadcast.emit('playerJoined', { id: socket.id, data: players[socket.id] });

    // Handle player movement
    socket.on('move', ({ x, y }) => {
        if (players[socket.id]) {
            players[socket.id].x = x;
            players[socket.id].y = y;
            io.emit('updatePosition', { id: socket.id, x, y });
        }
    });

    // Handle clicks
    socket.on('click', () => {
        if (players[socket.id]) {
            players[socket.id].clicks++;
            const hue = Math.min(360, players[socket.id].clicks * 10); // Slow progression
            players[socket.id].color = `hsl(${hue}, 100%, 50%)`;
            io.emit('updateColor', { id: socket.id, color: players[socket.id].color });
        }
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerLeft', socket.id);
        console.log(`Player disconnected: ${socket.id}`);
    });
});

module.exports = server;
