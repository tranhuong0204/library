import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { normalizeGroup, normalizeGroupMember, normalizeGroupChat } from '@/lib/normalizers';
import { formatDate, formatBytes } from '@/lib/formatters';
import { AppShell } from '@/components/layout/AppShell';
import { AdminShell } from '@/components/layout/AdminShell';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/feedback/EmptyState';
import { toast } from 'sonner';
import {
  MessageSquare,
  Users,
  UserCheck,
  Send,
  Paperclip,
  Settings,
  Shield,
  LogOut,
  Trash2,
  FileText,
  Download,
  Clock,
} from 'lucide-react';

const editGroupSchema = z.object({
  name: z.string().min(2, 'Tên nhóm phải chứa tối thiểu 2 ký tự').max(100, 'Tên nhóm không được vượt quá 100 ký tự'),
  subject: z.string().min(2, 'Vui lòng nhập môn học/lĩnh vực liên quan').max(100, 'Môn học không được vượt quá 100 ký tự'),
  description: z.string().max(255, 'Mô tả ngắn không được vượt quá 255 ký tự').optional().default(''),
});

type EditGroupForm = z.infer<typeof editGroupSchema>;

interface ChatMessage {
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

interface GroupMemberDto {
  id: number;
  groupId: number;
  groupName: string;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  status: 'JOINED' | 'PENDING' | 'REJECTED';
  joinedAt?: string;
}

interface GroupDetailPageProps {
  adminMode?: boolean;
}

export default function GroupDetailPage({ adminMode = false }: GroupDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'chat' | 'members' | 'requests'>('chat');
  const [composerText, setComposerText] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const Shell = adminMode ? AdminShell : AppShell;
  const returnPath = adminMode ? '/admin/groups' : '/groups';

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query: Get groups list (and filter to find current detail)
  const { data: groups = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: ['groups', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/groups');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeGroup);
    },
    enabled: !isNaN(groupId),
  });

  const group = groups.find((g) => g.id === groupId);
  const isJoined = group?.joined === true;
  const isOwner = group?.owner === true;
  const canModerateJoinRequests = user?.role === 'ADMIN';

  // Query: Fetch chat messages (polls every 3 seconds for updates)
  const { data: messages = [], isLoading: isChatsLoading } = useQuery({
    queryKey: ['groups', 'chats', groupId],
    queryFn: async () => {
      const res = await apiClient.get(`/groups/${groupId}/chats`);
      return (Array.isArray(res.data) ? res.data : []).map(normalizeGroupChat);
    },
    enabled: !!groupId && isJoined,
    refetchInterval: 3000,
  });

  // Query: Fetch group members
  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ['groups', 'members', groupId],
    queryFn: async () => {
      const res = await apiClient.get(`/groups/${groupId}/members`);
      return (Array.isArray(res.data) ? res.data : []).map(normalizeGroupMember);
    },
    enabled: !!groupId && isJoined,
  });

  // Query: Fetch pending join requests (owners only)
  const { data: joinRequests = [], isLoading: isRequestsLoading } = useQuery({
    queryKey: ['groups', 'requests', groupId],
    queryFn: async () => {
      const res = await apiClient.get(`/groups/${groupId}/join-requests`);
      return (Array.isArray(res.data) ? res.data : []).map(normalizeGroupMember);
    },
    enabled: !!groupId && isJoined && canModerateJoinRequests,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditGroupForm>({
    resolver: zodResolver(editGroupSchema),
  });

  // Load defaults into edit form when it opens
  useEffect(() => {
    if (group) {
      reset({
        name: group.name,
        subject: group.subject,
        description: group.description || '',
      });
    }
  }, [group, reset]);

  // Scroll chats to bottom when messages are loaded
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  // Mutation: Send Text Chat
  const sendChatMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiClient.post(`/groups/${groupId}/chats`, {
        content,
        channel: 'general',
      });
      return res.data;
    },
    onSuccess: () => {
      setComposerText('');
      queryClient.invalidateQueries({ queryKey: ['groups', 'chats', groupId] });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể gửi tin nhắn.');
    },
  });

  // Mutation: Send Attachment Multipart
  const sendAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('content', composerText.trim());
      formData.append('channel', 'general');

      const res = await apiClient.post(`/groups/${groupId}/chats/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      setComposerText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['groups', 'chats', groupId] });
      toast.success('Đã tải lên tệp đính kèm thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Tải lên tệp đính kèm thất bại.');
    },
  });

  // Mutation: Approve Request
  const approveMutation = useMutation({
    mutationFn: async (memberId: number) => {
      await apiClient.post(`/groups/${groupId}/join-requests/${memberId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'requests', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups', 'members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups', 'list'] });
      toast.success('Đã phê duyệt thành viên vào nhóm!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Phê duyệt thất bại.');
    },
  });

  // Mutation: Reject Request
  const rejectMutation = useMutation({
    mutationFn: async (memberId: number) => {
      await apiClient.post(`/groups/${groupId}/join-requests/${memberId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'requests', groupId] });
      toast.success('Đã từ chối yêu cầu tham gia.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Từ chối thất bại.');
    },
  });

  // Mutation: Update Group Settings
  const updateGroupMutation = useMutation({
    mutationFn: async (data: EditGroupForm) => {
      const res = await apiClient.put(`/groups/${groupId}`, {
        ...data,
        visibility: group?.visibility, // Maintain visibility
      });
      return res.data;
    },
    onSuccess: () => {
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['groups', 'list'] });
      toast.success('Cập nhật thiết lập nhóm thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Cập nhật thiết lập thất bại.');
    },
  });

  // Mutation: Leave Group
  const leaveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/groups/${groupId}/leave`);
    },
    onSuccess: () => {
      setIsLeaveOpen(false);
      queryClient.invalidateQueries({ queryKey: ['groups', 'list'] });
      toast.success('Rời nhóm học tập thành công.');
      navigate(returnPath);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Rời nhóm thất bại.');
    },
  });

  // Mutation: Delete Group (Owner only)
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/groups/${groupId}`);
    },
    onSuccess: () => {
      setIsDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['groups', 'list'] });
      toast.success('Đã giải tán nhóm học tập.');
      navigate(returnPath);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Giải tán nhóm thất bại.');
    },
  });

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim()) return;
    sendChatMutation.mutate(composerText.trim());
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sendAttachmentMutation.mutate(file);
  };

  if (isGroupsLoading) {
    return (
      <Shell>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="skeleton-shimmer" style={{ height: '32px', width: '30%' }} />
          <div className="skeleton-shimmer" style={{ height: '240px', width: '100%', borderRadius: 'var(--radius-md)' }} />
        </div>
      </Shell>
    );
  }

  if (!group || !isJoined) {
    return (
      <Shell>
        <EmptyState
          title="Không có quyền truy cập nhóm"
          message="Bạn chưa gia nhập nhóm học tập này hoặc nhóm không tồn tại trong cơ sở dữ liệu."
          icon={<Users size={48} />}
          actionText="Quay lại danh sách nhóm"
          onAction={() => navigate(returnPath)}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 'var(--spacing-6)', minHeight: 'calc(100vh - 180px)' }} className="group-detail-layout">
        {/* Left Control Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }} className="group-detail-sidebar">
          <Card>
            <CardBody style={{ padding: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
              <div>
                <Badge variant={group.visibility === 'PUBLIC' ? 'success' : 'accent'} style={{ marginBottom: '4px' }}>
                  {group.visibility === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}
                </Badge>
                <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--color-primary-950)', margin: 0 }}>
                  {group.name}
                </h2>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', fontWeight: 500 }}>
                  Môn học: {group.subject}
                </span>
              </div>

              {group.description && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', margin: 0, lineHeight: '1.4' }}>
                  {group.description}
                </p>
              )}

              {/* Action Buttons: owner edit / delete, member exit */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--color-slate-100)', paddingTop: 'var(--spacing-3)' }}>
                {isOwner ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} style={{ width: '100%', gap: '6px' }}>
                      <Settings size={12} />
                      <span>Thiết lập nhóm</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDeleteOpen(true)}
                      style={{ width: '100%', gap: '6px', color: 'var(--color-danger-600)', borderColor: 'var(--color-danger-100)' }}
                    >
                      <Trash2 size={12} />
                      <span>Giải tán nhóm</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLeaveOpen(true)}
                    style={{ width: '100%', gap: '6px', color: 'var(--color-danger-600)', borderColor: 'var(--color-danger-100)' }}
                  >
                    <LogOut size={12} />
                    <span>Rời khỏi nhóm</span>
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

        </aside>

        {/* Center Workspace Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {/* Tab bar header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-slate-200)', gap: 'var(--spacing-6)', paddingBottom: '2px' }}>
            <button
              onClick={() => setActiveTab('chat')}
              className={`tab-btn-detail ${activeTab === 'chat' ? 'tab-btn-detail-active' : ''}`}
            >
              <MessageSquare size={16} />
              <span>Cuộc trò chuyện</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`tab-btn-detail ${activeTab === 'members' ? 'tab-btn-detail-active' : ''}`}
            >
              <Users size={16} />
              <span>Thành viên ({members.length})</span>
            </button>

            {canModerateJoinRequests && (
              <button
                onClick={() => setActiveTab('requests')}
                className={`tab-btn-detail ${activeTab === 'requests' ? 'tab-btn-detail-active' : ''}`}
                style={{ position: 'relative' }}
              >
                <UserCheck size={16} />
                <span>Yêu cầu duyệt</span>
                {joinRequests.length > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-12px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-danger-500)',
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {joinRequests.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* TAB 1: Chat timeline */}
          {activeTab === 'chat' && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--color-slate-200)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'white',
                height: '560px',
                overflow: 'hidden',
              }}
            >
              {/* Message timeline container */}
              <div
                style={{
                  flex: 1,
                  padding: 'var(--spacing-4)',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-4)',
                  backgroundColor: 'var(--color-slate-50)',
                }}
              >
                {isChatsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                    <div className="skeleton-shimmer" style={{ height: '36px', width: '40%', borderRadius: '4px' }} />
                    <div className="skeleton-shimmer" style={{ height: '48px', width: '50%', alignSelf: 'flex-end', borderRadius: '4px' }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--color-slate-400)', fontSize: 'var(--text-xs)' }}>
                    <MessageSquare size={32} style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
                    Chưa có tin nhắn nào trong kênh này. Hãy bắt đầu cuộc trò chuyện!
                  </div>
                ) : (
                  messages.map((msg: ChatMessage) => {
                    const hasAttachment = !!msg.attachmentUrl;
                    const isImage = msg.attachmentMimeType?.startsWith('image/');
                    const isOwnMessage = user?.id != null && Number(msg.userId) === Number(user.id);
                    
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          gap: 'var(--spacing-3)',
                          alignItems: 'flex-start',
                          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {!isOwnMessage && <Avatar fallback={msg.authorName} size={36} />}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                            maxWidth: 'min(78%, 720px)',
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                              gap: '8px',
                              width: '100%',
                            }}
                          >
                            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-slate-700)' }}>
                              {isOwnMessage ? 'Bạn' : msg.authorName}
                            </span>
                            <span style={{ fontSize: '9px', color: 'var(--color-slate-400)' }}>
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>

                          <div
                            style={{
                              marginTop: '4px',
                              padding: 'var(--spacing-2) var(--spacing-3)',
                              backgroundColor: isOwnMessage ? 'var(--color-primary-600)' : 'white',
                              border: isOwnMessage
                                ? '1px solid var(--color-primary-600)'
                                : '1px solid var(--color-slate-200)',
                              borderRadius: isOwnMessage ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                              fontSize: 'var(--text-sm)',
                              color: isOwnMessage ? 'white' : 'var(--color-slate-800)',
                              maxWidth: '100%',
                              display: 'block',
                              boxShadow: isOwnMessage
                                ? '0 2px 6px rgba(37, 99, 235, 0.16)'
                                : '0 1px 2px rgba(0,0,0,0.02)',
                              wordBreak: 'break-word',
                            }}
                          >
                            {msg.content}

                            {/* Render image attachments */}
                            {hasAttachment && isImage && (
                              <div style={{ marginTop: 'var(--spacing-2)', maxWidth: '300px' }}>
                                <img
                                  src={msg.attachmentUrl || ''}
                                  alt={msg.attachmentName || 'Hình ảnh đính kèm'}
                                  style={{ width: '100%', borderRadius: '4px', border: '1px solid var(--color-slate-100)' }}
                                />
                              </div>
                            )}

                            {/* Render document/file attachments */}
                            {hasAttachment && !isImage && (
                              <a
                                href={msg.attachmentUrl || ''}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 'var(--spacing-3)',
                                  marginTop: 'var(--spacing-2)',
                                  padding: 'var(--spacing-2)',
                                  backgroundColor: isOwnMessage ? 'rgba(255, 255, 255, 0.14)' : 'var(--color-slate-50)',
                                  border: isOwnMessage
                                    ? '1px solid rgba(255, 255, 255, 0.3)'
                                    : '1px solid var(--color-slate-200)',
                                  borderRadius: '4px',
                                  textDecoration: 'none',
                                  color: isOwnMessage ? 'white' : 'var(--color-slate-700)',
                                  transition: 'all var(--transition-fast)',
                                }}
                                className={isOwnMessage ? 'attachment-card attachment-card-own' : 'attachment-card'}
                              >
                                <div
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '4px',
                                    backgroundColor: isOwnMessage ? 'rgba(255, 255, 255, 0.16)' : 'var(--color-primary-50)',
                                    color: isOwnMessage ? 'white' : 'var(--color-primary-600)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <FileText size={18} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p
                                    style={{
                                      fontSize: 'var(--text-xs)',
                                      fontWeight: 600,
                                      margin: 0,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {msg.attachmentName}
                                  </p>
                                  <span style={{ fontSize: '9px', color: isOwnMessage ? 'rgba(255, 255, 255, 0.72)' : 'var(--color-slate-400)' }}>
                                    {msg.attachmentSize ? formatBytes(msg.attachmentSize) : ''}
                                  </span>
                                </div>
                                <Download size={14} style={{ color: isOwnMessage ? 'white' : 'var(--color-slate-400)' }} />
                              </a>
                            )}
                          </div>
                        </div>
                        {isOwnMessage && <Avatar fallback={user.fullName || msg.authorName} size={36} />}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Send Composer footer */}
              <form
                onSubmit={handleSendChat}
                style={{
                  padding: 'var(--spacing-3)',
                  borderTop: '1px solid var(--color-slate-200)',
                  backgroundColor: 'white',
                  display: 'flex',
                  gap: 'var(--spacing-2)',
                  alignItems: 'center',
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleAttachmentChange}
                />
                
                <Button
                  type="button"
                  variant="text"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ color: 'var(--color-slate-500)', padding: '8px' }}
                  title="Đính kèm tệp tin"
                  disabled={sendAttachmentMutation.isPending}
                >
                  <Paperclip size={18} />
                </Button>

                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1, height: '36px' }}
                  placeholder={
                    sendAttachmentMutation.isPending
                      ? 'Đang tải tệp tin lên...'
                      : 'Gửi tin nhắn vào nhóm...'
                  }
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  disabled={sendChatMutation.isPending || sendAttachmentMutation.isPending}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!composerText.trim()}
                  isLoading={sendChatMutation.isPending}
                  style={{ height: '36px' }}
                >
                  <Send size={14} />
                </Button>
              </form>
            </div>
          )}

          {/* TAB 2: Members list roster */}
          {activeTab === 'members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
              {isMembersLoading ? (
                <div className="skeleton-shimmer" style={{ height: '120px', borderRadius: '4px' }} />
              ) : members.length === 0 ? (
                <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--color-slate-400)' }}>
                  Không tìm thấy thành viên nào.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-4)' }}>
                  {members.map((member: GroupMemberDto) => {
                    const isMemberOwner = member.username === group.createdByName || member.fullName === group.createdByName;
                    
                    return (
                      <Card key={member.id}>
                        <CardBody style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center', padding: 'var(--spacing-3)' }}>
                          <Avatar fallback={member.fullName || member.username} size={40} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, margin: 0 }}>
                                {member.fullName || member.username}
                              </h4>
                              {isMemberOwner && (
                                <Badge variant="warning" style={{ fontSize: '8px', padding: '1px 4px', gap: '2px' }}>
                                  <Shield size={8} /> Trưởng nhóm
                                </Badge>
                              )}
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--color-slate-400)' }}>
                              Email: {member.email}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '9px', color: 'var(--color-slate-400)' }}>
                              <Clock size={8} />
                              <span>Gia nhập: {member.joinedAt ? formatDate(member.joinedAt) : 'Mới'}</span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Join Requests, approved exclusively by administrators */}
          {activeTab === 'requests' && canModerateJoinRequests && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
              {isRequestsLoading ? (
                <div className="skeleton-shimmer" style={{ height: '80px', borderRadius: '4px' }} />
              ) : joinRequests.length === 0 ? (
                <div
                  style={{
                    padding: 'var(--spacing-8)',
                    textAlign: 'center',
                    backgroundColor: 'white',
                    border: '1px solid var(--color-slate-200)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-slate-400)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  Không có yêu cầu gia nhập nhóm học tập nào đang chờ duyệt.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                  {joinRequests.map((req: GroupMemberDto) => (
                    <Card key={req.id}>
                      <CardBody style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-4)' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
                          <Avatar fallback={req.fullName || req.username} size={40} />
                          <div>
                            <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, margin: 0 }}>
                              {req.fullName || req.username}
                            </h4>
                            <span style={{ fontSize: '10px', color: 'var(--color-slate-400)' }}>
                              Email: {req.email}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => approveMutation.mutate(req.id)}
                            isLoading={approveMutation.isPending && approveMutation.variables === req.id}
                          >
                            Duyệt
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => rejectMutation.mutate(req.id)}
                            isLoading={rejectMutation.isPending && rejectMutation.variables === req.id}
                            style={{ color: 'var(--color-danger-500)' }}
                          >
                            Từ chối
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Group Settings Dialog */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Thiết lập nhóm học tập">
        <form onSubmit={handleSubmit((data) => updateGroupMutation.mutate(data))} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <Input
            label="Tên nhóm học tập *"
            placeholder="Nhập tên nhóm học tập..."
            error={errors.name?.message}
            disabled={updateGroupMutation.isPending}
            {...register('name')}
          />

          <Input
            label="Môn học / Lĩnh vực *"
            placeholder="Nhập môn học hoặc chuyên ngành học..."
            error={errors.subject?.message}
            disabled={updateGroupMutation.isPending}
            {...register('subject')}
          />

          <Textarea
            label="Mô tả nhóm học tập"
            placeholder="Nhập mô tả tóm tắt..."
            error={errors.description?.message}
            disabled={updateGroupMutation.isPending}
            rows={3}
            {...register('description')}
          />

          <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
            <Button variant="secondary" type="button" onClick={() => setIsEditOpen(false)} disabled={updateGroupMutation.isPending}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={updateGroupMutation.isPending}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Group Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Giải tán nhóm học tập"
        message="Hành động này sẽ giải tán nhóm học tập vĩnh viễn và xóa bỏ toàn bộ lịch sử tin nhắn cùng các tệp tin đính kèm trong các kênh. Bạn có chắc chắn muốn tiếp tục?"
        confirmText="Xác nhận giải tán"
        isDestructive
        isLoading={deleteMutation.isPending}
      />

      {/* Leave Group Confirm Dialog */}
      <ConfirmDialog
        isOpen={isLeaveOpen}
        onClose={() => setIsLeaveOpen(false)}
        onConfirm={() => leaveMutation.mutate()}
        title="Rời khỏi nhóm học tập"
        message="Bạn có chắc chắn muốn rời khỏi nhóm học tập này? Bạn sẽ mất quyền truy cập vào các kênh thảo luận và chia sẻ tài nguyên giáo trình của nhóm."
        confirmText="Rời nhóm"
        isDestructive
        isLoading={leaveMutation.isPending}
      />

      <style>{`
        .tab-btn-detail {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding-bottom: var(--spacing-3);
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-slate-500);
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all var(--transition-fast);
        }
        .tab-btn-detail:hover {
          color: var(--color-slate-800);
        }
        .tab-btn-detail-active {
          color: var(--color-primary-700) !important;
          border-bottom-color: var(--color-primary-700) !important;
        }
        
        .attachment-card:hover {
          border-color: var(--color-primary-300) !important;
          background-color: var(--color-primary-25) !important;
        }

        .attachment-card-own:hover {
          border-color: rgba(255, 255, 255, 0.5) !important;
          background-color: rgba(255, 255, 255, 0.2) !important;
        }
        
        @media (max-width: 768px) {
          .group-detail-layout {
            grid-template-columns: 1fr !important;
          }
          .group-detail-sidebar {
            display: none !important;
          }
        }
      `}</style>
    </Shell>
  );
}
