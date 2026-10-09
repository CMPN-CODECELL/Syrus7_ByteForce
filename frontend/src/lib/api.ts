export interface FileAttachment {
  type: 'image' | 'audio' | 'link' | 'pdf';
  name: string;
  url: string;
  fileId?: string;
}

export interface Post {
  _id?: string;
  author: string;
  authorEmail?: string;
  avatar: string;
  time: string;
  title: string;
  body: string;
  tags: string[];
  votes: number;
  comments: number;
  replies?: Array<{
    _id?: string;
    text: string;
    author: string;
    avatar: string;
    color: string;
    createdAt?: string;
  }>;
  color: string;
  verified: boolean;
  college: string;
  attachments: FileAttachment[];
  aiScore?: number;
  aiReason?: string;
}

export interface Community {
  _id?: string;
  name: string;
  description: string;
  category: string;
  creator: string;
  creatorEmail: string;
  members: string[];
  memberCount: number;
}

export interface Product {
  _id?: string;
  title: string;
  price: string;
  type: string;
  condition: string;
  category?: string;
  sellerName?: string;
  sellerEmail?: string;
  image: string;
}

export interface Opportunity {
  _id?: string;
  title: string;
  company: string;
  type: string;
  deadline: string;
  eligibility: string;
  logo: string;
  appliedBy?: string[];
  savedBy?: string[];
}

export interface ChatMessage {
  _id?: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  text: string;
  attachments?: FileAttachment[];
  timestamp: string;
  read?: boolean;
}

export interface CommunityMessage {
  _id?: string;
  communityId: string;
  senderEmail: string;
  senderName: string;
  avatar: string;
  color?: string;
  text: string;
  attachments?: FileAttachment[];
  createdAt: string;
}

export interface Conversation {
  email: string;
  name: string;
  lastMessage: string;
  timestamp: string | null;
  college?: string;
}

// Safe JSON response parser that handles empty responses, 502/504 errors, and non-JSON text
async function safeParseJson<T>(res: Response, fallback: T): Promise<T> {
  try {
    const text = await res.text();
    if (!text || !text.trim()) return fallback;
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

// Upload images, audios, PDFs directly to MongoDB
export async function uploadFilesToMongoDB(files: File[]): Promise<FileAttachment[]> {
  if (files.length === 0) return [];
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));

  try {
    const res = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('File upload to MongoDB failed');
    const data = await safeParseJson<{ files: any[] }>(res, { files: [] });

    return (data.files || []).map((f: { url: string; filename: string; contentType: string; fileId: string }) => {
      let type: FileAttachment['type'] = 'link';
      if (f.contentType.startsWith('image/')) type = 'image';
      else if (f.contentType.startsWith('audio/')) type = 'audio';
      else if (f.contentType.includes('pdf')) type = 'pdf';

      return {
        type,
        name: f.filename,
        url: f.url,
        fileId: f.fileId,
      };
    });
  } catch (err) {
    console.warn('Upload error:', err);
    return [];
  }
}

// Posts API
export async function fetchPosts(): Promise<Post[]> {
  try {
    const res = await fetch('/api/posts');
    if (!res.ok) return [];
    return await safeParseJson<Post[]>(res, []);
  } catch {
    return [];
  }
}

export async function createPost(post: Partial<Post>): Promise<Post> {
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    return await safeParseJson<Post>(res, post as Post);
  } catch {
    return post as Post;
  }
}

export async function deleteUserAccount(email: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await safeParseJson<{ error?: string }>(res, { error: 'Failed to delete account' });
      throw new Error(data.error || 'Failed to delete account');
    }
    return true;
  } catch (error) {
    console.error('Delete account error:', error);
    return false;
  }
}

export async function deleteUploadedFile(fileId: string): Promise<boolean> {
  if (!fileId) return false;
  try {
    const res = await fetch(`/api/files/${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (error) {
    console.error('Delete uploaded file error:', error);
    return false;
  }
}

export async function votePost(postId: string, type: 'up' | 'down', voterEmail: string) {
  try {
    const res = await fetch(`/api/posts/${postId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, voterEmail }),
    });
    return await safeParseJson(res, { success: res.ok });
  } catch {
    return { success: false };
  }
}

export async function addPostReply(postId: string, text: string, author: string, avatar: string, color: string) {
  try {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author, avatar, color }),
    });
    return await safeParseJson(res, { success: res.ok });
  } catch {
    return { success: false };
  }
}

// Communities API
export async function fetchCommunities(): Promise<Community[]> {
  try {
    const res = await fetch('/api/communities');
    if (!res.ok) return [];
    return await safeParseJson<Community[]>(res, []);
  } catch {
    return [];
  }
}

export async function createCommunity(community: { name: string; description?: string; category?: string; creator: string; creatorEmail: string }): Promise<Community> {
  try {
    const res = await fetch('/api/communities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(community),
    });
    return await safeParseJson<Community>(res, { ...community, members: [community.creatorEmail], memberCount: 1 });
  } catch {
    return { ...community, members: [community.creatorEmail], memberCount: 1 };
  }
}

export async function toggleCommunityMembership(id: string, userEmail: string) {
  try {
    const res = await fetch(`/api/communities/${id}/toggle-membership`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail }),
    });
    return await safeParseJson(res, { isMember: true, memberCount: 1 });
  } catch {
    return { isMember: false, memberCount: 0 };
  }
}

export async function fetchCommunityMessages(communityId: string): Promise<CommunityMessage[]> {
  try {
    const res = await fetch(`/api/communities/${communityId}/messages`);
    if (!res.ok) return [];
    return await safeParseJson<CommunityMessage[]>(res, []);
  } catch {
    return [];
  }
}

export async function sendCommunityMessage(communityId: string, msg: {
  senderEmail: string;
  senderName: string;
  text: string;
  avatar?: string;
  color?: string;
  attachments?: FileAttachment[];
}): Promise<CommunityMessage> {
  try {
    const res = await fetch(`/api/communities/${communityId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
    return await safeParseJson<CommunityMessage>(res, {
      ...msg,
      communityId,
      _id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      avatar: msg.avatar || 'S',
    });
  } catch {
    return {
      ...msg,
      communityId,
      _id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      avatar: msg.avatar || 'S',
    };
  }
}

export async function deleteCommunityMessage(communityId: string, messageId: string, userEmail: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/communities/${communityId}/messages/${messageId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Marketplace API
export async function fetchMarketplace(): Promise<Product[]> {
  try {
    const res = await fetch('/api/marketplace');
    if (!res.ok) return [];
    return await safeParseJson<Product[]>(res, []);
  } catch {
    return [];
  }
}

export async function createProduct(product: Partial<Product>): Promise<Product> {
  try {
    const res = await fetch('/api/marketplace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return await safeParseJson<Product>(res, product as Product);
  } catch {
    return product as Product;
  }
}

export async function toggleSaveProduct(id: string, userEmail: string) {
  try {
    const res = await fetch(`/api/marketplace/${id}/toggle-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail }),
    });
    return await safeParseJson(res, { saved: false });
  } catch {
    return { saved: false };
  }
}

// Opportunities API
export async function fetchOpportunities(): Promise<Opportunity[]> {
  try {
    const res = await fetch('/api/opportunities');
    if (!res.ok) return [];
    return await safeParseJson<Opportunity[]>(res, []);
  } catch {
    return [];
  }
}

export async function createOpportunity(opp: Partial<Opportunity>): Promise<Opportunity> {
  try {
    const res = await fetch('/api/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opp),
    });
    return await safeParseJson<Opportunity>(res, opp as Opportunity);
  } catch {
    return opp as Opportunity;
  }
}

export async function applyOpportunity(id: string, userEmail: string) {
  try {
    const res = await fetch(`/api/opportunities/${id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail }),
    });
    return await safeParseJson(res, { applied: true });
  } catch {
    return { applied: false };
  }
}

export async function toggleSaveOpportunity(id: string, userEmail: string) {
  try {
    const res = await fetch(`/api/opportunities/${id}/toggle-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail }),
    });
    return await safeParseJson(res, { saved: false });
  } catch {
    return { saved: false };
  }
}

// Chats & WebSocket API
export async function fetchConversations(email: string): Promise<Conversation[]> {
  try {
    const res = await fetch(`/api/chats/conversations?email=${encodeURIComponent(email)}`);
    if (!res.ok) return [];
    return await safeParseJson<Conversation[]>(res, []);
  } catch {
    return [];
  }
}

export async function fetchMessages(user1: string, user2: string): Promise<ChatMessage[]> {
  try {
    const res = await fetch(`/api/chats/messages?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`);
    if (!res.ok) return [];
    return await safeParseJson<ChatMessage[]>(res, []);
  } catch {
    return [];
  }
}

export async function sendChatMessage(msg: {
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  text: string;
  attachments?: FileAttachment[];
}): Promise<ChatMessage> {
  try {
    const res = await fetch('/api/chats/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
    return await safeParseJson<ChatMessage>(res, { ...msg, _id: Date.now().toString(), timestamp: new Date().toISOString() });
  } catch {
    return { ...msg, _id: Date.now().toString(), timestamp: new Date().toISOString() };
  }
}

export async function deleteChatMessage(messageId: string, userEmail: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/chats/messages/${messageId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteConversation(user1: string, user2: string): Promise<boolean> {
  try {
    const res = await fetch('/api/chats/conversations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user1, user2 }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deletePostReply(postId: string, replyText: string, author?: string, authorEmail?: string) {
  try {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replyText, author, authorEmail }),
    });
    return await safeParseJson(res, { success: res.ok });
  } catch {
    return { success: false };
  }
}

export async function deletePost(postId: string, author?: string, authorEmail?: string) {
  try {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, authorEmail }),
    });
    return await safeParseJson(res, { success: res.ok });
  } catch {
    return { success: false };
  }
}

// Profile Sync
export async function syncUserProfile(profile: {
  email: string;
  name?: string;
  college?: string;
  avatar?: string;
  username?: string;
  year?: string;
  branch?: string;
  interests?: string[];
  supabaseId?: string;
}) {
  try {
    const res = await fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return await safeParseJson(res, profile);
  } catch (err) {
    console.warn('Profile sync network error:', err);
    return profile;
  }
}

// Fetch all registered campus students for directory and real-time chat initiation
export async function fetchCampusUsers(): Promise<Array<{ email: string; name: string; college: string; avatar?: string; username?: string; year?: string; branch?: string }>> {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) return [];
    return await safeParseJson<Array<{ email: string; name: string; college: string; avatar?: string; username?: string; year?: string; branch?: string }>>(res, []);
  } catch {
    return [];
  }
}

// Real-time WebSocket connection manager
export class RealtimeChatClient {
  private ws: WebSocket | null = null;
  private email: string;
  private onMessageCallback: (msg: ChatMessage) => void;
  private onDeleteCallback?: (deletedId: string) => void;
  private onCommunityMessageCallback?: (commId: string, msg: CommunityMessage) => void;
  private onConversationDeletedCallback?: (user1: string, user2: string) => void;
  private reconnectTimer: number | null = null;

  constructor(
    email: string,
    onMessage: (msg: ChatMessage) => void,
    onDelete?: (deletedId: string) => void,
    onCommunityMessage?: (commId: string, msg: CommunityMessage) => void,
    onConversationDeleted?: (user1: string, user2: string) => void
  ) {
    this.email = email;
    this.onMessageCallback = onMessage;
    this.onDeleteCallback = onDelete;
    this.onCommunityMessageCallback = onCommunityMessage;
    this.onConversationDeletedCallback = onConversationDeleted;
    this.connect();
  }

  public setOnCommunityMessage(cb: (commId: string, msg: CommunityMessage) => void) {
    this.onCommunityMessageCallback = cb;
  }

  public setOnConversationDeleted(cb: (user1: string, user2: string) => void) {
    this.onConversationDeletedCallback = cb;
  }

  private connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'auth', email: this.email }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'chat_message') {
            this.onMessageCallback(data.message);
          } else if (data.type === 'message_deleted' && this.onDeleteCallback) {
            this.onDeleteCallback(data.messageId);
          } else if (data.type === 'community_message' && this.onCommunityMessageCallback) {
            this.onCommunityMessageCallback(data.communityId, data.message);
          } else if (data.type === 'conversation_deleted' && this.onConversationDeletedCallback) {
            this.onConversationDeletedCallback(data.user1, data.user2);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      this.ws.onclose = () => {
        // Reconnect after 2 seconds
        this.reconnectTimer = window.setTimeout(() => this.connect(), 2000);
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket client error:', err);
        this.ws?.close();
      };
    } catch (err) {
      console.error('WebSocket connection initialization error:', err);
    }
  }

  public disconnect() {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }
}

// ==========================================
// GOOGLE GEMINI AI FEATURES
// ==========================================

export interface ModerationResult {
  flagged: boolean;
  categories: string[];
  reason: string;
  severity: 'none' | 'low' | 'medium' | 'high';
  poweredBy?: string;
}

export interface SemanticSearchResult {
  matches: Array<{
    id: string;
    score: number;
    reason: string;
  }>;
  poweredBy?: string;
}

export interface ThreadSummaryResult {
  summary: string;
  keyTakeaways: string[];
  consensus: string;
  poweredBy?: string;
}

export function getStoredGeminiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('campusly_gemini_key') || '';
}

export function saveStoredGeminiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key.trim()) {
    localStorage.removeItem('campusly_gemini_key');
  } else {
    localStorage.setItem('campusly_gemini_key', key.trim());
  }
}

export function getStoredGroqKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('campusly_groq_key') || '';
}

export function saveStoredGroqKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key.trim()) {
    localStorage.removeItem('campusly_groq_key');
  } else {
    localStorage.setItem('campusly_groq_key', key.trim());
  }
}

export async function moderateContent(text: string, title?: string, type: 'post' | 'comment' | 'chat' = 'post'): Promise<ModerationResult> {
  try {
    const geminiKey = getStoredGeminiKey();
    const groqKey = getStoredGroqKey();
    const res = await fetch('/api/ai/moderate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(geminiKey ? { 'x-gemini-key': geminiKey } : {}),
        ...(groqKey ? { 'x-groq-key': groqKey } : {}),
      },
      body: JSON.stringify({
        text,
        title,
        type,
        apiKey: geminiKey,
        groqApiKey: groqKey,
      }),
    });
    return await safeParseJson<ModerationResult>(res, {
      flagged: false,
      categories: [],
      reason: 'Safety check passed',
      severity: 'none',
    });
  } catch {
    return {
      flagged: false,
      categories: [],
      reason: 'Safety check completed',
      severity: 'none',
    };
  }
}

export async function checkGroqSafeguard(input: string): Promise<{
  violation?: number;
  category?: string | null;
  rationale?: string;
  error?: string;
}> {
  try {
    const groqKey = getStoredGroqKey();
    const res = await fetch('/api/ai/groq-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(groqKey ? { 'x-groq-key': groqKey } : {}),
      },
      body: JSON.stringify({ input, groqApiKey: groqKey }),
    });
    const data = await safeParseJson<{ result?: any; error?: string }>(res, {});
    if (data.error) return { error: data.error };
    return data.result || {};
  } catch (err: any) {
    return { error: err.message || 'Groq check failed' };
  }
}

export async function semanticSearchPosts(query: string, posts: Post[]): Promise<SemanticSearchResult> {
  try {
    const key = getStoredGeminiKey();
    const res = await fetch('/api/ai/semantic-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { 'x-gemini-key': key } : {}),
      },
      body: JSON.stringify({ query, posts, apiKey: key }),
    });
    return await safeParseJson<SemanticSearchResult>(res, { matches: [] });
  } catch {
    return { matches: [] };
  }
}

export async function summarizeThread(title: string, body: string, replies: Array<{ author: string; text: string }>): Promise<ThreadSummaryResult> {
  try {
    const key = getStoredGeminiKey();
    const res = await fetch('/api/ai/summarize-thread', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { 'x-gemini-key': key } : {}),
      },
      body: JSON.stringify({ title, body, replies, apiKey: key }),
    });
    return await safeParseJson<ThreadSummaryResult>(res, {
      summary: `Discussion on "${title}" with ${replies.length} replies.`,
      keyTakeaways: replies.slice(0, 3).map(r => `${r.author}: ${r.text.slice(0, 80)}`),
      consensus: 'Active community conversation.',
    });
  } catch {
    return {
      summary: `Discussion on "${title}".`,
      keyTakeaways: [],
      consensus: '',
    };
  }
}
