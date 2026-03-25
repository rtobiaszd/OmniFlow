import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile,
  Phone,
  Video,
  Info,
  CheckCheck,
  Loader2,
  Database
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { messageService, Conversation } from '../services/messageService';
import { Message } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function Inbox() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!profile?.tenantId) return;

    const unsub = messageService.subscribeToConversations(profile.tenantId, (data) => {
      setConversations(data);
      if (data.length > 0 && !activeConversation) {
        setActiveConversation(data[0]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [profile?.tenantId]);

  useEffect(() => {
    if (!activeConversation?.id || !profile?.tenantId) return;

    const unsub = messageService.subscribeToMessages(profile.tenantId, activeConversation.id, (data) => {
      setMessages(data);
    });

    return () => unsub();
  }, [activeConversation?.id, profile?.tenantId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !profile?.tenantId) return;

    setIsSending(true);
    try {
      await messageService.sendMessage(
        profile.tenantId,
        activeConversation.id,
        newMessage,
        activeConversation.channel,
        profile.uid
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const seedData = async () => {
    if (!profile?.tenantId) return;
    setLoading(true);
    try {
      // Data will now be seeded automatically by the backend or via API
      console.log('Seeding simulated via background processes...');
    } catch (error) {
      console.error('Error seeding data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mb-4 mx-auto" size={48} />
          <p className="text-gray-500 font-medium">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* Contacts List */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button className="flex-1 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg">All</button>
            <button className="flex-1 py-1.5 text-gray-500 text-xs font-bold hover:bg-gray-50 rounded-lg">Unread</button>
            <button className="flex-1 py-1.5 text-gray-500 text-xs font-bold hover:bg-gray-50 rounded-lg">Channels</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <Database className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-sm text-gray-500 mb-4">No conversations found.</p>
              <button 
                onClick={seedData}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Seed Test Data
              </button>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv)}
                className={cn(
                  "w-full p-4 flex gap-3 items-start hover:bg-gray-50 transition-colors border-b border-gray-50",
                  activeConversation?.id === conv.id && "bg-indigo-50/50 border-l-4 border-l-indigo-600"
                )}
              >
                <div className="relative">
                  <img src={conv.contactAvatar} className="w-12 h-12 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white",
                    conv.channel === 'whatsapp' ? "bg-green-500" : 
                    conv.channel === 'telegram' ? "bg-blue-400" : 
                    conv.channel === 'facebook' ? "bg-blue-700" :
                    conv.channel === 'instagram' ? "bg-pink-600" :
                    "bg-red-400"
                  )}>
                    {conv.channel[0].toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-gray-900 truncate">{conv.contactName}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-medium">
                      {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="bg-indigo-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                    {conv.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={activeConversation.contactAvatar} className="w-10 h-10 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
                <div>
                  <div className="font-bold text-gray-900">{activeConversation.contactName}</div>
                  <div className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Phone size={20} /></button>
                <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Video size={20} /></button>
                <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Info size={20} /></button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all ml-2"><MoreVertical size={20} /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8F9FB]">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.senderId === profile?.uid ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[70%] p-4 rounded-2xl text-sm shadow-sm",
                    msg.senderId === profile?.uid 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                  )}>
                    {msg.content}
                    <div className={cn("text-[10px] mt-2 flex items-center justify-end gap-1", msg.senderId === profile?.uid ? "text-indigo-200" : "text-gray-400")}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.senderId === profile?.uid && <CheckCheck size={14} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100">
              <div className="flex items-end gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                <div className="flex gap-1">
                  <button type="button" className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><Smile size={20} /></button>
                  <button type="button" className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><Paperclip size={20} /></button>
                </div>
                <textarea 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none max-h-32"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button 
                  type="submit"
                  disabled={isSending || !newMessage.trim()}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="p-6 bg-gray-50 rounded-full">
              <Send size={48} className="opacity-20" />
            </div>
            <p className="font-medium">Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      {/* Sidebar Details */}
      {activeConversation && (
        <div className="w-80 border-l border-gray-200 bg-white p-6 overflow-y-auto hidden xl:block">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Customer Details</h3>
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
              <img src={activeConversation.contactAvatar} className="w-24 h-24 rounded-3xl object-cover mb-4 shadow-xl" alt="" referrerPolicy="no-referrer" />
              <h4 className="text-lg font-bold text-gray-900">{activeConversation.contactName}</h4>
              <p className="text-sm text-gray-500">Active on {activeConversation.channel}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Channel</label>
                <div className="text-sm font-medium text-gray-700 capitalize">{activeConversation.channel}</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
                <div className="mt-1">
                  <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-md uppercase">{activeConversation.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
