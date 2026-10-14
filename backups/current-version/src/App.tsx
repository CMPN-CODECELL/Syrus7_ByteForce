import { useState } from "react";
import campuslyMark from "./assets/campusly-mark-v2.jpg";

type Page = "Home" | "Communities" | "Opportunities" | "Marketplace" | "Profile";

type IconName =
  | "home" | "users" | "briefcase" | "store" | "user" | "search" | "sparkles"
  | "bell" | "plus" | "sun" | "moon" | "arrowUp" | "arrowDown" | "message"
  | "bookmark" | "flag" | "check" | "chevron" | "book" | "clock" | "close"
  | "send" | "more" | "pin" | "shield" | "calendar" | "filter" | "edit"
  | "eye" | "eyeOff";

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
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>,
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
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Button({ children, variant = "primary", icon, onClick, type = "button", className = "" }: {
  children?: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "icon";
  icon?: IconName; onClick?: () => void; type?: "button" | "submit"; className?: string;
}) {
  return <button type={type} className={`btn btn-${variant} ${className}`} onClick={onClick}>{icon && <Icon name={icon} size={18}/>} {children}</button>;
}

const nav: { name: Page; icon: IconName }[] = [
  { name: "Home", icon: "home" }, { name: "Communities", icon: "users" },
  { name: "Opportunities", icon: "briefcase" }, { name: "Marketplace", icon: "store" },
  { name: "Profile", icon: "user" },
];

const posts = [
  { author: "Maya Chen", avatar: "MC", time: "12 min ago", title: "How should I prepare for graph questions in technical interviews?", body: "I understand BFS and DFS, but I struggle to identify when to use shortest path algorithms. What practice sequence worked for you?", tags: ["DSA", "Interviews"], votes: 84, comments: 18, color: "avatar-purple", verified: true },
  { author: "Anonymous", avatar: "A", time: "38 min ago", title: "Is it okay to negotiate a first internship offer?", body: "I received an offer from a mid-size startup, but the stipend is lower than I expected. I don't want to risk losing the opportunity.", tags: ["Internships", "Advice"], votes: 42, comments: 11, color: "avatar-dark", verified: false },
  { author: "Ishan Rao", avatar: "IR", time: "1 hr ago", title: "Looking for 2 teammates for the university AI hackathon", body: "We’re building an accessibility-focused note summarizer. Looking for someone comfortable with React or product design.", tags: ["Hackathons", "AI/ML"], votes: 31, comments: 24, color: "avatar-green", verified: false },
];

function Header({ dark, setDark, onPost }: { dark: boolean; setDark: (v: boolean) => void; onPost: () => void }) {
  return <header className="topbar">
    <div className="mobile-logo"><Logo/></div>
    <div className="search-wrap">
      <Icon name="search" size={18}/>
      <input aria-label="AI semantic search" placeholder="Ask anything across Campusly..." />
      <span className="ai-search"><Icon name="sparkles" size={14}/> AI Search</span>
    </div>
    <div className="top-actions">
      <Button variant="icon" onClick={() => setDark(!dark)} icon={dark ? "sun" : "moon"} className="desktop-theme"/>
      <button className="icon-button notification" aria-label="Notifications"><Icon name="bell" size={20}/><span/></button>
      <button className="avatar avatar-blue profile-button" aria-label="Profile">AK</button>
      <Button icon="plus" onClick={onPost} className="new-post">New Post</Button>
    </div>
  </header>;
}

function Logo() {
  return <div className="logo"><span className="logo-mark"><img src={campuslyMark} alt=""/></span><span>campus<span>ly</span></span></div>;
}

function Sidebar({ page, setPage, dark, setDark }: { page: Page; setPage: (p: Page) => void; dark: boolean; setDark: (v: boolean) => void }) {
  return <aside className="sidebar">
    <Logo/>
    <nav className="side-nav">
      <p className="eyebrow">DISCOVER</p>
      {nav.map(item => <button key={item.name} onClick={() => setPage(item.name)} className={page === item.name ? "nav-item active" : "nav-item"}><Icon name={item.icon}/><span>{item.name}</span>{item.name === "Home" && <b>6</b>}</button>)}
    </nav>
    <div className="side-bottom">
      <div className="study-card">
        <span><Icon name="sparkles" size={18}/></span>
        <strong>Study smarter</strong>
        <p>Get personalized answers with Campus AI.</p>
        <button>Try Campus AI <Icon name="chevron" size={14}/></button>
      </div>
      <button className="theme-row" onClick={() => setDark(!dark)}><Icon name={dark ? "sun" : "moon"} size={18}/><span>{dark ? "Light mode" : "Dark mode"}</span><span className={`toggle ${dark ? "on" : ""}`}><i/></span></button>
      <div className="user-row"><span className="avatar avatar-blue">AK</span><span><strong>Arjun Kumar</strong><small>Computer Science · 3rd yr</small></span><Icon name="more" size={18}/></div>
    </div>
  </aside>;
}

function SectionTitle({ eyebrow, title, copy, action }: { eyebrow?: string; title: string; copy: string; action?: React.ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <p className="blue-eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{copy}</p></div>{action}</div>;
}

function CategoryChips({ active, setActive }: { active: string; setActive: (v: string) => void }) {
  const categories = ["For you", "DSA", "Study Material", "Exam Material", "Internships", "Academics", "Hackathons", "AI / ML", "Campus Life"];
  return <div className="chips">{categories.map(c => <button key={c} className={active === c ? "chip active" : "chip"} onClick={() => setActive(c)}>{c}</button>)}</div>;
}

function VoteBox({ votes }: { votes: number }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  return <div className="vote-box"><button className={vote === "up" ? "voted" : ""} onClick={() => setVote(vote === "up" ? null : "up")} aria-label="Upvote"><Icon name="arrowUp" size={17}/></button><strong>{votes + (vote === "up" ? 1 : vote === "down" ? -1 : 0)}</strong><button className={vote === "down" ? "downvoted" : ""} onClick={() => setVote(vote === "down" ? null : "down")} aria-label="Downvote"><Icon name="arrowDown" size={17}/></button></div>;
}

function PostCard({ post, index, onReport }: { post: typeof posts[0]; index: number; onReport: () => void }) {
  const [saved, setSaved] = useState(false);
  const [threadOpen, setThreadOpen] = useState(index === 0);
  return <article className="post-card">
    <div className="post-votes"><VoteBox votes={post.votes}/></div>
    <div className="post-content">
      <div className="author-row"><span className={`avatar ${post.color}`}>{post.avatar}</span><div><strong>{post.author}</strong>{post.verified && <span className="verified"><Icon name="check" size={10}/> Verified Senior</span>}<small>{post.time} · IIIT Delhi</small></div><button className="more-button"><Icon name="more" size={19}/></button></div>
      <h2>{post.title}</h2>
      <p className="post-body">{post.body}</p>
      <div className="tags">{post.tags.map(t => <span key={t}>{t}</span>)}</div>
      <div className="post-footer">
        <button onClick={() => setThreadOpen(!threadOpen)}><Icon name="message" size={17}/>{threadOpen ? "Hide thread" : `View thread (${post.comments})`}</button>
        <button className={saved ? "saved" : ""} onClick={() => setSaved(!saved)}><Icon name="bookmark" size={17}/>{saved ? "Saved" : "Save"}</button>
        <button onClick={onReport}><Icon name="flag" size={16}/>Report</button>
      </div>
      {threadOpen && <Discussion/>}
    </div>
  </article>;
}

function Discussion() {
  return <div className="discussion">
    <div className="thread-heading"><Icon name="message" size={15}/><strong>Thread</strong><span>Top response</span></div>
      <div className="ai-summary"><span><Icon name="sparkles" size={20}/></span><div><strong>AI discussion summary</strong><p>Start with graph traversal patterns, then shortest-path problems. Most seniors recommend practicing by pattern—not difficulty—and explaining your approach aloud before coding.</p></div></div>
      <div className="comment"><span className="avatar avatar-coral">NS</span><div><div><strong>Nisha Shah</strong><span className="verified"><Icon name="check" size={10}/> Verified Senior</span><small>8 min ago</small></div><p>Build a decision tree: unweighted graph → BFS, positive weights → Dijkstra, negative weights → Bellman-Ford. Solve 3 examples of each before mixing patterns.</p><button>Reply</button></div></div>
      <div className="reply-box"><span className="avatar avatar-blue">AK</span><input placeholder="Add to the discussion..." /><button aria-label="Send reply"><Icon name="send" size={17}/></button></div>
  </div>;
}

function Home({ onReport }: { onReport: () => void }) {
  const [category, setCategory] = useState("For you");
  return <div className="home-layout">
    <main className="main-feed">
      <SectionTitle eyebrow="YOUR CAMPUS, CONNECTED" title="Good afternoon, Arjun" copy="Here’s what students are talking about today."/>
      <CategoryChips active={category} setActive={setCategory}/>
      <div className="feed-label"><span>Top discussions</span><button>Most relevant <Icon name="chevron" size={14}/></button></div>
      <div className="feed">{posts.map((post, i) => <PostCard key={post.title} post={post} index={i} onReport={onReport}/>)}</div>
      <article className="post-card flagged">
        <div className="blurred"><h2>Leaked answers for tomorrow’s quiz</h2><p>This post contains content that may violate community guidelines.</p></div>
        <div className="moderation-state"><span><Icon name="shield"/></span><div><strong>Pending moderator review</strong><p>Our AI moderation system flagged this post for review.</p></div></div>
      </article>
    </main>
    <aside className="right-rail">
      <div className="rail-card">
        <div className="rail-title"><h3>Trending this week</h3><button>View all</button></div>
        {[["01", "Summer internship prep", "142 posts"], ["02", "End-sem resources", "98 posts"], ["03", "AI Buildathon 2025", "76 posts"], ["04", "Course registration", "53 posts"]].map(x => <button className="trend" key={x[0]}><b>{x[0]}</b><span><strong>{x[1]}</strong><small>{x[2]}</small></span><Icon name="chevron" size={16}/></button>)}
      </div>
      <div className="rail-card event-card">
        <p className="eyebrow">UPCOMING</p><h3>Design & Code Sprint</h3><p>Build a product in 24 hours with students across campus.</p>
        <div><span><Icon name="calendar" size={16}/> May 24–25</span><span>124 going</span></div>
        <Button variant="secondary">View event</Button>
      </div>
      <p className="rail-footer">Community guidelines · Privacy · Help<br/>© 2025 Campusly</p>
    </aside>
  </div>;
}

const communities = [
  ["AI & Machine Learning", "2.8k members", "Linear-gradient(135deg,#ff5a00,#ff9c38)", "AI"],
  ["Web Development", "3.4k members", "Linear-gradient(135deg,#0ea5a8,#34d399)", "</>"],
  ["Competitive Coding", "4.1k members", "Linear-gradient(135deg,#f59e0b,#f97316)", "{}"],
  ["Product & Design", "1.9k members", "Linear-gradient(135deg,#ec4899,#8b5cf6)", "PD"],
];

function Communities() {
  const [joined, setJoined] = useState<string[]>(["AI & Machine Learning"]);
  return <main className="page-content">
    <SectionTitle eyebrow="FIND YOUR PEOPLE" title="Communities" copy="Learn, build, and grow with students who share your interests."/>
    <div className="community-grid">{communities.map(c => <article className="community-card" key={c[0]}><div className="community-cover" style={{ background: c[2].replace("Linear", "linear") }}><span>{c[3]}</span></div><div><h2>{c[0]}</h2><p>{c[1]} · 28 new posts</p><Button variant={joined.includes(c[0]) ? "secondary" : "primary"} onClick={() => setJoined(joined.includes(c[0]) ? joined.filter(x => x !== c[0]) : [...joined, c[0]])}>{joined.includes(c[0]) ? "Joined" : "Join community"}</Button></div></article>)}</div>
    <div className="community-detail">
      <div>
        <div className="subheading"><div><p className="blue-eyebrow">FEATURED COMMUNITY</p><h2>AI & Machine Learning</h2></div><Button icon="plus">New discussion</Button></div>
        {posts.slice(0,2).map((p,i) => <div className="mini-post" key={p.title}><span className={`avatar ${p.color}`}>{p.avatar}</span><div><small>{p.author} · {p.time}</small><h3>{p.title}</h3><p>{p.body}</p><span><Icon name="arrowUp" size={14}/> {p.votes} &nbsp; <Icon name="message" size={14}/> {p.comments}</span></div></div>)}
      </div>
      <aside className="resources"><h3><Icon name="pin" size={18}/> Pinned resources</h3>{["ML Roadmap for Beginners", "Deep Learning Study Guide", "50 Essential Papers", "Project Ideas Directory"].map((r,i) => <button key={r}><span><Icon name={i === 3 ? "briefcase" : "book"} size={17}/></span><div><strong>{r}</strong><small>{i % 2 ? "Notion guide" : "Community collection"}</small></div><Icon name="chevron" size={15}/></button>)}</aside>
    </div>
  </main>;
}

const opportunities = [
  { logo: "G", company: "Google", title: "Software Engineering Intern", type: "Internship", deadline: "May 30", eligibility: "2026 grads" },
  { logo: "D", company: "Devfolio", title: "Hack the Future 2025", type: "Hackathon", deadline: "Jun 08", eligibility: "All students" },
  { logo: "M", company: "Microsoft", title: "Explore Program Intern", type: "Internship", deadline: "Jun 12", eligibility: "1st–2nd year" },
  { logo: "S", company: "Stripe", title: "Product Engineering Challenge", type: "Challenge", deadline: "Jun 18", eligibility: "CS students" },
];

function Opportunities() {
  return <main className="page-content">
    <SectionTitle eyebrow="YOUR NEXT STEP" title="Opportunities hub" copy="Curated internships, hackathons, and challenges for ambitious students." action={<Button variant="secondary" icon="filter">Filters</Button>}/>
    <div className="opportunity-stats"><div><strong>48</strong><span>Open opportunities</span></div><div><strong>12</strong><span>Closing this week</span></div><div><strong>86%</strong><span>Verified listings</span></div></div>
    <div className="opportunity-grid">{opportunities.map((o,i) => <article className="opportunity-card" key={o.title}><div className="opp-top"><span className={`company-logo company-${i}`}>{o.logo}</span><span className="type-pill">{o.type}</span><button><Icon name="bookmark" size={18}/></button></div><small>{o.company}</small><h2>{o.title}</h2><div className="opp-meta"><span><Icon name="clock" size={15}/> Deadline: {o.deadline}</span><span><Icon name="user" size={15}/> {o.eligibility}</span></div><Button>Apply now <Icon name="chevron" size={15}/></Button></article>)}</div>
    <section className="tips-section"><div className="tips-intro"><p className="blue-eyebrow">FROM PEOPLE WHO’VE DONE IT</p><h2>Senior interview tips</h2><p>Practical advice from students who recently landed roles at top companies.</p></div><div className="tip-list">{[["Riya · SWE Intern at Google", "Narrate your thinking, even when you’re stuck. Interviewers care about your process."], ["Dev · Product Intern at Razorpay", "Make every resume bullet show a decision you made—not just a task you completed."]].map((t,i) => <article key={t[0]}><span className={`avatar ${i ? "avatar-green" : "avatar-purple"}`}>{i ? "DV" : "RS"}</span><div><strong>{t[0]}</strong><p>“{t[1]}”</p></div></article>)}</div></section>
  </main>;
}

const products = [
  { title: "Introduction to Algorithms", price: "₹850", type: "Sale", condition: "Like new", image: "https://images.unsplash.com/photo-1758708536050-e911f468ea83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { title: "Casio FX-991EX Calculator", price: "₹700", type: "Sale", condition: "Good", image: "https://images.unsplash.com/photo-1761546571631-a4d61b55cd2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { title: "Engineering Drawing Kit", price: "Free", type: "Donate", condition: "Used", image: "https://images.unsplash.com/photo-1536880879850-e5a87ee99f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  { title: "Discrete Mathematics", price: "₹120 / mo", type: "Lend", condition: "Like new", image: "https://images.unsplash.com/photo-1761821170104-ccd3e3e21318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
];

function Marketplace() {
  const [filter, setFilter] = useState("All");
  const shown = filter === "All" ? products : products.filter(p => p.type === filter);
  return <main className="page-content">
    <SectionTitle eyebrow="STUDENT TO STUDENT" title="Resource marketplace" copy="Buy, borrow, or pass on useful resources within your campus." action={<Button icon="plus">Create listing</Button>}/>
    <div className="market-toolbar"><div className="chips">{["All", "Sale", "Lend", "Donate"].map(x => <button className={filter === x ? "chip active" : "chip"} key={x} onClick={() => setFilter(x)}>{x}</button>)}</div><div className="filter-groups"><button><Icon name="book" size={16}/> Category <Icon name="chevron" size={14}/></button><button>Condition <Icon name="chevron" size={14}/></button></div></div>
    <div className="product-grid">{shown.map(p => <article className="product-card" key={p.title}><div className="product-image"><img src={p.image} alt={p.title}/><span className={`listing-type ${p.type.toLowerCase()}`}>{p.type}</span><button aria-label="Save listing"><Icon name="bookmark" size={18}/></button></div><div className="product-info"><small>{p.condition} · Listed 2d ago</small><h2>{p.title}</h2><strong className={p.price === "Free" ? "free" : ""}>{p.price}</strong><div className="seller"><span className="avatar avatar-coral">NS</span><span><b>Nisha Shah</b><small>0.8 km away</small></span></div><Button variant="secondary" icon="message">Message owner</Button></div></article>)}</div>
  </main>;
}

function Profile() {
  const [tab, setTab] = useState("Posts");
  return <main className="page-content profile-page">
    <div className="profile-hero"><div className="profile-banner"/><div className="profile-main"><span className="avatar profile-avatar">AK</span><div><h1>Arjun Kumar</h1><p>Computer Science · 3rd year · IIIT Delhi</p><span><Icon name="check" size={13}/> Campus verified</span></div><Button variant="secondary" icon="edit">Edit profile</Button></div><p className="profile-bio">Building for the web, exploring machine learning, and always happy to help with DSA. Currently looking for a summer internship.</p><div className="skill-list">{["React", "TypeScript", "Python", "Figma", "Machine Learning"].map(s => <span key={s}>{s}</span>)}</div><div className="profile-stats"><div><strong>14</strong><span>Posts</span></div><div><strong>382</strong><span>Upvotes</span></div><div><strong>26</strong><span>Helpful answers</span></div></div></div>
    <div className="profile-content"><div className="tabs">{["Posts", "Saved", "Listings"].map(t => <button className={tab === t ? "active" : ""} onClick={() => setTab(t)} key={t}>{t}</button>)}</div>{tab === "Posts" ? posts.slice(1).map((p,i) => <PostCard key={p.title} post={p} index={i+1} onReport={() => {}}/>) : <div className="empty-state"><span><Icon name={tab === "Saved" ? "bookmark" : "store"}/></span><h2>{tab === "Saved" ? "Your saved posts" : "Your marketplace listings"}</h2><p>{tab === "Saved" ? "Posts you save will appear here." : "You haven’t created a listing yet."}</p></div>}</div>
  </main>;
}

function NewPostModal({ onClose }: { onClose: () => void }) {
  const [anonymous, setAnonymous] = useState(false);
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="modal" role="dialog" aria-modal="true" aria-label="Create a new post" onMouseDown={e => e.stopPropagation()}>
    <div className="modal-head"><div><p className="blue-eyebrow">ASK THE COMMUNITY</p><h2>Create a post</h2></div><Button variant="icon" icon="close" onClick={onClose}/></div>
    <label>Title<input autoFocus placeholder="What do you want to ask or share?"/></label>
    <label>Details<textarea rows={6} placeholder="Add context, what you’ve tried, or any details that may help..."/></label>
    <label>Category<select defaultValue=""><option value="" disabled>Select a category</option><option>DSA</option><option>Study Material</option><option>Exam Material</option><option>Internships</option><option>Academics</option><option>Campus Life</option></select></label>
    <button className="anonymous-row" onClick={() => setAnonymous(!anonymous)}><span><strong>Post anonymously</strong><small>Your identity will be hidden from other students.</small></span><span className={`toggle ${anonymous ? "on" : ""}`}><i/></span></button>
    <div className="modal-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={onClose}>Publish post</Button></div>
  </div></div>;
}

function ReportModal({ onClose }: { onClose: () => void }) {
  const [reason, setReason] = useState("");
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal report-modal" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}><div className="modal-head"><div><p className="blue-eyebrow">HELP KEEP CAMPUSLY SAFE</p><h2>Report this post</h2></div><Button variant="icon" icon="close" onClick={onClose}/></div><p>Why are you reporting this content?</p><div className="report-options">{["Spam or misleading", "Harassment or bullying", "Academic misconduct", "Inappropriate content"].map(r => <button className={reason === r ? "selected" : ""} key={r} onClick={() => setReason(r)}><span>{r}</span><i>{reason === r && <Icon name="check" size={13}/>}</i></button>)}</div><div className="modal-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={onClose} className={!reason ? "disabled" : ""}>Submit report</Button></div></div></div>;
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  return <div className="login-page">
    <div className="login-brand">
      <div className="login-brand-top"><Logo/></div>
      <div className="login-story">
        <span className="login-kicker"><Icon name="sparkles" size={14}/> Built for student life</span>
        <h1>Everything campus.<br/><em>One community.</em></h1>
        <p>Ask questions, find opportunities, exchange resources, and learn from seniors who have been there before.</p>
      </div>
    </div>
    <main className="login-panel">
      <div className="login-box">
        <p className="blue-eyebrow">WELCOME TO CAMPUSLY</p>
        <h2>Sign in to your campus</h2>
        <p className="login-subtitle">Connect with your peers and pick up where you left off.</p>
        <button className="google-login" onClick={onLogin}><span>G</span> Continue with Google</button>
        <div className="login-divider"><span>or use your college email</span></div>
        <form onSubmit={e => { e.preventDefault(); onLogin(); }}>
          <label>College email<input type="email" placeholder="you@college.edu" required/></label>
          <label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} placeholder="Enter your password" required/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}><Icon name={showPassword ? "eyeOff" : "eye"} size={18}/></button></div></label>
          <div className="login-options"><label><input type="checkbox"/> Keep me signed in</label><button type="button">Forgot password?</button></div>
          <Button type="submit" className="login-submit">Sign in <Icon name="chevron" size={16}/></Button>
        </form>
        <p className="signup-copy">New to Campusly? <button onClick={onLogin}>Create your account</button></p>
        <p className="login-terms">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </main>
  </div>;
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState<Page>("Home");
  const [dark, setDark] = useState(false);
  const [newPost, setNewPost] = useState(false);
  const [report, setReport] = useState(false);
  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)}/>;
  return <div className={dark ? "app dark" : "app"}>
    <Sidebar page={page} setPage={setPage} dark={dark} setDark={setDark}/>
    <div className="app-shell">
      <Header dark={dark} setDark={setDark} onPost={() => setNewPost(true)}/>
      <div className="page-scroll">{page === "Home" && <Home onReport={() => setReport(true)}/>} {page === "Communities" && <Communities/>} {page === "Opportunities" && <Opportunities/>} {page === "Marketplace" && <Marketplace/>} {page === "Profile" && <Profile/>}</div>
    </div>
    <nav className="mobile-nav">{nav.map(n => <button className={page === n.name ? "active" : ""} key={n.name} onClick={() => setPage(n.name)}><Icon name={n.icon} size={20}/><span>{n.name === "Opportunities" ? "Jobs" : n.name}</span></button>)}</nav>
    {newPost && <NewPostModal onClose={() => setNewPost(false)}/>}
    {report && <ReportModal onClose={() => setReport(false)}/>}
  </div>;
}
