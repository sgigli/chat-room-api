// require necessary NPM packages
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

// require route files
const exampleRoutes = require('./app/routes/example_routes')
const userRoutes = require('./app/routes/user_routes')
const messageRoutes = require('./app/routes/message_routes')
const chatroomRoutes = require('./app/routes/chatroom_routes')

// require middleware
const errorHandler = require('./lib/error_handler')
const replaceToken = require('./lib/replace_token')
const requestLogger = require('./lib/request_logger')

// require database configuration logic
// `db` will be the actual Mongo URI as a string
const db = require('./config/db')

// require configured passport authentication middleware
const auth = require('./lib/auth')

// define server and client ports
// used for cors and local port declaration
const serverDevPort = 4741
const clientDevPort = 7165

// establish database connection
// use new version of URL parser
// use createIndex instead of deprecated ensureIndex
mongoose.connect(db, {
  useNewUrlParser: true,
  useCreateIndex: true
})

// instantiate express application object
const app = express()

// var http = require('http').createServer(app)
// var io = require('socket.io')(http)

const socketio = require('socket.io')
const http = require('http')
const server = http.createServer(app)
const io = socketio(server)
// require('./app/routes/message_routes.js')(io)

// set CORS headers on response from this API using the `cors` NPM package
// `CLIENT_ORIGIN` is an environment variable that will be set on Heroku
app.use(cors({ origin: process.env.CLIENT_ORIGIN || `http://localhost:${clientDevPort}` }))

// define port for API to run on
const port = process.env.PORT || serverDevPort

// this middleware makes it so the client can use the Rails convention
// of `Authorization: Token token=<token>` OR the Express convention of
// `Authorization: Bearer <token>`
app.use(replaceToken)

// register passport authentication middleware
app.use(auth)

// add `express.json` middleware which will parse JSON requests into
// JS objects before they reach the route files.
// The method `.use` sets up middleware for the Express application
app.use(express.json())
// this parses requests sent by `$.ajax`, which use a different content type
app.use(express.urlencoded({ extended: true }))

// log each request as it comes in for debugging
app.use(requestLogger)

// register route files
app.use(exampleRoutes)
app.use(userRoutes)
app.use(messageRoutes)
app.use(chatroomRoutes)

// app.get('/', function (req, res) {
//   res.send('<h1>Hello world</h1>')
// })
// io.on('connection', function (socket) {
//   console.log('a user connected')
//   // io.emit('chat message', 'hi')
// })
//
// io.on('connection', function (socket) {
//   socket.on('chat message', function (msg) {
//     console.log('message: ' + msg)
//   })
// })
io.on('connection', function (socket) {
  // socket.join('test-room')
  const allClients = {}
  socket.on('join-room', function (room) {
    // socket.emit('test-room', msg)
    if (!allClients[`${room}`]) {
      allClients[`${room}`] = [socket]
    } else {
      allClients[`${room}`].push(socket)
    }
    socket.join(room)
    console.log(allClients)
  })

  socket.on('send-message', function (room) {
    socket.in(room).emit('message', 'new message sent')
  })

  socket.on('refresh-chatrooms', function (room) {
    console.log('SocketTEST')
    socket.broadcast.emit('refresh-cr', 'new message sent')
  })

  // socket.on('delete-chatroom', function (room) {
  //   console.log('SocketTEST')
  //   socket.broadcast.emit('refresh-chatrooms', 'new message sent')
  // })
  //
  // socket.on('update-chatroom', function (room) {
  //   console.log('SocketTEST')
  //   socket.broadcast.emit('refresh', 'new message sent')
  // })

  socket.on('chat message', function (msg) {
    socket.broadcast.emit('chat message', msg)
  })

  // socket.on('disconnect', function (data) {
  //   console.log('DISCONNECT')
  //
  // })
})

// app.get('/', function (req, res) {
//   res.sendFile(__dirname + '/index.html')
//   // res.sendFile().path.join(__dirname, '/index.html')
// })

// register error handling middleware
// note that this comes after the route middlewares, because it needs to be
// passed any error messages from them
app.use(errorHandler)

// run API on designated port (4741 in this case)
// app -> server.listen
server.listen(port, () => {
  console.log('listening on port ' + port)
})

// needed for testing
module.exports = app
