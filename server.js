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
  socket.join('test-room')
  socket.on('test-room', function (msg) {
    socket.emit('test-room', msg)
  })

  socket.on('chat message', function (msg) {
    socket.broadcast.emit('chat message', msg)
  })
})

// app.get('/', function (req, res) {
//   res.sendFile(__dirname + '/index.html')
//   // res.sendFile().path.join(__dirname, '/index.html')
// })

// MESSAGE ROUTES
// const router = express.Router()
// app.use(router)
// const Message = require('./app/models/message')
// // CREATE
// // POST /examples
// router.post('/messages', (req, res, next) => {
//   // set owner of new example to be current user
//   // req.body.message.owner = req.user.id
//
//   Message.create(req.body.message)
//     // respond to succesful `create` with status 201 and JSON of new "example"
//     .then(message => {
//       res.status(201).json({ message: message.toObject() })
//       io.emit('chat message', message.toObject().text)
//       console.log(message.toObject().text)
//     })
//     // if an error occurs, pass it off to our error handler
//     // the error handler needs the error message and the `res` object so that it
//     // can send an error message back to the client
//     .catch(next)
// })
//
// // INDEX
// // GET /examples
// router.get('/messages', (req, res, next) => {
//   Message.find()
//     .then(examples => {
//       // `examples` will be an array of Mongoose documents
//       // we want to convert each one to a POJO, so we use `.map` to
//       // apply `.toObject` to each one
//       return examples.map(example => example.toObject())
//     })
//     // respond with status 200 and JSON of the examples
//     .then(messages => res.status(200).json({ messages: messages }))
//     .then(() => {
//       io.on('connection', function (socket) {
//         console.log('a user connected')
//         io.emit('chat message', 'hi')
//       })
//     })
//     // if an error occurs, pass it to the handler
//     .catch(next)
// })
// CLOSE MESSAGE ROUTES

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
// module.exports.listen = function (app) {
//   io = socketio.listen(app)
//
//   // users = io.of('/users')
//   // users.on('connection', function(socket){
//   //     socket.on ...
//   // })
//
//   return io
// }
