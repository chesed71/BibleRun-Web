import { NavLink } from 'react-router-dom';
import styles from './Header.module.css';

export function Header() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;

  return (
    <header className={styles.header}>
      <NavLink to="/" className={styles.logo}>BibleRun</NavLink>
      <nav className={styles.nav}>
        <NavLink to="/" className={linkClass} end>HOME</NavLink>
        <NavLink to="/about" className={linkClass}>ABOUT</NavLink>
      </nav>
    </header>
  );
}
