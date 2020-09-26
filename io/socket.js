const serverio = (io) => {

  let players = {}

  io.on('connection', (socket) => {

    console.log('a user connected: ', socket.id);
    // create a new player and add it to our players object
    players[socket.id] = {
      x: 0,
      y: 0,
      z: 0,
      r: 0,
      playerId: socket.id,
      team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
    }

    // send the players object to the new player
    socket.emit('currentPlayers', players);

    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // when a player disconnects, remove them from our players object
    socket.on('disconnect', () => {
      console.log('user disconnected: ', socket.id);
      delete players[socket.id];
      // emit a message to all players to remove this player
      io.emit('disconnect', socket.id);
    });

    // when a player moves, update the player data
    socket.on('playerMovement', (movementData) => {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].z = movementData.z;
      players[socket.id].r = movementData.r;
      // emit a message to all players about the player that moved
      socket.broadcast.emit('playerMoved', players[socket.id]);
    });


  })
}
module.exports = { serverio }
