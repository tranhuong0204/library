import type {
  User,
  Category,
  DocumentItem,
  DocumentComment,
  DocumentRating,
  ForumCategory,
  ForumPost,
  ForumComment,
  StudyGroup,
  GroupMember,
  GroupChat,
  NewsItem,
  NotificationItem,
  AiConversation,
  AiMessage,
  ForumReport,
  DocumentCopyrightItem
} from '@/types';

// Asset URL Resolver
export function resolveAssetUrl(rawPath: string | null | undefined): string {
  if (!rawPath) return '';
  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    return rawPath;
  }

  // Normalize duplicate slash or leading relative dots
  let cleanPath = rawPath.replace(/^(\.\.\/|\.\/)+/, '');
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

  let origin = import.meta.env.VITE_BACKEND_ORIGIN;
  if (!origin) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    try {
      origin = new URL(apiUrl).origin;
    } catch {
      origin = 'http://localhost:8080';
    }
  }

  return `${origin}${cleanPath}`;
}

export function normalizeUser(raw: any): User {
  if (!raw) throw new Error('Cannot normalize empty user');
  return {
    id: raw.id ?? raw.UserID ?? raw.userId ?? 0,
    username: raw.username ?? raw.Username ?? '',
    email: raw.email ?? raw.Email ?? '',
    fullName: raw.fullName ?? raw.FullName ?? '',
    major: raw.major ?? raw.Major ?? '',
    role: (raw.role ?? raw.Role ?? 'USER') as any,
    active: raw.active ?? raw.Active ?? raw.enabled ?? raw.Enabled ?? false,
    createdAt: raw.createdAt ?? raw.CreatedAt,
    updatedAt: raw.updatedAt ?? raw.UpdatedAt
  };
}

export function normalizeCategory(raw: any): Category {
  if (!raw) throw new Error('Cannot normalize empty category');
  return {
    id: raw.id ?? raw.CategoryID ?? raw.categoryId ?? 0,
    name: raw.name ?? raw.Name ?? raw.categoryName ?? raw.CategoryName ?? '',
    description: raw.description ?? raw.Description ?? '',
    icon: raw.icon ?? raw.Icon
  };
}

export function normalizeDocument(raw: any): DocumentItem {
  if (!raw) throw new Error('Cannot normalize empty document');
  return {
    id: raw.id ?? raw.DocID ?? raw.DocumentID ?? raw.documentId ?? 0,
    title: raw.title ?? raw.Title ?? '',
    author: raw.author ?? raw.Author ?? '',
    description: raw.description ?? raw.Description ?? '',
    fileUrl: resolveAssetUrl(raw.fileUrl ?? raw.FileUrl),
    coverUrl: resolveAssetUrl(raw.coverUrl ?? raw.CoverUrl),
    fileType: raw.fileType ?? raw.FileType ?? 'PDF',
    fileSize: raw.fileSize ?? raw.FileSize ?? 0,
    viewCount: raw.viewCount ?? raw.ViewCount ?? 0,
    downloadCount: raw.downloadCount ?? raw.DownloadCount ?? 0,
    categoryId: raw.categoryId ?? raw.CategoryID ?? 0,
    categoryName: raw.categoryName ?? raw.CategoryName ?? '',
    uploadedByName: raw.uploadedByName ?? raw.UploadedByName ?? '',
    createdAt: raw.createdAt ?? raw.CreatedAt ?? ''
  };
}

export function normalizeDocumentComment(raw: any): DocumentComment {
  if (!raw) throw new Error('Cannot normalize empty document comment');
  // The create endpoint wraps the record in { message, comment }, whereas the
  // list endpoint returns records directly. Normalize both response shapes.
  const comment = raw.comment ?? raw.Comment ?? raw;
  return {
    id: comment.id ?? comment.CommentID ?? 0,
    content: comment.content ?? comment.Content ?? '',
    userId: comment.userId ?? comment.UserID ?? 0,
    authorName: comment.authorName ?? comment.AuthorName ?? comment.fullName ?? comment.FullName
      ?? comment.username ?? comment.Username ?? 'Thành viên',
    createdAt: comment.createdAt ?? comment.CreatedAt ?? ''
  };
}

export function normalizeDocumentRating(raw: any): DocumentRating {
  if (!raw) return { averageRating: 0, ratingCount: 0, userRating: null };
  return {
    averageRating: raw.averageRating ?? raw.AverageRating ?? 0,
    ratingCount: raw.ratingCount ?? raw.RatingCount ?? 0,
    // The Spring API exposes the signed-in user's value as `myRating`.
    userRating: raw.userRating ?? raw.UserRating ?? raw.myRating ?? raw.MyRating ?? null
  };
}

export function normalizeForumCategory(raw: any): ForumCategory {
  if (!raw) throw new Error('Cannot normalize empty forum category');
  return {
    id: raw.id ?? raw.CategoryID ?? 0,
    name: raw.name ?? raw.Name ?? '',
    description: raw.description ?? raw.Description ?? '',
    color: raw.color ?? raw.Color ?? '#4f46e5'
  };
}

export function normalizeForumPost(raw: any): ForumPost {
  if (!raw) throw new Error('Cannot normalize empty forum post');
  const comments = raw.comments ?? raw.Comments ?? [];
  return {
    id: raw.id ?? raw.PostID ?? raw.postId ?? 0,
    title: raw.title ?? raw.Title ?? '',
    content: raw.content ?? raw.Content ?? '',
    viewCount: raw.viewCount ?? raw.ViewCount ?? 0,
    likeCount: raw.likeCount ?? raw.LikeCount ?? 0,
    commentCount: raw.commentCount ?? raw.CommentCount ?? 0,
    liked: raw.liked ?? raw.Liked ?? false,
    categoryId: raw.categoryId ?? raw.CategoryID ?? 0,
    categoryName: raw.categoryName ?? raw.CategoryName ?? '',
    userId: raw.userId ?? raw.UserID ?? 0,
    authorName: raw.authorName ?? raw.AuthorName ?? '',
    attachmentName: raw.attachmentName ?? raw.AttachmentName ?? null,
    attachmentUrl: raw.attachmentUrl ?? raw.AttachmentUrl ? resolveAssetUrl(raw.attachmentUrl ?? raw.AttachmentUrl) : null,
    attachmentType: raw.attachmentType ?? raw.AttachmentType ?? null,
    attachmentMimeType: raw.attachmentMimeType ?? raw.AttachmentMimeType ?? null,
    attachmentSize: raw.attachmentSize ?? raw.AttachmentSize ?? null,
    createdAt: raw.createdAt ?? raw.CreatedAt ?? '',
    comments: comments.map((c: any) => normalizeForumComment(c))
  };
}

export function normalizeForumComment(raw: any): ForumComment {
  if (!raw) throw new Error('Cannot normalize empty forum comment');
  return {
    id: raw.id ?? raw.CommentID ?? 0,
    content: raw.content ?? raw.Content ?? '',
    userId: raw.userId ?? raw.UserID ?? 0,
    authorName: raw.authorName ?? raw.AuthorName ?? '',
    parentId: raw.parentId ?? raw.ParentID ?? null,
    likeCount: raw.likeCount ?? raw.LikeCount ?? 0,
    liked: raw.liked ?? raw.Liked ?? false,
    createdAt: raw.createdAt ?? raw.CreatedAt ?? ''
  };
}

export function normalizeGroup(raw: any): StudyGroup {
  if (!raw) throw new Error('Cannot normalize empty study group');
  return {
    id: raw.id ?? raw.GroupID ?? raw.groupId ?? 0,
    name: raw.name ?? raw.Name ?? '',
    description: raw.description ?? raw.Description ?? '',
    subject: raw.subject ?? raw.Subject ?? '',
    visibility: (raw.visibility ?? raw.Visibility ?? 'PUBLIC') as any,
    memberCount: raw.memberCount ?? raw.MemberCount ?? 0,
    createdById: raw.createdById ?? raw.CreatedBy ?? 0,
    createdByName: raw.createdByName ?? raw.CreatedByName ?? '',
    joined: raw.joined ?? raw.Joined ?? false,
    joinStatus: (raw.joinStatus ?? raw.JoinStatus ?? 'NONE') as any,
    owner: raw.owner ?? raw.Owner ?? false,
    createdAt: raw.createdAt ?? raw.CreatedAt ?? ''
  };
}

export function normalizeGroupMember(raw: any): GroupMember {
  if (!raw) throw new Error('Cannot normalize empty group member');
  return {
    id: raw.id ?? 0,
    groupId: raw.groupId ?? raw.GroupID ?? 0,
    groupName: raw.groupName ?? raw.GroupName ?? '',
    userId: raw.userId ?? raw.UserID ?? 0,
    username: raw.username ?? raw.Username ?? '',
    fullName: raw.fullName ?? raw.FullName ?? '',
    email: raw.email ?? raw.Email ?? '',
    status: (raw.status ?? raw.Status ?? 'JOINED') as any,
    joinedAt: raw.joinedAt ?? raw.JoinedAt
  };
}

export function normalizeGroupChat(raw: any): GroupChat {
  if (!raw) throw new Error('Cannot normalize empty group chat message');
  return {
    id: raw.id ?? raw.ChatID ?? 0,
    content: raw.content ?? raw.Content ?? '',
    channel: raw.channel ?? raw.Channel ?? 'general',
    groupId: raw.groupId ?? raw.GroupID ?? 0,
    userId: raw.userId ?? raw.UserID ?? 0,
    authorName: raw.authorName ?? raw.AuthorName ?? '',
    attachmentName: raw.attachmentName ?? raw.AttachmentName ?? null,
    attachmentUrl: raw.attachmentUrl ?? raw.AttachmentUrl ? resolveAssetUrl(raw.attachmentUrl ?? raw.AttachmentUrl) : null,
    attachmentType: raw.attachmentType ?? raw.AttachmentType ?? null,
    attachmentMimeType: raw.attachmentMimeType ?? raw.AttachmentMimeType ?? null,
    attachmentSize: raw.attachmentSize ?? raw.AttachmentSize ?? null,
    createdAt: raw.createdAt ?? raw.CreatedAt ?? ''
  };
}

export function normalizeNews(raw: any): NewsItem {
  if (!raw) throw new Error('Cannot normalize empty news item');
  return {
    id: raw.id ?? 0,
    title: raw.title ?? raw.Title ?? '',
    slug: raw.slug ?? raw.Slug ?? '',
    summary: raw.summary ?? raw.Summary ?? '',
    content: raw.content ?? raw.Content ?? '',
    thumbnailUrl: resolveAssetUrl(raw.thumbnailUrl ?? raw.ThumbnailUrl),
    category: raw.category ?? raw.Category ?? '',
    featured: raw.featured ?? raw.Featured ?? false,
    viewCount: raw.viewCount ?? raw.ViewCount ?? 0,
    status: (raw.status ?? raw.Status ?? 'DRAFT') as any,
    createdAt: raw.createdAt ?? raw.CreatedAt ?? '',
    updatedAt: raw.updatedAt ?? raw.UpdatedAt ?? ''
  };
}

export function normalizeNotification(raw: any): NotificationItem {
  if (!raw) throw new Error('Cannot normalize empty notification');
  return {
    id: raw.id ?? 0,
    title: raw.title ?? raw.Title ?? '',
    message: raw.message ?? raw.Message ?? '',
    type: raw.type ?? raw.Type ?? 'INFO',
    isRead: raw.isRead ?? raw.IsRead ?? raw.readStatus ?? false,
    createdAt: raw.createdAt ?? raw.CreatedAt ?? ''
  };
}

export function normalizeAiConversation(raw: any): AiConversation {
  if (!raw) throw new Error('Cannot normalize empty AI conversation');
  return {
    id: raw.id ?? 0,
    title: raw.title ?? raw.Title ?? 'Cuộc hội thoại',
    createdAt: raw.createdAt ?? raw.CreatedAt ?? '',
    updatedAt: raw.updatedAt ?? raw.UpdatedAt ?? ''
  };
}

export function normalizeAiMessage(raw: any): AiMessage {
  if (!raw) throw new Error('Cannot normalize empty AI message');
  return {
    role: (raw.role ?? raw.Role ?? 'user').toLowerCase() as 'user' | 'assistant',
    content: raw.content ?? raw.Content ?? '',
    createdAt: raw.createdAt ?? raw.CreatedAt
  };
}

export function normalizeForumReport(raw: any): ForumReport {
  if (!raw) throw new Error('Cannot normalize empty forum report');
  return {
    id: raw.id ?? raw.reportId ?? raw.ReportID ?? 0,
    reportId: raw.reportId ?? raw.ReportID ?? raw.id ?? 0,
    postId: raw.postId ?? raw.PostID ?? 0,
    postTitle: raw.postTitle ?? raw.PostTitle ?? '',
      postContentPreview: raw.postContentPreview ?? raw.PostContentPreview ?? '',
      targetType: (raw.targetType ?? raw.TargetType ?? 'POST') as 'POST' | 'COMMENT',
      targetId: raw.targetId ?? raw.TargetID ?? raw.postId ?? raw.PostID ?? 0,
      commentId: raw.commentId ?? raw.CommentID ?? null,
      parentPostId: raw.parentPostId ?? raw.ParentPostID ?? null,
      commentContentPreview: raw.commentContentPreview ?? raw.CommentContentPreview ?? '',
    reporterId: raw.reporterId ?? raw.ReporterID ?? 0,
    reporterUsername: raw.reporterUsername ?? raw.ReporterUsername ?? '',
    reason: raw.reason ?? raw.Reason ?? '',
    description: raw.description ?? raw.Description ?? '',
    status: (raw.status ?? raw.Status ?? 'PENDING') as any,
    createdAt: raw.createdAt ?? raw.CreatedAt ?? '',
    resolvedAt: raw.resolvedAt ?? raw.ResolvedAt ?? null,
    resolvedBy: raw.resolvedBy ?? raw.ResolvedBy ?? null,
    adminNote: raw.adminNote ?? raw.AdminNote ?? null
  };
}

export function normalizeCopyright(raw: any): DocumentCopyrightItem {
  if (!raw) throw new Error('Cannot normalize empty copyright');
  return {
    id: raw.id ?? raw.Id ?? 0,
    documentId: raw.documentId ?? raw.DocumentId ?? (raw.document?.id ?? 0),
    documentTitle: raw.documentTitle ?? raw.DocumentTitle ?? (raw.document?.title ?? ''),
    copyrightOwner: raw.copyrightOwner ?? raw.CopyrightOwner ?? '',
    author: raw.author ?? raw.Author ?? '',
    licenseType: raw.licenseType ?? raw.LicenseType ?? 'COPYRIGHT',
    certificateNumber: raw.certificateNumber ?? raw.CertificateNumber ?? '',
    registrationDate: raw.registrationDate ?? raw.RegistrationDate ?? '',
    expirationDate: raw.expirationDate ?? raw.ExpirationDate ?? '',
    terms: raw.terms ?? raw.Terms ?? '',
    createdAt: raw.createdAt ?? raw.CreatedAt,
    updatedAt: raw.updatedAt ?? raw.UpdatedAt
  };
}
