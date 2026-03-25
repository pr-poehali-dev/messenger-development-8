import { useState } from "react";
import Icon from "@/components/ui/icon";

const SECTIONS = [
  { id: "chats", icon: "MessageCircle", label: "Чаты" },
  { id: "contacts", icon: "Users", label: "Контакты" },
  { id: "stories", icon: "Circle", label: "Сторис" },
  { id: "notifications", icon: "Bell", label: "Уведомления" },
  { id: "profile", icon: "User", label: "Профиль" },
  { id: "settings", icon: "Settings", label: "Настройки" },
];

const CHATS = [
  { id: 1, name: "Алексей Кравцов", lastMsg: "Окей, давай встретимся завтра 👍", time: "14:32", unread: 2, online: true, avatar: "АК" },
  { id: 2, name: "Команда Orbit", lastMsg: "Новый релиз готов к деплою", time: "13:10", unread: 7, online: false, avatar: "КО", isGroup: true },
  { id: 3, name: "Мария Соколова", lastMsg: "Ты видел презентацию?", time: "12:58", unread: 0, online: true, avatar: "МС" },
  { id: 4, name: "Дизайн-отдел", lastMsg: "Прикрепила новые макеты", time: "11:45", unread: 0, online: false, avatar: "ДО", isGroup: true },
  { id: 5, name: "Иван Петров", lastMsg: "Отправил тебе файлы на почту", time: "Вчера", unread: 0, online: false, avatar: "ИП" },
  { id: 6, name: "Светлана Ким", lastMsg: "Спасибо большое! 🙏", time: "Вчера", unread: 0, online: true, avatar: "СК" },
];

const MESSAGES: Record<number, Array<{ id: number; text: string; time: string; out: boolean; reactions?: string[] }>> = {
  1: [
    { id: 1, text: "Привет! Как дела с проектом?", time: "14:20", out: false },
    { id: 2, text: "Всё отлично, почти закончил основной функционал 🚀", time: "14:22", out: true },
    { id: 3, text: "Круто! Когда можно посмотреть демо?", time: "14:28", out: false, reactions: ["👀", "🔥"] },
    { id: 4, text: "Окей, давай встретимся завтра 👍", time: "14:32", out: false },
  ],
  2: [
    { id: 1, text: "Ребята, нужно обсудить архитектуру нового модуля", time: "12:00", out: false },
    { id: 2, text: "Я готов, давайте в 15:00", time: "12:05", out: true },
    { id: 3, text: "Новый релиз готов к деплою", time: "13:10", out: false, reactions: ["🎉"] },
  ],
};

const CONTACTS = [
  { id: 1, name: "Алексей Кравцов", status: "Разработчик · В сети", online: true, avatar: "АК" },
  { id: 2, name: "Дмитрий Волков", status: "Менеджер · Был в 10:00", online: false, avatar: "ДВ" },
  { id: 3, name: "Иван Петров", status: "Дизайнер · Был вчера", online: false, avatar: "ИП" },
  { id: 4, name: "Мария Соколова", status: "Аналитик · В сети", online: true, avatar: "МС" },
  { id: 5, name: "Светлана Ким", status: "UX · В сети", online: true, avatar: "СК" },
  { id: 6, name: "Юрий Новиков", status: "CEO · Не беспокоить", online: false, avatar: "ЮН" },
];

const STORIES = [
  { id: 1, name: "Мария", avatar: "МС", viewed: false, gradient: "from-[#00FFD1] to-[#7B61FF]" },
  { id: 2, name: "Алексей", avatar: "АК", viewed: false, gradient: "from-[#FF6B35] to-[#FF3E9D]" },
  { id: 3, name: "Команда", avatar: "КО", viewed: true, gradient: "from-[#00FFD1] to-[#0080FF]" },
  { id: 4, name: "Светлана", avatar: "СК", viewed: false, gradient: "from-[#FFD700] to-[#FF6B35]" },
  { id: 5, name: "Дмитрий", avatar: "ДВ", viewed: true, gradient: "from-[#7B61FF] to-[#FF3E9D]" },
];

const NOTIFICATIONS = [
  { id: 1, icon: "MessageCircle", text: "Алексей написал вам сообщение", time: "2 мин назад", read: false },
  { id: 2, icon: "Users", text: "Мария добавила вас в группу «Дизайн 2026»", time: "15 мин назад", read: false },
  { id: 3, icon: "Heart", text: "Иван поставил реакцию 🔥 на ваше сообщение", time: "1 час назад", read: false },
  { id: 4, icon: "UserPlus", text: "Светлана Ким хочет добавить вас в контакты", time: "3 часа назад", read: true },
  { id: 5, icon: "Video", text: "Пропущенный видеозвонок от Дмитрия Волкова", time: "Вчера", read: true },
  { id: 6, icon: "Shield", text: "Включено сквозное шифрование для всех чатов", time: "Вчера", read: true },
];

function Avatar({ initials, online, size = "md" }: { initials: string; online?: boolean; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-11 h-11 text-sm", lg: "w-14 h-14 text-base" };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} rounded-full bg-secondary flex items-center justify-center font-semibold text-foreground`}>
        {initials}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-neon border-2 border-background" />
      )}
    </div>
  );
}

function SearchBar({ placeholder = "Поиск..." }: { placeholder?: string }) {
  return (
    <div className="relative">
      <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        className="w-full bg-secondary rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-neon/40 transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}

function ChatsSection({ onSelectChat, selectedChat }: { onSelectChat: (id: number) => void; selectedChat: number | null }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Сообщения</h2>
          <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-neon/20 transition-colors group">
            <Icon name="Pencil" size={15} className="text-muted-foreground group-hover:text-neon transition-colors" />
          </button>
        </div>
        <SearchBar placeholder="Поиск чатов..." />
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {CHATS.map((chat, i) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all animate-fade-in group ${
              selectedChat === chat.id ? "bg-neon/10 border border-neon/20" : "hover:bg-secondary/60"
            }`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Avatar initials={chat.avatar} online={chat.online} />
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-sm font-semibold truncate ${selectedChat === chat.id ? "text-neon" : "text-foreground"}`}>
                  {chat.isGroup && <Icon name="Users" size={11} className="inline mr-1 opacity-60" />}
                  {chat.name}
                </span>
                <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{chat.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground truncate">{chat.lastMsg}</p>
                {chat.unread > 0 && (
                  <span className="ml-2 min-w-[20px] h-5 px-1.5 rounded-full neon-bg text-background text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatView({ chatId, onBack }: { chatId: number; onBack: () => void }) {
  const [msg, setMsg] = useState("");
  const chat = CHATS.find(c => c.id === chatId)!;
  const messages = MESSAGES[chatId] || [];

  return (
    <div className="flex flex-col h-full animate-slide-in-right">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border glass sticky top-0 z-10">
        <button onClick={onBack} className="md:hidden w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors mr-1">
          <Icon name="ChevronLeft" size={18} className="text-muted-foreground" />
        </button>
        <Avatar initials={chat.avatar} online={chat.online} size="sm" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{chat.name}</p>
          <p className="text-xs text-neon">{chat.online ? "В сети" : "Был недавно"}</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center transition-colors group">
            <Icon name="Phone" size={17} className="text-muted-foreground group-hover:text-neon transition-colors" />
          </button>
          <button className="w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center transition-colors group">
            <Icon name="Video" size={17} className="text-muted-foreground group-hover:text-neon transition-colors" />
          </button>
          <button className="w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center transition-colors group">
            <Icon name="MoreVertical" size={17} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        <div className="text-center mb-2">
          <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">Сегодня</span>
        </div>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.out ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[72%] relative group">
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.out ? "msg-bubble-out text-background rounded-br-sm" : "msg-bubble-in text-foreground rounded-bl-sm"}`}>
                {m.text}
              </div>
              {m.reactions && (
                <div className={`flex gap-0.5 mt-1 ${m.out ? "justify-end" : "justify-start"}`}>
                  {m.reactions.map((r, i) => (
                    <span key={i} className="text-xs bg-secondary border border-border rounded-full px-1.5 py-0.5 cursor-pointer hover:scale-110 transition-transform">
                      {r}
                    </span>
                  ))}
                </div>
              )}
              <p className={`text-xs text-muted-foreground mt-1 ${m.out ? "text-right" : "text-left"}`}>{m.time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4 pt-2">
        <div className="flex items-end gap-2 bg-secondary rounded-2xl px-3 py-2">
          <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-neon transition-colors flex-shrink-0">
            <Icon name="Paperclip" size={18} />
          </button>
          <textarea
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder="Сообщение..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none py-1.5 max-h-32"
          />
          <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-neon transition-colors flex-shrink-0">
            <Icon name="Smile" size={18} />
          </button>
          <button className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${msg.trim() ? "neon-bg text-background" : "bg-muted text-muted-foreground"}`}>
            <Icon name="Send" size={16} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-1 mt-2">
          <Icon name="Lock" size={10} className="text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground/50">Сквозное шифрование</span>
        </div>
      </div>
    </div>
  );
}

function ContactsSection() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Контакты</h2>
          <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-neon/20 transition-colors group">
            <Icon name="UserPlus" size={15} className="text-muted-foreground group-hover:text-neon transition-colors" />
          </button>
        </div>
        <SearchBar placeholder="Поиск контактов..." />
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">В сети · {CONTACTS.filter(c => c.online).length}</p>
        {CONTACTS.filter(c => c.online).map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/60 transition-all cursor-pointer animate-fade-in group" style={{ animationDelay: `${i * 40}ms` }}>
            <Avatar initials={c.avatar} online={c.online} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{c.name}</p>
              <p className="text-xs text-muted-foreground truncate">{c.status}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-neon/20 transition-colors">
                <Icon name="MessageCircle" size={14} className="text-muted-foreground" />
              </button>
              <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-neon/20 transition-colors">
                <Icon name="Phone" size={14} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
        <p className="px-3 mt-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Не в сети · {CONTACTS.filter(c => !c.online).length}</p>
        {CONTACTS.filter(c => !c.online).map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/60 transition-all cursor-pointer animate-fade-in group opacity-70 hover:opacity-100" style={{ animationDelay: `${(i + 3) * 40}ms` }}>
            <Avatar initials={c.avatar} online={false} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{c.name}</p>
              <p className="text-xs text-muted-foreground truncate">{c.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoriesSection() {
  const [activeStory, setActiveStory] = useState<number | null>(null);
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Сторис</h2>
          <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-neon/20 transition-colors group">
            <Icon name="Plus" size={15} className="text-muted-foreground group-hover:text-neon transition-colors" />
          </button>
        </div>
      </div>
      {activeStory ? (
        <div className="flex-1 flex items-center justify-center p-4 animate-scale-in">
          <div className="relative w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden bg-secondary">
            <div className={`absolute inset-0 bg-gradient-to-b ${STORIES.find(s => s.id === activeStory)?.gradient} opacity-70`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-white">{STORIES.find(s => s.id === activeStory)?.avatar}</span>
            </div>
            <div className="absolute top-4 left-4 right-4 flex gap-1">
              {STORIES.map(s => (
                <div key={s.id} className={`h-0.5 flex-1 rounded-full ${s.id === activeStory ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>
            <div className="absolute top-8 left-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold text-white">
                {STORIES.find(s => s.id === activeStory)?.avatar}
              </div>
              <span className="text-sm font-semibold text-white">{STORIES.find(s => s.id === activeStory)?.name}</span>
            </div>
            <button onClick={() => setActiveStory(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center">
              <Icon name="X" size={16} className="text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4">
          <div className="mb-6">
            <button className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 rounded-full bg-secondary border-2 border-dashed border-border group-hover:border-neon/60 flex items-center justify-center transition-colors">
                <Icon name="Plus" size={22} className="text-muted-foreground group-hover:text-neon transition-colors" />
              </div>
              <span className="text-xs text-muted-foreground">Добавить</span>
            </button>
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Непросмотренные</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {STORIES.filter(s => !s.viewed).map((story, i) => (
              <button key={story.id} onClick={() => setActiveStory(story.id)} className="relative aspect-[3/4] rounded-2xl overflow-hidden group animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className={`absolute inset-0 bg-gradient-to-b ${story.gradient}`} />
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">{story.avatar}</div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70">
                  <p className="text-xs font-semibold text-white">{story.name}</p>
                </div>
                <div className="absolute inset-0 ring-2 ring-neon rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Просмотренные</p>
          <div className="grid grid-cols-2 gap-3">
            {STORIES.filter(s => s.viewed).map((story, i) => (
              <button key={story.id} onClick={() => setActiveStory(story.id)} className="relative aspect-[3/4] rounded-2xl overflow-hidden group opacity-50 hover:opacity-75 transition-opacity animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className={`absolute inset-0 bg-gradient-to-b ${story.gradient}`} />
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">{story.avatar}</div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70">
                  <p className="text-xs font-semibold text-white">{story.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsSection() {
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">Уведомления</h2>
            {unreadCount > 0 && (
              <span className="min-w-[22px] h-5 px-1.5 rounded-full neon-bg text-background text-xs font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={() => setNotifs(n => n.map(x => ({ ...x, read: true })))} className="text-xs text-neon hover:text-neon/70 transition-colors">
              Прочитать все
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {notifs.map((n, i) => (
          <div
            key={n.id}
            onClick={() => setNotifs(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x))}
            className={`flex items-start gap-3 px-3 py-3.5 rounded-xl transition-all cursor-pointer animate-fade-in ${!n.read ? "bg-neon/5 hover:bg-neon/10" : "hover:bg-secondary/60 opacity-60 hover:opacity-80"}`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.read ? "bg-neon/15" : "bg-secondary"}`}>
              <Icon name={n.icon} fallback="Bell" size={16} className={!n.read ? "text-neon" : "text-muted-foreground"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-relaxed ${!n.read ? "text-foreground font-medium" : "text-muted-foreground"}`}>{n.text}</p>
              <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full neon-bg mt-1.5 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileSection({ userName, onRename }: { userName: string; onRename: (name: string) => void }) {
  const initials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(userName);

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onRename(trimmed);
    setEditing(false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 pb-3">
        <h2 className="text-lg font-bold text-foreground mb-4">Профиль</h2>
      </div>
      <div className="px-4">
        <div className="flex flex-col items-center py-6 mb-4">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-foreground ring-4 ring-neon/30">
              {initials}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full neon-bg flex items-center justify-center">
              <Icon name="Camera" size={12} className="text-background" />
            </div>
          </div>
          {editing ? (
            <div className="flex items-center gap-2 w-full max-w-[220px]">
              <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
                className="flex-1 bg-secondary rounded-xl px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-neon/40 text-center"
              />
              <button onClick={handleSave} className="w-7 h-7 rounded-full neon-bg flex items-center justify-center flex-shrink-0">
                <Icon name="Check" size={13} className="text-background" />
              </button>
              <button onClick={() => setEditing(false)} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Icon name="X" size={13} className="text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button onClick={() => { setDraft(userName); setEditing(true); }} className="group flex items-center gap-1.5">
              <h3 className="text-xl font-bold text-foreground group-hover:text-neon transition-colors">{userName}</h3>
              <Icon name="Pencil" size={13} className="text-muted-foreground group-hover:text-neon transition-colors mt-0.5" />
            </button>
          )}
          <p className="text-sm text-neon mt-1">@orbit_yura</p>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-[200px]">Разработчик · Люблю космос и чистый код 🚀</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Контакты", value: "128" },
            { label: "Группы", value: "12" },
            { label: "Медиа", value: "847" },
          ].map(stat => (
            <div key={stat.label} className="bg-secondary rounded-2xl py-3 px-2 text-center">
              <p className="text-xl font-bold neon-text">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {[
            { icon: "Mail", label: "Email", value: "yura@orbit.dev" },
            { icon: "Phone", label: "Телефон", value: "+7 (999) 123-45-67" },
            { icon: "MapPin", label: "Город", value: "Москва" },
          ].map(field => (
            <div key={field.label} className="flex items-center gap-3 bg-secondary/60 rounded-xl px-4 py-3">
              <Icon name={field.icon} fallback="Info" size={16} className="text-neon flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{field.label}</p>
                <p className="text-sm text-foreground font-medium">{field.value}</p>
              </div>
              <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ onLogout }: { onLogout: () => void }) {
  const [encEnabled, setEncEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const settings = [
    {
      group: "Приватность и безопасность",
      items: [
        { icon: "Lock", label: "Сквозное шифрование", desc: "Все сообщения защищены", toggle: true, value: encEnabled, onChange: setEncEnabled },
        { icon: "Fingerprint", label: "Биометрия", desc: "Разблокировка по отпечатку", toggle: true, value: biometricEnabled, onChange: setBiometricEnabled },
        { icon: "Shield", label: "Двухфакторная аутентификация", desc: "Дополнительная защита", toggle: false, value: false, onChange: () => {} },
      ]
    },
    {
      group: "Уведомления",
      items: [
        { icon: "Bell", label: "Push-уведомления", desc: "Сообщения и звонки", toggle: true, value: notifEnabled, onChange: setNotifEnabled },
        { icon: "Volume2", label: "Звук уведомлений", desc: "Orbit Sound Pack", toggle: false, value: false, onChange: () => {} },
      ]
    },
    {
      group: "Медиа",
      items: [
        { icon: "Image", label: "Автозагрузка медиа", desc: "По Wi-Fi", toggle: false, value: false, onChange: () => {} },
        { icon: "HardDrive", label: "Хранилище", desc: "1.2 ГБ использовано", toggle: false, value: false, onChange: () => {} },
      ]
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 pb-3">
        <h2 className="text-lg font-bold text-foreground mb-4">Настройки</h2>
      </div>
      <div className="px-4 space-y-5 pb-4">
        {settings.map(group => (
          <div key={group.group}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{group.group}</p>
            <div className="bg-secondary/60 rounded-2xl overflow-hidden">
              {group.items.map((item, i) => (
                <div key={item.label} className={`flex items-center gap-3 px-4 py-3.5 ${i < group.items.length - 1 ? "border-b border-border/50" : ""}`}>
                  <div className="w-8 h-8 rounded-xl bg-neon/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={item.icon} fallback="Settings" size={15} className="text-neon" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  {item.toggle ? (
                    <button
                      onClick={() => item.onChange(!item.value)}
                      className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${item.value ? "neon-bg" : "bg-muted"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-background transition-all ${item.value ? "left-6" : "left-1"}`} />
                    </button>
                  ) : (
                    <Icon name="ChevronRight" size={14} className="text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div>
          <div className="bg-secondary/60 rounded-2xl overflow-hidden">
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-destructive/10 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Icon name="LogOut" size={15} className="text-destructive" />
              </div>
              <span className="text-sm font-medium text-destructive">Выйти из аккаунта</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchSection() {
  const [query, setQuery] = useState("");
  const filtered = query.length > 0
    ? CHATS.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.lastMsg.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-3">
        <h2 className="text-lg font-bold text-foreground mb-4">Поиск</h2>
        <div className="relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-secondary rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-neon/40 transition-all"
            placeholder="Люди, сообщения, медиа..."
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {query.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <Icon name="Search" size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Начните вводить запрос для поиска среди чатов, контактов и сообщений</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <p className="text-sm text-muted-foreground">Ничего не найдено по запросу «{query}»</p>
          </div>
        ) : (
          <>
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Результаты · {filtered.length}</p>
            {filtered.map(chat => (
              <div key={chat.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/60 transition-all cursor-pointer animate-fade-in">
                <Avatar initials={chat.avatar} online={chat.online} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{chat.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{chat.lastMsg}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function LoginScreen({ onEnter }: { onEnter: (name: string) => void }) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onEnter(trimmed);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background font-golos">
      <div className="w-full max-w-sm px-6 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl neon-bg flex items-center justify-center mb-4">
            <span className="text-background font-black text-2xl">O</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Orbit Messenger</h1>
          <p className="text-sm text-muted-foreground mt-1">Как вас зовут?</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Введите ваше имя..."
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-neon/40 transition-all"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all neon-bg text-background disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Index() {
  const [userName, setUserName] = useState<string | null>(() => localStorage.getItem("orbit_user_name"));
  const [activeSection, setActiveSection] = useState("chats");
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  if (!userName) {
    return (
      <LoginScreen
        onEnter={(name) => {
          localStorage.setItem("orbit_user_name", name);
          setUserName(name);
        }}
      />
    );
  }

  const handleSelectChat = (id: number) => {
    setSelectedChat(id);
    setMobileShowChat(true);
  };

  const handleBack = () => {
    setMobileShowChat(false);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "chats": return <ChatsSection onSelectChat={handleSelectChat} selectedChat={selectedChat} />;
      case "contacts": return <ContactsSection />;
      case "stories": return <StoriesSection />;
      case "notifications": return <NotificationsSection />;
      case "profile": return <ProfileSection userName={userName} onRename={(name) => { localStorage.setItem("orbit_user_name", name); setUserName(name); }} />;
      case "settings": return <SettingsSection onLogout={() => { localStorage.removeItem("orbit_user_name"); setUserName(null); }} />;
      case "search": return <SearchSection />;
      default: return null;
    }
  };

  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden font-golos">
      {/* Sidebar nav */}
      <nav className="w-16 h-full flex flex-col items-center py-4 border-r border-border bg-card/50 z-20 flex-shrink-0">
        <div className="mb-6">
          <div className="w-9 h-9 rounded-xl neon-bg flex items-center justify-center">
            <span className="text-background font-black text-sm">O</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); setMobileShowChat(false); }}
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                activeSection === s.id ? "bg-neon/15 text-neon" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              title={s.label}
            >
              <Icon name={s.icon} fallback="Circle" size={19} />
              {activeSection === s.id && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full neon-bg" />
              )}
              {s.id === "notifications" && NOTIFICATIONS.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full neon-bg" />
              )}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1 mt-auto">
          <button
            onClick={() => { setActiveSection("search"); setMobileShowChat(false); }}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              activeSection === "search" ? "bg-neon/15 text-neon" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            title="Поиск"
          >
            <Icon name="Search" size={19} />
          </button>
        </div>
      </nav>

      {/* Panel */}
      <div className={`w-80 flex-shrink-0 h-full border-r border-border bg-card/30 overflow-hidden flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
        {renderSection()}
      </div>

      {/* Main area */}
      <div className={`flex-1 h-full overflow-hidden flex-col ${!mobileShowChat && selectedChat === null ? "hidden md:flex" : "flex"}`}>
        {selectedChat && activeSection === "chats" ? (
          <ChatView chatId={selectedChat} onBack={handleBack} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-secondary/80 flex items-center justify-center">
              <span className="text-3xl font-black neon-text">O</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Orbit Messenger</h3>
              <p className="text-sm text-muted-foreground max-w-xs">Выберите чат слева, чтобы начать общение.<br />Все сообщения защищены сквозным шифрованием.</p>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <Icon name="Lock" size={13} className="text-neon" />
              <span className="text-xs text-neon/80">End-to-end encryption enabled</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}