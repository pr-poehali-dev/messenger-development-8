import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = {
  auth: "https://functions.poehali.dev/b040de66-5e20-4906-a61b-bea7f8e3febf",
  chats: "https://functions.poehali.dev/51e8d7db-6606-418f-8a69-eaf89248651b",
  messages: "https://functions.poehali.dev/3ec21eee-9c62-46fe-9297-17ede0d20e50",
};

interface User { id: string; name: string; invite_code: string }
interface Chat { id: string; partner_id: string; partner_name: string; last_msg: string | null; last_time: string | null }
interface Message { id: number; sender_id: string; sender_name: string; text: string; created_at: string }

const SECTIONS = [
  { id: "chats", icon: "MessageCircle", label: "Чаты" },
  { id: "contacts", icon: "Users", label: "Контакты" },
  { id: "profile", icon: "User", label: "Профиль" },
  { id: "settings", icon: "Settings", label: "Настройки" },
];

function Avatar({ name, size = "md", online }: { name: string; size?: "sm" | "md" | "lg"; online?: boolean }) {
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-11 h-11 text-sm", lg: "w-14 h-14 text-base" };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} rounded-full bg-secondary flex items-center justify-center font-semibold text-foreground`}>
        {initials}
      </div>
      {online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-neon border-2 border-background" />}
    </div>
  );
}

// ——— Login Screen ———
function LoginScreen({ onEnter }: { onEnter: (user: User) => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    const res = await fetch(API.auth, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.id) {
      localStorage.setItem("orbit_user", JSON.stringify(data));
      onEnter(data);
    }
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
            disabled={!name.trim() || loading}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all neon-bg text-background disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          >
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ——— Chats Section ———
function ChatsSection({ user, onSelectChat, selectedChatId, onUnreadChange }: {
  user: User;
  onSelectChat: (chat: Chat) => void;
  selectedChatId: string | null;
  onUnreadChange: (count: number) => void;
}) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}${window.location.pathname}?invite=${user.invite_code}`;

  const getReadTimes = (): Record<string, string> => {
    try { return JSON.parse(localStorage.getItem("orbit_read_times") || "{}"); } catch { return {}; }
  };

  const loadChats = useCallback(async () => {
    const res = await fetch(`${API.chats}?user_id=${user.id}`);
    const data = await res.json();
    if (data.chats) {
      setChats(data.chats);
      const readTimes = getReadTimes();
      const count = data.chats.filter((c: Chat) => {
        if (!c.last_time) return false;
        if (c.id === selectedChatId) return false;
        const read = readTimes[c.id];
        return !read || new Date(c.last_time) > new Date(read);
      }).length;
      onUnreadChange(count);
    }
  }, [user.id, selectedChatId, onUnreadChange]);

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 5000);
    return () => clearInterval(interval);
  }, [loadChats]);

  const markRead = (chatId: string) => {
    const times = getReadTimes();
    times[chatId] = new Date().toISOString();
    localStorage.setItem("orbit_read_times", JSON.stringify(times));
  };

  const handleSelectChat = (chat: Chat) => {
    markRead(chat.id);
    onSelectChat(chat);
  };

  const handleAddChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteInput.trim().replace(/.*invite=/, "");
    if (!code) return;
    setInviteLoading(true);
    setInviteError("");
    const res = await fetch(API.chats, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, invite_code: code }),
    });
    const data = await res.json();
    setInviteLoading(false);
    if (data.error) {
      setInviteError(data.error === "invite code not found" ? "Код не найден" : data.error === "cannot chat with yourself" ? "Нельзя написать самому себе" : data.error);
    } else {
      setShowInvite(false);
      setInviteInput("");
      loadChats();
      const chat = { id: data.id, partner_id: data.partner_id, partner_name: data.partner_name, last_msg: null, last_time: null };
      markRead(data.id);
      onSelectChat(chat);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
    return "Вчера";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Сообщения</h2>
          <button
            onClick={() => setShowInvite(v => !v)}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-neon/20 transition-colors group"
            title="Добавить чат по ссылке"
          >
            <Icon name="Pencil" size={15} className="text-muted-foreground group-hover:text-neon transition-colors" />
          </button>
        </div>

        {showInvite && (
          <div className="mb-4 space-y-3 animate-fade-in">
            <div className="bg-secondary/60 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-2">Ваша ссылка-приглашение:</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-neon font-mono flex-1 truncate">{inviteLink}</p>
                <button onClick={handleCopy} className="flex-shrink-0 text-xs px-2 py-1 rounded-lg neon-bg text-background font-medium">
                  {copied ? "Скопировано!" : "Копировать"}
                </button>
              </div>
            </div>
            <form onSubmit={handleAddChat} className="space-y-2">
              <input
                value={inviteInput}
                onChange={e => setInviteInput(e.target.value)}
                placeholder="Вставьте ссылку или код приглашения..."
                className="w-full bg-secondary rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-neon/40"
              />
              {inviteError && <p className="text-xs text-destructive px-1">{inviteError}</p>}
              <button
                type="submit"
                disabled={!inviteInput.trim() || inviteLoading}
                className="w-full py-2 rounded-xl text-sm font-semibold neon-bg text-background disabled:opacity-40"
              >
                {inviteLoading ? "Поиск..." : "Начать чат"}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 pb-16">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <Icon name="MessageCircle" size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Нет чатов. Поделитесь своей ссылкой-приглашением или вставьте ссылку собеседника.</p>
            <button onClick={() => setShowInvite(true)} className="text-xs text-neon hover:underline">
              Добавить чат
            </button>
          </div>
        ) : (
          chats.map((chat, i) => (
            <button
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all animate-fade-in group ${
                selectedChatId === chat.id ? "bg-neon/10 border border-neon/20" : "hover:bg-secondary/60"
              }`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Avatar name={chat.partner_name} />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-sm font-semibold truncate ${selectedChatId === chat.id ? "text-neon" : "text-foreground"}`}>
                    {chat.partner_name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{formatTime(chat.last_time)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground truncate">{chat.last_msg || "Нет сообщений"}</p>
                  {(() => {
                    if (!chat.last_time || chat.id === selectedChatId) return null;
                    const read = getReadTimes()[chat.id];
                    const hasUnread = !read || new Date(chat.last_time) > new Date(read);
                    return hasUnread ? <span className="ml-2 w-2.5 h-2.5 rounded-full neon-bg flex-shrink-0" /> : null;
                  })()}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function useNotifications(partnerName: string) {
  const audioCtx = useRef<AudioContext | null>(null);

  const playSound = useCallback(() => {
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext();
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { void e; }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") await Notification.requestPermission();
  }, []);

  const notify = useCallback((text: string) => {
    playSound();
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (document.visibilityState === "visible") return;
    new Notification(partnerName, { body: text, icon: "/favicon.ico" });
  }, [partnerName, playSound]);

  return { requestPermission, notify };
}

// ——— Chat View ———
function ChatView({ chat, user, onBack }: { chat: Chat; user: User; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);
  const isFirstLoad = useRef(true);
  const { requestPermission, notify } = useNotifications(chat.partner_name);

  useEffect(() => { requestPermission(); }, [requestPermission]);

  const loadMessages = useCallback(async () => {
    const res = await fetch(`${API.messages}?chat_id=${chat.id}&since_id=${lastIdRef.current}`);
    const data = await res.json();
    if (data.messages && data.messages.length > 0) {
      setMessages(prev => {
        const merged = [...prev];
        for (const m of data.messages) {
          if (!merged.find(x => x.id === m.id)) merged.push(m);
        }
        return merged;
      });
      if (!isFirstLoad.current) {
        for (const m of data.messages) {
          if (m.sender_id !== user.id) notify(m.text);
        }
      }
      lastIdRef.current = data.messages[data.messages.length - 1].id;
      isFirstLoad.current = false;
    } else {
      isFirstLoad.current = false;
    }
  }, [chat.id, user.id, notify]);

  useEffect(() => {
    setMessages([]);
    lastIdRef.current = 0;
    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = msg.trim();
    if (!text || sending) return;
    setSending(true);
    setMsg("");
    await fetch(API.messages, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat.id, sender_id: user.id, text }),
    });
    setSending(false);
    loadMessages();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-full animate-slide-in-right">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border glass sticky top-0 z-10">
        <button onClick={onBack} className="md:hidden w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors mr-1">
          <Icon name="ChevronLeft" size={18} className="text-muted-foreground" />
        </button>
        <Avatar name={chat.partner_name} size="sm" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{chat.partner_name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Нет сообщений. Напишите первым!</p>
          </div>
        )}
        {messages.map((m) => {
          const isOut = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[72%]">
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isOut ? "msg-bubble-out text-background rounded-br-sm" : "msg-bubble-in text-foreground rounded-bl-sm"}`}>
                  {m.text}
                </div>
                <p className={`text-xs text-muted-foreground mt-1 ${isOut ? "text-right" : "text-left"}`}>{formatTime(m.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-4 pt-2">
        <div className="flex items-end gap-2 bg-secondary rounded-2xl px-3 py-2">
          <textarea
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Сообщение..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none py-1.5 max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={!msg.trim() || sending}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${msg.trim() ? "neon-bg text-background" : "bg-muted text-muted-foreground"}`}
          >
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

// ——— Profile Section ———
function ProfileSection({ user, onRename }: { user: User; onRename: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user.name);
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}${window.location.pathname}?invite=${user.invite_code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
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
          <Avatar name={user.name} size="lg" />
          <div className="mt-4">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
                  className="bg-secondary rounded-xl px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-neon/40 text-center"
                />
                <button onClick={handleSave} className="w-7 h-7 rounded-full neon-bg flex items-center justify-center">
                  <Icon name="Check" size={13} className="text-background" />
                </button>
                <button onClick={() => setEditing(false)} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                  <Icon name="X" size={13} className="text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button onClick={() => { setDraft(user.name); setEditing(true); }} className="group flex items-center gap-1.5">
                <h3 className="text-xl font-bold text-foreground group-hover:text-neon transition-colors">{user.name}</h3>
                <Icon name="Pencil" size={13} className="text-muted-foreground group-hover:text-neon transition-colors mt-0.5" />
              </button>
            )}
          </div>
        </div>

        <div className="bg-secondary/60 rounded-xl p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-2">Ваша ссылка-приглашение:</p>
          <p className="text-xs text-neon font-mono break-all mb-3">{inviteLink}</p>
          <button onClick={handleCopy} className="w-full py-2 rounded-xl neon-bg text-background text-sm font-semibold">
            {copied ? "Скопировано!" : "Скопировать ссылку"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ——— Settings Section ———
function SettingsSection({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 pb-3">
        <h2 className="text-lg font-bold text-foreground mb-4">Настройки</h2>
      </div>
      <div className="px-4 pb-4">
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
  );
}

// ——— Main App ———
export default function Index() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("orbit_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [activeSection, setActiveSection] = useState("chats");
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Обработка invite-ссылки в URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    if (invite) {
      localStorage.setItem("orbit_pending_invite", invite);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // После входа — открыть чат по pending invite
  useEffect(() => {
    if (!user) return;
    const invite = localStorage.getItem("orbit_pending_invite");
    if (!invite) return;
    localStorage.removeItem("orbit_pending_invite");
    fetch(API.chats, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, invite_code: invite }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.id) {
          setSelectedChat({ id: data.id, partner_id: data.partner_id, partner_name: data.partner_name, last_msg: null, last_time: null });
          setActiveSection("chats");
          setMobileShowChat(true);
        }
      });
  }, [user]);

  if (!user) {
    return <LoginScreen onEnter={(u) => setUser(u)} />;
  }

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setMobileShowChat(true);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "chats": return <ChatsSection user={user} onSelectChat={handleSelectChat} selectedChatId={selectedChat?.id ?? null} onUnreadChange={setUnreadCount} />;
      case "profile": return (
        <ProfileSection
          user={user}
          onRename={(name) => {
            const updated = { ...user, name };
            localStorage.setItem("orbit_user", JSON.stringify(updated));
            setUser(updated);
          }}
        />
      );
      case "settings": return (
        <SettingsSection
          onLogout={() => {
            localStorage.removeItem("orbit_user");
            setUser(null);
          }}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden font-golos">
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
              {s.id === "chats" && unreadCount > 0 && activeSection !== "chats" && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full neon-bg text-background text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <div className={`w-80 flex-shrink-0 h-full border-r border-border bg-card/30 overflow-hidden flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
        {renderSection()}
      </div>

      <div className={`flex-1 h-full overflow-hidden flex-col ${!mobileShowChat && selectedChat === null ? "hidden md:flex" : "flex"}`}>
        {selectedChat && activeSection === "chats" ? (
          <ChatView chat={selectedChat} user={user} onBack={() => setMobileShowChat(false)} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-secondary/80 flex items-center justify-center">
              <span className="text-3xl font-black neon-text">O</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Orbit Messenger</h3>
              <p className="text-sm text-muted-foreground max-w-xs">Выберите чат или поделитесь ссылкой-приглашением, чтобы начать общение.</p>
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