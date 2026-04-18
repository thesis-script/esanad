'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import styles from './page.module.css';

const QuillEditor = dynamic(() => import('@/components/admin/QuillEditor'), {
  ssr: false,
  loading: () => (
    <div className={styles.editorLoading}>جارٍ تحميل المحرر...</div>
  ),
});

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];
const LEVELS = ['بكالوريا', 'متقدم', 'متوسط', 'مبتدئ'];

function stripHtml(html) {
  return html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
}

function ModalShell({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: wide ? 720 : 560 }}>
        <div className="modal-header">
          <h3 style={{ fontFamily: 'Cairo,sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
            {title}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminCourseDetail({ course: initialCourse, categories }) {
  const router = useRouter();
  const [course, setCourse] = useState(initialCourse);
  const [sections, setSections] = useState(initialCourse.sections || []);

  // Toast
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  }

  // ── Course edit modal ──────────────────────────────────────────────────────
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: course.title,
    description: course.description || '',
    category_id: course.category_id,
    cover_color: course.cover_color || '#3b82f6',
    level: course.level || 'بكالوريا',
    is_published: course.is_published !== false,
    pdf_url: course.pdf_url || '',
  });
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState('');
  const [pdfUploading, setPdfUploading] = useState(false);

  async function uploadPdf(file) {
    if (!file) return;
    setPdfUploading(true);
    const fd = new FormData();
    fd.append('pdf', file);
    const res = await fetch('/api/courses/upload-pdf', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.url) setCourseForm(p => ({ ...p, pdf_url: data.url }));
    setPdfUploading(false);
  }

  async function saveCourse(e) {
    e.preventDefault();
    setCourseLoading(true); setCourseError('');
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseForm),
      });
      const data = await res.json();
      if (!res.ok) { setCourseError(data.error); return; }
      const cat = categories.find(c => c.id == courseForm.category_id);
      setCourse(prev => ({ ...prev, ...data.course, category_name: cat?.name, category_color: cat?.color }));
      setShowEditCourse(false);
      showToast('تم تحديث الدرس ✓');
    } catch { setCourseError('خطأ في الاتصال'); }
    finally { setCourseLoading(false); }
  }

  // ── Section form ───────────────────────────────────────────────────────────
  const [sectionForm, setSectionForm] = useState({ title: '', content: '' });
  const [editingSection, setEditingSection] = useState(null);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionError, setSectionError] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [deletingSection, setDeletingSection] = useState(null);

  function openAddSection() {
    setEditingSection(null);
    setSectionForm({ title: '', content: '' });
    setEditorKey(k => k + 1);
    setSectionError('');
    setShowSectionForm(true);
    setTimeout(() => document.getElementById('section-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  function openEditSection(s) {
    setEditingSection(s);
    setSectionForm({ title: s.title, content: s.content });
    setEditorKey(k => k + 1);
    setSectionError('');
    setShowSectionForm(true);
    setTimeout(() => document.getElementById('section-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  function cancelSectionForm() {
    setShowSectionForm(false);
    setEditingSection(null);
    setSectionForm({ title: '', content: '' });
    setSectionError('');
  }

  async function saveSection(e) {
    e.preventDefault();
    const text = stripHtml(sectionForm.content).trim();
    if (!text) { setSectionError('المحتوى مطلوب'); return; }
    setSectionLoading(true); setSectionError('');
    try {
      if (editingSection) {
        const res = await fetch(`/api/sections/${editingSection.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...sectionForm, order_index: editingSection.order_index }),
        });
        const data = await res.json();
        if (!res.ok) { setSectionError(data.error); return; }
        setSections(p => p.map(s => s.id === editingSection.id ? data.section : s));
        showToast('تم تحديث العنوان ✓');
      } else {
        const res = await fetch('/api/sections', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...sectionForm, course_id: course.id }),
        });
        const data = await res.json();
        if (!res.ok) { setSectionError(data.error); return; }
        setSections(p => [...p, data.section]);
        showToast('تم إضافة العنوان ✓');
      }
      cancelSectionForm();
    } catch { setSectionError('خطأ في الاتصال'); }
    finally { setSectionLoading(false); }
  }

  async function deleteSection(s) {
    setDeletingSection(s);
  }

  async function confirmDelete() {
    if (!deletingSection) return;
    try {
      await fetch(`/api/sections/${deletingSection.id}`, { method: 'DELETE' });
      setSections(p => p.filter(s => s.id !== deletingSection.id));
      setDeletingSection(null);
      showToast('تم حذف العنوان ✓');
    } catch { showToast('خطأ في الحذف', 'error'); }
  }

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast.msg && (
        <div className={`alert ${toast.type === 'error' ? 'alert-error' : 'alert-success'} ${styles.toast}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <Link href="/admin/courses" className="btn btn-ghost btn-sm">
          ← العودة للدروس
        </Link>
        <div className={styles.topActions}>
          <Link href={`/courses/${course.id}`} target="_blank" className="btn btn-ghost btn-sm">
            🌐 عرض في الموقع
          </Link>
          <button className="btn btn-primary btn-sm" onClick={() => setShowEditCourse(true)}>
            ✏️ تعديل الدرس
          </button>
        </div>
      </div>

      {/* ── Course Header Card ── */}
      <div className={styles.courseCard}>
        <div className={styles.courseCardLeft}>
          <div
            className={styles.courseCover}
            style={{ background: `linear-gradient(135deg, ${course.cover_color}dd, ${course.cover_color}66)` }}
          >
            📖
          </div>
          <div>
            <div className={styles.courseMeta}>
              {course.category_name && (
                <span className={styles.catBadge} style={{ color: course.category_color, background: `${course.category_color}18` }}>
                  {course.category_name}
                </span>
              )}
              <span className={styles.levelBadge}>{course.level}</span>
              <span className={`${styles.pubBadge} ${course.is_published ? styles.published : styles.draft}`}>
                {course.is_published ? '✓ منشور' : '○ مسودة'}
              </span>
            </div>
            <h1 className={styles.courseTitle}>{course.title}</h1>
            {course.description && <p className={styles.courseDesc}>{course.description}</p>}
            <div className={styles.courseStats}>
              <span>📝 {sections.length} عنوان</span>
            </div>

            {/* ── PDF link ── */}
            {course.pdf_url && (
              <div style={{ marginTop: 12 }}>
                <a
                  href={course.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: `${course.cover_color}18`, color: course.cover_color,
                    border: `1.5px solid ${course.cover_color}55`,
                    borderRadius: 8, padding: '6px 14px',
                    fontFamily: 'Cairo,sans-serif', fontWeight: 700,
                    textDecoration: 'none', fontSize: '0.9rem',
                  }}
                >
                  📄 عرض ملف PDF
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sections Panel ── */}
      <div className={styles.sectionsPanel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>العناوين والمحتوى</h2>
            <p className={styles.panelSub}>{sections.length} عنوان مضاف</p>
          </div>
          {!showSectionForm && (
            <button className="btn btn-primary" onClick={openAddSection}>
              + إضافة عنوان جديد
            </button>
          )}
        </div>

        {/* Section form */}
        {showSectionForm && (
          <div className={styles.sectionFormCard} id="section-form">
            <h3 className={styles.formHeading}>
              {editingSection ? `✏️ تعديل: ${editingSection.title}` : '➕ عنوان جديد'}
            </h3>
            {sectionError && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>{sectionError}</div>
            )}
            <form onSubmit={saveSection}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">العنوان *</label>
                <input
                  className="form-input"
                  value={sectionForm.title}
                  onChange={e => setSectionForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="مثل: تعريف الشعر الجاهلي، خصائص الأسلوب، أبرز الشعراء..."
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">المحتوى والشرح *</label>
                <div className={styles.editorContainer}>
                  <QuillEditor
                    key={editorKey}
                    value={sectionForm.content}
                    onChange={v => setSectionForm(p => ({ ...p, content: v }))}
                    placeholder="اكتب شرحاً مفصّلاً هنا... يمكنك تنسيق النص وإضافة قوائم واقتباسات"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary" disabled={sectionLoading}>
                  {sectionLoading ? 'جارٍ الحفظ...' : (editingSection ? 'حفظ التعديلات' : 'إضافة العنوان')}
                </button>
                <button type="button" className="btn btn-ghost" onClick={cancelSectionForm}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sections list */}
        {sections.length === 0 ? (
          <div className={styles.emptySections}>
            <span>📄</span>
            <h3>لا توجد عناوين بعد</h3>
            <p>أضف أول عنوان لبدء بناء محتوى هذا الدرس</p>
            {!showSectionForm && (
              <button className="btn btn-primary" onClick={openAddSection}>
                + إضافة أول عنوان
              </button>
            )}
          </div>
        ) : (
          <div className={styles.sectionsList}>
            {sections.map((s, idx) => (
              <div
                key={s.id}
                className={`${styles.sectionCard} ${editingSection?.id === s.id ? styles.sectionEditing : ''}`}
              >
                <div className={styles.sectionCardHeader}>
                  <div className={styles.sectionCardLeft}>
                    <span
                      className={styles.sectionNum}
                      style={{ background: `${course.cover_color}18`, color: course.cover_color }}
                    >
                      {idx + 1}
                    </span>
                    <h3 className={styles.sectionName}>{s.title}</h3>
                  </div>
                  <div className={styles.sectionCardActions}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditSection(s)}>
                      ✏️ تعديل
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteSection(s)}>
                      حذف
                    </button>
                  </div>
                </div>
                <div className={styles.sectionPreview}>
                  {stripHtml(s.content).substring(0, 200)}
                  {stripHtml(s.content).length > 200 ? '...' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Course Modal ── */}
      {showEditCourse && (
        <ModalShell title="تعديل بيانات الدرس" onClose={() => setShowEditCourse(false)}>
          <form onSubmit={saveCourse}>
            <div className="modal-body">
              {courseError && <div className="alert alert-error">{courseError}</div>}
              <div className="form-group">
                <label className="form-label">عنوان الدرس *</label>
                <input className="form-input" value={courseForm.title}
                  onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">الوصف</label>
                <textarea className="form-textarea" value={courseForm.description} rows={3}
                  onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">التصنيف *</label>
                  <select className="form-select" value={courseForm.category_id}
                    onChange={e => setCourseForm(p => ({ ...p, category_id: e.target.value }))} required>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">المستوى</label>
                  <select className="form-select" value={courseForm.level}
                    onChange={e => setCourseForm(p => ({ ...p, level: e.target.value }))}>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">لون الغلاف</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  {COLORS.map(c => (
                    <button key={c} type="button"
                      style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: courseForm.cover_color === c ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', transform: courseForm.cover_color === c ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.15s' }}
                      onClick={() => setCourseForm(p => ({ ...p, cover_color: c }))} />
                  ))}
                  <div style={{ width: 56, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${courseForm.cover_color},${courseForm.cover_color}66)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📖</div>
                </div>
              </div>

              {/* ── PDF Upload ── */}
              <div className="form-group">
                <label className="form-label">ملف PDF (اختياري)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="form-input"
                  style={{ cursor: 'pointer' }}
                  onChange={async e => {
                    const file = e.target.files[0];
                    if (file) await uploadPdf(file);
                  }}
                />
                {pdfUploading && (
                  <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.85rem' }}>جارٍ رفع الملف...</p>
                )}
                {courseForm.pdf_url && !pdfUploading && (
                  <p style={{ marginTop: 6, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <a href={courseForm.pdf_url} target="_blank" rel="noreferrer" style={{ color: 'green' }}>
                      ✅ معاينة الملف الحالي
                    </a>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '0.85rem' }}
                      onClick={() => setCourseForm(p => ({ ...p, pdf_url: '' }))}
                    >
                      ✕ حذف الملف
                    </button>
                  </p>
                )}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={courseForm.is_published}
                  onChange={e => setCourseForm(p => ({ ...p, is_published: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                <span className="form-label" style={{ marginBottom: 0 }}>نشر الدرس (مرئي للزوار)</span>
              </label>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary" disabled={courseLoading || pdfUploading}>
                {courseLoading ? 'جارٍ الحفظ...' : pdfUploading ? 'جارٍ رفع الملف...' : 'حفظ التعديلات'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowEditCourse(false)}>إلغاء</button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* ── Confirm delete section ── */}
      {deletingSection && (
        <ModalShell title="تأكيد الحذف" onClose={() => setDeletingSection(null)}>
          <div className="modal-body">
            <p style={{ color: 'var(--text-secondary)' }}>
              هل تريد حذف عنوان <strong>«{deletingSection.title}»</strong>؟ لا يمكن التراجع.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-danger" onClick={confirmDelete}>نعم، احذف</button>
            <button className="btn btn-ghost" onClick={() => setDeletingSection(null)}>إلغاء</button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}