import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useArticle } from '../context/ArticleContext';
import { API_BASE_URL } from '../config';

const ArticleDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { updateArticleStats } = useArticle();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [coverMediaType, setCoverMediaType] = useState('image');
  const viewIncrementedRef = useRef(new Set());
  const membershipRef = useRef(null);

  const handleContentLinkClick = async (link) => {
    if (article.isPaid && (!user || !user.isPremium)) {
      setTimeout(() => {
        membershipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank');
    } else if (link.startsWith('GetArticle/')) {
      try {
        const res = await fetch(`${API_BASE_URL}/articles/${link}`);
        const data = await res.json();
        if (data.contentLink) {
          window.open(data.contentLink, '_blank');
        }
      } catch (error) {
        alert('获取文章链接失败');
      }
    }
  };

  const fetchArticle = useCallback(async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/articles/${id}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const data = await res.json();
    
    setArticle(data);
    if (data.coverImage) {
      const isVideo = /\.(mp4|webm)(\?.*)?$/i.test(data.coverImage);
      setCoverMediaType(isVideo ? 'video' : 'image');
    }
    if (data.isPaid && (!user || !user.isPremium)) {
      setShowPaywall(true);
    }
  }, [id, user]);

  const incrementViewCount = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/articles/${id}/view`, {
        method: 'POST'
      });
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_BASE_URL}/stats/view`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
    }
  }, [id]);

  const checkFavorite = useCallback(async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/articles/${id}/favorite/check`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setIsFavorited(data.isFavorited);
  }, [id]);

  useEffect(() => {
    fetchArticle();
    if (user) checkFavorite();
    if (!viewIncrementedRef.current.has(id)) {
      incrementViewCount();
      viewIncrementedRef.current.add(id);
    }
  }, [id, user, fetchArticle, checkFavorite, incrementViewCount]);

  const handleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const token = localStorage.getItem('token');
    const method = isFavorited ? 'DELETE' : 'POST';
    await fetch(`${API_BASE_URL}/articles/${id}/favorite`, {
      method,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setIsFavorited(!isFavorited);
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!article) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/articles/${id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      await fetch(`${API_BASE_URL}/stats/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setArticle(prev => prev ? { ...prev, likes: data.likes } : null);
      updateArticleStats(id, { likes: data.likes });
    } catch (error) {
    }
  };

  if (!article) return <div style={styles.loading}>加载中...</div>;

  const displayContent = showPaywall 
    ? article.content.substring(0, Math.floor(article.content.length / 8))
    : article.content;

  return (
    <div style={styles.container}>
      <article style={styles.article}>
        {coverMediaType === 'video' ? (
          <video src={article.coverImage} autoPlay loop muted playsInline style={styles.coverImage} />
        ) : (
          <img src={article.coverImage} alt={article.title} style={styles.coverImage} />
        )}
        <h1 style={styles.title}>{article.title}</h1>
        <div style={styles.meta}>
          <span>作者：{article.author}</span>
          <span>{new Date(article.createdAt).toLocaleDateString('zh-CN')}</span>
        </div>
        <div style={styles.tags}>
          {article.tags?.map(tag => (
            <span key={tag} style={styles.tag}>{tag}</span>
          ))}
        </div>
        {article.contentLink ? (
          <div style={styles.linkContainer}>
            <button 
              onClick={() => handleContentLinkClick(article.contentLink)} 
              style={{
                ...styles.readBtn,
                ...(article.isPaid && (!user || !user.isPremium) ? styles.readBtnDisabled : {})
              }}
            >
              阅读全文 →
            </button>
          </div>
        ) : (
          <div style={styles.content}>
            {displayContent}
          </div>
        )}
        
        {(showPaywall || (article.contentLink && article.isPaid && (!user || !user.isPremium))) && (
          <div style={article.contentLink ? styles.paywallForLink : styles.paywall}>
            {!article.contentLink && <div style={styles.paywallOverlay}></div>}
            <div ref={membershipRef} style={styles.paywallContent}>
              <h3>解锁全文</h3>
              <p>开通会员即可阅读完整内容</p>
              <button onClick={() => user ? navigate('/membership') : navigate('/login')} style={styles.paywallBtn}>
                开通会员 ¥39.99/月
              </button>
            </div>
          </div>
        )}

        <div style={styles.actions}>
          <button onClick={handleLike} style={styles.likeBtn}>
            ❤️ 点赞 {article.likes || 0}
          </button>
          <button onClick={handleFavorite} style={{...styles.favoriteBtn, background: isFavorited ? '#fef3c7' : '#f3f4f6'}}>
            {isFavorited ? '⭐ 已收藏' : '☆ 收藏'}
          </button>
          <div style={styles.viewCount}>
            👁️ 浏览 {article.views || 0}
          </div>
        </div>
      </article>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '2rem auto',
    padding: '0 1rem',
  },
  loading: {
    textAlign: 'center',
    padding: '4rem',
  },
  article: {
    background: '#fff',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 'auto',
    maxHeight: '600px',
    display: 'block',
    borderRadius: '8px',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1rem',
    color: '#111827',
  },
  meta: {
    display: 'flex',
    gap: '2rem',
    color: '#6b7280',
    marginBottom: '1rem',
  },
  tags: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
  },
  tag: {
    background: '#e0e7ff',
    color: '#4f46e5',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.875rem',
  },
  content: {
    lineHeight: '1.8',
    fontSize: '1.1rem',
    color: '#374151',
    whiteSpace: 'pre-wrap',
  },
  paywall: {
    position: 'relative',
    marginTop: '-100px',
  },
  paywallForLink: {
    position: 'relative',
    marginTop: '2rem',
  },
  paywallOverlay: {
    height: '200px',
    background: 'linear-gradient(to bottom, transparent, white)',
  },
  paywallContent: {
    textAlign: 'center',
    padding: '2rem',
    background: '#f9fafb',
    borderRadius: '12px',
    marginTop: '1rem',
  },
  paywallBtn: {
    marginTop: '1rem',
    padding: '1rem 2rem',
    background: '#fbbf24',
    color: '#000',
    borderRadius: '24px',
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  actions: {
    marginTop: '2rem',
    display: 'flex',
    gap: '1rem',
  },
  likeBtn: {
    padding: '0.75rem 1.5rem',
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: '24px',
    fontSize: '1rem',
  },
  favoriteBtn: {
    padding: '0.75rem 1.5rem',
    color: '#92400e',
    borderRadius: '24px',
    fontSize: '1rem',
  },
  viewCount: {
    padding: '0.75rem 1.5rem',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '24px',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  linkContainer: {
    textAlign: 'center',
    padding: '3rem 0',
  },
  readBtn: {
    padding: '1rem 3rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    borderRadius: '24px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  readBtnDisabled: {
    background: '#9ca3af',
    cursor: 'pointer',
  },
};

export default ArticleDetail;
