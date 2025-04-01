import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/store/gameStore';

interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: string;
  isWhisper: boolean;
  targetPlayerId?: string;
}

interface ChatProps {
  roomId: string;
}

export const Chat: React.FC<ChatProps> = ({ roomId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentPlayer, whisperTarget, setWhisperTarget } = useGameStore();
  const { emit, getSocket } = useSocket(roomId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId) return;

    const handleChatMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('chat:message', handleChatMessage);

    return () => {
      socket.off('chat:message', handleChatMessage);
    };
  }, [getSocket, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentPlayer) return;
    
    emit('chat:message', {
      roomId,
      playerId: currentPlayer.id,
      message: newMessage,
      targetPlayerId: whisperTarget || undefined,
    });
    setNewMessage('');
    setWhisperTarget(null);
  };

  const getMessageStyle = (message: ChatMessage) => {
    if (message.isWhisper) {
      return 'bg-purple-100 text-purple-800 border border-purple-200';
    }
    return message.playerId === currentPlayer?.id
      ? 'bg-blue-500 text-white'
      : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.playerId === currentPlayer?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${getMessageStyle(msg)}`}
            >
              <p className="text-sm font-semibold mb-1">
                {msg.playerName}
                {msg.isWhisper && ' (귓속말)'}
              </p>
              <p>{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={whisperTarget ? "귓속말을 입력하세요..." : "메시지를 입력하세요..."}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              전송
            </button>
          </div>
          {whisperTarget && (
            <div className="flex items-center space-x-2 text-sm text-purple-600">
              <span>귓속말 모드</span>
              <button
                type="button"
                onClick={() => setWhisperTarget(null)}
                className="text-red-500 hover:text-red-600"
              >
                취소
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}; 