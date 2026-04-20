import Link from 'next/link';
import { query } from '@/lib/db';
import CategoryCard from '@/components/public/CategoryCard';
import CourseCard from '@/components/public/CourseCard';
import styles from './page.module.css';

async function getData() {
  try {
    const [catRes, courseRes] = await Promise.all([
      query(`SELECT c.id, c.*, COUNT(co.id) as course_count FROM categories c LEFT JOIN courses co ON co.category_id = c.id GROUP BY c.id ORDER BY c.created_at DESC LIMIT 6`),
      query(`SELECT co.*, c.name as category_name, c.slug as category_slug, c.color as category_color, COUNT(s.id) as section_count FROM courses co LEFT JOIN categories c ON co.category_id = c.id LEFT JOIN sections s ON s.course_id = co.id WHERE co.is_published = true GROUP BY co.id, c.name, c.slug, c.color ORDER BY co.created_at DESC LIMIT 6`),
    ]);
    return { categories: catRes.rows, courses: courseRes.rows };
  } catch {
    return { categories: [], courses: [] };
  }
}
export default async function HomePage() {
  const { categories, courses } = await getData();

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg}></div>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.preparationInfo}>
              <p className={styles.preparationText}>إعداد الدكتورة سارة جابري</p>
              <p className={styles.preparationDetails}>أستاذة مادة اللغة العربية وآدابها بثانوية أبي عبيدة بن الجراح تبسة</p>
            </div>
            <h1 className={styles.heroTitle}>
              تعلّم الأدب العربي
              <br />
              <span className={styles.heroAccent}>بأسلوب حديث ومنظّم</span>
            </h1>
            <p className={styles.heroDesc}>
              منصتك الشاملة لمادة الأدب العربي — دروس منظّمة، محتوى أصيل، وشروح وافية لجميع محاور البكالوريا.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/categories" className="btn btn-primary">
                الفئات
              </Link>
              <Link href="/courses" className="btn btn-secondary">
                جميع الدروس
              </Link>
            </div>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>{categories.length}+</span>
              <span className={styles.statLabel}>فئة</span>
            </div>
            <div className={styles.statDiv}></div>
            <div className={styles.stat}>
              <span className={styles.statNum}>{courses.length}+</span>
              <span className={styles.statLabel}>درس</span>
            </div>
            <div className={styles.statDiv}></div>
            <div className={styles.stat}>
              <span className={styles.statNum}>100%</span>
              <span className={styles.statLabel}>مجاني</span>
            </div>
          </div>
        </div>
        <div className={styles.heroWave}>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L48 74.7C96 69 192 59 288 53.3C384 48 480 48 576 53.3C672 59 768 69 864 74.7C960 80 1056 80 1152 74.7C1248 69 1344 59 1392 53.3L1440 48V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0Z" fill="#faf8f3" />
          </svg>
        </div>
      </section>


      {/* Categories */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionTag}>الفئات</span>
              <h2 className={styles.sectionTitle}>استكشف الفئات الأدبية</h2>
            </div>
            <Link href="/categories" className="btn btn-ghost btn-sm">عرض الكل</Link>
          </div>
          {categories.length === 0 ? (
            <div className={styles.empty}>
              <span>📚</span>
              <p>لا توجد الفئات بعد</p>
            </div>
          ) : (
            <div className={styles.categoriesGrid}>
              {categories.map(cat => <CategoryCard key={cat.id} category={cat} />)}
            </div>
          )}
        </div>
      </section>

      {/* Latest Courses */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionTag}>أحدث الدروس</span>
              <h2 className={styles.sectionTitle}>ابدأ رحلتك التعليمية</h2>
            </div>
            <Link href="/courses" className="btn btn-ghost btn-sm">عرض الكل</Link>
          </div>
          {courses.length === 0 ? (
            <div className={styles.empty}>
              <span>📝</span>
              <p>لا توجد دروس بعد</p>
            </div>
          ) : (
            <div className={styles.coursesGrid}>
              {courses.map(course => <CourseCard key={course.id} course={course} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
