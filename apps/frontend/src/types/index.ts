export type Role = 'USER' | 'ADMIN' | 'LIBRARIAN';
export type NewsStatus = 'DRAFT' | 'PUBLISHED';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  major: string;
  role: Role;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  icon?: string;
}

export interface DocumentItem {
  id: number;
  title: string;
  author: string;
  description: string;
  fileUrl: string;
  coverUrl: string;
  fileType: string;
  fileSize: number;
  viewCount: number;
  downloadCount: number;
  categoryId: number;
  categoryName: string;
  uploadedByName: string;
  createdAt: string;
}

export interface DocumentCopyrightItem {
  id: number;
  documentId: number;
  documentTitle?: string;
  copyrightOwner: string;
  author?: string;
  licenseType: string;
  certificateNumber?: string;
  registrationDate?: string;
  expirationDate?: string;
  terms?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentComment {
  id: number;
  content: string;
  userId: number;
  authorName: string;
  createdAt: string;
}

export interface DocumentRating {
  averageRating: number;
  ratingCount: number;
  userRating: number | null;
}

export interface ForumCategory {
  id: number;
  name: string;
  description: string;
  color?: string;
}

export interface ForumPost {
  id: number;
  title: string;
  content: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  categoryId: number;
  categoryName: string;
  userId: number;
  authorName: string;
  attachmentName: string | null;
  attachmentUrl: string | null;
  attachmentType: 'IMAGE' | 'FILE' | null;
  attachmentMimeType: string | null;
  attachmentSize: number | null;
  createdAt: string;
  comments: ForumComment[];
}

export interface ForumComment {
  id: number;
  content: string;
  userId: number;
  authorName: string;
  parentId: number | null;
  likeCount: number;
  liked: boolean;
  createdAt: string;
  replies?: ForumComment[]; // Client-side tree representations
}

export interface StudyGroup {
  id: number;
  name: string;
  description: string;
  subject: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  memberCount: number;
  createdById: number;
  createdByName: string;
  joined: boolean;
  joinStatus: 'JOINED' | 'PENDING' | 'NONE';
  owner: boolean;
  createdAt: string;
}

export interface GroupMember {
  id: number;
  groupId: number;
  groupName: string;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  status: 'JOINED' | 'PENDING';
  joinedAt?: string;
}

export interface GroupChat {
  id: number;
  content: string;
  channel: string;
  groupId: number;
  userId: number;
  authorName: string;
  attachmentName: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentMimeType: string | null;
  attachmentSize: number | null;
  createdAt: string;
}

export interface NewsItem {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  thumbnailUrl: string;
  category: string;
  featured: boolean;
  viewCount: number;
  status: NewsStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface AiConversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface AiChatResponse {
  message: string;
  conversationId: string;
  conversationTitle?: string;
  messages?: any[];
  documents?: Array<{
    id: number;
    title: string;
    author?: string;
    fileUrl: string;
    coverUrl?: string;
    snippet?: string;
  }>;
}

export interface ForumReport {
  id: number;
  reportId: number;
  postId: number;
  postTitle: string;
  postContentPreview: string;
  targetType: 'POST' | 'COMMENT';
  targetId: number;
  commentId: number | null;
  parentPostId: number | null;
  commentContentPreview: string;
  reporterId: number;
  reporterUsername: string;
  reason: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  adminNote: string | null;
}
