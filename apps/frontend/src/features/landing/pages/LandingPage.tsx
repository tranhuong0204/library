import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  FileSearch,
  GraduationCap,
  LibraryBig,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import collaborativeStudyImage from '@/assets/landing/collaborative-study.jpg';
import libraryFocusImage from '@/assets/landing/library-focus.jpg';
import knowledgeLayersImage from '@/assets/hero.png';

const features = [
  {
    icon: BookOpen,
    index: '01',
    title: 'Thư viện học thuật',
    description: 'Tìm kiếm, lưu yêu thích và tiếp cận tài liệu theo danh mục trong một không gian thống nhất.',
    tone: 'blue',
  },
  {
    icon: Bot,
    index: '02',
    title: 'Library AI',
    description: 'Đặt câu hỏi bằng ngôn ngữ tự nhiên và nhận câu trả lời dựa trên nguồn tri thức của thư viện.',
    tone: 'violet',
  },
  {
    icon: MessageSquareText,
    index: '03',
    title: 'Diễn đàn học tập',
    description: 'Trao đổi vấn đề học thuật, chia sẻ góc nhìn và kết nối với cộng đồng người học.',
    tone: 'amber',
  },
  {
    icon: Users,
    index: '04',
    title: 'Nhóm học tập',
    description: 'Tạo không gian cộng tác riêng, quản lý thành viên và cùng nhau theo đuổi mục tiêu học tập.',
    tone: 'emerald',
  },
];

const journey = [
  {
    step: '01',
    title: 'Khám phá nguồn tri thức',
    description: 'Tìm đúng tài liệu theo từ khóa, danh mục và nhu cầu học tập của bạn.',
  },
  {
    step: '02',
    title: 'Học sâu cùng AI',
    description: 'Đặt câu hỏi, làm rõ nội dung và tiếp cận kiến thức theo cách trực quan hơn.',
  },
  {
    step: '03',
    title: 'Kết nối và phát triển',
    description: 'Thảo luận trên diễn đàn, tham gia nhóm và chia sẻ tri thức với cộng đồng.',
  },
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <a className="landing-brand" href="#top" aria-label="Library AI - về đầu trang">
            <span className="landing-brand-mark"><LibraryBig size={22} strokeWidth={2.1} /></span>
            <span className="landing-brand-copy">
              <strong>Library AI</strong>
              <small>Knowledge workspace</small>
            </span>
          </a>

          <nav className="landing-nav" aria-label="Điều hướng trang giới thiệu">
            <a href="#about">Giới thiệu</a>
            <a href="#features">Tính năng</a>
            <a href="#experience">Trải nghiệm</a>
          </nav>

          <div className="landing-auth-actions">
            <Link className="landing-button landing-button-ghost" to="/login">Đăng nhập</Link>
            <Link className="landing-button landing-button-primary" to="/register">
              Đăng ký <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-hero-glow landing-hero-glow-one" aria-hidden="true" />
          <div className="landing-hero-glow landing-hero-glow-two" aria-hidden="true" />
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <div className="landing-eyebrow landing-reveal">
                <Sparkles size={15} />
                Không gian tri thức số dành cho bạn
              </div>
              <h1 id="landing-hero-title" className="landing-reveal landing-reveal-delay-1">
                Học tập sâu hơn.<br />
                <span>Kết nối thông minh hơn.</span>
              </h1>
              <p className="landing-reveal landing-reveal-delay-2">
                Library AI đưa tài liệu học thuật, trợ lý AI và cộng đồng học tập vào một không gian hiện đại — để mỗi câu hỏi đều mở ra một hành trình khám phá mới.
              </p>

              <div className="landing-hero-actions landing-reveal landing-reveal-delay-3">
                <Link className="landing-button landing-button-primary landing-button-large" to="/register">
                  Bắt đầu khám phá <ArrowRight size={17} />
                </Link>
                <a className="landing-button landing-button-soft landing-button-large" href="#features">
                  Xem các tính năng
                </a>
              </div>

              <div className="landing-trust-row landing-reveal landing-reveal-delay-4">
                <span><CheckCircle2 size={15} /> Kho tri thức tập trung</span>
                <span><CheckCircle2 size={15} /> AI hỗ trợ theo ngữ cảnh</span>
                <span><CheckCircle2 size={15} /> Cộng đồng học thuật</span>
              </div>
            </div>

            <div className="landing-hero-visual landing-reveal landing-reveal-delay-2" aria-label="Minh họa trải nghiệm học tập với Library AI">
              <div className="landing-photo-frame">
                <img
                  className="landing-hero-photo"
                  src={collaborativeStudyImage}
                  alt="Hai sinh viên cùng trao đổi và học tập với máy tính"
                  fetchPriority="high"
                />
                <div className="landing-photo-shade" aria-hidden="true" />
                <div className="landing-photo-caption">
                  <span>Không gian học tập</span>
                  <strong>Tri thức trở nên gần hơn</strong>
                </div>
              </div>

              <div className="landing-ai-card landing-float-slow">
                <div className="landing-ai-card-head">
                  <span className="landing-ai-icon"><Sparkles size={16} /></span>
                  <span><strong>Library AI</strong><small>Trợ lý tri thức của bạn</small></span>
                  <i>AI</i>
                </div>
                <div className="landing-ai-question">
                  <Search size={14} /> Tóm tắt nội dung tài liệu này...
                </div>
                <div className="landing-ai-answer">
                  <span />
                  <span />
                  <span />
                  <small><ShieldCheck size={12} /> Phản hồi dựa trên nguồn tài liệu</small>
                </div>
              </div>

              <div className="landing-knowledge-card landing-float-fast">
                <img src={knowledgeLayersImage} alt="" aria-hidden="true" />
                <span><small>Không gian tri thức</small><strong>Mọi nguồn học liệu, một nơi.</strong></span>
              </div>

              <div className="landing-orbit-dot landing-orbit-dot-one" aria-hidden="true" />
              <div className="landing-orbit-dot landing-orbit-dot-two" aria-hidden="true" />
            </div>
          </div>

          <div className="landing-container landing-capability-strip" aria-label="Năng lực nổi bật">
            <div><span>01</span><strong>Tài liệu học thuật</strong><small>Tra cứu có hệ thống</small></div>
            <div><span>02</span><strong>AI RAG</strong><small>Phản hồi theo nguồn</small></div>
            <div><span>03</span><strong>Nhóm học tập</strong><small>Cộng tác hiệu quả</small></div>
            <div><span>04</span><strong>Diễn đàn tri thức</strong><small>Kết nối cộng đồng</small></div>
          </div>
        </section>

        <section id="about" className="landing-intro-section">
          <div className="landing-container landing-section-heading landing-section-heading-centered">
            <span className="landing-section-kicker">Một hệ sinh thái học tập hoàn chỉnh</span>
            <h2>Không chỉ là một thư viện.<br /><em>Đây là nơi tri thức được kết nối.</em></h2>
            <p>
              Từ lúc tìm kiếm tài liệu đến khi thảo luận một vấn đề khó, Library AI giúp hành trình học tập luôn liền mạch, có định hướng và giàu cảm hứng.
            </p>
          </div>
        </section>

        <section id="features" className="landing-feature-section">
          <div className="landing-container">
            <div className="landing-feature-grid">
              {features.map(({ icon: Icon, index, title, description, tone }) => (
                <article className={`landing-feature-card is-${tone}`} key={title}>
                  <div className="landing-feature-topline">
                    <span className="landing-feature-icon"><Icon size={22} strokeWidth={1.8} /></span>
                    <small>{index}</small>
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className="landing-feature-link">Khám phá <ArrowRight size={14} /></span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="experience" className="landing-experience-section">
          <div className="landing-container landing-experience-grid">
            <div className="landing-experience-visual">
              <div className="landing-experience-photo-wrap">
                <img
                  src={libraryFocusImage}
                  alt="Không gian thư viện với sinh viên đang nghiên cứu tài liệu"
                  loading="lazy"
                />
              </div>
              <div className="landing-quote-card">
                <span>“</span>
                <p>Mỗi nguồn tài liệu đều có thể trở thành một cuộc đối thoại với tri thức.</p>
              </div>
              <div className="landing-mini-stat">
                <FileSearch size={19} />
                <span><strong>Tìm đúng tài liệu</strong><small>Theo chủ đề bạn quan tâm</small></span>
              </div>
            </div>

            <div className="landing-experience-copy">
              <span className="landing-section-kicker landing-section-kicker-light">Trải nghiệm được thiết kế cho việc học</span>
              <h2>Gọn gàng để tập trung.<br /><em>Thông minh để tiến xa.</em></h2>
              <p>
                Library AI giảm bớt những thao tác rời rạc để bạn dành nhiều thời gian hơn cho điều quan trọng nhất: đọc, hiểu, đặt câu hỏi và chia sẻ kiến thức.
              </p>
              <div className="landing-benefit-list">
                <div><span><Search size={18} /></span><p><strong>Tìm kiếm trực quan</strong><small>Đi từ câu hỏi đến đúng nguồn tài liệu nhanh chóng.</small></p></div>
                <div><span><Bot size={18} /></span><p><strong>Hỗ trợ học tập bằng AI</strong><small>Khám phá nội dung tài liệu qua hội thoại tự nhiên.</small></p></div>
                <div><span><GraduationCap size={18} /></span><p><strong>Không gian học tập kết nối</strong><small>Cùng trao đổi, hợp tác và mở rộng góc nhìn.</small></p></div>
              </div>
              <Link className="landing-text-link" to="/register">
                Tạo không gian của bạn <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-journey-section">
          <div className="landing-container">
            <div className="landing-section-heading landing-section-heading-split">
              <div>
                <span className="landing-section-kicker">Bắt đầu thật đơn giản</span>
                <h2>Ba bước cho một hành trình<br /><em>học tập chủ động hơn.</em></h2>
              </div>
              <p>Một trải nghiệm xuyên suốt, từ lúc bạn tìm kiếm tri thức đến khi biến tri thức thành kết nối có giá trị.</p>
            </div>
            <div className="landing-journey-grid">
              {journey.map((item) => (
                <article key={item.step}>
                  <span>{item.step}</span>
                  <div className="landing-journey-line" aria-hidden="true"><i /></div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-final-cta">
          <div className="landing-final-orb landing-final-orb-one" aria-hidden="true" />
          <div className="landing-final-orb landing-final-orb-two" aria-hidden="true" />
          <div className="landing-container landing-final-content">
            <div className="landing-final-mark"><Sparkles size={25} /></div>
            <span>Library AI Workspace</span>
            <h2>Sẵn sàng mở ra một cách học<br /><em>thông minh và kết nối hơn?</em></h2>
            <p>Tham gia Library AI để xây dựng không gian tri thức của riêng bạn ngay hôm nay.</p>
            <div>
              <Link className="landing-button landing-button-white landing-button-large" to="/register">
                Đăng ký ngay <ArrowRight size={17} />
              </Link>
              <Link className="landing-button landing-button-dark-ghost landing-button-large" to="/login">
                Tôi đã có tài khoản
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-brand landing-footer-brand">
            <span className="landing-brand-mark"><LibraryBig size={20} /></span>
            <span className="landing-brand-copy"><strong>Library AI</strong><small>Knowledge workspace</small></span>
          </div>
          <p>Không gian tri thức số dành cho học tập, nghiên cứu và kết nối.</p>
          <div>
            <Link to="/login">Đăng nhập</Link>
            <Link to="/register">Đăng ký</Link>
            <a href="#top">Lên đầu trang</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
