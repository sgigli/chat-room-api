const mongoose = require('mongoose')
const messageSchema = require('./message')

const chatroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [messageSchema]
}, {
  timestamps: true
})

module.exports = mongoose.model('Chatroom', chatroomSchema)
