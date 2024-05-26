document.addEventListener('DOMContentLoaded', () => {
  let ws;
  let nickname = '';

  function connectToChatApp() {
    ws = new WebSocket('wss://websocket-rd9d.onrender.com'); // Replace with your actual Render WebSocket URL
    // ws = new WebSocket('ws://192.168.1.64:3000');

    ws.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.onmessage = function(event) {
      const data = JSON.parse(event.data);
      console.log('Received data:', data);

      if (data.type === 'chatMessage') {
        const messageText = `${data.nickname} [${data.timestamp}]: ${data.message}`;
        appendMessage(messageText);
        scrollToBottom();
      } else if (data.type === 'systemMessage') {
        appendMessage(data.message, 'system-message');
        scrollToBottom();
      } else if (data.type === 'userCount') {
        document.getElementById('userCount').innerText = `Connected users: ${data.count}`;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      // Reconnect after a delay
      setTimeout(connectToChatApp, 3000);
    };

    function sendJsonMessage(type, data) {
      ws.send(JSON.stringify({ type, ...data }));
    }

    function scrollToBottom() {
      const chat = document.getElementById('chat');
      chat.scrollTop = chat.scrollHeight;
    }

    function appendMessage(message, className = 'message') {
      const chat = document.getElementById('chat');
      const messageDiv = document.createElement('div');
      messageDiv.classList.add(className);
      messageDiv.innerHTML = `<span class="chat-content">${message}</span>`;
      chat.appendChild(messageDiv);
    }

    document.getElementById('sendMessageButton').addEventListener('click', () => {
      const messageInput = document.getElementById('messageInput');
      const message = messageInput.value.trim();

      if (message !== '') {
        sendJsonMessage('chatMessage', { message });
        messageInput.value = ''; // Clear input field after sending message
      }
    });

    document.getElementById('setNicknameButton').addEventListener('click', () => {
      const nicknameInput = document.getElementById('nicknameInput');
      const setNicknameButton = document.getElementById('setNicknameButton');
      nickname = nicknameInput.value.trim();

      if (nickname !== '') {
        sendJsonMessage('setNickname', { nickname });
        // Remove the nickname setting section (button and input)
        nicknameInput.style.display = 'none';
        setNicknameButton.style.display = 'none';
      }
    });
  }

  connectToChatApp();
});
