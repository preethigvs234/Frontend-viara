import React, { useState, useRef, useEffect } from 'react';
import { API_ENDPOINTS } from '../api/config';

export default function DiscoveryMode({ user_id, onClose }) {
  const [messages, setMessages] = useState([
    { 
      type: 'ai', 
      content: "Hi! I'm your personal discovery assistant. Tell me what kind of mood you're in or what you're looking for, and I'll help you discover something amazing!" 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.discovery, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user_id,
          message: userMessage
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: data.response || "I'm here to help you discover great content!" 
      }]);
    } catch (error) {
      console.error('Discovery Mode error:', error);
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: "Sorry, I'm having trouble connecting right now. But I'd love to help you discover new movies, books, or music!" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedPrompts = [
    "I'm feeling adventurous today",
    "Recommend something in a different genre",
    "I want something relaxing",
    "Suggest something popular right now",
    "I'm in the mood for something nostalgic"
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-[#232323] rounded-xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-[#1793d1] to-[#106fa0] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">🤖</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Discovery Mode</h2>
              <p className="text-gray-400 text-sm">Your AI recommendation assistant</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-[#1793d1] text-white' 
                  : 'bg-[#181314] text-gray-100 border border-gray-600'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#181314] text-gray-100 border border-gray-600 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#1793d1] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#1793d1] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-[#1793d1] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-sm text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts (show only when conversation is short) */}
        {messages.length <= 2 && (
          <div className="px-4 py-2">
            <p className="text-gray-400 text-xs mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(prompt)}
                  className="text-xs bg-[#181314] text-gray-300 px-3 py-1 rounded-full hover:bg-[#1793d1] hover:text-white transition-colors border border-gray-600"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-600">
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about movies, books, music, or just tell me your mood..."
              className="flex-1 bg-[#181314] text-white p-3 rounded-lg border border-gray-600 focus:border-[#1793d1] focus:outline-none resize-none"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-[#1793d1] text-white px-4 py-2 rounded-lg hover:bg-[#106fa0] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Send
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}