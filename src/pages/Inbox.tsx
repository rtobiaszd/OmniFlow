import React from 'react';
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
  CheckCheck
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const contacts = [
  { id: 1, name: 'Alice Freeman', lastMsg: 'I will be there in 5 mins', time: '10:45 AM', unread: 2, channel: 'whatsapp', avatar: 'https://picsum.photos/seed/alice/100/100' },
  { id: 2, name: 'Bob Smith', lastMsg: 'Did you see the new Jira ticket?', time: '09:30 AM', unread: 0, channel: 'telegram', avatar: 'https://picsum.photos/seed/bob/100/100' },
  { id: 3, name: 'Charlie Davis', lastMsg: 'Thanks for the update!', time: 'Yesterday', unread: 0, channel: 'email', avatar: 'https://picsum.photos/seed/charlie/100/100' },
  { id: 4, name: 'Diana Prince', lastMsg: 'Can we schedule a call?', time: 'Yesterday', unread: 5, channel: 'whatsapp', avatar: 'https://picsum.photos/seed/diana/100/100' },
];

const messages = [
  { id: 1, text: 'Hi there! How can I help you today?', time: '10:00 AM', sent: false },
  { id: 2, text: 'I have a question about my recent order #12345', time: '10:02 AM', sent: true },
  { id: 3, text: 'Sure, let me check that for you. One moment please.', time: '10:03 AM', sent: false },
  { id: 4, text: 'I see that your order is currently in processing and will be shipped by tomorrow.', time: '10:05 AM', sent: false },
  { id: 5, text: 'Great, thank you so much!', time: '10:06 AM', sent: true },
];

export function Inbox() {
  const [activeContact, setActiveContact] = React.useState(contacts[0]);

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
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              className={cn(
                "w-full p-4 flex gap-3 items-start hover:bg-gray-50 transition-colors border-b border-gray-50",
                activeContact.id === contact.id && "bg-indigo-50/50 border-l-4 border-l-indigo-600"
              )}
            >
              <div className="relative">
                <img src={contact.avatar} className="w-12 h-12 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white",
                  contact.channel === 'whatsapp' ? "bg-green-500" : contact.channel === 'telegram' ? "bg-blue-400" : "bg-red-400"
                )}>
                  {contact.channel[0].toUpperCase()}
                </div>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-900 truncate">{contact.name}</span>
                  <span className="text-[10px] text-gray-400 uppercase font-medium">{contact.time}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{contact.lastMsg}</p>
              </div>
              {contact.unread > 0 && (
                <div className="bg-indigo-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                  {contact.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={activeContact.avatar} className="w-10 h-10 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
            <div>
              <div className="font-bold text-gray-900">{activeContact.name}</div>
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
          <div className="flex justify-center mb-8">
            <span className="bg-white px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest shadow-sm border border-gray-100">Today</span>
          </div>
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.sent ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[70%] p-4 rounded-2xl text-sm shadow-sm",
                msg.sent 
                  ? "bg-indigo-600 text-white rounded-tr-none" 
                  : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
              )}>
                {msg.text}
                <div className={cn("text-[10px] mt-2 flex items-center justify-end gap-1", msg.sent ? "text-indigo-200" : "text-gray-400")}>
                  {msg.time}
                  {msg.sent && <CheckCheck size={14} />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-end gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
            <div className="flex gap-1">
              <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><Smile size={20} /></button>
              <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><Paperclip size={20} /></button>
            </div>
            <textarea 
              placeholder="Type a message..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none max-h-32"
              rows={1}
            />
            <button className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Details */}
      <div className="w-80 border-l border-gray-200 bg-white p-6 overflow-y-auto hidden xl:block">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Customer Details</h3>
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
            <img src={activeContact.avatar} className="w-24 h-24 rounded-3xl object-cover mb-4 shadow-xl" alt="" referrerPolicy="no-referrer" />
            <h4 className="text-lg font-bold text-gray-900">{activeContact.name}</h4>
            <p className="text-sm text-gray-500">London, United Kingdom</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</label>
              <div className="text-sm font-medium text-gray-700">{activeContact.name.toLowerCase().replace(' ', '.')}@example.com</div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</label>
              <div className="text-sm font-medium text-gray-700">+44 20 7123 4567</div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pipeline Stage</label>
              <div className="mt-1">
                <span className="px-2 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-md uppercase">Negotiation</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h5 className="text-xs font-bold text-gray-900 mb-4">Recent Activity</h5>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 shrink-0"></div>
                  <div className="text-xs">
                    <div className="font-bold text-gray-800">Deal Moved to Negotiation</div>
                    <div className="text-gray-400 mt-1">2 hours ago</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
