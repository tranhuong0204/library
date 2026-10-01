import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeAiConversation, normalizeAiMessage } from '@/lib/normalizers';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/feedback/EmptyState';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/app/providers';
import { toast } from 'sonner';
import {
  Sparkles,
  Plus,
  Trash2,
  Send,
  MessageSquare,
  ArrowDown,
  Loader2,
  ShieldCheck,
} from 'lucide-react';



interface MessageDto {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export default function AiWorkspacePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-resize composer textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(160, textareaRef.current.scrollHeight)}px`;
    }
  }, [inputVal]);

  // Query: Fetch conversations list
  const { data: conversations = [], isLoading: isConvsLoading } = useQuery({
    queryKey: ['ai', 'conversations', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/ai/conversations');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeAiConversation);
    },
    enabled: !!user,
  });

  // Query: Fetch active conversation messages
  const { data: messages = [], isLoading: isMessagesLoading } = useQuery({
    queryKey: ['ai', 'messages', activeConvId],
    queryFn: async () => {
      const res = await apiClient.get(`/ai/conversations/${activeConvId}/messages`);
      return (Array.isArray(res.data) ? res.data : []).map(normalizeAiMessage);
    },
    enabled: activeConvId !== null,
  });

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll handler to toggle "scroll-to-bottom" floating button
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      setShowScrollBtn(!isNearBottom && scrollHeight > clientHeight);
    }
  };

  // Auto-scroll when messages load or change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('instant');
    }
  }, [messages.length, activeConvId]);

  // Mutation: Start New Conversation
  const startConvMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/ai/conversations', { title: 'Cuộc trò chuyện mới' });
      return res.data;
    },
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations', 'list'] });
      setActiveConvId(Number(newConv.id));
      setInputVal('');
      toast.success('Đã bắt đầu cuộc trò chuyện mới!');
      setTimeout(() => textareaRef.current?.focus(), 100);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể tạo cuộc trò chuyện.');
    },
  });

  // Mutation: Delete Conversation
  const deleteConvMutation = useMutation({
    mutationFn: async (convId: number) => {
      await apiClient.delete(`/ai/conversations/${convId}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations', 'list'] });
      if (activeConvId === deletedId) {
        setActiveConvId(null);
      }
      toast.success('Đã xóa cuộc trò chuyện.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể xóa cuộc trò chuyện.');
    },
  });

  // Send Message Logic
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputVal.trim() || isSending) return;

    const queryText = inputVal.trim();
    if (queryText.length > 5000) {
      toast.error('Câu hỏi vượt quá giới hạn tối đa 5000 ký tự.');
      return;
    }

    setInputVal('');
    setIsSending(true);

    // If no active conversation, create one first
    let currentConvId = activeConvId;
    try {
      if (currentConvId === null) {
        const newConv = await apiClient.post('/ai/conversations', {
          title: queryText.substring(0, 40),
        });
        currentConvId = Number(newConv.data.id);
        setActiveConvId(currentConvId);
        await queryClient.invalidateQueries({ queryKey: ['ai', 'conversations', 'list'] });
      }

      // Optimistically append user message
      queryClient.setQueryData<MessageDto[]>(['ai', 'messages', currentConvId], (old = []) => [
        ...old,
        { role: 'user', content: queryText },
      ]);
      setTimeout(() => scrollToBottom('smooth'), 50);

      // Post message
      await apiClient.post(`/ai/conversations/${currentConvId}/messages`, {
        message: queryText,
        conversationId: String(currentConvId),
      }, {
        // Ollama may need extra time for the first request while loading the model.
        timeout: 120000,
      });

      queryClient.invalidateQueries({ queryKey: ['ai', 'messages', currentConvId] });
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations', 'list'] });
    } catch (err: any) {
      toast.error(err.message || 'Gửi câu hỏi thất bại.');
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AppShell>
      <div className="ai-workspace-container">
        {/* Conversations History Sidebar */}
        <aside className="ai-sidebar">
          <div className="ai-sidebar-header">
            <span>Lịch sử trò chuyện</span>
            <Button
              variant="primary"
              className="ai-new-chat-button"
              onClick={() => startConvMutation.mutate()}
              isLoading={startConvMutation.isPending}
            >
              <Plus size={16} />
              <span>Cuộc trò chuyện mới</span>
            </Button>
          </div>

          <div className="ai-conversation-list">
            {isConvsLoading ? (
              <div className="ai-conversation-skeleton">
                <div className="skeleton-shimmer" style={{ height: '36px', borderRadius: '4px' }} />
                <div className="skeleton-shimmer" style={{ height: '36px', borderRadius: '4px' }} />
                <div className="skeleton-shimmer" style={{ height: '36px', borderRadius: '4px' }} />
              </div>
            ) : conversations.length === 0 ? (
              <div className="ai-conversation-empty">
                <MessageSquare size={22} />
                <span>Chưa có cuộc trò chuyện</span>
              </div>
            ) : (
              <div className="ai-conversation-items">
                {conversations.map((conv) => {
                  const isActive = activeConvId === conv.id;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className={`conv-item ${isActive ? 'conv-item-active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', width: '80%' }}>
                        <MessageSquare size={16} style={{ color: isActive ? 'var(--color-primary-700)' : 'var(--color-slate-400)' }} />
                        <span
                          style={{
                            fontSize: 'var(--text-xs)',
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? 'var(--color-primary-800)' : 'var(--color-slate-700)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {conv.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConvMutation.mutate(conv.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-slate-400)',
                          display: 'none',
                        }}
                        className="delete-conv-btn"
                        title="Xóa cuộc trò chuyện"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Central Chat Workspace */}
        <div className="ai-chat-panel">
          <div className="ai-panel-header">
            <div>
              <span className="ai-panel-mark"><Sparkles size={17} /></span>
              <span><strong>Library AI</strong><small>Trợ lý học tập và nghiên cứu</small></span>
            </div>
            <span className="ai-source-assurance"><ShieldCheck size={14} /> Ưu tiên nguồn trong hệ thống</span>
          </div>
          {activeConvId === null ? (
            /* Empty Chatbox State */
            <div className="ai-empty-workspace">
              <EmptyState
                title="Học tập cùng Trợ lý AI LIBRARY"
                message="Đăng câu hỏi về tài liệu nghiên cứu, tóm tắt bài học hoặc dịch thuật để được AI hỗ trợ tức thì bằng phương pháp RAG thông minh."
                icon={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary-50)',
                      color: 'var(--color-primary-600)',
                    }}
                  >
                    <Sparkles size={40} />
                  </div>
                }
                actionText="Tạo cuộc trò chuyện mới"
                onAction={() => startConvMutation.mutate()}
              />
            </div>
          ) : (
            /* Active Chat interface */
            <>
              {/* Messages timeline */}
              <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="ai-message-timeline"
              >
                {isMessagesLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                    <div className="skeleton-shimmer" style={{ height: '60px', width: '50%' }} />
                    <div className="skeleton-shimmer" style={{ height: '60px', width: '40%', alignSelf: 'flex-end' }} />
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={idx}
                        className={`ai-message-row ${isUser ? 'is-user' : 'is-assistant'}`}
                      >
                        <Avatar
                          fallback={isUser ? (user?.fullName || 'U') : 'AI'}
                          size={36}
                          style={{
                            backgroundColor: isUser ? 'var(--color-primary-600)' : 'var(--color-accent-600)',
                            color: 'white',
                          }}
                        />

                        <div className="ai-message-bubble">
                          {isUser ? (
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 'var(--text-sm)' }}>
                              {msg.content}
                            </p>
                          ) : (
                            <MarkdownRenderer content={msg.content} />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* AI typing simulation loading spinner */}
                {isSending && (
                  <div className="ai-typing-row">
                    <Avatar fallback="AI" size={36} style={{ backgroundColor: 'var(--color-accent-600)', color: 'white' }} />
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-sm)',
                        backgroundColor: 'white',
                        border: '1px solid var(--color-slate-200)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Loader2 className="animate-spin" size={16} style={{ color: 'var(--color-accent-600)' }} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', fontWeight: 500 }}>
                        LIBRARY AI đang suy nghĩ...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Floating scroll bottom button */}
              {showScrollBtn && (
                <button
                  onClick={() => scrollToBottom('smooth')}
                  className="ai-scroll-button"
                  aria-label="Cuộn xuống tin nhắn mới nhất"
                >
                  <ArrowDown size={18} />
                </button>
              )}

              {/* Chat Composer form */}
              <div className="ai-composer-wrap">
                <form
                  onSubmit={handleSendMessage}
                  className="ai-composer"
                >
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Hỏi LIBRARY AI về các tài liệu học tập..."
                    disabled={isSending}
                    style={{
                      flex: 1,
                      border: 'none',
                      backgroundColor: 'transparent',
                      resize: 'none',
                      fontSize: 'var(--text-sm)',
                      outline: 'none',
                      fontFamily: 'var(--font-sans)',
                      maxHeight: '160px',
                      padding: '4px 0',
                    }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: inputVal.length > 4500 ? 'var(--color-danger-500)' : 'var(--color-slate-400)' }}>
                      {inputVal.length}/5000
                    </span>
                    <button
                      type="submit"
                      disabled={!inputVal.trim() || isSending}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: !inputVal.trim() || isSending ? 'var(--color-slate-200)' : 'var(--color-primary-600)',
                        color: 'white',
                        cursor: !inputVal.trim() || isSending ? 'not-allowed' : 'pointer',
                        transition: 'background var(--transition-fast)',
                        border: 'none',
                      }}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

    </AppShell>
  );
}
