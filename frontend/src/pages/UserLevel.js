import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const useCountUp = (end, duration = 1500) => {
  const [count, setCount] = useState(0);
  const startTime = useRef(null);

  useEffect(() => {
    if (end === 0) return;
    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
};

const UserLevel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/stats/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) return <div style={styles.loading}>加载中...</div>;
  if (!stats) return <div style={styles.loading}>无法加载数据</div>;

  const isAdmin = stats.user.role === 'admin';
  const levelColors = ['#95a5a6', '#3498db', '#9b59b6', '#e67e22', '#e74c3c'];
  const levelColor = levelColors[stats.levelNum - 1] || '#95a5a6';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{...styles.levelBadge, background: levelColor}}>
          <div style={styles.levelNum}>Lv.{stats.levelNum}</div>
          <div style={styles.levelName}>{stats.level}</div>
        </div>

        <div style={styles.userInfo}>
          <h2>{stats.user.nickname}</h2>
          <p style={styles.email}>{stats.user.email}</p>
          <p style={styles.role}>{isAdmin ? '编辑' : '用户'}</p>
        </div>

        <div style={styles.statsGrid}>
          {isAdmin ? (
            <>
              <StatItem label="发表文章" value={stats.user.publishedCount} icon="📝" />
              <StatItem label="浏览文章" value={stats.user.adminViewCount} icon="👀" />
              <StatItem label="登录次数" value={stats.user.adminLoginCount} icon="🔑" />
              <StatItem label="被收藏" value={stats.user.totalFavorited} icon="⭐" />
              <StatItem label="被浏览" value={stats.user.totalViewed} icon="📊" />
              <StatItem label="被点赞" value={stats.user.totalLiked} icon="❤️" />
            </>
          ) : (
            <>
              <StatItem label="浏览文章" value={stats.user.articleViewCount} icon="👀" />
              <StatItem label="点赞次数" value={stats.user.articleLikeCount} icon="❤️" />
              <StatItem label="登录次数" value={stats.user.loginCount} icon="🔑" />
              <StatItem label="收藏文章" value={stats.user.favoriteCount} icon="⭐" />
            </>
          )}
        </div>

        <div style={styles.levelProgress}>
          <h3>等级说明</h3>
          {isAdmin ? (
            <div style={styles.levelList}>
              <LevelItem level={1} name="实习编辑" min={0} color={levelColors[0]} />
              <LevelItem level={2} name="编辑" min={50} color={levelColors[1]} />
              <LevelItem level={3} name="资深编辑" min={200} color={levelColors[2]} />
              <LevelItem level={4} name="高级编辑" min={500} color={levelColors[3]} />
              <LevelItem level={5} name="首席编辑" min={1000} color={levelColors[4]} />
            </div>
          ) : (
            <div style={styles.levelList}>
              <LevelItem level={1} name="新手用户" min={0} color={levelColors[0]} />
              <LevelItem level={2} name="普通用户" min={20} color={levelColors[1]} />
              <LevelItem level={3} name="活跃用户" min={80} color={levelColors[2]} />
              <LevelItem level={4} name="资深用户" min={200} color={levelColors[3]} />
              <LevelItem level={5} name="传奇用户" min={500} color={levelColors[4]} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, icon }) => {
  const animatedValue = useCountUp(value);
  return (
    <div style={styles.statItem}>
      <div style={styles.statIcon}>{icon}</div>
      <div style={styles.statValue}>{animatedValue}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
};

const LevelItem = ({ level, name, min, color }) => (
  <div style={styles.levelItem}>
    <div style={{...styles.levelDot, background: color}}></div>
    <span style={styles.levelText}>Lv.{level} {name}</span>
    <span style={styles.levelMin}>({min}分起)</span>
  </div>
);

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px 20px',
  },
  loading: {
    textAlign: 'center',
    padding: '100px 20px',
    fontSize: '18px',
    color: '#fff',
  },
  card: {
    maxWidth: '800px',
    margin: '0 auto',
    background: '#fff',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  levelBadge: {
    textAlign: 'center',
    padding: '30px',
    borderRadius: '15px',
    color: '#fff',
    marginBottom: '30px',
  },
  levelNum: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  levelName: {
    fontSize: '24px',
    fontWeight: '500',
  },
  userInfo: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  email: {
    color: '#7f8c8d',
    margin: '10px 0',
  },
  role: {
    display: 'inline-block',
    padding: '5px 15px',
    background: '#ecf0f1',
    borderRadius: '20px',
    fontSize: '14px',
    color: '#34495e',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  statItem: {
    textAlign: 'center',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '10px',
  },
  statIcon: {
    fontSize: '32px',
    marginBottom: '10px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
  levelProgress: {
    marginTop: '40px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '10px',
  },
  levelList: {
    marginTop: '20px',
  },
  levelItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #ecf0f1',
  },
  levelDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    marginRight: '15px',
  },
  levelText: {
    flex: 1,
    fontSize: '16px',
    fontWeight: '500',
  },
  levelMin: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
};

export default UserLevel;
