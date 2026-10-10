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
    authorEmail?: string;
    avatar: string;
    color: string;
    parentId?: string | null;
    replyingToAuthor?: string | null;
    replyingToText?: string | null;
    votes?: number;
    upvoters?: string[];
    downvoters?: string[];
    createdAt?: string;
  }>;
  color: string;
  verified: boolean;
  college: string;
  attachments: FileAttachment[];
  aiScore?: number;
  aiReason?: string;
  flagged?: boolean;
  moderationReason?: string;
  moderationStatus?: 'approved' | 'pending' | 'flagged';
}

export interface Community {
  _id?: string;
  name: string;
  description: string;
  category: string;
  creator: string;
  creatorEmail: string;
  image?: string;
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
  link?: string;
  image?: string;
  postedBy?: string;
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
  edited?: boolean;
  editedAt?: string;
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
  edited?: boolean;
  editedAt?: string;
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

export async function addPostReply(
  postId: string,
  text: string,
  author: string,
  avatar: string,
  color: string,
  authorEmail?: string,
  parentId?: string | null,
  replyingToAuthor?: string | null,
  replyingToText?: string | null
) {
  try {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author, avatar, color, authorEmail, parentId, replyingToAuthor, replyingToText }),
    });
    return await safeParseJson(res, { success: res.ok });
  } catch {
    return { success: false };
  }
}

export async function votePostComment(
  postId: string,
  commentId: string,
  type: 'up' | 'down',
  voterEmail: string
): Promise<{ commentId: string; votes: number; upvoted: boolean; downvoted: boolean }> {
  try {
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, voterEmail }),
    });
    return await safeParseJson(res, { commentId, votes: 0, upvoted: false, downvoted: false });
  } catch {
    return { commentId, votes: 0, upvoted: false, downvoted: false };
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

export async function editCommunityMessage(
  communityId: string,
  messageId: string,
  text: string,
  userEmail: string
): Promise<CommunityMessage | null> {
  try {
    const res = await fetch(`/api/communities/${communityId}/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, userEmail }),
    });
    if (!res.ok) return null;
    return await safeParseJson<CommunityMessage | null>(res, null);
  } catch {
    return null;
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
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    if (errData?.error) throw new Error(errData.error);
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch failed')) {
      throw err;
    }
  }
  return {
    ...product,
    _id: `prod-${Date.now()}`,
    createdAt: new Date().toISOString(),
  } as Product;
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
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    if (errData?.error) throw new Error(errData.error);
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch failed')) {
      throw err;
    }
  }
  return {
    ...opp,
    _id: `opp-${Date.now()}`,
    createdAt: new Date().toISOString(),
  } as Opportunity;
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

export async function deleteCommunity(id: string, userEmail?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/communities/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteProduct(id: string, userEmail?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/marketplace/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteOpportunity(id: string, userEmail?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/opportunities/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deletePostAttachment(postId: string, index: number, userEmail?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/posts/${postId}/attachments/${index}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function reportChatMessage(messageId: string, reason: string, reporterEmail?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/chats/messages/${messageId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, reporterEmail }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function reportCommunityMessage(communityId: string, messageId: string, reason: string, reporterEmail?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/communities/${communityId}/messages/${messageId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, reporterEmail }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchReportedPosts(): Promise<Post[]> {
  try {
    const res = await fetch('/api/posts/reported');
    if (!res.ok) return [];
    return await safeParseJson<Post[]>(res, []);
  } catch {
    return [];
  }
}

export async function fetchReportedChatMessages(): Promise<ChatMessage[]> {
  try {
    const res = await fetch('/api/chats/reported-messages');
    if (!res.ok) return [];
    return await safeParseJson<ChatMessage[]>(res, []);
  } catch {
    return [];
  }
}

export async function fetchReportedCommunityMessages(): Promise<CommunityMessage[]> {
  try {
    const res = await fetch('/api/communities/reported-messages');
    if (!res.ok) return [];
    return await safeParseJson<CommunityMessage[]>(res, []);
  } catch {
    return [];
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

export async function editChatMessage(
  messageId: string,
  text: string,
  userEmail: string
): Promise<ChatMessage | null> {
  try {
    const res = await fetch(`/api/chats/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, userEmail }),
    });
    if (!res.ok) return null;
    return await safeParseJson<ChatMessage | null>(res, null);
  } catch {
    return null;
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

export async function reportPost(postId: string, reason: string, reporterEmail?: string) {
  try {
    const res = await fetch(`/api/posts/${postId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, reporterEmail }),
    });
    return await safeParseJson(res, { success: true, flagged: true, moderationReason: reason });
  } catch {
    return { success: true, flagged: true, moderationReason: reason };
  }
}

export async function unflagPost(postId: string) {
  try {
    const res = await fetch(`/api/posts/${postId}/unflag`, {
      method: 'POST',
    });
    return await safeParseJson(res, { success: res.ok, flagged: false });
  } catch {
    return { success: true, flagged: false };
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

export async function fetchUserProfileByEmail(email: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchUserProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`/api/users/by-username/${encodeURIComponent(username)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
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
  private onPostCreatedCallback?: (post: Post) => void;
  private onMessageEditedCallback?: (msg: ChatMessage) => void;
  private onCommunityMessageEditedCallback?: (commId: string, msg: CommunityMessage) => void;
  private reconnectTimer: number | null = null;

  constructor(
    email: string,
    onMessage: (msg: ChatMessage) => void,
    onDelete?: (deletedId: string) => void,
    onCommunityMessage?: (commId: string, msg: CommunityMessage) => void,
    onConversationDeleted?: (user1: string, user2: string) => void,
    onPostCreated?: (post: Post) => void,
    onMessageEdited?: (msg: ChatMessage) => void,
    onCommunityMessageEdited?: (commId: string, msg: CommunityMessage) => void
  ) {
    this.email = email;
    this.onMessageCallback = onMessage;
    this.onDeleteCallback = onDelete;
    this.onCommunityMessageCallback = onCommunityMessage;
    this.onConversationDeletedCallback = onConversationDeleted;
    this.onPostCreatedCallback = onPostCreated;
    this.onMessageEditedCallback = onMessageEdited;
    this.onCommunityMessageEditedCallback = onCommunityMessageEdited;
    this.connect();
  }

  public setOnCommunityMessage(cb: (commId: string, msg: CommunityMessage) => void) {
    this.onCommunityMessageCallback = cb;
  }

  public setOnConversationDeleted(cb: (user1: string, user2: string) => void) {
    this.onConversationDeletedCallback = cb;
  }

  public setOnPostCreated(cb: (post: Post) => void) {
    this.onPostCreatedCallback = cb;
  }

  public setOnMessageEdited(cb: (msg: ChatMessage) => void) {
    this.onMessageEditedCallback = cb;
  }

  public setOnCommunityMessageEdited(cb: (commId: string, msg: CommunityMessage) => void) {
    this.onCommunityMessageEditedCallback = cb;
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
          } else if (data.type === 'message_edited' && this.onMessageEditedCallback) {
            this.onMessageEditedCallback(data.message);
          } else if (data.type === 'message_deleted' && this.onDeleteCallback) {
            this.onDeleteCallback(data.messageId);
          } else if (data.type === 'community_message' && this.onCommunityMessageCallback) {
            this.onCommunityMessageCallback(data.communityId, data.message);
          } else if (data.type === 'community_message_edited' && this.onCommunityMessageEditedCallback) {
            this.onCommunityMessageEditedCallback(data.communityId, data.message);
          } else if (data.type === 'conversation_deleted' && this.onConversationDeletedCallback) {
            this.onConversationDeletedCallback(data.user1, data.user2);
          } else if (data.type === 'post_created' && this.onPostCreatedCallback) {
            this.onPostCreatedCallback(data.post);
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

function extractClientJson<T>(raw: string): T | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {}

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    } catch {}
  }

  const objectMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[1].trim()) as T;
    } catch {}
  }

  return null;
}

export function normalizeForModeration(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/0/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/5/g, 's')
    .replace(/\+/g, 't');
}

export function runLocalSafetyModeration(text: string, title?: string, type: 'post' | 'comment' | 'chat' = 'post'): ModerationResult {
  const content = `${title ? `Title: ${title}\n` : ''}${text || ''}`.trim();
  if (!content) {
    return {
      flagged: false,
      categories: [],
      reason: 'Empty content',
      severity: 'none',
      poweredBy: 'Campus Safety Engine',
    };
  }

  const norm = normalizeForModeration(content);
  const normNoPunct = norm.replace(/[*_~`\-\.]/g, '');
  const normPunctAsSpace = norm.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ');

  const misconductPatterns = [
    /\b(leak|leaked|leaking)\b.*\b(exam|quiz|test|paper|midterm|endsem|question|answer)/i,
    /\b(exam|quiz|test|midterm|endsem|paper)\b.*\b(leak|leaked|leaks|cheats?|answers?)\b/i,
    /\b(buy|sell|selling|purchase)\b.*\b(exam|paper|assignment|homework|essay|degree|diploma|solutions?)\b/i,
    /\b(cheat|cheating)\b.*\b(exam|test|quiz|proctor|online exam)\b/i,
    /\b(hack|tamper|change)\b.*\b(grade|portal|cgpa|gpa|marks)\b/i,
    /\b(do my exam|take my exam|write my paper|do my homework for money)\b/i,
  ];

  const toxicityPatterns = [
    // Adult, sexual, and NSFW terms (porn, sex, ass, bad ass, etc.)
    /\b(bad\s*ass|badass)\b/i,
    /\b(ass|asses|asshole|assholes|jackass|dumbass|fatass)\b/i,
    /\b(porn|porno|pornography|xxx|hentai|nsfw)\b/i,
    /\b(sex|sexy|sexual|sexuality|intercourse|erotic)\b/i,
    /\b(nude|nudes|naked|boob|boobs|tit|tits|titties|blowjob|handjob|cum|cumshot|dildo|vagina|penis|cock|cocks|pussy|pussies|masturbat\w*|horny|orgasm|clit|clitoris)\b/i,
    // Motherfucker variations (with space, hyphens, compound or leetspeak)
    /\b(mother\s*fuck(er|ing|ers|s|a|ed)?|mothafuck(a|er|in|ing)?|mofo)\b/i,
    // Standalone fuck and variations
    /\b(fuck|fucker|fuckers|fucking|fucked|fucks|fck|fuk|fuuck|fuuuck|f\*+k)\b/i,
    // Severe insults, profanities & slurs
    /\b(bitch|bitches|bitching|bitchy|bastard|bastards)\b/i,
    /\b(shit|shitty|bullshit|dipshit|cunt|cunts|dick|dickhead|dicks|whore|whores|slut|sluts|retard|retarded)\b/i,
    /\b(nigger|nigga|faggot|fag|tranny|chink|kike)\b/i,
    // Campus/regional abusive slurs
    /\b(behenchod|bhenchod|madarchod|chutiya|chutiye|gandu|bhosdike|bhosdi|lauda|lodu|harami|saala)\b/i,
    // Threats, harassment and self-harm
    /\b(stfu|kys|die\s+bitch|go\s+die|kill\s+yourself)\b/i,
    /\b(kill\s+(you|him|her|them|everyone|myself)|commit\s+suicide|die\s+in\s+a\s+fire|shoot\s+up|bomb\s+the|slit\s+your)\b/i,
    /\b(i\s+will\s+(kill|murder|hurt|destroy|beat\s+up|attack))\b/i,
    /\b(i\s+hate\s+(all\s+)?(women|men|gay|trans|blacks|whites|muslims|jews|hindus|asians))\b/i,
    /\b(you\s+are\s+(a\s+)?(piece of shit|worthless|ugly|disgusting|pathetic|waste of space))\b/i,
  ];

  const spamPatterns = [
    /\b(crypto\s+giveaway|free\s+crypto|telegram\s+channel|whatsapp\s+betting|free\s+cash\s+click|earn\s+\$?\d+\s+daily|betting\s+app|casino\s+bonus)\b/i,
    /\b(buy\s+(drugs|weed|cannabis|cocaine|pills|fake\s+id))\b/i,
  ];

  const injectionPatterns = [
    /\b(ignore\s+(all\s+)?(previous\s+)?(instructions|prompts|rules)|reveal\s+system\s+prompt|disregard\s+prior\s+guidelines|system\s+override)\b/i,
    /\b(you\s+are\s+now\s+in\s+developer\s+mode|dan\s+mode|jailbreak)\b/i,
  ];

  const testVariants = [content, norm, normNoPunct, normPunctAsSpace];

  const isMisconduct = misconductPatterns.some(p => testVariants.some(v => p.test(v)));
  const isToxicity = toxicityPatterns.some(p => testVariants.some(v => p.test(v)));
  const isSpam = spamPatterns.some(p => testVariants.some(v => p.test(v)));
  const isInjection = injectionPatterns.some(p => testVariants.some(v => p.test(v)));

  if (isMisconduct || isToxicity || isSpam || isInjection) {
    const categories: string[] = [];
    if (isMisconduct) categories.push('academic_misconduct');
    if (isToxicity) categories.push('toxicity');
    if (isSpam) categories.push('spam');
    if (isInjection) categories.push('prompt_injection');

    return {
      flagged: true,
      categories,
      reason: isMisconduct
        ? 'Content appears to promote academic dishonesty or exam paper sharing.'
        : isToxicity
        ? 'Content flagged for severe profanity, abusive language, or harassment.'
        : isInjection
        ? 'Content flagged for prompt injection or system instruction override attempt.'
        : 'Content flagged as promotional spam or prohibited goods.',
      severity: isMisconduct || isToxicity || isInjection ? 'high' : 'medium',
      poweredBy: 'Campus Safety Engine',
    };
  }

  return {
    flagged: false,
    categories: [],
    reason: 'Content complies with university community guidelines.',
    severity: 'none',
    poweredBy: 'Campus Safety Engine',
  };
}

export async function moderateContent(text: string, title?: string, type: 'post' | 'comment' | 'chat' = 'post'): Promise<ModerationResult> {
  const content = `${title ? `Title: ${title}\n` : ''}${text || ''}`.trim();
  if (!content) {
    return {
      flagged: false,
      categories: [],
      reason: 'Empty content',
      severity: 'none',
      poweredBy: 'Campus Safety Engine',
    };
  }

  // 1. Immediate high-precision local safety check
  const localCheck = runLocalSafetyModeration(text, title, type);
  if (localCheck.flagged && localCheck.severity === 'high') {
    return localCheck;
  }

  const geminiKey = getStoredGeminiKey();
  const groqKey = getStoredGroqKey();

  // 2. Attempt backend moderate endpoint
  try {
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

    if (res.ok) {
      const data = await safeParseJson<ModerationResult | null>(res, null);
      if (data && typeof data.flagged === 'boolean') {
        return data;
      }
    }
  } catch {
    // Backend offline / unreachable, fallback seamlessly
  }

  // 3. Client-side direct call to Google Gemini if key is provided in Settings
  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const model of models) {
      try {
        const gemRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an AI campus safety moderator for university network Campusly. Analyze this ${type} for toxicity, severe profanity, harassment, hate speech, bullying, academic fraud (exam leaks/cheating), spam, or dangerous behavior.\n\nContent:\n"""\n${content}\n"""\n\nReturn strictly valid JSON with this exact schema:\n{\n  "flagged": true or false,\n  "categories": ["toxicity" | "harassment" | "hate_speech" | "academic_misconduct" | "spam" | "inappropriate" | "prompt_injection"],\n  "reason": "Brief 1-sentence explanation",\n  "severity": "none" | "low" | "medium" | "high"\n}`
              }]
            }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            }
          })
        });

        if (gemRes.ok) {
          const gemData = await gemRes.json();
          const textResult = gemData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResult) {
            const parsed = extractClientJson<ModerationResult>(textResult);
            if (parsed && typeof parsed.flagged === 'boolean') {
              return { ...parsed, poweredBy: 'Google Gemini AI' };
            }
          }
        }
      } catch {
        // Continue to fallback
      }
    }
  }

  // 4. Return local moderation result
  return localCheck;
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

export function generateSmartLocalSummary(title: string, body: string, replies: Array<{ author: string; text: string }>): ThreadSummaryResult {
  const hasReplies = Array.isArray(replies) && replies.length > 0;

  if (!hasReplies) {
    return {
      summary: `Discussion on "${title}". The author is seeking insights and experiences from campus peers and seniors.`,
      keyTakeaways: [
        `Core inquiry: ${body ? body.slice(0, 110) : 'Guidance requested on ' + title}`,
        'The thread is currently open for senior tips and peer recommendations.',
        'Contribute your practical knowledge or notes below to help this student.'
      ],
      consensus: 'Awaiting initial community contributions and student solutions.',
      poweredBy: 'Campus Summarizer Engine',
    };
  }

  const fillerRegex = /^(thanks|thank you|ok|okay|cool|\+1|upvoted|following|nice|bump|same here)\b/i;
  const meaningfulTips: Array<{ author: string; tip: string }> = [];

  replies.forEach(r => {
    const rawSentences = (r.text || '').split(/(?<=[.!?])\s+/);
    const nonFiller = rawSentences.filter(s => s.trim().length > 8 && !fillerRegex.test(s.trim()));
    if (nonFiller.length > 0) {
      meaningfulTips.push({ author: r.author || 'Peer', tip: nonFiller[0].trim() });
    } else if (r.text && r.text.trim().length > 4) {
      meaningfulTips.push({ author: r.author || 'Peer', tip: r.text.trim() });
    }
  });

  const takeaways: string[] = [];
  meaningfulTips.slice(0, 3).forEach(item => {
    takeaways.push(`${item.author}: ${item.tip}`);
  });
  while (takeaways.length < 3 && replies.length > 0) {
    takeaways.push(`Community recommendation: Review shared notes and study links across replies.`);
  }

  const leadAdvice = meaningfulTips[0] ? ` emphasizing "${meaningfulTips[0].tip.slice(0, 70)}..."` : '';
  const summary = `Students discussed "${title}". Across ${replies.length} replies, peers shared practical guidance${leadAdvice}.`;

  const consensus = meaningfulTips.length > 1
    ? `Consensus: Most contributors recommend following structured resources and practical methods like ${meaningfulTips[0].author}'s suggestions.`
    : `Consensus: General community agreement with the advice shared by ${replies[0]?.author || 'contributors'}.`;

  return {
    summary,
    keyTakeaways: takeaways,
    consensus,
    poweredBy: 'Campus Summarizer Engine',
  };
}

export async function summarizeThread(title: string, body: string, replies: Array<{ author: string; text: string }>): Promise<ThreadSummaryResult> {
  const geminiKey = getStoredGeminiKey();

  // 1. Try backend summarizer endpoint
  try {
    const res = await fetch('/api/ai/summarize-thread', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(geminiKey ? { 'x-gemini-key': geminiKey } : {}),
      },
      body: JSON.stringify({ title, body, replies, apiKey: geminiKey }),
    });

    if (res.ok) {
      const data = await safeParseJson<ThreadSummaryResult | null>(res, null);
      if (data && data.summary && !data.summary.startsWith('Discussion on "') && data.keyTakeaways?.length) {
        return data;
      }
    }
  } catch {
    // Backend offline / unreachable, fallback to client or local
  }

  // 2. Client-side direct call to Google Gemini if key is provided in Settings
  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    const repliesSnippet = replies.map(r => `- ${r.author}: "${r.text}"`).join('\n') || '(No replies yet)';

    for (const model of models) {
      try {
        const gemRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert AI campus academic assistant for university student network Campusly.
Summarize this discussion thread for busy college students:

Topic: "${title}"
Details/Question: "${body || 'No description provided.'}"
Replies from students:
${repliesSnippet}

Synthesize a high-value summary with actionable takeaways.
Return strictly valid JSON with this exact schema:
{
  "summary": "2-sentence clear overview synthesizing the core question and primary answers.",
  "keyTakeaways": [
    "Specific actionable takeaway point 1",
    "Specific actionable takeaway point 2",
    "Specific actionable takeaway point 3"
  ],
  "consensus": "1 sentence summarizing what the students/seniors overall agreed upon."
}`
              }]
            }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            }
          })
        });

        if (gemRes.ok) {
          const gemData = await gemRes.json();
          const textResult = gemData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResult) {
            const parsed = extractClientJson<ThreadSummaryResult>(textResult);
            if (parsed && parsed.summary) {
              return { ...parsed, poweredBy: 'Google Gemini AI' };
            }
          }
        }
      } catch {
        // Continue to local fallback
      }
    }
  }

  // 3. Fallback to smart local campus summarizer
  return generateSmartLocalSummary(title, body, replies);
}

