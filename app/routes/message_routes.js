// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for examples
const Message = require('../models/message')
const Chatroom = require('../models/chatroom')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { example: { title: '', text: 'foo' } } -> { example: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /examples
router.get('/messages', (req, res, next) => {
  Message.find()
    .then(examples => {
      // `examples` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return examples.map(example => example.toObject())
    })
    // respond with status 200 and JSON of the examples
    .then(messages => res.status(200).json({ messages: messages }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /examples
router.post('/messages', requireToken, (req, res, next) => {
  // set owner of new example to be current user
  req.body.message.owner = req.user.id
  const id = req.body.message.chatroomId

  Chatroom.findById(id)
    .then(handle404)
    .then(chatroom => {
      chatroom.messages.push(req.body.message)
      chatroom.save()
      const length = chatroom.messages.length
      return chatroom.messages[length - 1]
    })
    .then(message => {
      res.status(201).json({ message: message })
    })
    .catch(next)
})

// UPDATE
// PATCH /examples/5a7db6c74d55bc51bdf39793
router.patch('/messages/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  // delete req.body.message.owner
  //
  req.body.message.owner = req.user.id
  const id = req.body.message.chatroomId

  Chatroom.findById(id)
    .then(handle404)
    .then(chatroom => {
      for (let i = 0; i < chatroom.messages.length; i++) {
        // console.log(chatroom.messages[i])
        if (chatroom.messages[i]._id == req.params.id) {
          chatroom.messages[i].text = req.body.message.text
          chatroom.save()
        }
      }
    })
    .then(message => {
      res.status(201).json({ message: message })
    })
    .catch(next)
})

// DESTROY
// DELETE /examples/5a7db6c74d55bc51bdf39793
router.delete('/messages/:id/:CR', requireToken, (req, res, next) => {
  // req.body.message.owner = req.user.id
  // const id = req.body.message.chatroomId

  Chatroom.findById(req.params.CR)
    .then(handle404)
    .then(chatroom => {
      for (let i = 0; i < chatroom.messages.length; i++) {
        if (chatroom.messages[i]._id == req.params.id) {
          console.log(chatroom.messages[i])
          chatroom.messages.splice(i, 1)
          chatroom.save()
        }
      }
      // chatroom.save()
      // const length = chatroom.messages.length
      // return chatroom.messages[length - 1]
    })
    .then(message => {
      res.status(201).json({ message: message })
    })
    .catch(next)
})

module.exports = router
