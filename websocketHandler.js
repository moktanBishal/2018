const WebSocket = require('ws');
const moment = require('moment');
const { Room, Message, Account } = require('./databaseOperation');

// Maintain a map to store connected clients and their nicknames
const connectedClients = new Map();

// Maintain a map to store chat rooms and their messages
const chatRoomMessages = new Map();

// Maintain a map to store the room each client is connected to
const clientRooms = new Map();

// Maintain a map to store the wallet address
const accountAddresses = new Map();

let wss;
// Handle WebSocket connection
function handleWebSocketConnection(server) {

    wss = new WebSocket.Server({ server });
    // When the server starts, retrieve existing chat rooms from MongoDB and store them in the chatRoomMessages map
    initializeChatRooms();

    // Handle WebSocket connection
    wss.on('connection', async ws => {
        // Prompt the client to set a nickname
        ws.send(JSON.stringify({ type: 'setNicknamePrompt', message: 'Please set your nickname to join the chat.' }));

        ws.on('message', async message => {
            // Handle incoming messages
            handleMessage(ws, message); // This is where handleMessage function is called
        });

        ws.on('close', () => {
            // Handle client disconnection
            handleWebSocketClose(ws); // This is where handleWebSocketClose function is called
        });
    });


}

async function initializeChatRooms() {
    try {
        const existingRooms = await Room.find();
        existingRooms.forEach(room => {
            chatRoomMessages.set(room.name, []);
        });
    } catch (err) {
        console.error('Error retrieving chat rooms from database:', err);
    }
}

async function handleGetRoomsRequest(ws) {
    try {
        const existingRooms = await Room.find({}, 'name');
        const roomNames = existingRooms.map(room => room.name);
        ws.send(JSON.stringify({ type: 'roomList', rooms: roomNames }));
    } catch (error) {
        console.error('Error retrieving rooms: ', error);
    }
}

async function handleAccountAddressRequest(ws) {
    try {
        const existingAccounts = await Account.find({}, 'address');
        const waitlistedAccounts = existingAccounts.map(account => account.address);
        ws.send(JSON.stringify({ type: 'accountList', accounts: waitlistedAccounts}))
    } catch (error) {
        console.error('Error retrieving account address.', error);
    }
}

async function handleMessage(ws, message) {
    try {
        const data = JSON.parse(message);

        // Handle setting nickname
        if (data.type === 'setNickname') {
            const nickname = data.nickname;
            if ([...connectedClients.values()].includes(nickname)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Nickname is already taken. Please choose a different one.' }));
                return;
            }
            connectedClients.set(ws, nickname);
            ws.send(JSON.stringify({ type: 'systemMessage', message: `You have set your nickname as ${nickname}.` }));
            return;
        }

        // Handle room creation
        if (data.type === 'createRoom') {
            const newRoomName = data.roomName;
            if (chatRoomMessages.has(newRoomName)) {
                ws.send(JSON.stringify({ type: 'systemMessage', message: `Room "${newRoomName}" already exists.` }));
                return;
            }
            const newRoom = new Room({ name: newRoomName });
            try {
                await newRoom.save();
                chatRoomMessages.set(newRoomName, []);
                ws.send(JSON.stringify({ type: 'systemMessage', message: `New room "${newRoomName}" created.` }));
                clientRooms.set(ws, newRoomName);
            } catch (error) {
                console.error('Error creating chat room:', error);
            }
            return;
        }

        // Handle room joining
        if (data.type === 'joinRoom') {
            const roomName = data.roomName;
            if (!chatRoomMessages.has(roomName)) {
                ws.send(JSON.stringify({ type: 'systemMessage', message: `Room "${roomName}" does not exist.` }));
                return;
            }
            const existingMessages = await Message.find({ roomName });
            ws.send(JSON.stringify({ type: 'existingMessages', messages: existingMessages }));
            clientRooms.set(ws, roomName);
            ws.send(JSON.stringify({ type: 'systemMessage', message: `You have joined room "${roomName}".` }));
            return;
        }

        // Handle retrieving room 
        if (data.type === 'getRooms') {
            await handleGetRoomsRequest(ws);
        }
        // Handle chat messages
        if (data.type === 'chatMessage') {
            const roomName = clientRooms.get(ws);
            const timestamp = moment().format('hh:mm:ss');
            if (!roomName) {
                ws.send(JSON.stringify({ type: 'error', message: 'You are not connected to a room.' }));
                return;
            }
            const messageData = {
                roomName: roomName,
                nickname: connectedClients.get(ws),
                text: data.message,
                timestamp: timestamp
            };
            try {
                const newMessage = new Message(messageData);
                await newMessage.save();

                const messages = chatRoomMessages.get(roomName);
                messages.push(newMessage);
                chatRoomMessages.set(roomName, messages);

                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN && clientRooms.get(client) === roomName) {
                        client.send(JSON.stringify({ type: 'chatMessage', roomName, message: newMessage }))
                    }
                });
            } catch (error) {
                console.error('Error saving messages to databases: ', error);
                ws.send(JSON.stringify({ type: 'error', message: 'Failed to save messages' }));
                return;
            }
        }

        // Handle address for token verification
        if (data.type === 'token') {
            const newAccountAddress = data.accountAddress;
            const existingAccount = await Account.findOne({ address: newAccountAddress });
            try {
                if (existingAccount) {
                    ws.send(JSON.stringify({ type: 'systemMessage', message: `Account address ${newAccountAddress} is already on waitlist.` }));
                    return;
                } else {
                    const newAccount = new Account({ address: newAccountAddress });
                    await newAccount.save();
                    ws.send(JSON.stringify({ type: 'systemMessage', message: `New account ${newAccountAddress} is waitlisted.` }));
                    accountAddresses.set(ws, newAccountAddress);
                }
            } catch (error) {
                console.error('Error adding wallet address:', error);
            }
            return;
        }

        // Handle get address request from client
        if (data.type === 'getAddresses') {
            await handleAccountAddressRequest(ws);
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
}

function handleWebSocketClose(ws) {
    const nickname = connectedClients.get(ws);
    if (nickname) {
        const roomName = clientRooms.get(ws);
        connectedClients.delete(ws);
        clientRooms.delete(ws);
    }
}


module.exports = {
    handleWebSocketConnection
};
