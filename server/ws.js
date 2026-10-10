import { WebSocketServer, WebSocket } from 'ws';

// Map of userEmail -> Set of active WebSocket connections
const userSockets = new Map();

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    let authenticatedEmail = null;

    ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());

        if (payload.type === 'auth') {
          authenticatedEmail = payload.email;
          if (authenticatedEmail) {
            if (!userSockets.has(authenticatedEmail)) {
              userSockets.set(authenticatedEmail, new Set());
            }
            userSockets.get(authenticatedEmail).add(ws);
            ws.send(JSON.stringify({ type: 'auth_success', email: authenticatedEmail }));
            console.log(`WebSocket connected & authenticated for: ${authenticatedEmail}`);
          }
        }

        if (payload.type === 'typing') {
          // Relay typing event to recipient
          const { recipientEmail, senderEmail } = payload;
          if (recipientEmail && userSockets.has(recipientEmail)) {
            const recipientSockets = userSockets.get(recipientEmail);
            for (const sock of recipientSockets) {
              if (sock.readyState === WebSocket.OPEN) {
                sock.send(JSON.stringify({ type: 'typing', senderEmail }));
              }
            }
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      if (authenticatedEmail && userSockets.has(authenticatedEmail)) {
        const set = userSockets.get(authenticatedEmail);
        set.delete(ws);
        if (set.size === 0) {
          userSockets.delete(authenticatedEmail);
        }
        console.log(`WebSocket closed for: ${authenticatedEmail}`);
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket connection error:', err);
    });
  });

  return wss;
}

export function broadcastChatMessage(message) {
  const { senderEmail, recipientEmail } = message;

  // Send to recipient's connected devices
  if (recipientEmail && userSockets.has(recipientEmail)) {
    for (const sock of userSockets.get(recipientEmail)) {
      if (sock.readyState === WebSocket.OPEN) {
        sock.send(JSON.stringify({ type: 'chat_message', message }));
      }
    }
  }

  // Also send to all of sender's other connected devices for instant multi-device sync
  if (senderEmail && userSockets.has(senderEmail)) {
    for (const sock of userSockets.get(senderEmail)) {
      if (sock.readyState === WebSocket.OPEN) {
        sock.send(JSON.stringify({ type: 'chat_message', message }));
      }
    }
  }
}

export function broadcastMessageDeleted(payload) {
  const { senderEmail, recipientEmail, messageId } = payload;
  const data = JSON.stringify({ type: 'message_deleted', messageId, senderEmail, recipientEmail });

  if (recipientEmail && userSockets.has(recipientEmail)) {
    for (const sock of userSockets.get(recipientEmail)) {
      if (sock.readyState === WebSocket.OPEN) {
        sock.send(data);
      }
    }
  }

    if (senderEmail && userSockets.has(senderEmail)) {
    for (const sock of userSockets.get(senderEmail)) {
      if (sock.readyState === WebSocket.OPEN) {
        sock.send(data);
      }
    }
  }
}

export function broadcastCommunityMessage(communityId, message) {
  const data = JSON.stringify({ type: 'community_message', communityId, message });
  for (const set of userSockets.values()) {
    for (const sock of set) {
      if (sock.readyState === WebSocket.OPEN) {
        sock.send(data);
      }
    }
  }
}

export function broadcastConversationDeleted(user1, user2) {
  const data = JSON.stringify({ type: 'conversation_deleted', user1, user2 });
  for (const email of [user1, user2]) {
    if (email && userSockets.has(email)) {
      for (const sock of userSockets.get(email)) {
        if (sock.readyState === WebSocket.OPEN) {
          sock.send(data);
        }
      }
    }
  }
}

export function broadcastPostCreated(post) {
  const data = JSON.stringify({ type: 'post_created', post });
  for (const set of userSockets.values()) {
    for (const sock of set) {
      if (sock.readyState === WebSocket.OPEN) {
        sock.send(data);
      }
    }
  }
}

export function broadcastMessageEdited(message) {
  const { senderEmail, recipientEmail } = message;
  const data = JSON.stringify({ type: 'message_edited', message });

  if (recipientEmail && userSockets.has(recipientEmail)) {
    for (const sock of userSockets.get(recipientEmail)) {
      if (sock.readyState === WebSocket.OPEN) {
        sock.send(data);
      }
    }
  }

  if (senderEmail && userSockets.has(senderEmail)) {
    for (const sock of userSockets.get(senderEmail)) {
      if (sock.readyState === WebSocket.OPEN) {
        sock.send(data);
      }
    }
  }
}

export function broadcastCommunityMessageEdited(communityId, message) {
  const data = JSON.stringify({ type: 'community_message_edited', communityId, message });
  for (const set of userSockets.values()) {
    for (const sock of set) {
      if (sock.readyState === WebSocket.OPEN) {
        sock.send(data);
      }
    }
  }
}


