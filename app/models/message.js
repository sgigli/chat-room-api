const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  chatroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatroom',
    required: true
  }
}, {
  timestamps: true
})

// module.exports = mongoose.model('Message', messageSchema)
module.exports = messageSchema
