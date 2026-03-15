import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useArticle } from '../context/ArticleContext';
import { API_BASE_URL } from '../config';
import './Home.css';

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [activeAudioId, setActiveAudioId] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const { getArticleStats, updateArticleStats } = useArticle();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('search');
  const [favoritedArticles, setFavoritedArticles] = useState(new Set());

  const viewIncrementedRef = useRef(new Set());

  const handleArticleClick = async (e, article) => {
    if (article.contentLink) {
      e.preventDefault();
      if (article.isPaid && (!user || !user.isPremium)) {
        window.location.href = `/article/${article.id}`;
        return;
      }
      if (!viewIncrementedRef.current.has(article.id)) {
        await incrementView(article.id);
        viewIncrementedRef.current.add(article.id);
      }
      if (article.contentLink.startsWith('http://') || article.contentLink.startsWith('https://')) {
        window.open(article.contentLink, '_blank');
      } else if (article.contentLink.startsWith('GetArticle/')) {
        try {
          const res = await fetch(`${API_BASE_URL}/articles/${article.contentLink}`);
          const data = await res.json();
          if (data.contentLink) {
            window.open(data.contentLink, '_blank');
          }
        } catch (error) {
          alert('获取文章链接失败');
        }
      }
    }
  };

  const incrementView = async (articleId) => {
    try {
      await fetch(`${API_BASE_URL}/articles/${articleId}/view`, { method: 'POST' });
      if (user) {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/stats/view`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
    }
  };

  const handleLike = async (e, articleId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('请先登录');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/articles/${articleId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      updateArticleStats(articleId, { likes: data.likes });
    } catch (error) {
    }
  };

  const handleFavorite = async (e, articleId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('请先登录');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const isFavorited = favoritedArticles.has(articleId);
      await fetch(`${API_BASE_URL}/articles/${articleId}/favorite`, {
        method: isFavorited ? 'DELETE' : 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFavoritedArticles(prev => {
        const newSet = new Set(prev);
        isFavorited ? newSet.delete(articleId) : newSet.add(articleId);
        return newSet;
      });
    } catch (error) {
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchArticles();
      if (user) fetchFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, user, authLoading]);

  const fetchArticles = async () => {
    try {
      let url;
      if (searchTerm) {
        url = `${API_BASE_URL}/articles?search=${searchTerm}`;
      } else if (!user) {
        url = `${API_BASE_URL}/articles/homepage`;
      } else {
        url = `${API_BASE_URL}/articles`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      setArticles(data);
      setActiveAudioId(null);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setFavoritedArticles(new Set(data.map(f => f.id)));
    } catch (error) {
    }
  };

  const handleLoadMore = () => {
    if (!user) {
      setShowRegisterModal(true);
    }
  };

  if (authLoading || loading) return <div style={styles.loading}>加载中...</div>;

  const VideoWithAudio = ({ src, id }) => {
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const containerRef = useRef(null);
    const audioSrc = src.replace(/\.(mp4|webm)(\?.*)?$/i, '.mp3$2');

    useEffect(() => {
      const audio = audioRef.current;
      const container = containerRef.current;
      
      if (!audio || !container) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveAudioId(prev => prev === null ? id : prev);
          } else {
            setActiveAudioId(prev => prev === id ? null : prev);
          }
        },
        { threshold: 0.5 }
      );

      observer.observe(container);
      return () => observer.disconnect();
    }, [id]);

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      
      if (activeAudioId === id) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    }, [activeAudioId, id]);

    return (
      <div ref={containerRef} style={{overflowAnchor: 'none'}}>
        <video ref={videoRef} src={src} autoPlay loop muted playsInline style={styles.video} />
        <audio ref={audioRef} src={audioSrc} loop style={{position: 'absolute', left: '-9999px'}} tabIndex="-1" />
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div className="article-grid">
        {articles.map(article => {
          const isVideo = article.coverImage && /\.(mp4|webm)(\?.*)?$/i.test(article.coverImage);
          return article.contentLink ? (
            <div onClick={(e) => handleArticleClick(e, article)} key={article.id} style={{...styles.card, cursor: 'pointer'}}>
              {isVideo ? (
                <VideoWithAudio src={article.coverImage} id={article.id} />
              ) : (
                <img src={article.coverImage || '/placeholder.jpg'} alt={article.title} style={styles.image} />
              )}
              <div style={styles.content}>
                <h2 style={styles.title}>{article.title}</h2>
                <div style={styles.meta}>
                  <span>{article.author}</span>
                  <span>{new Date(article.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
                <p style={styles.excerpt}>{article.excerpt}</p>
                <div style={styles.tags}>
                  {article.tags?.map(tag => (
                    <span key={tag} style={styles.tag}>{tag}</span>
                  ))}
                </div>
                <div style={styles.stats}>
                  <button onClick={(e) => handleLike(e, article.id)} style={styles.actionBtn}>❤️ {(getArticleStats(article.id).likes ?? article.likes) || 0}</button>
                  <button onClick={(e) => handleFavorite(e, article.id)} style={{...styles.actionBtn, color: favoritedArticles.has(article.id) ? '#f59e0b' : '#6b7280'}}>{favoritedArticles.has(article.id) ? '⭐ 已收藏' : '☆ 收藏'}</button>
                  <span style={styles.stat}>👁️ {(getArticleStats(article.id).views ?? article.views) || 0}</span>
                </div>
                {article.isPaid && (
                  <span style={styles.paidBadge}>付费</span>
                )}
                <span style={styles.linkBadge}>🔗 外链</span>
              </div>
            </div>
          ) : (
            <Link to={`/article/${article.id}`} key={article.id} style={styles.card}>
            {isVideo ? (
              <VideoWithAudio src={article.coverImage} id={article.id} />
            ) : (
              <img src={article.coverImage || '/placeholder.jpg'} alt={article.title} style={styles.image} />
            )}
            <div style={styles.content}>
              <h2 style={styles.title}>{article.title}</h2>
              <div style={styles.meta}>
                <span>{article.author}</span>
                <span>{new Date(article.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
              <p style={styles.excerpt}>{article.excerpt}</p>
              <div style={styles.tags}>
                {article.tags?.map(tag => (
                  <span key={tag} style={styles.tag}>{tag}</span>
                ))}
              </div>
              <div style={styles.stats}>
                <span style={styles.stat}>❤️ {(getArticleStats(article.id).likes ?? article.likes) || 0}</span>
                <span style={styles.stat}>👁️ {(getArticleStats(article.id).views ?? article.views) || 0}</span>
              </div>
              {article.isPaid && (
                <span style={styles.paidBadge}>付费</span>
              )}
            </div>
          </Link>
          );
        })}
      </div>

      {!user && articles.length >= 3 && (
        <button onClick={handleLoadMore} style={styles.loadMoreBtn}>
          查看更多文章
        </button>
      )}

      {showRegisterModal && (
        <div style={styles.modal} onClick={() => setShowRegisterModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>注册后查看更多</h2>
            <p>注册登录后即可浏览全部文章内容</p>
            <Link to="/register" style={styles.modalBtn}>立即注册</Link>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '2rem auto',
    padding: '0 1rem',
  },
  loading: {
    textAlign: 'center',
    padding: '4rem',
    fontSize: '1.2rem',
  },

  card: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
    position: 'relative',
    breakInside: 'avoid',
    marginBottom: '2rem',
    display: 'inline-block',
    width: '100%',
  },
  image: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  video: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  content: {
    padding: '1.5rem',
    display: 'block',
  },
  title: {
    fontSize: '1.25rem',
    marginBottom: '0.5rem',
    color: '#111827',
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '1rem',
  },
  excerpt: {
    color: '#4b5563',
    lineHeight: '1.6',
    marginBottom: '1rem',
  },
  tags: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  tag: {
    background: '#e0e7ff',
    color: '#4f46e5',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
  },
  stats: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.5rem',
  },
  stat: {
    fontSize: '0.875rem',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  actionBtn: {
    fontSize: '0.875rem',
    color: '#6b7280',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    transition: 'background 0.2s',
  },
  paidBadge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: '#fbbf24',
    color: '#000',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  linkBadge: {
    position: 'absolute',
    bottom: '1rem',
    right: '1rem',
    background: '#dbeafe',
    color: '#1e40af',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  loadMoreBtn: {
    display: 'block',
    margin: '2rem auto',
    padding: '1rem 2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    borderRadius: '24px',
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: '#fff',
    padding: '2rem',
    borderRadius: '12px',
    textAlign: 'center',
    maxWidth: '400px',
  },
  modalBtn: {
    display: 'inline-block',
    marginTop: '1rem',
    padding: '0.75rem 2rem',
    background: '#667eea',
    color: '#fff',
    borderRadius: '24px',
    fontWeight: 'bold',
  },
};

export default Home;
