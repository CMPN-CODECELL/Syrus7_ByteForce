import { useEffect, useLayoutEffect, useRef, useState } from "react";
import campuslyMark from "./assets/campusly-logo.png";
import defaultAvatar from "./assets/default-avatar.svg";
import { signInUser, signUpUser, signOutUser, updateUserPassword, isSupabaseConfigured } from "./lib/supabase";
import {
  fetchPosts,
  createPost,
  deleteUserAccount,
  votePost,
  addPostReply,
  deletePostReply,
  deletePost,
  uploadFilesToMongoDB,
  fetchCommunities,
  createCommunity,
  toggleCommunityMembership,
  fetchMarketplace,
  createProduct,
  toggleSaveProduct,
  fetchOpportunities,
  createOpportunity,
  applyOpportunity,
  toggleSaveOpportunity,
  fetchConversations,
  fetchMessages,
  sendChatMessage,
  deleteChatMessage,
  deleteConversation,
  fetchCommunityMessages,
  sendCommunityMessage,
  deleteCommunityMessage,
  syncUserProfile,
  fetchCampusUsers,
  moderateContent,
  semanticSearchPosts,
  summarizeThread,
  getStoredGeminiKey,
  saveStoredGeminiKey,
  getStoredGroqKey,
  saveStoredGroqKey,
  RealtimeChatClient,
  type Post,
  type Community,
  type CommunityMessage,
  type Product,
  type Opportunity,
  type Conversation,
  type ChatMessage,
  type FileAttachment,
} from "./lib/api";

type Page = "Home" | "Communities" | "Chats" | "Opportunities" | "Marketplace" | "Profile" | "Settings";

interface UserProfile {
  id?: string;
  email: string;
  name: string;
  college: string;
  avatar?: string;
  username?: string;
  year?: string;
  branch?: string;
}

type IconName =
  | "home" | "users" | "briefcase" | "store" | "user" | "search" | "sparkles"
  | "bell" | "plus" | "sun" | "moon" | "arrowUp" | "arrowDown" | "message"
  | "bookmark" | "flag" | "check" | "chevron" | "book" | "clock" | "close"
  | "send" | "more" | "pin" | "shield" | "calendar" | "filter" | "edit"
  | "eye" | "eyeOff" | "trash" | "smile";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></>,
    store: <><path d="M3 9 5 3h14l2 6"/><path d="M5 13v8h14v-8"/><path d="M9 21v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z"/><path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14ZM5 13l.8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8L5 13Z"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    sun: <><circle className="sun-core" cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></>,
    moon: <><path className="moon-body" d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" fill="currentColor"/><circle className="moon-crater" cx="9" cy="9" r="1.2"/><circle className="moon-crater" cx="8" cy="14" r=".8"/><circle className="moon-crater" cx="13" cy="16" r="1"/></>,
    arrowUp: <><path d="m6 10 6-6 6 6M12 4v16"/></>,
    arrowDown: <><path d="m6 14 6 6 6-6M12 20V4"/></>,
    message: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z"/>,
    flag: <><path d="M5 22V4"/><path d="M5 4h12l-2 4 2 4H5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    pin: <><path d="m12 17 0 5"/><path d="M5 12h14l-3-3V4l2-2H6l2 2v5Z"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    filter: <path d="M4 5h16M7 12h10M10 19h4"/>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    eye: <><path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
    eyeOff: <><path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.5 5.8A10.7 10.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16.4 16.4 0 0 1-2.1 3.1M6.2 6.2C3.7 8 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1 0 2-.2 2.8-.5"/></>,
    trash: <><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>,
    smile: <><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function GoogleIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/>
    <path fill="#FBBC05" d="M5.84 14.09A6.8 6.8 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A10.98 10.98 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"/>
  </svg>;
}

function Button({ children, variant = "primary", icon, onClick, type = "button", className = "", disabled = false, loading = false }: {
  children?: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "icon";
  icon?: IconName; onClick?: () => void; type?: "button" | "submit"; className?: string; disabled?: boolean; loading?: boolean;
}) {
  return <button type={type} className={`btn btn-${variant} ${className}`} onClick={onClick} disabled={disabled || loading}>{loading ? <span className="button-spinner"/> : icon && <Icon name={icon} size={18}/>} {loading ? "Working…" : children}</button>;
}

const nav: { name: Page; icon: IconName }[] = [
  { name: "Home", icon: "home" }, { name: "Communities", icon: "users" },
  { name: "Chats", icon: "message" },
  { name: "Opportunities", icon: "briefcase" }, { name: "Marketplace", icon: "store" },
];

function Header({ dark, setDark, onPost, notificationsOpen, onNotifications, notificationCount, onClearNotifications, query, setQuery, onNavigate, onSignOut, currentUser }: { dark: boolean; setDark: (v: boolean) => void; onPost: () => void; notificationsOpen: boolean; onNotifications: () => void; notificationCount: number; onClearNotifications: () => void; query: string; setQuery: (value: string) => void; onNavigate: (page: Page) => void; onSignOut: () => void; currentUser: UserProfile | null }) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const closeMenu = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  const chooseAccountAction = (action: () => void) => {
    setAccountMenuOpen(false);
    action();
  };

  return <header className="topbar">
    <div className="mobile-logo"><Logo/></div>
    <div className="search-wrap">
      <Icon name="search" size={18}/>
      <input aria-label="Search Campusly" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search posts, topics, campus resources..." />
    </div>
    <div className="top-actions">
      <Button variant="icon" onClick={() => setDark(!dark)} icon={dark ? "sun" : "moon"} className={`desktop-theme ${dark ? "theme-dark" : "theme-light"}`}/>
      <button className="icon-button notification" aria-label={`${notificationCount} pending notifications`} aria-expanded={notificationsOpen} onClick={() => { setAccountMenuOpen(false); onNotifications(); }}><Icon name="bell" size={20}/>{notificationCount > 0 && <span className="notification-badge">{notificationCount > 99 ? "99+" : notificationCount}</span>}</button>
      <Button icon="plus" onClick={onPost} className="new-post">New Post</Button>
      <div className="account-menu-wrap" ref={accountMenuRef}>
        <button className="avatar profile-button" aria-label="Open account menu" aria-haspopup="menu" aria-expanded={accountMenuOpen} onClick={() => { const nextOpen = !accountMenuOpen; setAccountMenuOpen(nextOpen); if (nextOpen && notificationsOpen) onNotifications(); }}>
          <img src={defaultAvatar} alt="Profile avatar"/>
        </button>
        <div className={accountMenuOpen ? "account-menu open" : "account-menu"} role="menu" aria-hidden={!accountMenuOpen}>
          <div style={{ padding: "6px 10px 8px", borderBottom: "1px solid var(--line)", fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>
            {currentUser?.email || "Student"}
          </div>
          <button role="menuitem" tabIndex={accountMenuOpen ? 0 : -1} onClick={() => chooseAccountAction(() => onNavigate("Profile"))}><Icon name="user" size={17}/><span>Profile</span></button>
          <button role="menuitem" tabIndex={accountMenuOpen ? 0 : -1} onClick={() => chooseAccountAction(() => onNavigate("Settings"))}><Icon name="edit" size={17}/><span>Settings</span></button>
          <button className="account-menu-logout" role="menuitem" tabIndex={accountMenuOpen ? 0 : -1} onClick={() => chooseAccountAction(onSignOut)}><Icon name="chevron" size={17}/><span>Log Out</span></button>
        </div>
      </div>
      {notificationsOpen && <div className="notification-popover"><EmptyState icon="bell" title={notificationCount ? `${notificationCount} new alerts` : "No notifications yet"} copy={notificationCount ? "Your pending real-time campus updates are ready to review." : "Updates and real-time activity will appear here."} action={notificationCount ? "Mark as read" : "Explore campus"} onAction={notificationCount ? onClearNotifications : onNotifications} compact/></div>}
    </div>
  </header>;
}

function Logo() {
  return <div className="logo"><span className="logo-mark"><img src={campuslyMark} alt="CAMPUSLY logo"/></span><span>campus<span>ly</span></span></div>;
}

function PageTransitionLoader() {
  return <div className="page-loader" role="status" aria-live="polite" aria-label="Loading page">
    <span className="page-loader-orbit" aria-hidden="true"/>
    <span className="page-loader-mark"><img src={campuslyMark} alt="Campusly"/></span>
  </div>;
}

function Sidebar({ page, setPage, onAI }: { page: Page; setPage: (p: Page) => void; onAI: () => void }) {
  const activeIndex = nav.findIndex(item => item.name === page);

  return <aside className="sidebar">
    <Logo/>
    <nav className="side-nav">
      <p className="eyebrow">DISCOVER</p>
      <div className="side-nav-list">
        {activeIndex >= 0 && <span className="side-nav-indicator" style={{ transform: `translateY(${activeIndex * 52}px)` }} aria-hidden="true"/>}
        {nav.map(item => <button key={item.name} onClick={() => setPage(item.name)} className={page === item.name ? "nav-item active" : "nav-item"}><Icon name={item.icon}/><span>{item.name}</span></button>)}
      </div>
    </nav>
    <div className="side-bottom">
      <div className="study-card">
        <span><Icon name="sparkles" size={18}/></span>
        <strong>Real-time Chats</strong>
        <p>Syncs across devices with MongoDB and WebSockets.</p>
        <button onClick={onAI}>Open Chats <Icon name="chevron" size={14}/></button>
      </div>
    </div>
  </aside>;
}

function SectionTitle({ eyebrow, title, copy, action }: { eyebrow?: string; title: string; copy: string; action?: React.ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <p className="blue-eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{copy}</p></div>{action}</div>;
}

function EmptyState({ icon, title, copy, action, onAction, compact = false }: {
  icon: IconName; title: string; copy: string; action: string; onAction?: () => void; compact?: boolean;
}) {
  return <div className={compact ? "section-empty compact" : "section-empty"}>
    <span><Icon name={icon} size={compact ? 20 : 24}/></span>
    <h2>{title}</h2>
    <p>{copy}</p>
    <Button onClick={onAction}>{action}</Button>
  </div>;
}

function SlidingChips({ items, active, setActive }: { items: string[]; active: string; setActive: (v: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ x: 0, width: 0, height: 0, ready: false });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const activeButton = container.querySelector<HTMLButtonElement>(`[data-chip="${CSS.escape(active)}"]`);
      if (!activeButton) return;
      setIndicator({
        x: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
        height: activeButton.offsetHeight,
        ready: true,
      });
      activeButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [active]);

  return <div className="chips sliding-chips" ref={containerRef}>
    <span className={indicator.ready ? "chip-indicator ready" : "chip-indicator"} style={{ width: indicator.width, height: indicator.height, transform: `translateX(${indicator.x}px)` }} aria-hidden="true"/>
    {items.map(item => <button key={item} data-chip={item} className={active === item ? "chip active" : "chip"} onClick={() => setActive(item)}>{item}</button>)}
  </div>;
}

function CategoryChips({ active, setActive }: { active: string; setActive: (v: string) => void }) {
  const categories = ["For you", "DSA", "Study Material", "Exam Material", "Internships", "Academics", "Hackathons", "AI / ML", "Campus Life"];
  return <SlidingChips items={categories} active={active} setActive={setActive}/>;
}

function VoteBox({ votes, onVote }: { votes: number; onVote: (type: "up" | "down") => void }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const handleVote = (type: "up" | "down") => {
    const next = vote === type ? null : type;
    setVote(next);
    onVote(type);
  };
  return <div className="vote-box">
    <button className={vote === "up" ? "voted" : ""} onClick={() => handleVote("up")} aria-label="Upvote"><Icon name="arrowUp" size={17}/></button>
    <strong>{votes + (vote === "up" ? 1 : vote === "down" ? -1 : 0)}</strong>
    <button className={vote === "down" ? "downvoted" : ""} onClick={() => handleVote("down")} aria-label="Downvote"><Icon name="arrowDown" size={17}/></button>
  </div>;
}

function PostCard({ post, onReport, onFeedback, currentUser, onStartChat, onDeletePost }: { post: Post; onReport: () => void; onFeedback: (message: string) => void; currentUser: UserProfile | null; onStartChat?: (email: string, name: string) => void; onDeletePost?: (postId: string) => void }) {
  const [saved, setSaved] = useState(false);
  const [threadOpen, setThreadOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [replies, setReplies] = useState<Array<{ text: string; author: string; avatar: string; color: string }>>(post.replies || []);

  const myPostIds: string[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("campusly_my_posts") || "[]");
    } catch {
      return [];
    }
  })();

  const isMyPost = Boolean(
    currentUser && (
      (post.authorEmail && post.authorEmail === currentUser.email) ||
      (post._id && myPostIds.includes(post._id)) ||
      post.author === currentUser.name ||
      (currentUser.username && (post.author === currentUser.username || post.author === `@${currentUser.username}`)) ||
      post.author === currentUser.email?.split("@")[0]
    )
  );

  const handleVote = async (type: "up" | "down") => {
    if (!post._id) return;
    try {
      await votePost(post._id, type, currentUser?.email || "guest");
    } catch {
      onFeedback("Vote failed");
    }
  };

  const handleReplyAdded = (newReply: { text: string; author: string; avatar: string; color: string }) => {
    setReplies(cur => [...cur, newReply]);
    post.comments = (post.comments || 0) + 1;
  };

  const handleReplyDeleted = (replyText: string) => {
    setReplies(cur => cur.filter(r => r.text !== replyText));
    post.comments = Math.max(0, (post.comments || 1) - 1);
    onFeedback("Comment removed from discussion");
  };

  return <article className="post-card">
    <div className="post-votes"><VoteBox votes={post.votes} onVote={handleVote}/></div>
    <div className="post-content">
      <div className="author-row">
        <span className={`avatar ${post.color || "avatar-blue"}`}>{post.avatar || "A"}</span>
        <div>
          <strong>{post.author}</strong>
          {post.author === "Anonymous" && isMyPost && (
            <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "6px", background: "rgba(255, 90, 0, 0.15)", color: "var(--blue)", fontWeight: 700, marginLeft: "6px" }}>
              Your Anonymous Post
            </span>
          )}
          {post.verified && <span className="verified"><Icon name="check" size={10}/> Verified Senior</span>}
          <small>{post.time || "Just now"} · {post.college}</small>
        </div>
        <div className="post-menu-wrap">
          <button className="more-button" aria-label="Post actions" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name="more" size={19}/></button>
          {menuOpen && <div className="post-menu">
            <button onClick={() => { void navigator.clipboard?.writeText(post.title); setMenuOpen(false); onFeedback("Post title copied"); }}>Copy title</button>
            <button onClick={() => { setMenuOpen(false); setSaved(!saved); onFeedback(saved ? "Removed from saved posts" : "Post saved"); }}>{saved ? "Remove saved" : "Save post"}</button>
            {post.authorEmail && post.authorEmail !== currentUser?.email && onStartChat && (
              <button onClick={() => { setMenuOpen(false); onStartChat(post.authorEmail!, post.author); }}>
                Message {post.author}
              </button>
            )}
            {isMyPost && post._id && (
              <button
                style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "6px" }}
                onClick={async () => {
                  setMenuOpen(false);
                  const confirmMsg = post.author === "Anonymous"
                    ? "Are you sure you want to delete your anonymous post?"
                    : "Are you sure you want to delete this discussion post?";
                  if (!confirm(confirmMsg)) return;
                  try {
                    await deletePost(post._id!, currentUser?.name, currentUser?.email);
                    onDeletePost?.(post._id!);
                    onFeedback(post.author === "Anonymous" ? "Your anonymous post was deleted" : "Discussion post deleted");
                  } catch {
                    onFeedback("Failed to delete discussion");
                  }
                }}
              >
                <Icon name="trash" size={14}/>
                <span>{post.author === "Anonymous" ? "Delete anonymous post" : "Delete discussion"}</span>
              </button>
            )}
          </div>}
        </div>
      </div>
      {post.aiScore !== undefined && post.aiScore > 0 && (
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "3px 10px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(168, 85, 247, 0.12))",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          color: "var(--text)",
          fontSize: "11px",
          fontWeight: 600,
          marginBottom: "8px",
        }}>
          <span style={{ color: "#38bdf8", display: "flex" }}><Icon name="sparkles" size={13}/></span>
          <span style={{ color: "#38bdf8", fontWeight: 700 }}>AI Match ({post.aiScore}%)</span>
          {post.aiReason && <span style={{ color: "var(--muted)" }}>· {post.aiReason}</span>}
        </div>
      )}
      <h2>{post.title}</h2>
      {post.body && <p className="post-body">{post.body}</p>}
      {post.attachments && post.attachments.length > 0 && <div className="post-attachments">
        {post.attachments.map((att, idx) => {
          if (att.type === "image") {
            return <img key={`${att.url}-${idx}`} src={att.url} alt={att.name}/>;
          }
          if (att.type === "audio") {
            return <audio key={`${att.url}-${idx}`} controls src={att.url}>Your browser does not support audio playback.</audio>;
          }
          if (att.type === "pdf") {
            return <a key={`${att.url}-${idx}`} href={att.url} target="_blank" rel="noreferrer" className="attachment-pdf">
              <Icon name="book" size={16}/>
              <span>{att.name}</span>
            </a>;
          }
          return <a key={`${att.url}-${idx}`} href={att.url} target="_blank" rel="noreferrer">
            <Icon name="chevron" size={15}/>
            <span>{att.name}</span>
          </a>;
        })}
      </div>}
      {post.tags && post.tags.length > 0 && <div className="tags">{post.tags.map(t => <span key={t}>{t}</span>)}</div>}
      <div className="post-footer">
        <button onClick={() => setThreadOpen(!threadOpen)}><Icon name="message" size={17}/>{threadOpen ? "Hide thread" : `View thread (${replies.length || post.comments || 0})`}</button>
        <button className={saved ? "saved" : ""} onClick={() => { setSaved(!saved); onFeedback(saved ? "Removed from saved posts" : "Post saved"); }}><Icon name="bookmark" size={17}/>{saved ? "Saved" : "Save"}</button>
        <button onClick={onReport}><Icon name="flag" size={16}/>Report</button>
      </div>
      {threadOpen && (
        <Discussion
          postId={post._id}
          postTitle={post.title}
          postBody={post.body}
          existingReplies={replies}
          onReplyAdded={handleReplyAdded}
          onReplyDeleted={handleReplyDeleted}
          currentUser={currentUser}
          onFeedback={onFeedback}
        />
      )}
    </div>
  </article>;
}

function Discussion({
  postId,
  postTitle,
  postBody,
  existingReplies,
  onReplyAdded,
  onReplyDeleted,
  currentUser,
  onFeedback,
}: {
  postId?: string;
  postTitle?: string;
  postBody?: string;
  existingReplies: Array<{ text: string; author: string; avatar: string; color: string }>;
  onReplyAdded: (r: { text: string; author: string; avatar: string; color: string }) => void;
  onReplyDeleted?: (replyText: string) => void;
  currentUser: UserProfile | null;
  onFeedback?: (msg: string) => void;
}) {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<{ summary: string; keyTakeaways: string[]; consensus: string; poweredBy?: string } | null>(null);

  const handleGenerateSummary = async () => {
    if (summaryLoading) return;
    setSummaryLoading(true);
    try {
      const res = await summarizeThread(postTitle || 'Campus Discussion', postBody || '', existingReplies);
      setSummaryData(res);
      setSummaryOpen(true);
      onFeedback?.(`✨ Thread summary generated (${res.poweredBy || 'Google Gemini AI'})`);
    } catch {
      onFeedback?.("Could not generate thread summary at this time");
    } finally {
      setSummaryLoading(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);

    // AI Safety Moderation Check with Gemini
    try {
      const mod = await moderateContent(reply.trim(), '', 'comment');
      if (mod.flagged && (mod.severity === 'high' || mod.severity === 'medium')) {
        onFeedback?.(`⚠️ AI Safety Alert: Comment flagged for ${mod.categories.join(', ')} (${mod.reason})`);
        const proceed = confirm(`⚠️ AI Moderation Warning (${mod.poweredBy || 'Google Gemini AI'}):\n\nYour comment was flagged for ${mod.categories.join(', ')}:\n"${mod.reason}"\n\nDo you want to post this comment anyway?`);
        if (!proceed) {
          setSending(false);
          return;
        }
      }
    } catch {
      // Don't block if moderation service is busy
    }

    const author = currentUser?.username ? `@${currentUser.username}` : (currentUser?.name || currentUser?.email?.split("@")[0] || "Student");
    const avatar = author.replace(/^@/, "").charAt(0).toUpperCase() || "S";
    const color = "avatar-blue";
    try {
      if (postId) {
        await addPostReply(postId, reply.trim(), author, avatar, color);
      }
      onReplyAdded({ text: reply.trim(), author, avatar, color });
      setReply("");
    } catch (err) {
      console.error("Failed to post reply:", err);
    } finally {
      setSending(false);
    }
  };

  return <div className="discussion">
    <div className="thread-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <Icon name="message" size={15}/>
        <strong>Discussion Thread</strong>
        <span>{existingReplies.length ? `${existingReplies.length} ${existingReplies.length === 1 ? "reply" : "replies"}` : "No replies yet"}</span>
      </div>
      <button
        type="button"
        onClick={handleGenerateSummary}
        disabled={summaryLoading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "3px 9px",
          borderRadius: "8px",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          background: "linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(168, 85, 247, 0.12))",
          color: "#38bdf8",
          fontSize: "11px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        <Icon name="sparkles" size={13}/>
        {summaryLoading ? "Gemini Summarizing..." : summaryOpen ? "Refresh AI Summary" : "✨ AI Thread Summary"}
      </button>
    </div>

    {/* Gemini AI Thread Summary Card */}
    {summaryOpen && summaryData && (
      <div style={{
        padding: "14px 16px",
        borderRadius: "12px",
        background: "linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(99, 102, 241, 0.08))",
        border: "1px solid rgba(56, 189, 248, 0.25)",
        marginBottom: "14px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#38bdf8", display: "flex" }}><Icon name="sparkles" size={15}/></span>
            <strong style={{ fontSize: "13px", color: "var(--text)" }}>Gemini Thread Summary</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px", background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8" }}>
              {summaryData.poweredBy || "Google Gemini"}
            </span>
            <button
              type="button"
              onClick={() => setSummaryOpen(false)}
              style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "11px" }}
              aria-label="Close summary"
            >
              <Icon name="close" size={13}/>
            </button>
          </div>
        </div>
        <p style={{ margin: "0 0 10px", fontSize: "12px", lineHeight: 1.5, color: "var(--text)" }}>
          {summaryData.summary}
        </p>
        {summaryData.keyTakeaways && summaryData.keyTakeaways.length > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <strong style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Key Student Takeaways:</strong>
            <ul style={{ margin: "4px 0 0", paddingLeft: "18px", fontSize: "12px", color: "var(--text)" }}>
              {summaryData.keyTakeaways.map((point, idx) => (
                <li key={idx} style={{ marginBottom: "3px" }}>{point}</li>
              ))}
            </ul>
          </div>
        )}
        {summaryData.consensus && (
          <div style={{ padding: "6px 10px", borderRadius: "8px", background: "var(--surface)", fontSize: "11px", color: "var(--muted)" }}>
            <strong>Consensus: </strong>{summaryData.consensus}
          </div>
        )}
      </div>
    )}

    {existingReplies.length ? (
      <div className="session-replies">
        {existingReplies.map((item, index) => {
          const isMyReply = Boolean(
            currentUser && (
              item.author === currentUser.name ||
              (currentUser.username && (item.author === currentUser.username || item.author === `@${currentUser.username}`)) ||
              item.author === currentUser.email?.split("@")[0]
            )
          );
          return (
            <div key={`${item.text}-${index}`} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "8px" }}>
              <span className={`avatar ${item.color || "avatar-blue"}`} style={{ width: "26px", height: "26px", fontSize: "10px" }}>{item.avatar || "S"}</span>
              <div style={{ margin: 0, padding: "8px 12px", borderRadius: "10px", background: "var(--surface-2)", flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.4 }}>
                  <strong>{item.author}: </strong>{item.text}
                </p>
                {isMyReply && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (postId) {
                        await deletePostReply(postId, item.text, item.author, currentUser?.email).catch(console.error);
                      }
                      onReplyDeleted?.(item.text);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      padding: "2px 6px",
                      marginLeft: "8px",
                      opacity: 0.7,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
                    title="Delete your comment from discussion"
                  >
                    <Icon name="trash" size={13}/>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <p className="thread-empty-copy">Be the first to share a helpful reply with your campus peers.</p>
    )}
    <div className="reply-box">
      <span className="avatar avatar-blue">{currentUser?.name?.charAt(0) || "U"}</span>
      <input value={reply} onChange={event => setReply(event.target.value)} onKeyDown={event => { if (event.key === "Enter") sendReply(); }} placeholder="Add a comment to this discussion..." />
      <button aria-label="Send reply" disabled={!reply.trim() || sending} onClick={sendReply}><Icon name="send" size={17}/></button>
    </div>
  </div>;
}

function Home({ posts, onReport, onCreate, query, onClearSearch, onFeedback, currentUser, onStartChat, onDeletePost }: { posts: Post[]; onReport: () => void; onCreate: () => void; query: string; onClearSearch: () => void; onFeedback: (message: string) => void; currentUser: UserProfile | null; onStartChat?: (email: string, name: string) => void; onDeletePost?: (postId: string) => void }) {
  const [category, setCategory] = useState("For you");
  const [sort, setSort] = useState<"Recent" | "Most relevant">("Recent");
  const [semanticMode, setSemanticMode] = useState(false);
  const [semanticSearching, setSemanticSearching] = useState(false);
  const [semanticMatches, setSemanticMatches] = useState<Record<string, { score: number; reason: string }>>({});

  useEffect(() => {
    if (!semanticMode || !query.trim() || posts.length === 0) {
      setSemanticMatches({});
      return;
    }
    const timer = setTimeout(async () => {
      setSemanticSearching(true);
      try {
        const res = await semanticSearchPosts(query.trim(), posts);
        const map: Record<string, { score: number; reason: string }> = {};
        (res.matches || []).forEach(m => {
          map[m.id] = { score: m.score, reason: m.reason };
        });
        setSemanticMatches(map);
      } catch {
        // fallback
      } finally {
        setSemanticSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [semanticMode, query, posts]);

  const filteredPosts = posts
    .filter(post => category === "For you" || post.tags.includes(category))
    .filter(post => {
      if (semanticMode && query.trim()) {
        const id = post._id || post.title;
        return Boolean(semanticMatches[id]) || `${post.title} ${post.body} ${(post.tags || []).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
      }
      return !query.trim() || `${post.title} ${post.body} ${(post.tags || []).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
    })
    .map(post => {
      const match = semanticMatches[post._id || post.title];
      if (match) {
        return { ...post, aiScore: match.score, aiReason: match.reason };
      }
      return post;
    });

  const shownPosts = semanticMode && query.trim()
    ? [...filteredPosts].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
    : (sort === "Most relevant" ? [...filteredPosts].sort((a, b) => (b.votes || 0) - (a.votes || 0)) : filteredPosts);

  return <div className="home-layout">
    <main className="main-feed">
      <SectionTitle eyebrow="YOUR CAMPUS, CONNECTED" title="Welcome to Campusly" copy="Your campus feed is stored in MongoDB and synced across all your devices."/>
      <CategoryChips active={category} setActive={setCategory}/>
      {shownPosts.length > 0 ? <>
        <div className="feed-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>{query ? `${shownPosts.length} ${semanticMode ? 'semantic' : ''} result${shownPosts.length === 1 ? "" : "s"}` : "Discussions"}</span>
            <button
              type="button"
              onClick={() => {
                const next = !semanticMode;
                setSemanticMode(next);
                onFeedback(next ? "✨ Google Gemini Semantic Search activated" : "Standard keyword search activated");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                borderRadius: "16px",
                border: semanticMode ? "1px solid #38bdf8" : "1px solid var(--line)",
                background: semanticMode ? "rgba(56, 189, 248, 0.15)" : "var(--surface-2)",
                color: semanticMode ? "#38bdf8" : "var(--muted)",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 700,
                transition: "all 0.2s",
              }}
            >
              <Icon name="sparkles" size={13}/>
              {semanticSearching ? "Gemini Searching..." : semanticMode ? "Gemini AI Search: ON" : "Enable AI Semantic Search"}
            </button>
          </div>
          <button onClick={() => setSort(sort === "Recent" ? "Most relevant" : "Recent")}>{sort} <Icon name="chevron" size={14}/></button>
        </div>
        <div className="feed">{shownPosts.map((post, i) => <PostCard key={post._id || `${post.title}-${i}`} post={post} onReport={onReport} onFeedback={onFeedback} currentUser={currentUser} onStartChat={onStartChat} onDeletePost={onDeletePost}/>)}</div>
      </> : <EmptyState icon="message" title={posts.length ? "No matching discussions" : "No discussions yet"} copy={posts.length ? "Try another search or category." : "Be the first to create a post with images, audio, or PDF notes!"} action={posts.length ? "Clear filters" : "Create first post"} onAction={posts.length ? () => { setCategory("For you"); onClearSearch(); onFeedback("Filters cleared"); } : onCreate}/>}
    </main>
  </div>;
}

const POPULAR_EMOJIS = [
  "😊", "😂", "🔥", "👍", "❤️", "🎓", "🎉", "🚀", "💡", "💯", "👏", "🙌", "📚", "✨", "🤔", "👀", "🥳", "🙏",
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😇", "🙂", "😉", "😍", "🥰", "😘", "😎", "🤩", "😏", "🤫", "🤐",
  "😴", "🤯", "🥶", "😱", "👎", "🤝", "💪", "🧡", "💛", "💚", "💙", "💜", "⭐", "🌟", "🎯", "🏆", "☕", "🍕"
];

function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className="emoji-picker-popover"
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: 0,
        zIndex: 40,
        width: "280px",
        maxHeight: "220px",
        padding: "10px",
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: "4px",
        overflowY: "auto",
      }}
    >
      {POPULAR_EMOJIS.map(emoji => (
        <button
          key={emoji}
          type="button"
          className="emoji-btn"
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function CommunityChatModal({
  community,
  currentUser,
  onClose,
  onFeedback,
}: {
  community: Community;
  currentUser: UserProfile | null;
  onClose: () => void;
  onFeedback: (msg: string) => void;
}) {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    if (!community._id) return;
    try {
      const data = await fetchCommunityMessages(community._id);
      setMessages(data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch {
      onFeedback("Could not load community messages");
    }
  };

  useEffect(() => {
    loadMessages();
  }, [community._id]);

  useEffect(() => {
    if (!currentUser?.email || !community._id) return;
    const client = new RealtimeChatClient(
      currentUser.email,
      () => {},
      () => {},
      (commId: string, msg: CommunityMessage) => {
        if (commId === community._id) {
          setMessages(cur => [...cur, msg]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
        }
      }
    );
    return () => client.disconnect();
  }, [currentUser?.email, community._id]);

  const handleSend = async () => {
    if ((!text.trim() && chatFiles.length === 0) || !community._id || sending) return;
    setSending(true);
    try {
      let attachments: FileAttachment[] = [];
      if (chatFiles.length > 0) {
        attachments = await uploadFilesToMongoDB(chatFiles);
      }

      const senderName = currentUser?.username ? `@${currentUser.username}` : (currentUser?.name || currentUser?.email?.split("@")[0] || "Student");
      const avatar = senderName.replace(/^@/, "").charAt(0).toUpperCase() || "S";

      const created = await sendCommunityMessage(community._id, {
        senderEmail: currentUser?.email || "student@campus.edu",
        senderName,
        text: text.trim(),
        avatar,
        color: "avatar-blue",
        attachments,
      });

      setMessages(cur => [...cur, created]);
      setText("");
      setChatFiles([]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    } catch {
      onFeedback("Failed to send message to community");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMsg = async (msgId?: string) => {
    if (!community._id || !msgId || !currentUser?.email) return;
    if (!confirm("Are you sure you want to delete this message from the community chat?")) return;
    try {
      await deleteCommunityMessage(community._id, msgId, currentUser.email);
      setMessages(cur => cur.filter(m => m._id !== msgId));
      onFeedback("Message deleted");
    } catch {
      onFeedback("Failed to delete message");
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={e => e.stopPropagation()}
        style={{ maxWidth: "620px", height: "82vh", display: "flex", flexDirection: "column", padding: "22px" }}
      >
        <div className="modal-head" style={{ marginBottom: "12px", borderBottom: "1px solid var(--line)", paddingBottom: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="type-pill">{community.category}</span>
              <span className="pulse-dot"/>
              <small style={{ color: "var(--muted)", fontWeight: 700 }}>
                {community.memberCount || 1} student{community.memberCount === 1 ? "" : "s"}
              </small>
            </div>
            <h2 style={{ fontSize: "18px", margin: "0 0 2px" }}>{community.name}</h2>
            <small style={{ color: "var(--muted)" }}>Live campus group chat · Real-time WebSocket sync</small>
          </div>
          <Button variant="icon" icon="close" onClick={onClose}/>
        </div>

        {/* Message Feed */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 4px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {messages.length > 0 ? (
            messages.map((m, idx) => {
              const isSent = m.senderEmail === currentUser?.email;
              return (
                <div key={m._id || idx} style={{ display: "flex", gap: "8px", flexDirection: isSent ? "row-reverse" : "row", alignItems: "flex-end", maxWidth: "85%", alignSelf: isSent ? "flex-end" : "flex-start" }}>
                  <span className={`avatar ${m.color || "avatar-blue"}`} style={{ width: "28px", height: "28px", fontSize: "11px" }}>
                    {m.avatar || "S"}
                  </span>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "2px", textAlign: isSent ? "right" : "left" }}>
                      <strong>{m.senderName}</strong> · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexDirection: isSent ? "row-reverse" : "row" }}>
                      <p className={isSent ? "msg-sent" : "msg-received"} style={{ margin: 0, padding: "8px 12px", fontSize: "13px" }}>
                        {m.text}
                      </p>
                      {isSent && m._id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMsg(m._id)}
                          title="Delete message"
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "3px", opacity: 0.6 }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
                        >
                          <Icon name="trash" size={13}/>
                        </button>
                      )}
                    </div>
                    {m.attachments && m.attachments.length > 0 && (
                      <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {m.attachments.map((att, attIdx) => {
                          if (att.type === "image") {
                            return <img key={attIdx} src={att.url} alt={att.name} style={{ maxWidth: "180px", borderRadius: "8px" }}/>;
                          }
                          return (
                            <a key={attIdx} href={att.url} target="_blank" rel="noreferrer" className="attachment-pdf" style={{ fontSize: "11px" }}>
                              <Icon name="book" size={13}/>
                              <span>{att.name}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
              <Icon name="message" size={32}/>
              <p style={{ marginTop: "8px", fontSize: "13px" }}>No messages yet in <strong>{community.name}</strong>.</p>
              <small>Share thoughts, questions, or resources with this community!</small>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Quick Emoji Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 0", borderTop: "1px solid var(--line)" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700 }}>Quick:</span>
          {["👍", "❤️", "🔥", "😂", "🎓", "🚀", "💡", "👏"].map(em => (
            <button
              key={em}
              type="button"
              onClick={() => setText(cur => cur + em)}
              style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: "6px", padding: "2px 6px", fontSize: "13px", cursor: "pointer" }}
            >
              {em}
            </button>
          ))}
        </div>

        {/* Compose Input */}
        <div className="chat-compose" style={{ position: "relative", marginTop: "4px" }}>
          {emojiOpen && (
            <EmojiPicker
              onSelect={em => { setText(cur => cur + em); setEmojiOpen(false); }}
              onClose={() => setEmojiOpen(false)}
            />
          )}
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: "0 8px" }}
            title="Add Emoji"
            onClick={() => setEmojiOpen(!emojiOpen)}
          >
            <Icon name="smile" size={19}/>
          </button>
          <label style={{ cursor: "pointer", display: "grid", placeItems: "center", padding: "0 6px" }} title="Attach files">
            <Icon name="plus" size={18}/>
            <input type="file" multiple style={{ display: "none" }} onChange={e => setChatFiles(Array.from(e.target.files ?? []))}/>
          </label>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
            placeholder={`Message ${community.name}...`}
          />
          <Button icon="send" onClick={handleSend} disabled={(!text.trim() && chatFiles.length === 0) || sending}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

function Communities({ currentUser, onFeedback }: { currentUser: UserProfile | null; onFeedback: (msg: string) => void }) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCommunityChat, setActiveCommunityChat] = useState<Community | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Academics");

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const data = await fetchCommunities();
      setCommunities(data);
    } catch {
      onFeedback("Could not load communities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const created = await createCommunity({
        name: name.trim(),
        description: description.trim(),
        category,
        creator: currentUser?.name || currentUser?.email?.split("@")[0] || "Student",
        creatorEmail: currentUser?.email || "",
      });
      setCommunities(cur => [created, ...cur]);
      setName("");
      setDescription("");
      setModalOpen(false);
      onFeedback("Community created in MongoDB");
    } catch {
      onFeedback("Failed to create community");
    }
  };

  const handleToggle = async (comm: Community) => {
    if (!comm._id || !currentUser?.email) return;
    try {
      const res = await toggleCommunityMembership(comm._id, currentUser.email);
      setCommunities(cur => cur.map(c => c._id === comm._id ? {
        ...c,
        memberCount: res.memberCount,
        members: res.isMember ? [...(c.members || []), currentUser.email] : (c.members || []).filter(e => e !== currentUser.email)
      } : c));
      onFeedback(res.isMember ? "Joined community" : "Left community");
    } catch {
      onFeedback("Membership update failed");
    }
  };

  return <main className="page-content">
    <SectionTitle eyebrow="FIND YOUR PEOPLE" title="Communities" copy="Connect, collaborate, and study together in student-created communities." action={<Button icon="plus" onClick={() => setModalOpen(true)}>Create Community</Button>}/>
    {modalOpen && <div className="modal-backdrop" onMouseDown={() => setModalOpen(false)}><div className="modal" role="dialog" onMouseDown={e => e.stopPropagation()}>
      <div className="modal-head"><div><p className="blue-eyebrow">NEW COMMUNITY</p><h2>Create a campus group</h2></div><Button variant="icon" icon="close" onClick={() => setModalOpen(false)}/></div>
      <label>Community Name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Competitive Programming Club"/></label>
      <label>Description<textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this community about?"/></label>
      <label>Category<select value={category} onChange={e => setCategory(e.target.value)}><option>Academics</option><option>DSA & Coding</option><option>Hackathons</option><option>Career & Prep</option><option>Campus Life</option></select></label>
      <div className="modal-actions"><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={!name.trim()}>Create Community</Button></div>
    </div></div>}
    {communities.length > 0 ? <div className="community-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "16px" }}>
      {communities.map((c, idx) => {
        const isMember = c.members?.includes(currentUser?.email || "");
        return <article
          key={c._id || c.name}
          className="community-card community-card-animated"
          style={{
            border: "1px solid var(--line)",
            borderRadius: "16px",
            padding: "18px",
            background: "var(--surface)",
            animationDelay: `${idx * 0.06}s`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span className="type-pill">{c.category}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="pulse-dot"/>
                <small style={{ color: "var(--muted)", fontWeight: 700 }}>{c.memberCount || 1} member{c.memberCount === 1 ? "" : "s"}</small>
              </div>
            </div>
            <h2 style={{ fontSize: "16px", margin: "4px 0 6px" }}>{c.name}</h2>
            <p style={{ color: "var(--muted)", fontSize: "12px", minHeight: "36px", lineHeight: 1.5 }}>{c.description || "No description provided."}</p>
          </div>
          <div style={{ marginTop: "14px", borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <small style={{ color: "var(--subtle)" }}>By {c.creator}</small>
              <Button
                variant={isMember ? "secondary" : "primary"}
                style={{ minHeight: "30px", fontSize: "11px", padding: "0 10px" }}
                onClick={() => handleToggle(c)}
              >
                {isMember ? "Joined ✓" : "Join"}
              </Button>
            </div>
            <Button
              variant="secondary"
              style={{ width: "100%", minHeight: "34px", fontSize: "12px", gap: "6px", background: "var(--surface-2)" }}
              onClick={() => setActiveCommunityChat(c)}
            >
              <Icon name="message" size={14}/>
              <span>Open Community Chat Room</span>
            </Button>
          </div>
        </article>;
      })}
    </div> : !loading && <EmptyState icon="users" title="No communities yet" copy="Be the first student to create a community on your campus." action="Create Community" onAction={() => setModalOpen(true)}/>}

    {activeCommunityChat && (
      <CommunityChatModal
        community={activeCommunityChat}
        currentUser={currentUser}
        onClose={() => setActiveCommunityChat(null)}
        onFeedback={onFeedback}
      />
    )}
  </main>;
}

function NewChatModal({
  currentUser,
  onClose,
  onSelectPeer,
}: {
  currentUser: UserProfile | null;
  onClose: () => void;
  onSelectPeer: (email: string, name: string) => void;
}) {
  const [students, setStudents] = useState<Array<{ email: string; name: string; college: string }>>([]);
  const [search, setSearch] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampusUsers()
      .then(users => {
        setStudents(users.filter(u => u.email !== currentUser?.email));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser]);

  const filtered = students.filter(s =>
    `${s.name} ${s.email} ${s.college}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()} style={{ maxWidth: "480px" }}>
        <div className="modal-head">
          <div>
            <p className="blue-eyebrow">REAL-TIME CHAT</p>
            <h2>Start a conversation</h2>
          </div>
          <Button variant="icon" icon="close" onClick={onClose}/>
        </div>

        <label>
          Search campus peers
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or college..."
          />
        </label>

        <div style={{ maxHeight: "220px", overflowY: "auto", margin: "10px 0", border: "1px solid var(--line)", borderRadius: "12px", padding: "6px" }}>
          {loading ? (
            <p style={{ textAlign: "center", padding: "16px", color: "var(--muted)", fontSize: "12px" }}>Loading students...</p>
          ) : filtered.length > 0 ? (
            filtered.map(s => (
              <button
                key={s.email}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "8px 10px",
                  border: 0,
                  borderRadius: "8px",
                  background: "transparent",
                  color: "var(--text)",
                  textAlign: "left",
                  cursor: "pointer",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                onClick={() => onSelectPeer(s.email, s.name || s.email.split("@")[0])}
              >
                <span className="avatar avatar-blue" style={{ width: "32px", height: "32px", fontSize: "12px" }}>
                  {(s.name || s.email).charAt(0).toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: "12px", display: "block" }}>{s.name || s.email.split("@")[0]}</strong>
                  <small style={{ color: "var(--muted)", fontSize: "10px", display: "block" }}>{s.email} · {s.college || "Campus Student"}</small>
                </div>
                <Icon name="message" size={15}/>
              </button>
            ))
          ) : (
            <p style={{ textAlign: "center", padding: "16px", color: "var(--muted)", fontSize: "12px" }}>
              {students.length === 0 ? "No other students registered yet. You can still message any email below!" : "No students matching your search."}
            </p>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "12px", marginTop: "12px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, margin: "0 0 6px", color: "var(--text)" }}>Or enter student email directly:</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              style={{ flex: 1, marginTop: 0 }}
              value={customEmail}
              onChange={e => setCustomEmail(e.target.value)}
              placeholder="peer@college.edu"
              onKeyDown={e => {
                if (e.key === "Enter" && customEmail.trim()) {
                  onSelectPeer(customEmail.trim(), customEmail.split("@")[0]);
                }
              }}
            />
            <Button
              disabled={!customEmail.trim() || !customEmail.includes("@")}
              onClick={() => onSelectPeer(customEmail.trim(), customEmail.split("@")[0])}
            >
              Start Chat
            </Button>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: "16px" }}>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

function Chats({ currentUser, onFeedback, initialPeer }: { currentUser: UserProfile | null; onFeedback: (msg: string) => void; initialPeer?: { email: string; name: string } | null }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePeer, setActivePeer] = useState<string | null>(null);
  const [activePeerName, setActivePeerName] = useState<string>("Student");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const startChatWith = (email: string, name: string) => {
    setActivePeer(email);
    setActivePeerName(name);
    setNewChatModalOpen(false);
    setConversations(cur => {
      if (cur.some(c => c.email === email)) return cur;
      return [{ email, name, lastMessage: "Started conversation", timestamp: null }, ...cur];
    });
  };

  useEffect(() => {
    if (initialPeer?.email) {
      startChatWith(initialPeer.email, initialPeer.name);
    }
  }, [initialPeer]);

  // Load conversations list
  const loadConversations = async () => {
    if (!currentUser?.email) return;
    try {
      const data = await fetchConversations(currentUser.email);
      setConversations(data);
      if (data.length > 0 && !activePeer) {
        setActivePeer(data[0].email);
        setActivePeerName(data[0].name);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  // Load messages for active peer
  const loadMessages = async (peerEmail: string) => {
    if (!currentUser?.email) return;
    try {
      const data = await fetchMessages(currentUser.email, peerEmail);
      setMessages(data);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentUser]);

  useEffect(() => {
    if (activePeer) {
      loadMessages(activePeer);
    }
  }, [activePeer]);

  // Connect to real-time WebSocket for instant cross-device updates
  useEffect(() => {
    if (!currentUser?.email) return;

    const realtimeClient = new RealtimeChatClient(
      currentUser.email,
      (incomingMsg: ChatMessage) => {
        // If incoming message belongs to currently open chat
        if (
          (incomingMsg.senderEmail === activePeer && incomingMsg.recipientEmail === currentUser.email) ||
          (incomingMsg.senderEmail === currentUser.email && incomingMsg.recipientEmail === activePeer)
        ) {
          setMessages(cur => [...cur, incomingMsg]);
          setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        } else {
          onFeedback(`New message from ${incomingMsg.senderName || incomingMsg.senderEmail}`);
        }
        loadConversations();
      },
      (deletedId: string) => {
        setMessages(cur => cur.filter(m => m._id !== deletedId));
        loadConversations();
      },
      undefined,
      (u1: string, u2: string) => {
        if (
          (u1 === currentUser.email && u2 === activePeer) ||
          (u2 === currentUser.email && u1 === activePeer)
        ) {
          setMessages([]);
        }
        loadConversations();
      }
    );

    return () => {
      realtimeClient.disconnect();
    };
  }, [currentUser, activePeer]);

  const handleDeleteConversation = async (targetEmail?: string, targetName?: string) => {
    const peer = targetEmail || activePeer;
    const name = targetName || activePeerName;
    if (!currentUser?.email || !peer) return;

    if (!confirm(`Are you sure you want to delete the entire chat with ${name}? All messages will be permanently deleted.`)) {
      return;
    }

    try {
      await deleteConversation(currentUser.email, peer);
      setConversations(cur => cur.filter(c => c.email !== peer));
      if (activePeer === peer) {
        setMessages([]);
        setActivePeer(null);
      }
      onFeedback(`Chat with ${name} deleted`);
    } catch {
      onFeedback("Failed to delete chat conversation");
    }
  };

  const handleSend = async () => {
    if ((!inputMsg.trim() && chatFiles.length === 0) || !currentUser?.email || !activePeer || sending) return;
    setSending(true);

    try {
      let attachments: FileAttachment[] = [];
      if (chatFiles.length > 0) {
        attachments = await uploadFilesToMongoDB(chatFiles);
      }

      const sent = await sendChatMessage({
        senderEmail: currentUser.email,
        senderName: currentUser.username ? `@${currentUser.username}` : (currentUser.name || currentUser.email.split("@")[0]),
        recipientEmail: activePeer,
        recipientName: activePeerName,
        text: inputMsg.trim(),
        attachments,
      });

      setMessages(cur => [...cur, sent]);
      setInputMsg("");
      setChatFiles([]);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      loadConversations();
    } catch {
      onFeedback("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return <main className="page-content">
    <SectionTitle eyebrow="REAL-TIME CAMPUS CHATS" title="Messages" copy="Live messaging with WebSocket sync across all your devices and MongoDB storage."/>
    {conversations.length > 0 || activePeer ? (
      <div className="chat-layout">
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <div>
              <span>Direct Messages</span>
              <span style={{ fontSize: "10px", color: "var(--muted)", marginLeft: "6px" }}>({conversations.length})</span>
            </div>
            <button
              className="btn btn-secondary"
              style={{ minHeight: "28px", padding: "0 10px", fontSize: "11px", gap: "4px" }}
              onClick={() => setNewChatModalOpen(true)}
            >
              <Icon name="plus" size={13}/>
              <span>New Chat</span>
            </button>
          </div>
          <div className="chat-conv-list">
            {conversations.map(c => (
              <div
                key={c.email}
                className={`chat-conv-item ${activePeer === c.email ? "active" : ""}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", width: "100%", paddingRight: "6px" }}
                onClick={() => { setActivePeer(c.email); setActivePeerName(c.name); }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                  <span className="avatar avatar-blue">{c.name.charAt(0).toUpperCase()}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{c.name}</strong>
                    <small style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{c.lastMessage || c.college || c.email}</small>
                  </div>
                </div>
                <button
                  type="button"
                  title={`Delete chat with ${c.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(c.email, c.name);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    cursor: "pointer",
                    padding: "4px 6px",
                    opacity: 0.5,
                    borderRadius: "6px",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.opacity = "0.5"; }}
                >
                  <Icon name="trash" size={13}/>
                </button>
              </div>
            ))}
          </div>
        </aside>
        <section className="chat-panel" style={{ display: "flex", flexDirection: "column", height: "550px" }}>
          <div className="chat-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="avatar avatar-blue">{activePeerName.charAt(0).toUpperCase()}</span>
              <div>
                <strong>{activePeerName}</strong>
                <small>{activePeer} · Real-time Synced</small>
              </div>
            </div>
            {activePeer && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => handleDeleteConversation()}
                title="Delete chat conversation"
                style={{
                  color: "#ef4444",
                  fontSize: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                }}
              >
                <Icon name="trash" size={14}/>
                <span>Delete Chat</span>
              </button>
            )}
          </div>
          <div className="chat-messages" style={{ flex: 1, overflowY: "auto" }}>
            {messages.length > 0 ? (
              messages.map((m, idx) => {
                const isSent = m.senderEmail === currentUser?.email;
                return (
                  <div key={m._id || idx} style={{ alignSelf: isSent ? "flex-end" : "flex-start", maxWidth: "80%", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexDirection: isSent ? "row-reverse" : "row" }}>
                      <p className={isSent ? "msg-sent" : "msg-received"} style={{ margin: 0 }}>
                        {m.text}
                      </p>
                      {isSent && m._id && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!currentUser?.email || !m._id) return;
                            try {
                              await deleteChatMessage(m._id, currentUser.email);
                              setMessages(cur => cur.filter(item => item._id !== m._id));
                              onFeedback("Message deleted");
                            } catch {
                              onFeedback("Failed to delete message");
                            }
                          }}
                          title="Delete message"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "3px",
                            opacity: 0.6,
                            transition: "opacity 0.2s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
                        >
                          <Icon name="trash" size={13}/>
                        </button>
                      )}
                    </div>
                    {m.attachments && m.attachments.length > 0 && (
                      <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {m.attachments.map((att, attIdx) => {
                          if (att.type === "image") {
                            return <img key={attIdx} src={att.url} alt={att.name} style={{ maxWidth: "200px", borderRadius: "8px" }}/>;
                          }
                          if (att.type === "audio") {
                            return <audio key={attIdx} controls src={att.url} style={{ maxWidth: "220px" }}/>;
                          }
                          return (
                            <a key={attIdx} href={att.url} target="_blank" rel="noreferrer" className="attachment-pdf">
                              <Icon name="book" size={14}/>
                              <span>{att.name}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <span>No messages yet. Send a message to start real-time chat with {activePeerName}!</span>
            )}
            <div ref={chatBottomRef}/>
          </div>

          {/* Quick Emoji Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700 }}>Emoji:</span>
            {["👍", "❤️", "🔥", "😂", "🎓", "🚀", "💡", "👏", "🎉", "✨"].map(em => (
              <button
                key={em}
                type="button"
                onClick={() => setInputMsg(cur => cur + em)}
                style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: "6px", padding: "2px 6px", fontSize: "13px", cursor: "pointer" }}
              >
                {em}
              </button>
            ))}
          </div>

          <div className="chat-compose" style={{ position: "relative" }}>
            {emojiOpen && (
              <EmojiPicker
                onSelect={em => { setInputMsg(cur => cur + em); setEmojiOpen(false); }}
                onClose={() => setEmojiOpen(false)}
              />
            )}
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: "0 8px" }}
              title="Add Emoji"
              onClick={() => setEmojiOpen(!emojiOpen)}
            >
              <Icon name="smile" size={19}/>
            </button>
            <label style={{ cursor: "pointer", display: "grid", placeItems: "center", padding: "0 6px" }} title="Attach image, audio, or PDF">
              <Icon name="plus" size={18}/>
              <input type="file" multiple style={{ display: "none" }} onChange={e => setChatFiles(Array.from(e.target.files ?? []))}/>
            </label>
            {chatFiles.length > 0 && (
              <span style={{ fontSize: "11px", color: "var(--blue)", alignSelf: "center" }}>
                {chatFiles.length} file{chatFiles.length > 1 ? "s" : ""}
              </span>
            )}
            <input
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
              placeholder={`Message ${activePeerName}...`}
            />
            <Button icon="send" onClick={handleSend} disabled={(!inputMsg.trim() && chatFiles.length === 0) || sending}>
              Send
            </Button>
          </div>
        </section>
      </div>
    ) : (
      <EmptyState
        icon="message"
        title="No conversations yet"
        copy="Connect with students across campus in real time. Pick someone from the campus directory or enter their email."
        action="Start New Chat"
        onAction={() => setNewChatModalOpen(true)}
      />
    )}
    {newChatModalOpen && (
      <NewChatModal
        currentUser={currentUser}
        onClose={() => setNewChatModalOpen(false)}
        onSelectPeer={startChatWith}
      />
    )}
  </main>;
}

function Opportunities({ onFeedback, currentUser }: { onFeedback: (message: string) => void; currentUser: UserProfile | null }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [type, setType] = useState("All types");
  const [eligibility, setEligibility] = useState("All students");
  const [applied, setApplied] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [createModal, setCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newType, setNewType] = useState("Internship");
  const [newDeadline, setNewDeadline] = useState("");

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const data = await fetchOpportunities();
      setOpportunities(data);
    } catch {
      onFeedback("Could not load opportunities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  const handleApply = async (opp: Opportunity) => {
    if (!opp._id || !currentUser?.email) return;
    try {
      await applyOpportunity(opp._id, currentUser.email);
      setApplied(cur => [...cur, opp.title]);
      onFeedback(`Applied to ${opp.title}`);
    } catch {
      onFeedback("Application failed");
    }
  };

  const handleToggleSave = async (opp: Opportunity) => {
    if (!opp._id || !currentUser?.email) return;
    try {
      const res = await toggleSaveOpportunity(opp._id, currentUser.email);
      setSaved(cur => res.isSaved ? [...cur, opp.title] : cur.filter(t => t !== opp.title));
      onFeedback(res.isSaved ? "Saved opportunity" : "Removed from saved");
    } catch {
      onFeedback("Save update failed");
    }
  };

  const handleCreateOpp = async () => {
    if (!newTitle.trim() || !newCompany.trim()) return;
    try {
      const created = await createOpportunity({
        title: newTitle.trim(),
        company: newCompany.trim(),
        type: newType,
        deadline: newDeadline.trim() || "Ongoing",
        eligibility: "All students",
        logo: newCompany.charAt(0).toUpperCase(),
      });
      setOpportunities(cur => [created, ...cur]);
      setNewTitle("");
      setNewCompany("");
      setCreateModal(false);
      onFeedback("Opportunity posted in MongoDB");
    } catch {
      onFeedback("Failed to post opportunity");
    }
  };

  const filtered = opportunities
    .filter(o => type === "All types" || o.type === type)
    .filter(o => eligibility === "All students" || o.eligibility === eligibility);

  return <main className="page-content">
    <SectionTitle
      eyebrow="YOUR NEXT STEP"
      title="Opportunities hub"
      copy="Internships, hackathons, and opportunities stored in MongoDB."
      action={<div style={{ display: "flex", gap: "8px" }}><Button variant="secondary" icon="filter" onClick={() => setFiltersOpen(!filtersOpen)}>{filtersOpen ? "Hide filters" : "Filters"}</Button><Button icon="plus" onClick={() => setCreateModal(true)}>Post Opportunity</Button></div>}
    />
    {createModal && <div className="modal-backdrop" onMouseDown={() => setCreateModal(false)}><div className="modal" role="dialog" onMouseDown={e => e.stopPropagation()}>
      <div className="modal-head"><div><p className="blue-eyebrow">POST OPPORTUNITY</p><h2>Add a job or event</h2></div><Button variant="icon" icon="close" onClick={() => setCreateModal(false)}/></div>
      <label>Title<input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Frontend Developer Intern"/></label>
      <label>Company / Organization<input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="e.g. Google or Campus Club"/></label>
      <label>Type<select value={newType} onChange={e => setNewType(e.target.value)}><option>Internship</option><option>Hackathon</option><option>Challenge</option><option>Part-time</option></select></label>
      <label>Deadline<input value={newDeadline} onChange={e => setNewDeadline(e.target.value)} placeholder="e.g. May 30 or Rolling"/></label>
      <div className="modal-actions"><Button variant="ghost" onClick={() => setCreateModal(false)}>Cancel</Button><Button onClick={handleCreateOpp} disabled={!newTitle.trim() || !newCompany.trim()}>Publish Opportunity</Button></div>
    </div></div>}
    {filtersOpen && <div className="filter-panel"><label>Type<select value={type} onChange={event => setType(event.target.value)}><option>All types</option><option>Internship</option><option>Hackathon</option><option>Challenge</option></select></label><label>Eligibility<select value={eligibility} onChange={event => setEligibility(event.target.value)}><option>All students</option><option>First year</option><option>Final year</option></select></label><Button onClick={() => setFiltersOpen(false)}>Done</Button></div>}
    {filtered.length > 0 ? (
      <div className="opportunity-grid">
        {filtered.map((o, i) => (
          <article className="opportunity-card" key={o._id || `${o.title}-${i}`}>
            <div className="opp-top">
              <span className={`company-logo company-${i % 4}`}>{o.logo || o.company.charAt(0)}</span>
              <span className="type-pill">{o.type}</span>
              <button aria-label="Save opportunity" onClick={() => handleToggleSave(o)}>
                <Icon name="bookmark" size={18}/>
              </button>
            </div>
            <small>{o.company}</small>
            <h2>{o.title}</h2>
            <div className="opp-meta">
              <span><Icon name="clock" size={15}/> Deadline: {o.deadline}</span>
              <span><Icon name="user" size={15}/> {o.eligibility}</span>
            </div>
            <Button disabled={applied.includes(o.title) || o.appliedBy?.includes(currentUser?.email || "")} onClick={() => handleApply(o)}>
              {applied.includes(o.title) || o.appliedBy?.includes(currentUser?.email || "") ? "Applied" : "Apply now"} <Icon name="chevron" size={15}/>
            </Button>
          </article>
        ))}
      </div>
    ) : !loading && (
      <EmptyState
        icon="briefcase"
        title="No opportunities posted yet"
        copy="Be the first to post an internship, challenge, or hackathon for campus students."
        action="Post First Opportunity"
        onAction={() => setCreateModal(true)}
      />
    )}
  </main>;
}

function Marketplace({ onFeedback, currentUser, onStartChat }: { onFeedback: (message: string) => void; currentUser: UserProfile | null; onStartChat?: (email: string, name: string) => void }) {
  const [filter, setFilter] = useState("All");
  const [listings, setListings] = useState<Product[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("Sale");
  const [condition, setCondition] = useState("Good");
  const [category, setCategory] = useState("Books");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);

  const loadMarketplace = async () => {
    try {
      const data = await fetchMarketplace();
      setListings(data);
    } catch {
      onFeedback("Could not load marketplace items");
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, []);

  const createListing = async () => {
    if (!title.trim() || !price.trim() || publishing) return;
    setPublishing(true);

    try {
      let imageUrl = "";
      if (imageFiles.length > 0) {
        const uploaded = await uploadFilesToMongoDB([imageFiles[0]]);
        if (uploaded.length > 0) imageUrl = uploaded[0].url;
      }

      const created = await createProduct({
        title: title.trim(),
        price: price.trim(),
        type,
        condition,
        category,
        image: imageUrl,
        sellerName: currentUser?.name || currentUser?.email?.split("@")[0] || "Student",
        sellerEmail: currentUser?.email || "",
      });

      setListings(cur => [created, ...cur]);
      setTitle("");
      setPrice("");
      setImageFiles([]);
      setFormOpen(false);
      onFeedback("Listing created with photo stored in MongoDB");
    } catch {
      onFeedback("Failed to publish listing");
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleSave = async (p: Product) => {
    if (!p._id || !currentUser?.email) return;
    try {
      const res = await toggleSaveProduct(p._id, currentUser.email);
      setSaved(cur => res.isSaved ? [...cur, p.title] : cur.filter(t => t !== p.title));
      onFeedback(res.isSaved ? "Listing saved" : "Removed from saved");
    } catch {
      onFeedback("Failed to save item");
    }
  };

  const shown = listings.filter(product => filter === "All" || product.type === filter);

  return <main className="page-content">
    <SectionTitle
      eyebrow="STUDENT TO STUDENT"
      title="Resource marketplace"
      copy="Buy, borrow, or donate books, notes, and electronics with media stored in MongoDB."
      action={<Button icon={formOpen ? "close" : "plus"} onClick={() => setFormOpen(!formOpen)}>{formOpen ? "Cancel" : "Create listing"}</Button>}
    />
    {formOpen && <div className="listing-form" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
      <label>Item title<input value={title} onChange={event => setTitle(event.target.value)} placeholder="What are you listing?"/></label>
      <label>Price<input value={price} onChange={event => setPrice(event.target.value)} placeholder="Free or $25"/></label>
      <label>Type<select value={type} onChange={event => setType(event.target.value)}><option>Sale</option><option>Lend</option><option>Donate</option></select></label>
      <label>Condition<select value={condition} onChange={event => setCondition(event.target.value)}><option>New</option><option>Like new</option><option>Good</option><option>Used</option></select></label>
      <label>Category<select value={category} onChange={event => setCategory(event.target.value)}><option>Books & Notes</option><option>Electronics</option><option>Supplies</option><option>Lab Kits</option></select></label>
      <label>Photo (Stored in MongoDB)<input type="file" accept="image/*" onChange={e => setImageFiles(Array.from(e.target.files ?? []))}/></label>
      <div style={{ display: "flex", alignItems: "flex-end" }}><Button onClick={createListing} disabled={!title.trim() || !price.trim() || publishing} loading={publishing}>Publish to MongoDB</Button></div>
    </div>}
    <div className="market-toolbar"><SlidingChips items={["All", "Sale", "Lend", "Donate"]} active={filter} setActive={setFilter}/></div>
    {shown.length > 0 ? (
      <div className="product-grid">
        {shown.map((p, i) => (
          <article className="product-card" key={p._id || `${p.title}-${i}`}>
            <div className="product-image">
              {p.image ? <img src={p.image} alt={p.title}/> : <span className="product-placeholder"><Icon name="store" size={28}/></span>}
              <span className={`listing-type ${p.type.toLowerCase()}`}>{p.type}</span>
              <button aria-label="Save listing" onClick={() => handleToggleSave(p)}>
                <Icon name="bookmark" size={18}/>
              </button>
            </div>
            <div className="product-info">
              <small>{p.condition} · {p.category || "Campus"}</small>
              <h2>{p.title}</h2>
              <strong className={p.price === "Free" ? "free" : ""}>{p.price}</strong>
              <small style={{ color: "var(--subtle)", marginTop: "4px" }}>Seller: {p.sellerName || "Peer"}</small>
              {p.sellerEmail && p.sellerEmail !== currentUser?.email && onStartChat && (
                <div style={{ marginTop: "10px" }}>
                  <button
                    className="btn btn-secondary"
                    style={{ width: "100%", minHeight: "32px", fontSize: "11px", gap: "6px" }}
                    onClick={() => onStartChat(p.sellerEmail!, p.sellerName || "Seller")}
                  >
                    <Icon name="message" size={14}/> Message Seller
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    ) : (
      <EmptyState
        icon="store"
        title="No marketplace listings yet"
        copy="Pass on textbooks, electronics, or dorm essentials to peers."
        action="Create First Listing"
        onAction={() => setFormOpen(true)}
      />
    )}
  </main>;
}

function Profile({
  posts,
  currentUser,
  onProfileUpdate,
  onCollegeChange,
  onCreatePost,
  onNavigate,
  onFeedback,
  onReport,
  onDeletePost
}: {
  posts: Post[];
  currentUser: UserProfile | null;
  onProfileUpdate?: (user: UserProfile) => void;
  onCollegeChange: (college: string) => void;
  onCreatePost: () => void;
  onNavigate: (page: Page) => void;
  onFeedback: (message: string) => void;
  onReport: () => void;
  onDeletePost?: (postId: string) => void;
}) {
  const [tab, setTab] = useState("Posts");
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(currentUser?.name || "");
  const [draftUsername, setDraftUsername] = useState(currentUser?.username || "");
  const [draftCollege, setDraftCollege] = useState(currentUser?.college === "College not selected" ? "" : (currentUser?.college || ""));
  const [draftYear, setDraftYear] = useState(currentUser?.year || "");
  const [draftBranch, setDraftBranch] = useState(currentUser?.branch || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDraftName(currentUser.name || "");
      setDraftUsername(currentUser.username || "");
      setDraftCollege(currentUser.college === "College not selected" ? "" : (currentUser.college || ""));
      setDraftYear(currentUser.year || "");
      setDraftBranch(currentUser.branch || "");
    }
  }, [currentUser]);

  const userPosts = posts.filter(p =>
    (p.authorEmail && p.authorEmail === currentUser?.email) ||
    p.author === (currentUser?.name || currentUser?.email?.split("@")[0]) ||
    (currentUser?.username && (p.author === currentUser.username || p.author === `@${currentUser.username}`))
  );

  const saveProfile = async () => {
    if (!currentUser?.email || saving) return;
    setSaving(true);
    try {
      const cleanUsername = draftUsername.trim().replace(/^@/, "").toLowerCase();
      const updated: UserProfile = {
        ...currentUser,
        name: draftName.trim() || currentUser.name,
        username: cleanUsername,
        college: draftCollege.trim() || currentUser.college,
        year: draftYear.trim(),
        branch: draftBranch.trim(),
      };
      await syncUserProfile(updated);
      onProfileUpdate?.(updated);
      onCollegeChange(updated.college);
      setEditing(false);
      onFeedback("Profile updated and synced to MongoDB Atlas!");
    } catch {
      onFeedback("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return <main className="page-content profile-page">
    <div className="profile-hero">
      <div className="profile-banner"/>
      <div className="profile-main">
        <span className="avatar profile-avatar"><img src={defaultAvatar} alt="Profile avatar"/></span>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <h1 style={{ margin: 0 }}>{currentUser?.name || currentUser?.email?.split("@")[0] || "Student"}</h1>
            {currentUser?.username && (
              <span style={{ color: "var(--blue)", fontWeight: 700, fontSize: "14px" }}>
                @{currentUser.username}
              </span>
            )}
          </div>
          <p style={{ margin: "4px 0", color: "var(--text)", fontSize: "13px" }}>
            {currentUser?.college || "College not selected"}
            {currentUser?.branch && ` · ${currentUser.branch}`}
            {currentUser?.year && ` · ${currentUser.year}`}
          </p>
          <small style={{ color: "var(--subtle)" }}>{currentUser?.email}</small>
        </div>
        <Button variant="secondary" icon={editing ? "close" : "edit"} onClick={() => setEditing(!editing)}>
          {editing ? "Cancel" : "Edit profile"}
        </Button>
      </div>

      {editing && (
        <div className="profile-edit" style={{ padding: "18px 24px", display: "grid", gap: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <label>
              Full Name
              <input value={draftName} onChange={event => setDraftName(event.target.value)} placeholder="Your full name"/>
            </label>
            <label>
              Username
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: "10px", color: "var(--muted)", fontWeight: 700 }}>@</span>
                <input
                  style={{ paddingLeft: "26px" }}
                  value={draftUsername}
                  onChange={event => setDraftUsername(event.target.value.replace(/^@/, "").toLowerCase())}
                  placeholder="username"
                />
              </div>
            </label>
          </div>

          <label>
            College / University Name
            <input value={draftCollege} onChange={event => setDraftCollege(event.target.value)} placeholder="Enter your university or college name"/>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <label>
              College Year
              <select value={draftYear} onChange={event => setDraftYear(event.target.value)}>
                <option value="">Select Year</option>
                <option value="1st Year">1st Year (Freshman)</option>
                <option value="2nd Year">2nd Year (Sophomore)</option>
                <option value="3rd Year">3rd Year (Junior)</option>
                <option value="4th Year">4th Year (Senior)</option>
                <option value="5th Year">5th Year (Dual Degree)</option>
                <option value="Postgraduate / Masters">Postgraduate / Masters</option>
                <option value="PhD / Scholar">PhD / Scholar</option>
                <option value="Alumni">Alumni</option>
              </select>
            </label>
            <label>
              Branch / Major
              <input value={draftBranch} onChange={event => setDraftBranch(event.target.value)} placeholder="e.g. Computer Science, Mechanical, Civil..."/>
            </label>
          </div>

          <div style={{ marginTop: "4px" }}>
            <Button onClick={saveProfile} loading={saving}>Save to MongoDB</Button>
          </div>
        </div>
      )}

      <div className="profile-stats">
        <div><strong>{userPosts.length}</strong><span>Posts</span></div>
        <div><strong>{userPosts.reduce((acc, p) => acc + (p.votes || 0), 0)}</strong><span>Upvotes</span></div>
        <div><strong>Real-time</strong><span>Sync Status</span></div>
      </div>
    </div>
    <div className="profile-content">
      <SlidingChips items={["Posts", "Saved", "Listings"]} active={tab} setActive={setTab}/>
      <div className="tab-panel" key={tab}>
        {tab === "Posts" && userPosts.length > 0 ? (
          userPosts.map(p => <PostCard key={p._id || p.title} post={p} onReport={onReport} onFeedback={onFeedback} currentUser={currentUser} onDeletePost={onDeletePost}/>)
        ) : (
          <EmptyState
            icon={tab === "Saved" ? "bookmark" : tab === "Listings" ? "store" : "message"}
            title={tab === "Saved" ? "No saved posts yet" : tab === "Listings" ? "No listings yet" : "No posts yet"}
            copy={tab === "Saved" ? "Posts you save will appear here." : tab === "Listings" ? "Items you publish to marketplace will appear here." : "Posts you create will appear here and persist in MongoDB."}
            action={tab === "Listings" ? "Create listing" : tab === "Saved" ? "Explore discussions" : "Create post"}
            onAction={tab === "Listings" ? () => onNavigate("Marketplace") : tab === "Saved" ? () => onNavigate("Home") : onCreatePost}
          />
        )}
      </div>
    </div>
  </main>;
}

function NewPostModal({ onClose, onCreate, college, currentUser }: { onClose: () => void; onCreate: (post: Partial<Post>) => void; college: string; currentUser: UserProfile | null }) {
  const [anonymous, setAnonymous] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState("Academics");
  const [link, setLink] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [modWarning, setModWarning] = useState<{ categories: string[]; reason: string; poweredBy?: string } | null>(null);
  const [aiChecking, setAiChecking] = useState(false);

  const removeSelectedFile = (kind: "image" | "audio" | "pdf", index: number) => {
    if (kind === "image") setImageFiles(cur => cur.filter((_, i) => i !== index));
    if (kind === "audio") setAudioFiles(cur => cur.filter((_, i) => i !== index));
    if (kind === "pdf") setPdfFiles(cur => cur.filter((_, i) => i !== index));
  };

  const publish = async () => {
    if (!title.trim() || publishing) return;
    setPublishing(true);
    setAiChecking(true);

    try {
      // Compulsory AI Safety Moderation Check (Groq Safeguard + Gemini / Rules)
      const mod = await moderateContent(details.trim(), title.trim(), 'post');
      if (mod.flagged && (mod.severity === 'high' || mod.severity === 'medium')) {
        setModWarning({ categories: mod.categories, reason: mod.reason, poweredBy: mod.poweredBy });
        setPublishing(false);
        setAiChecking(false);
        return;
      }

      setModWarning(null);

      // 1. Upload files directly to MongoDB GridFS
      const allFiles = [...imageFiles, ...audioFiles, ...pdfFiles];
      const uploadedAttachments: FileAttachment[] = allFiles.length > 0
        ? await uploadFilesToMongoDB(allFiles)
        : [];

      // 2. Add web link if entered
      const normalizedLink = link.trim() && !/^https?:\/\//i.test(link.trim()) ? `https://${link.trim()}` : link.trim();
      if (normalizedLink) {
        uploadedAttachments.push({ type: "link", name: normalizedLink, url: normalizedLink });
      }

      // 3. Save post to MongoDB - author identity hidden if anonymous, but owner email recorded for author deletion
      const author = anonymous ? "Anonymous" : (currentUser?.name || currentUser?.email?.split("@")[0] || "You");
      const avatar = anonymous ? "A" : (author.charAt(0).toUpperCase() || "U");

      const created = await createPost({
        author,
        authorEmail: currentUser?.email || undefined,
        avatar,
        title: title.trim(),
        body: details.trim(),
        tags: category ? [category] : [],
        color: anonymous ? "avatar-dark" : "avatar-blue",
        college: currentUser?.college || college || "Campus Student",
        attachments: uploadedAttachments,
      });

      // Save post ID locally for anonymous ownership
      if (created?._id) {
        try {
          const currentIds: string[] = JSON.parse(localStorage.getItem("campusly_my_posts") || "[]");
          localStorage.setItem("campusly_my_posts", JSON.stringify([...currentIds, created._id]));
        } catch {}
      }

      onCreate(created);
      onClose();
    } catch (err) {
      console.error("Failed to publish post:", err);
    } finally {
      setPublishing(false);
      setAiChecking(false);
    }
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <div className="modal" role="dialog" aria-modal="true" aria-label="Create a new post" onMouseDown={e => e.stopPropagation()}>
      <div className="modal-head"><div><p className="blue-eyebrow">ASK THE COMMUNITY</p><h2>Create a post</h2></div><Button variant="icon" icon="close" onClick={onClose}/></div>
      <label>Title<input autoFocus value={title} onChange={e => { setTitle(e.target.value); if (modWarning) setModWarning(null); }} placeholder="What do you want to ask or share?"/></label>
      <label>Details<textarea rows={5} value={details} onChange={e => { setDetails(e.target.value); if (modWarning) setModWarning(null); }} placeholder="Add context, what you’ve tried, or any details that may help..."/></label>
      <label>Category<select value={category} onChange={e => setCategory(e.target.value)}><option>DSA</option><option>Study Material</option><option>Exam Material</option><option>Internships</option><option>Academics</option><option>Campus Life</option></select></label>
      <div className="attachment-fields" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
        <label><span><Icon name="plus" size={16}/> Add Images</span><input type="file" accept="image/*" multiple onChange={e => setImageFiles(Array.from(e.target.files ?? []))}/><small>{imageFiles.length ? `${imageFiles.length} selected` : "Images in MongoDB"}</small></label>
        <label><span><Icon name="plus" size={16}/> Add Audio</span><input type="file" accept="audio/*" multiple onChange={e => setAudioFiles(Array.from(e.target.files ?? []))}/><small>{audioFiles.length ? `${audioFiles.length} selected` : "Voice notes in MongoDB"}</small></label>
        <label><span><Icon name="book" size={16}/> Add PDFs / Notes</span><input type="file" accept="application/pdf,.pdf" multiple onChange={e => setPdfFiles(Array.from(e.target.files ?? []))}/><small>{pdfFiles.length ? `${pdfFiles.length} selected` : "PDFs in MongoDB"}</small></label>
      </div>
      {[{ kind: "image" as const, files: imageFiles }, { kind: "audio" as const, files: audioFiles }, { kind: "pdf" as const, files: pdfFiles }].map(group => group.files.length > 0 && (
        <div key={group.kind} style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
          {group.files.map((file, index) => (
            <span key={`${group.kind}-${index}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 8px", borderRadius: "999px", background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: "11px", color: "var(--text)" }}>
              {file.name}
              <button type="button" onClick={() => removeSelectedFile(group.kind, index)} aria-label={`Remove ${file.name}`} style={{ border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer", fontWeight: 700 }}>×</button>
            </span>
          ))}
        </div>
      ))}
      <label>Link<input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://example.com"/></label>
      <button className="anonymous-row" onClick={() => setAnonymous(!anonymous)}><span><strong>Post anonymously</strong><small>Your identity will be hidden from other students.</small></span><span className={`toggle ${anonymous ? "on" : ""}`}><i/></span></button>

      {/* Non-bypassable AI Moderation Block Banner */}
      {modWarning && (
        <div style={{
          padding: "12px 14px",
          borderRadius: "10px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          color: "var(--text)",
          fontSize: "12px",
          marginTop: "10px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ef4444", fontWeight: 700, marginBottom: "4px" }}>
            <Icon name="shield" size={15}/>
            <span>Post Blocked by Safety Moderation ({modWarning.poweredBy || "Campus Safety Policy"})</span>
          </div>
          <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{modWarning.reason}</p>
          <small style={{ color: "var(--muted)" }}>Category: {modWarning.categories.join(", ")}. Inappropriate content is strictly prevented from being published on Campusly. Please adjust your text to comply with campus guidelines.</small>
          <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setModWarning(null)}
              style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "5px 12px", borderRadius: "6px", fontSize: "11px", color: "var(--text)", cursor: "pointer", fontWeight: 600 }}
            >
              Edit Post
            </button>
          </div>
        </div>
      )}

      <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
        <Button variant="ghost" onClick={onClose} disabled={publishing}>Cancel</Button>
        <Button onClick={publish} disabled={!title.trim() || aiChecking} loading={publishing || aiChecking}>Publish to MongoDB</Button>
      </div>
    </div>
  </div>;
}

function ReportModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal report-modal" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}><div className="modal-head"><div><p className="blue-eyebrow">KEEP CAMPUS SAFE</p><h2>Report content</h2></div><Button variant="icon" icon="close" onClick={onClose}/></div><p>Why are you reporting this content?</p><div className="report-options">{["Spam or misleading", "Harassment or bullying", "Academic misconduct", "Inappropriate content"].map(r => <button className={reason === r ? "selected" : ""} key={r} onClick={() => setReason(r)}><span>{r}</span><i>{reason === r && <Icon name="check" size={13}/>}</i></button>)}</div><div className="modal-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => onSubmit(reason)} disabled={!reason}>Submit report</Button></div></div></div>;
}

function Login({ onLogin, dark, setDark }: { onLogin: (user: UserProfile, isNew: boolean) => void; dark: boolean; setDark: (value: boolean) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [notice, setNotice] = useState("");
  const [needSignup, setNeedSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 6 || loading) return;

    setLoading(true);
    setNotice("");
    setNeedSignup(false);

    try {
      if (mode === "signup") {
        const { user } = await signUpUser(email, password, { college: "College not selected" });
        const profile: UserProfile = {
          id: user?.id,
          email,
          name: email.split("@")[0],
          college: "College not selected",
        };
        try {
          const synced = await syncUserProfile(profile);
          if (synced && typeof synced === "object") {
            Object.assign(profile, synced);
          }
        } catch {
          // Non-blocking sync
        }
        onLogin(profile, true);
      } else {
        const { user } = await signInUser(email, password);
        const profile: UserProfile = {
          id: user?.id,
          email,
          name: email.split("@")[0],
          college: "College not selected",
        };
        try {
          const synced = await syncUserProfile(profile);
          if (synced && typeof synced === "object") {
            if (synced.name) profile.name = synced.name;
            if (synced.college) profile.college = synced.college;
            if (synced.username) profile.username = synced.username;
            if (synced.year) profile.year = synced.year;
            if (synced.branch) profile.branch = synced.branch;
          }
        } catch {
          // Non-blocking sync
        }
        onLogin(profile, false);
      }
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();
      if (mode === "signin") {
        if (
          msg.includes("invalid login credentials") ||
          msg.includes("invalid_grant") ||
          msg.includes("user not found") ||
          msg.includes("not found")
        ) {
          setNotice("Account details do not exist or password is incorrect. If you don't have an account yet, please create a new account.");
          setNeedSignup(true);
        } else if (msg.includes("confirm")) {
          setNotice("Email not confirmed yet. In Supabase Dashboard → Auth → Providers → Email, turn OFF 'Confirm email' for instant student access.");
        } else {
          setNotice(err?.message || "Sign in failed. Please check your credentials.");
        }
      } else {
        if (msg.includes("already registered") || msg.includes("already exists")) {
          setNotice("An account with this email already exists in Supabase. Please sign in with your password.");
          setMode("signin");
        } else {
          setNotice(err?.message || "Sign up failed. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={dark ? "login-page dark" : "login-page"}>
      <div className="login-brand">
        <div className="login-brand-top"><Logo/></div>
        <div className="login-story">
          <h1>Everything<br/><span className="of-campus-text">Of Campus</span><br/><em>One community</em></h1>
          <p>Ask questions, find opportunities, exchange resources, and learn from seniors with live real-time chats.</p>
        </div>
      </div>
      <main className="login-panel">
        <div className="login-box">
          <Button variant="icon" onClick={() => setDark(!dark)} icon={dark ? "sun" : "moon"} className={`desktop-theme login-theme-toggle ${dark ? "theme-dark" : "theme-light"}`}/>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p className="blue-eyebrow" style={{ margin: 0 }}>{mode === "signin" ? "WELCOME TO CAMPUSLY" : "JOIN CAMPUSLY"}</p>
            <span style={{ color: "#138a72", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              🔒 SSL Encrypted
            </span>
          </div>
          <h2>{mode === "signin" ? "Sign in to your campus" : "Create your account"}</h2>
          <p className="login-subtitle">
            Enter your college email and password to access verified campus forums, resources, and live chats.
          </p>
          <form onSubmit={handleSubmit}>
            <label>College email<input type="email" value={email} onChange={event => { setEmail(event.target.value); setNotice(""); setNeedSignup(false); }} placeholder="you@college.edu" required/></label>
            <label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === "signin" ? "Enter your password" : "Create a password (min 6 chars)"} minLength={6} required/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}><Icon name={showPassword ? "eyeOff" : "eye"} size={18}/></button></div></label>
            <div className="login-options"><label><input type="checkbox" checked={keepSignedIn} onChange={event => setKeepSignedIn(event.target.checked)}/> Keep me signed in</label>{mode === "signin" && <button type="button" onClick={() => setNotice(email ? `Reset instructions sent to ${email}` : "Enter your college email first.")}>Forgot password?</button>}</div>
            {notice && (
              <div style={{ margin: "12px 0", padding: "12px 14px", borderRadius: "10px", background: "rgba(255, 90, 0, 0.12)", border: "1px solid rgba(255, 90, 0, 0.3)" }}>
                <p className="auth-notice" role="status" style={{ color: "#ff5a00", fontSize: "12px", margin: 0, lineHeight: 1.45 }}>
                  {notice}
                </p>
                {needSignup && mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => { setMode("signup"); setNotice(""); setNeedSignup(false); }}
                    style={{
                      marginTop: "10px",
                      width: "100%",
                      padding: "8px 12px",
                      background: "var(--blue)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Create New Account Now →
                  </button>
                )}
              </div>
            )}
            <Button type="submit" className="login-submit" disabled={!email || password.length < 6 || loading} loading={loading}>
              {mode === "signin" ? "Sign in to Campusly" : "Create Account"} <Icon name="chevron" size={16}/>
            </Button>
          </form>
          <p className="signup-copy">{mode === "signin" ? "New to Campusly?" : "Already have an account?"} <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setNotice(""); setNeedSignup(false); }}>{mode === "signin" ? "Create your account" : "Sign in"}</button></p>
          <p className="login-terms">Protected by Supabase Authentication & encrypted MongoDB storage.</p>
        </div>
      </main>
    </div>
  );
}

function Settings({ currentUser, onProfileUpdate, onFeedback, onDeleteAccount }: { currentUser: UserProfile | null; onProfileUpdate?: (user: UserProfile) => void; onFeedback: (msg: string) => void; onDeleteAccount: () => void }) {
  const [name, setName] = useState(currentUser?.name || "");
  const [username, setUsername] = useState(currentUser?.username || "");
  const [college, setCollege] = useState(currentUser?.college || "");
  const [year, setYear] = useState(currentUser?.year || "");
  const [branch, setBranch] = useState(currentUser?.branch || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [geminiKey, setGeminiKey] = useState(getStoredGeminiKey());
  const [groqKey, setGroqKey] = useState(getStoredGroqKey());

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setUsername(currentUser.username || "");
      setCollege(currentUser.college || "");
      setYear(currentUser.year || "");
      setBranch(currentUser.branch || "");
    }
  }, [currentUser]);

  const [allowDirectMessages, setAllowDirectMessages] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfileLoading(true);
    try {
      const cleanUsername = username.trim().replace(/^@/, "").toLowerCase();
      const updated: UserProfile = {
        ...currentUser,
        name: name.trim() || currentUser.name,
        username: cleanUsername,
        college: college.trim() || currentUser.college,
        year: year.trim(),
        branch: branch.trim(),
      };
      await syncUserProfile(updated);
      onProfileUpdate?.(updated);
      onFeedback("Student profile updated successfully in MongoDB!");
    } catch {
      onFeedback("Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      onFeedback("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      onFeedback("Passwords do not match.");
      return;
    }
    setPwdLoading(true);
    try {
      await updateUserPassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      onFeedback("Password updated securely in Supabase Auth!");
    } catch (err: any) {
      onFeedback(err?.message || "Failed to update password.");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser?.email) return;
    const confirmed = window.confirm("This permanently deletes your Campusly profile, all account data, and student records. This cannot be undone. Continue?");
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      const deleted = await deleteUserAccount(currentUser.email);
      if (!deleted) {
        throw new Error("Account deletion failed.");
      }
      onFeedback("Account deleted successfully.");
      onDeleteAccount();
    } catch (err: any) {
      onFeedback(err?.message || "Failed to delete account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <main className="page-content">
      <SectionTitle
        eyebrow="ACCOUNT & SECURITY"
        title="Settings & Privacy"
        copy="Manage your student profile, login credentials, and communication preferences."
      />
      <div style={{ display: "grid", gap: "20px", maxWidth: "680px", marginTop: "20px" }}>
        
        {/* Profile Card */}
        <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "16px", background: "var(--surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <strong style={{ fontSize: "14px" }}>Student Profile</strong>
            <span style={{ color: "#138a72", fontWeight: 700, fontSize: "11px" }}>● Verified Student Account</span>
          </div>
          <form onSubmit={handleUpdateProfile} style={{ display: "grid", gap: "12px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>
              Registered Email (Supabase Auth ID)
              <input
                disabled
                value={currentUser?.email || ""}
                style={{ width: "100%", height: "38px", marginTop: "5px", border: "1px solid var(--line)", borderRadius: "9px", padding: "0 10px", background: "var(--surface-2)", color: "var(--muted)", fontSize: "12px", opacity: 0.8, cursor: "not-allowed" }}
              />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>
                Full Name
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your Name"
                  style={{ width: "100%", height: "38px", marginTop: "5px", border: "1px solid var(--line)", borderRadius: "9px", padding: "0 10px", background: "var(--surface-2)", color: "var(--text)", fontSize: "12px" }}
                />
              </label>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>
                Username
                <div style={{ position: "relative", display: "flex", alignItems: "center", marginTop: "5px" }}>
                  <span style={{ position: "absolute", left: "10px", color: "var(--muted)", fontWeight: 700, fontSize: "12px" }}>@</span>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/^@/, "").toLowerCase())}
                    placeholder="handle"
                    style={{ width: "100%", height: "38px", border: "1px solid var(--line)", borderRadius: "9px", padding: "0 10px 0 24px", background: "var(--surface-2)", color: "var(--text)", fontSize: "12px" }}
                  />
                </div>
              </label>
            </div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>
              College / University
              <input
                value={college}
                onChange={e => setCollege(e.target.value)}
                placeholder="e.g. Stanford University"
                style={{ width: "100%", height: "38px", marginTop: "5px", border: "1px solid var(--line)", borderRadius: "9px", padding: "0 10px", background: "var(--surface-2)", color: "var(--text)", fontSize: "12px" }}
              />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>
                College Year
                <select
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  style={{ width: "100%", height: "38px", marginTop: "5px", border: "1px solid var(--line)", borderRadius: "9px", padding: "0 10px", background: "var(--surface-2)", color: "var(--text)", fontSize: "12px" }}
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year (Freshman)</option>
                  <option value="2nd Year">2nd Year (Sophomore)</option>
                  <option value="3rd Year">3rd Year (Junior)</option>
                  <option value="4th Year">4th Year (Senior)</option>
                  <option value="5th Year">5th Year (Dual Degree)</option>
                  <option value="Postgraduate / Masters">Postgraduate / Masters</option>
                  <option value="PhD / Scholar">PhD / Scholar</option>
                  <option value="Alumni">Alumni</option>
                </select>
              </label>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>
                Branch / Major
                <input
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  placeholder="e.g. Computer Science, Mechanical..."
                  style={{ width: "100%", height: "38px", marginTop: "5px", border: "1px solid var(--line)", borderRadius: "9px", padding: "0 10px", background: "var(--surface-2)", color: "var(--text)", fontSize: "12px" }}
                />
              </label>
            </div>
            <div>
              <Button type="submit" loading={profileLoading} style={{ minHeight: "36px", padding: "0 16px", fontSize: "12px" }}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Password & Security Card */}
        <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "16px", background: "var(--surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <strong style={{ fontSize: "14px" }}>Security & Password</strong>
            <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "11px" }}>🔒 SSL 256-bit Secured</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
            Update your account password securely in Supabase Authentication:
          </p>
          <form onSubmit={handlePasswordChange} style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>
                New Password
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  style={{ width: "100%", height: "38px", marginTop: "5px", border: "1px solid var(--line)", borderRadius: "9px", padding: "0 10px", background: "var(--surface-2)", color: "var(--text)", fontSize: "12px" }}
                />
              </label>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>
                Confirm New Password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  style={{ width: "100%", height: "38px", marginTop: "5px", border: "1px solid var(--line)", borderRadius: "9px", padding: "0 10px", background: "var(--surface-2)", color: "var(--text)", fontSize: "12px" }}
                />
              </label>
            </div>
            <div>
              <Button type="submit" loading={pwdLoading} disabled={!newPassword || newPassword.length < 6} style={{ minHeight: "36px", padding: "0 16px", fontSize: "12px" }}>
                Update Password
              </Button>
            </div>
          </form>
        </div>

        {/* Account Deletion Card */}
        <div style={{ padding: "20px", border: "1px solid rgba(239, 68, 68, 0.35)", borderRadius: "16px", background: "rgba(239, 68, 68, 0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <strong style={{ fontSize: "14px", color: "#ef4444" }}>Delete Account</strong>
            <span style={{ color: "#ef4444", fontWeight: 700, fontSize: "11px" }}>Danger Zone</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
            Permanently delete your Campusly student profile, saved data, and all content linked to this email.
          </p>
          <Button onClick={handleDeleteAccount} loading={deleteLoading} variant="ghost" style={{ minHeight: "36px", padding: "0 16px", fontSize: "12px", borderColor: "rgba(239, 68, 68, 0.5)", color: "#ef4444" }}>
            Delete My Account
          </Button>
        </div>

        {/* Google Gemini AI Services Configuration */}
        <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "16px", background: "var(--surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#38bdf8", display: "flex" }}><Icon name="sparkles" size={17}/></span>
              <strong style={{ fontSize: "14px" }}>Google Gemini AI Services</strong>
            </div>
            <span style={{ color: geminiKey ? "#38bdf8" : "#138a72", fontWeight: 700, fontSize: "11px" }}>
              {geminiKey ? "● Free Gemini Key Active" : "● Smart Safety & Search Active"}
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
            Powers <strong>AI Content Moderation</strong>, <strong>AI Semantic Search</strong>, and <strong>Discussion Thread Summaries</strong> with Google Gemini. Add your free key from Google AI Studio below to unlock live Google Gemini Flash:
          </p>
          <div style={{ display: "grid", gap: "12px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>
              Google Gemini API Key (Free Tier)
              <div style={{ display: "flex", gap: "8px", marginTop: "5px" }}>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  style={{ flex: 1, height: "38px", border: "1px solid var(--line)", borderRadius: "9px", padding: "0 10px", background: "var(--surface-2)", color: "var(--text)", fontSize: "12px" }}
                />
                <Button
                  onClick={() => {
                    saveStoredGeminiKey(geminiKey);
                    onFeedback(geminiKey ? "✨ Google Gemini API Key saved!" : "Gemini key removed, using smart fallback engine.");
                  }}
                  style={{ minHeight: "38px", padding: "0 14px", fontSize: "12px" }}
                >
                  Save Key
                </Button>
              </div>
            </label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "11px", color: "#38bdf8", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <span>Get a free Google Gemini key from Google AI Studio ↗</span>
              </a>
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                Free tier: 15 Requests / min · No credit card required
              </span>
            </div>
          </div>
        </div>

        {/* Groq Prompt Injection Safeguard Configuration */}
        <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "16px", background: "var(--surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#f97316", display: "flex" }}><Icon name="shield" size={17}/></span>
              <strong style={{ fontSize: "14px" }}>Groq AI Safeguard (Prompt Injection Defense)</strong>
            </div>
            <span style={{ color: groqKey ? "#f97316" : "#138a72", fontWeight: 700, fontSize: "11px" }}>
              {groqKey ? "● Groq Safeguard Active" : "● Campus Safety Policy Active"}
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
            Protects campus posts and chat against jailbreaks, prompt injection, and system manipulation using Groq's high-speed inference with <code>openai/gpt-oss-safeguard-20b</code>.
          </p>
          <div style={{ display: "grid", gap: "12px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)" }}>
              Groq API Key (<code>openai/gpt-oss-safeguard-20b</code>)
              <div style={{ display: "flex", gap: "8px", marginTop: "5px" }}>
                <input
                  type="password"
                  value={groqKey}
                  onChange={e => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  style={{ flex: 1, height: "38px", border: "1px solid var(--line)", borderRadius: "9px", padding: "0 10px", background: "var(--surface-2)", color: "var(--text)", fontSize: "12px" }}
                />
                <Button
                  onClick={() => {
                    saveStoredGroqKey(groqKey);
                    onFeedback(groqKey ? "🛡️ Groq Safeguard API Key saved!" : "Groq key cleared, falling back to local campus safety policy.");
                  }}
                  style={{ minHeight: "38px", padding: "0 14px", fontSize: "12px" }}
                >
                  Save Key
                </Button>
              </div>
            </label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "11px", color: "#f97316", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <span>Get a free Groq API key from console.groq.com ↗</span>
              </a>
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                Model: openai/gpt-oss-safeguard-20b · Sub-second inference
              </span>
            </div>
          </div>
        </div>

        {/* Communication & Notification Preferences */}
        <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "16px", background: "var(--surface)" }}>
          <strong style={{ fontSize: "14px", display: "block", marginBottom: "14px" }}>Notifications & Privacy</strong>
          <div style={{ display: "grid", gap: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontSize: "13px" }}>
              <span>Allow direct real-time messages from verified peers</span>
              <input type="checkbox" checked={allowDirectMessages} onChange={e => { setAllowDirectMessages(e.target.checked); onFeedback(e.target.checked ? "Direct messages enabled" : "Direct messages disabled"); }} />
            </label>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontSize: "13px" }}>
              <span>Audio tone on incoming real-time chat messages</span>
              <input type="checkbox" checked={soundAlerts} onChange={e => { setSoundAlerts(e.target.checked); onFeedback("Sound preferences saved"); }} />
            </label>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontSize: "13px" }}>
              <span>Email notifications for marketplace inquiries</span>
              <input type="checkbox" checked={emailAlerts} onChange={e => { setEmailAlerts(e.target.checked); onFeedback("Email alert preference saved"); }} />
            </label>
          </div>
        </div>

        {/* Cloud Infrastructure & Security Status */}
        <div style={{ padding: "16px 20px", border: "1px solid var(--line)", borderRadius: "16px", background: "var(--surface-2)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <strong style={{ fontSize: "13px", display: "block", color: "var(--text)" }}>Cloud Infrastructure & Data Security</strong>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>End-to-end encrypted auth with Supabase and isolated media buckets</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ background: "rgba(19, 138, 114, 0.15)", color: "#138a72", fontSize: "11px", fontWeight: 700, padding: "4px 8px", borderRadius: "6px" }}>
              ● Supabase Auth
            </span>
            <span style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", fontSize: "11px", fontWeight: 700, padding: "4px 8px", borderRadius: "6px" }}>
              ● MongoDB GridFS
            </span>
            <span style={{ background: "rgba(168, 85, 247, 0.15)", color: "#a855f7", fontSize: "11px", fontWeight: 700, padding: "4px 8px", borderRadius: "6px" }}>
              ● WebSockets Live
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

const campusInterests = [
  { name: "Academics", icon: "book" as IconName, copy: "Courses, notes, and study support" },
  { name: "Exam Prep", icon: "check" as IconName, copy: "Revision plans and exam resources" },
  { name: "Internships", icon: "briefcase" as IconName, copy: "Career opportunities and applications" },
  { name: "Hackathons", icon: "sparkles" as IconName, copy: "Build events and team discovery" },
  { name: "AI / ML", icon: "message" as IconName, copy: "Artificial intelligence and machine learning" },
  { name: "Campus Life", icon: "users" as IconName, copy: "Clubs, events, and student activities" },
  { name: "Communities", icon: "users" as IconName, copy: "Find people who share your interests" },
  { name: "Marketplace", icon: "store" as IconName, copy: "Buy, sell, lend, and donate on campus" },
];

function InterestOnboarding({ dark, setDark, selected, setSelected, onContinue }: { dark: boolean; setDark: (value: boolean) => void; selected: string[]; setSelected: (interests: string[]) => void; onContinue: () => void }) {
  const toggleInterest = (interest: string) => {
    setSelected(selected.includes(interest) ? selected.filter(item => item !== interest) : [...selected, interest]);
  };

  return <div className={dark ? "app dark interest-page route-transition" : "app interest-page route-transition"}>
    <header className="interest-header">
      <Logo/>
      <Button variant="icon" onClick={() => setDark(!dark)} icon={dark ? "sun" : "moon"} className={`desktop-theme ${dark ? "theme-dark" : "theme-light"}`}/>
    </header>
    <main className="interest-content">
      <p className="blue-eyebrow">PERSONALIZE YOUR CAMPUS</p>
      <h1>What are you interested in?</h1>
      <p className="interest-intro">Choose at least three areas to shape your Campusly feed, communities, and opportunities.</p>
      <div className="interest-grid" aria-label="Campus interests">
        {campusInterests.map(interest => {
          const active = selected.includes(interest.name);
          return <button key={interest.name} className={active ? "interest-card active" : "interest-card"} aria-pressed={active} onClick={() => toggleInterest(interest.name)}>
            <span className="interest-icon"><Icon name={interest.icon} size={20}/></span>
            <span><strong>{interest.name}</strong><small>{interest.copy}</small></span>
            <span className="interest-check"><Icon name="check" size={15}/></span>
          </button>;
        })}
      </div>
      <div className="interest-footer">
        <span>{selected.length} selected</span>
        <Button onClick={onContinue} disabled={selected.length < 3}>Continue to Campusly <Icon name="chevron" size={16}/></Button>
      </div>
    </main>
  </div>;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("campusly_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authStage, setAuthStage] = useState<"auth" | "interests" | "app">(() => {
    const saved = localStorage.getItem("campusly_user");
    return saved ? "app" : "auth";
  });

  const [interests, setInterests] = useState<string[]>([]);
  const [page, setPage] = useState<Page>("Home");
  const [dark, setDark] = useState(false);
  const [newPost, setNewPost] = useState(false);
  const [report, setReport] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [college, setCollege] = useState("College not selected");
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pendingPage, setPendingPage] = useState<Page | null>(null);
  const pageTimerRef = useRef<number | null>(null);
  const activeIndex = nav.findIndex(item => item.name === page);

  const [chatTargetPeer, setChatTargetPeer] = useState<{ email: string; name: string } | null>(null);

  const openChatWith = (email: string, name: string) => {
    setChatTargetPeer({ email, name });
    navigateTo("Chats");
  };

  useEffect(() => {
    // If the database was wiped clean of registered users, reset client session for a fresh start
    fetchCampusUsers().then(users => {
      if (users.length === 0 && currentUser) {
        localStorage.removeItem("campusly_user");
        localStorage.removeItem("campusly_my_posts");
        setCurrentUser(null);
        setAuthStage("auth");
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser?.email) {
      syncUserProfile(currentUser).catch(console.error);
    }
  }, [currentUser?.email]);

  // Load real posts from MongoDB on load
  const loadPosts = async () => {
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch (err) {
      console.error("Could not load posts from MongoDB:", err);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(""), 2600);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => () => {
    if (pageTimerRef.current !== null) window.clearTimeout(pageTimerRef.current);
  }, []);

  const navigateTo = (nextPage: Page) => {
    if (nextPage === page || pendingPage) return;
    setNotificationsOpen(false);
    setPendingPage(nextPage);
    pageTimerRef.current = window.setTimeout(() => {
      setPage(nextPage);
      setPendingPage(null);
      pageTimerRef.current = null;
    }, 420);
  };

  const handleLoginSuccess = (user: UserProfile, isNew: boolean) => {
    setCurrentUser(user);
    localStorage.setItem("campusly_user", JSON.stringify(user));
    if (isNew) {
      setAuthStage("interests");
    } else {
      setAuthStage("app");
    }
    setFeedback(`Welcome, ${user.name}!`);
  };

  const signOut = async () => {
    if (pageTimerRef.current !== null) window.clearTimeout(pageTimerRef.current);
    pageTimerRef.current = null;
    await signOutUser();
    localStorage.removeItem("campusly_user");
    setCurrentUser(null);
    setPendingPage(null);
    setAuthStage("auth");
    setPage("Home");
    setNotificationsOpen(false);
    setNewPost(false);
    setReport(false);
    setQuery("");
    setFeedback("Logged out successfully");
  };

  const handleProfileUpdate = (updated: UserProfile) => {
    setCurrentUser(updated);
    localStorage.setItem("campusly_user", JSON.stringify(updated));
    if (updated.college) {
      setCollege(updated.college);
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts(cur => cur.filter(p => p._id !== postId));
  };

  if (authStage === "auth") {
    return <div className="route-transition" key="auth">
      <Login onLogin={handleLoginSuccess} dark={dark} setDark={setDark}/>
    </div>;
  }

  if (authStage === "interests") {
    return <InterestOnboarding
      dark={dark}
      setDark={setDark}
      selected={interests}
      setSelected={setInterests}
      onContinue={async () => {
        if (currentUser?.email) {
          await syncUserProfile({ email: currentUser.email, interests });
        }
        setAuthStage("app");
      }}
    />;
  }

  return <div className={dark ? "app dark route-transition" : "app route-transition"} key="app">
    <Sidebar page={page} setPage={navigateTo} onAI={() => { navigateTo("Chats"); setFeedback("Campus chats connected in real-time"); }}/>
    <div className="app-shell">
      <Header
        dark={dark}
        setDark={setDark}
        onPost={() => setNewPost(true)}
        notificationsOpen={notificationsOpen}
        onNotifications={() => setNotificationsOpen(!notificationsOpen)}
        notificationCount={notificationCount}
        onClearNotifications={() => { setNotificationCount(0); setNotificationsOpen(false); setFeedback("Notifications marked as read"); }}
        query={query}
        setQuery={value => { setQuery(value); if (page !== "Home") navigateTo("Home"); }}
        onNavigate={navigateTo}
        onSignOut={signOut}
        currentUser={currentUser}
      />
      <div className="page-scroll">
        <div className="page-transition" key={page}>
          {page === "Home" && <Home posts={posts} onReport={() => setReport(true)} onCreate={() => setNewPost(true)} query={query} onClearSearch={() => setQuery("")} onFeedback={setFeedback} currentUser={currentUser} onStartChat={openChatWith} onDeletePost={handleDeletePost}/>}
          {page === "Communities" && <Communities currentUser={currentUser} onFeedback={setFeedback}/>}
          {page === "Chats" && <Chats currentUser={currentUser} onFeedback={setFeedback} initialPeer={chatTargetPeer}/>}
          {page === "Opportunities" && <Opportunities onFeedback={setFeedback} currentUser={currentUser}/>}
          {page === "Marketplace" && <Marketplace onFeedback={setFeedback} currentUser={currentUser} onStartChat={openChatWith}/>}
          {page === "Profile" && <Profile posts={posts} currentUser={currentUser} onProfileUpdate={handleProfileUpdate} onCollegeChange={setCollege} onCreatePost={() => setNewPost(true)} onNavigate={navigateTo} onFeedback={setFeedback} onReport={() => setReport(true)} onDeletePost={handleDeletePost}/>}
          {page === "Settings" && <Settings currentUser={currentUser} onProfileUpdate={handleProfileUpdate} onFeedback={setFeedback} onDeleteAccount={signOut}/> }
        </div>
      </div>
    </div>
    <nav className="mobile-nav">
      {activeIndex >= 0 && <span className="mobile-nav-indicator" style={{ transform: `translateX(${activeIndex * 100}%)` }} aria-hidden="true"/>}
      {nav.map(n => <button className={page === n.name ? "active" : ""} key={n.name} onClick={() => navigateTo(n.name)}><Icon name={n.icon} size={20}/><span>{n.name === "Opportunities" ? "Jobs" : n.name}</span></button>)}
    </nav>
    {pendingPage && <PageTransitionLoader/>}
    {newPost && <NewPostModal onClose={() => setNewPost(false)} onCreate={post => { setPosts(cur => [post as Post, ...cur]); setFeedback("Post published to MongoDB"); }} college={college} currentUser={currentUser}/>}
    {report && <ReportModal onClose={() => setReport(false)} onSubmit={reason => { setReport(false); setFeedback(`Report submitted: ${reason}`); }}/>}
    {feedback && <div className="toast" role="status"><Icon name="check" size={16}/><span>{feedback}</span><button onClick={() => setFeedback("")} aria-label="Dismiss message"><Icon name="close" size={14}/></button></div>}
  </div>;
}
