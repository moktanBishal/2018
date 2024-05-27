const mongoose = require('mongoose');
// Connect to MongoDB
mongoose.connect('mongodb+srv://20saallama:xcmeRTCmpigBHAWq@cluster0.ya6gbh8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  connectTimeoutMS: 30000,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define schema for chat rooms
const roomSchema = new mongoose.Schema({name: String});
const Room = mongoose.model('Room', roomSchema);

// Define schema for chat messages
const messageSchema = new mongoose.Schema({
  roomName: String,
  nickname: String,
  text: String,
  timestamp: String,
});
const Message = mongoose.model('Message', messageSchema);

// Defining account address for metamask
const accountSchema = new mongoose.Schema({address: String});
const Account = mongoose.model('Account', accountSchema);

// Export the models and any necessary database functions
module.exports = { Room, Message, Account };
