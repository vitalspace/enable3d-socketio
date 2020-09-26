const express = require('express')
const app = express()

var server = require('http').Server(app);
var io = require('socket.io').listen(server);

const path = require('path')

const { serverio } = require('./io/socket')

serverio(io)

app.set('port', process.env.PORT || 4000)
app.set('appname', 'Server game')

app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

server.listen(app.get('port'), function () {
    console.log('Server on port', app.get('port'));
  });
  