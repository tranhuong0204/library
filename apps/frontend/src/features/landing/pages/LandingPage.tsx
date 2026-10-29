import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/ui/BrandLogo';
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  FileSearch,
  GraduationCap,
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
    tone: 'sage',
  },
  {
    icon: Bot,
    index: '02',
    title: 'Library AI',
    description: 'Đặt câu hỏi bằng ngôn ngữ tự nhiên và nhận câu trả lời dựa trên nguồn tri thức của thư viện.',
    tone: 'clay',
  },
  {
    icon: MessageSquareText,
    index: '03',
    title: 'Diễn đàn học tập',
    description: 'Trao đổi vấn đề học thuật, chia sẻ góc nhìn và kết nối với cộng đồng người học.',
    tone: 'terracotta',
  },
  {
    icon: Users,
    index: '04',
    title: 'Nhóm học tập',
    description: 'Tạo không gian cộng tác riêng, quản lý thành viên và cùng nhau theo đuổi mục tiêu học tập.',
    tone: 'forest',
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

const comparisonCapabilities = [
  {
    index: '01',
    title: 'Tài liệu học thuật',
    detail: 'Tra cứu có hệ thống, phân loại giáo trình chuẩn mực',
    badge: 'Tổ chức chuẩn',
  },
  {
    index: '02',
    title: 'Trợ lý AI RAG',
    detail: 'Hỏi đáp ngữ cảnh, trích dẫn chính xác nguồn dữ liệu',
    badge: 'Có trích dẫn',
  },
  {
    index: '03',
    title: 'Nhóm học tập',
    detail: 'Không gian cộng tác nhóm riêng, phân quyền rõ ràng',
    badge: 'Cộng tác mở',
  },
  {
    index: '04',
    title: 'Diễn đàn tri thức',
    detail: 'Thảo luận chuyên sâu, kết nối học viên và giảng viên',
    badge: 'Kết nối sâu',
  },
];

/* Minimal Decorative Botanical Sprig SVG */
const BotanicalSprig = ({ className = '', size = 18 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 21V6" />
    <path d="M12 16c-2.4 0-4.8-1.4-5.6-3.8 2.8 0 4.8 1.4 5.6 3.8z" />
    <path d="M12 11c2.4 0 4.8-1.4 5.6-3.8-2.8 0-4.8 1.4-5.6 3.8z" />
    <path d="M12 6c-1.8-1-3-2.8-3-4.5 2.2 0 3 2.8 3 4.5z" />
  </svg>
);

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* ---------------------------------------------------- */}
      {/* Navigation Header                                    */}
      {/* ---------------------------------------------------- */}
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <a className="landing-brand" href="#top" aria-label="Library AI - Về đầu trang">
            <BrandLogo subtitle="Knowledge Workspace" size="md" />
          </a>

          <nav className="landing-nav" aria-label="Điều hướng trang giới thiệu">
            <a href="#about">Giới thiệu</a>
            <a href="#capabilities">Năng lực</a>
            <a href="#features">Tính năng</a>
            <a href="#process">Quy trình</a>
          </nav>

          <div className="landing-auth-actions">
            <Link className="landing-button landing-button-ghost" to="/login">
              Đăng nhập
            </Link>
            <Link className="landing-button landing-button-forest" to="/register">
              Đăng ký <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ---------------------------------------------------- */}
        {/* Hero Section: Large Serif Copy + Tall Arched Photo   */}
        {/* ---------------------------------------------------- */}
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-container landing-hero-grid">
            {/* Left Copy Column */}
            <div className="landing-hero-copy">
              <div className="landing-eyebrow">
                <BotanicalSprig size={16} />
                <span>Không gian tri thức số dành cho bạn</span>
              </div>

              <h1 id="landing-hero-title">
                Học tập sâu hơn.<br />
                <em className="landing-accent-italic">Kết nối thông minh hơn.</em>
              </h1>

              <p>
                Library AI đưa tài liệu học thuật, trợ lý AI và cộng đồng học tập vào một không gian thanh bình và hiện đại — để mỗi câu hỏi đều mở ra một hành trình khám phá mới.
              </p>

              <div className="landing-hero-actions">
                <Link className="landing-button landing-button-forest landing-button-large" to="/register">
                  Bắt đầu khám phá <ArrowRight size={16} />
                </Link>
                <a className="landing-action-underline" href="#features">
                  Xem các tính năng
                </a>
              </div>

              <div className="landing-trust-row" aria-label="Cam kết chất lượng">
                <span className="landing-trust-item">
                  <CheckCircle2 size={15} /> Kho tri thức tập trung
                </span>
                <span className="landing-trust-item">
                  <CheckCircle2 size={15} /> AI hỗ trợ theo ngữ cảnh
                </span>
                <span className="landing-trust-item">
                  <CheckCircle2 size={15} /> Cộng đồng học thuật
                </span>
              </div>
            </div>

            {/* Right Tall Arched Visual Column */}
            <div className="landing-hero-visual" aria-label="Minh họa không gian học tập Library AI">
              {/* Tall Arched Main Photograph */}
              <div className="landing-tall-arch-frame">
                <img
                  className="landing-tall-arch-photo"
                  src={collaborativeStudyImage}
                  alt="Hai sinh viên cùng trao đổi và học tập với máy tính"
                  width={460}
                  height={620}
                  fetchPriority="high"
                />
                <div className="landing-photo-shade" aria-hidden="true" />
                <div className="landing-photo-caption">
                  <span>Không gian học tập</span>
                  <strong>Tri thức trở nên gần hơn</strong>
                </div>
              </div>

              {/* Small Circular Object Image Overlapping Base */}
              <div className="landing-circular-object-wrap" aria-hidden="true">
                {/* Fine Arch Flourish Line & Sprig SVG */}
                <svg
                  className="landing-sprig-arch-flourish"
                  viewBox="0 0 120 120"
                  fill="none"
                  stroke="var(--dp-color-ornament-line)"
                  strokeWidth="1.2"
                >
                  <circle cx="60" cy="60" r="54" strokeDasharray="3 4" />
                  <path d="M60 6 C62 20 54 28 48 38 C56 34 68 30 60 6Z" fill="var(--dp-color-panel)" />
                </svg>

                <div className="landing-circular-object-frame">
                  <img
                    src={libraryFocusImage}
                    alt=""
                    className="landing-circular-object-photo"
                    width={130}
                    height={130}
                  />
                </div>
              </div>

              {/* Anchored AI Assistant Note Card */}
              <div className="landing-ai-card">
                <div className="landing-ai-card-head">
                  <span className="landing-ai-icon">
                    <Sparkles size={16} />
                  </span>
                  <span>
                    <strong>Library AI</strong>
                    <small>Trợ lý tri thức của bạn</small>
                  </span>
                  <span className="landing-ai-tag">AI RAG</span>
                </div>
                <div className="landing-ai-question">
                  <Search size={14} /> Tóm tắt nội dung tài liệu này...
                </div>
                <div className="landing-ai-answer">
                  <span />
                  <span />
                  <span />
                  <small>
                    <ShieldCheck size={12} /> Phản hồi dựa trên nguồn tài liệu
                  </small>
                </div>
              </div>

              {/* Minimal Knowledge Object Accent */}
              <div className="landing-object-pill">
                <img src={knowledgeLayersImage} alt="" aria-hidden="true" />
                <span>
                  <small>Kho học liệu tập trung</small>
                  <strong>Mọi nguồn học liệu, một nơi</strong>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* Broad Comparison / Capability in Pale Clay Field     */}
        {/* ---------------------------------------------------- */}
        <section id="capabilities" className="landing-container landing-section-gap">
          <div className="landing-clay-field">
            <div className="landing-clay-header">
              <span className="landing-section-kicker">Năng lực nền tảng</span>
              <h2>Hệ thống hóa mọi nhu cầu nghiên cứu</h2>
              <p>Mỗi khía cạnh của nền tảng được cân chỉnh để phục vụ trải nghiệm học tập sâu sắc và bền bỉ.</p>
            </div>

            <div className="landing-comparison-grid">
              {comparisonCapabilities.map((item) => (
                <div className="landing-comparison-row" key={item.index}>
                  <div className="landing-comparison-id">
                    <span className="landing-comparison-num">{item.index}</span>
                    <strong>{item.title}</strong>
                  </div>
                  <div className="landing-comparison-desc">
                    <p>{item.detail}</p>
                  </div>
                  <div className="landing-comparison-action">
                    <span className="landing-comparison-badge">{item.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* Related Explanations in Rounded Sage Panel           */}
        {/* ---------------------------------------------------- */}
        <section id="about" className="landing-container landing-section-gap">
          <div className="landing-sage-panel">
            <div className="landing-sage-grid">
              <div className="landing-sage-copy">
                <span className="landing-section-kicker">Một hệ sinh thái học tập hoàn chỉnh</span>
                <h2>
                  Không chỉ là một thư viện.<br />
                  <em className="landing-accent-italic">Đây là nơi tri thức được kết nối.</em>
                </h2>
                <p>
                  Từ lúc tìm kiếm tài liệu đến khi thảo luận một vấn đề khó, Library AI giúp hành trình học tập luôn liền mạch, có định hướng và giàu cảm hứng.
                </p>
                <div className="landing-sage-highlights">
                  <div>
                    <FileSearch size={18} />
                    <span>Tra cứu đa tầng theo từ khóa và danh mục chuẩn mực.</span>
                  </div>
                  <div>
                    <BotanicalSprig size={18} />
                    <span>Không gian học tập yên tĩnh, tinh giản tối đa xao nhãng.</span>
                  </div>
                </div>
              </div>

              {/* Open Quotation on Cream Paper */}
              <div className="landing-cream-quote-box">
                <span className="landing-open-quote" aria-hidden="true">“</span>
                <blockquote>
                  Mỗi nguồn tài liệu đều có thể trở thành một cuộc đối thoại mở với tri thức.
                </blockquote>
                <cite>— Triết lý học tập tại Library AI</cite>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* Editorial Images: Uneven Row (Arch, Rect, Circle)    */}
        {/* ---------------------------------------------------- */}
        <section className="landing-container landing-editorial-section" aria-label="Bộ sưu tập hình ảnh học thuật">
          <div className="landing-editorial-row">
            {/* Uneven item 1: Arched crop, vertical offset */}
            <div className="landing-editorial-item is-arch">
              <div className="landing-editorial-img-wrap">
                <img
                  src={collaborativeStudyImage}
                  alt="Sinh viên trao đổi học thuật theo nhóm"
                  loading="lazy"
                  width={340}
                  height={420}
                />
              </div>
              <small>Thảo luận đồng nghiệp</small>
            </div>

            {/* Uneven item 2: Soft rectangle crop, lowered offset */}
            <div className="landing-editorial-item is-rect">
              <div className="landing-editorial-img-wrap">
                <img
                  src={libraryFocusImage}
                  alt="Không gian thư viện yên tĩnh và tập trung"
                  loading="lazy"
                  width={440}
                  height={320}
                />
              </div>
              <small>Không gian nghiên cứu tĩnh lặng</small>
            </div>

            {/* Uneven item 3: Circle medallion crop */}
            <div className="landing-editorial-item is-circle">
              <div className="landing-editorial-img-wrap">
                <img
                  src={knowledgeLayersImage}
                  alt="Biểu tượng tri thức số đa tầng"
                  loading="lazy"
                  width={220}
                  height={220}
                />
              </div>
              <small>Tri thức số kết nối</small>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* Features: Line Drawings beside Concise Explanations  */}
        {/* ---------------------------------------------------- */}
        <section id="features" className="landing-container landing-section-gap">
          <div className="landing-section-intro-centered">
            <span className="landing-section-kicker">Tính năng trọng tâm</span>
            <h2>Công cụ chuẩn mực cho người học hiện đại</h2>
          </div>

          <div className="landing-feature-grid">
            {features.map(({ icon: Icon, index, title, description, tone }) => (
              <article className={`landing-feature-card tone-${tone}`} key={title}>
                <div className="landing-feature-topline">
                  <span className="landing-feature-icon">
                    <Icon size={22} strokeWidth={1.6} />
                  </span>
                  <span className="landing-feature-index">{index}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <div className="landing-feature-footer">
                  <span className="landing-feature-link">
                    Khám phá <ArrowRight size={14} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* Continuous Forest-Green Field: Process & Benefits    */}
        {/* ---------------------------------------------------- */}
        <section id="process" className="landing-container landing-section-gap">
          <div className="landing-forest-field">
            {/* Part A: Numbered Process */}
            <div className="landing-forest-process-block">
              <div className="landing-forest-split-head">
                <div>
                  <span className="landing-forest-kicker">Bắt đầu thật đơn giản</span>
                  <h2>
                    Ba bước cho một hành trình<br />
                    <em>học tập chủ động hơn.</em>
                  </h2>
                </div>
                <p>
                  Một trải nghiệm xuyên suốt, từ lúc bạn tìm kiếm tri thức đến khi biến tri thức thành kết nối có giá trị lâu dài.
                </p>
              </div>

              <div className="landing-journey-grid">
                {journey.map((item) => (
                  <article className="landing-journey-step" key={item.step}>
                    <span className="landing-journey-step-num">{item.step}</span>
                    <div className="landing-journey-field-line" aria-hidden="true" />
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </div>

            {/* Field Divider Line */}
            <div className="landing-forest-field-divider" aria-hidden="true" />

            {/* Part B: Learning Benefits */}
            <div className="landing-forest-benefits-block">
              <div className="landing-forest-benefits-copy">
                <span className="landing-forest-kicker">Trải nghiệm được thiết kế cho việc học</span>
                <h2>
                  Gọn gàng để tập trung.<br />
                  <em>Thông minh để tiến xa.</em>
                </h2>
                <p>
                  Library AI giảm bớt những thao tác rời rạc để bạn dành nhiều thời gian hơn cho điều quan trọng nhất: đọc, hiểu, đặt câu hỏi và chia sẻ kiến thức.
                </p>
                <Link className="landing-forest-action" to="/register">
                  Tạo không gian của bạn <ArrowRight size={16} />
                </Link>
              </div>

              <div className="landing-forest-benefit-list">
                <div className="landing-forest-benefit-item">
                  <span className="landing-forest-benefit-icon">
                    <Search size={19} strokeWidth={1.8} />
                  </span>
                  <div>
                    <strong>Tìm kiếm trực quan</strong>
                    <small>Đi từ câu hỏi đến đúng nguồn tài liệu nhanh chóng.</small>
                  </div>
                </div>

                <div className="landing-forest-benefit-item">
                  <span className="landing-forest-benefit-icon">
                    <Bot size={19} strokeWidth={1.8} />
                  </span>
                  <div>
                    <strong>Hỗ trợ học tập bằng AI</strong>
                    <small>Khám phá nội dung tài liệu qua hội thoại tự nhiên.</small>
                  </div>
                </div>

                <div className="landing-forest-benefit-item">
                  <span className="landing-forest-benefit-icon">
                    <GraduationCap size={19} strokeWidth={1.8} />
                  </span>
                  <div>
                    <strong>Không gian học tập kết nối</strong>
                    <small>Cùng trao đổi, hợp tác và mở rộng góc nhìn.</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* The Close: Forest Area with Broad Curved Top & Footer*/}
        {/* ---------------------------------------------------- */}
        <section className="landing-curved-close">
          {/* Centered Serif Invitation */}
          <div className="landing-container landing-curved-close-content">
            <div className="landing-curved-mark">
              <BotanicalSprig size={28} />
            </div>
            <span className="landing-curved-kicker">LIBRIA WORKSPACE</span>
            <h2>
              Sẵn sàng mở ra một cách học<br />
              <em className="landing-clay-highlight">thông minh và kết nối hơn?</em>
            </h2>
            <p>
              Tham gia Library AI để xây dựng không gian tri thức của riêng bạn ngay hôm nay.
            </p>
            <div className="landing-curved-actions">
              <Link className="landing-button landing-button-cream landing-button-large" to="/register">
                Đăng ký ngay <ArrowRight size={16} />
              </Link>
              <Link className="landing-button landing-button-outline-cream landing-button-large" to="/login">
                Tôi đã có tài khoản
              </Link>
            </div>
          </div>

          {/* Footer on the Exact Same Forest Ground */}
          <footer className="landing-forest-footer">
            <div className="landing-container landing-footer-inner">
              <div className="landing-footer-brand-side">
                <BrandLogo subtitle="Botanical Archive" size="md" variant="light" />
                <p>Không gian tri thức số dành cho học tập, nghiên cứu và kết nối.</p>
              </div>

              <div className="landing-footer-links">
                <Link to="/login">Đăng nhập</Link>
                <Link to="/register">Đăng ký</Link>
                <a href="#top">Lên đầu trang</a>
              </div>
            </div>

            <div className="landing-container landing-footer-bottom">
              <small>&copy; {new Date().getFullYear()} Library AI. Trải nghiệm học thuật và tri thức số.</small>
              <small>Phục vụ nghiên cứu, giáo dục và phát triển tư duy học tập.</small>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
