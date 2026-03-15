import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?search=${searchTerm}`);
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoText}>极志社区</span>
          <span style={styles.logoSubtext}>ZhiX Club</span>
        </Link>
        
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="text"
            placeholder="搜索文章、标签、作者..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </form>

        <nav style={styles.nav}>
          {user ? (
            <>
              <Link to="/avatar" style={styles.userInfoLink}>
                <div style={styles.userInfo}>
                  {user.avatar && <img src={user.avatar} alt="avatar" style={styles.avatar} />}
                  <span style={styles.username}>{user.nickname || '极客的志向'}</span>
                </div>
              </Link>
              <Link to="/level" style={styles.navLink}>🏆 等级</Link>
              <Link to="/favorites" style={styles.navLink}>⭐ 收藏夹</Link>
              {user.role === 'admin' && (
                <>
                  <Link to="/manage" style={styles.navLink}>文章管理</Link>
                  <Link to="/editor" style={styles.navLink}>写文章</Link>
                </>
              )}
              {!user.isPremium && (
                <Link to="/membership" style={styles.premiumBtn}>开通会员</Link>
              )}
              <button onClick={logout} style={styles.logoutBtn}>退出</button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.navLink}>登录</Link>
              <Link to="/register" style={styles.registerBtn}>注册</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

const styles = {
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    padding: '1rem 0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    fontWeight: 'bold',
  },
  logoText: {
    fontSize: '1.5rem',
  },
  logoSubtext: {
    fontSize: '0.75rem',
    opacity: 0.9,
  },
  searchForm: {
    flex: 1,
    minWidth: '200px',
  },
  searchInput: {
    width: '100%',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    border: 'none',
    fontSize: '0.9rem',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userInfoLink: {
    color: '#fff',
    textDecoration: 'none',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: '2px solid #fff',
    objectFit: 'cover',
  },
  username: {
    fontSize: '0.9rem',
  },
  navLink: {
    color: '#fff',
    fontSize: '0.9rem',
  },
  premiumBtn: {
    background: '#fbbf24',
    color: '#000',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
  },
  registerBtn: {
    background: '#fff',
    color: '#667eea',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
  },
};

export default Header;
