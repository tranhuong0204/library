import { describe, expect, it } from 'vitest';
import {
  normalizeDocument,
  normalizeDocumentComment,
  normalizeDocumentRating,
  normalizeGroupChat,
  normalizeUser,
  resolveAssetUrl,
} from './index';

describe('API response normalizers', () => {
  it('normalizes legacy user field names without losing false values', () => {
    expect(normalizeUser({
      UserID: 7,
      Username: 'student',
      Email: 'student@example.com',
      FullName: 'Student',
      Role: 'USER',
      Active: false,
    })).toMatchObject({
      id: 7,
      username: 'student',
      active: false,
    });
  });

  it('builds backend URLs for relative assets and preserves absolute URLs', () => {
    expect(resolveAssetUrl('/uploads/book.pdf')).toBe('http://localhost:8080/uploads/book.pdf');
    expect(resolveAssetUrl('https://cdn.example.com/book.pdf')).toBe(
      'https://cdn.example.com/book.pdf',
    );
  });

  it('normalizes document counters when the API returns zero', () => {
    expect(normalizeDocument({
      DocumentID: 9,
      Title: 'Test',
      ViewCount: 0,
      DownloadCount: 0,
    })).toMatchObject({
      id: 9,
      viewCount: 0,
      downloadCount: 0,
    });
  });

  it('unwraps a newly created document comment', () => {
    expect(normalizeDocumentComment({
      message: 'Đã gửi bình luận',
      comment: {
        id: 12,
        content: 'Nội dung hữu ích',
        userId: 7,
        fullName: 'Nguyễn Văn A',
        createdAt: '2026-08-05T09:00:00',
      },
    })).toMatchObject({
      id: 12,
      content: 'Nội dung hữu ích',
      userId: 7,
      authorName: 'Nguyễn Văn A',
    });
  });

  it('preserves the current user rating returned as myRating', () => {
    expect(normalizeDocumentRating({
      averageRating: 4.5,
      ratingCount: 2,
      myRating: 5,
    })).toEqual({
      averageRating: 4.5,
      ratingCount: 2,
      userRating: 5,
    });
  });

  it('returns a null attachment URL when a chat message has no attachment', () => {
    expect(normalizeGroupChat({ ChatID: 11, Content: 'hello' }).attachmentUrl).toBeNull();
  });
});
