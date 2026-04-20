import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.pattern}></div>
      <div className="container">
        <div className={styles.preparationFooter}>
          <p>إعداد الدكتورة سارة جابري</p>
          <p>أستاذة مادة اللغة العربية وآدابها بثانوية أبي عبيدة بن الجراح تبسة</p>
        </div>
        <div className={styles.bottom}>
          <p className={styles.ornament}>﴿ وَمَا أُوتِيتُم مِّن الْعِلْمِ إِلَّا قَلِيلًا ﴾</p>
          <p className={styles.copy}> © {new Date().getFullYear()} منصة السند في النصوص والنقد — جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}