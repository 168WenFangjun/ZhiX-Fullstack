import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const ManageArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAudioId, setActiveAudioId] = useState(null);

  useEffect(() => {
    fetchMyArticles();
  }, []);

  const fetchMyArticles = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/articles?manage=true`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setArticles(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除这篇文章吗？')) return;
    
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      setArticles(articles.filter(a => a.id !== id));
    } else {
      const error = await res.json();
      alert(error.error || '删除失败');
    }
  };

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
      <div ref={containerRef} style={styles.mediaContainer}>
        <video ref={videoRef} src={src} autoPlay loop muted playsInline style={{width: '100%', height: 'auto', maxHeight: '200px', objectFit: 'contain'}} />
        <audio ref={audioRef} src={audioSrc} loop />
      </div>
    );
  };

  if (loading) return <div style={styles.loading}>加载中...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>我的文章</h1>
        <Link to="/editor" style={styles.createBtn}>创建新文章</Link>
      </div>

      {articles.length === 0 ? (
        <div style={styles.empty}>暂无文章</div>
      ) : (
        <div style={styles.list}>
          {articles.map(article => {
            const isVideo = article.coverImage && /\.(mp4|webm)(\?.*)?$/i.test(article.coverImage);
            const isDynamic = article.coverImage && /\.(gif|webp)(\?.*)?$/i.test(article.coverImage);
            return (
            <div key={article.id} style={styles.item}>
              {isVideo ? (
                <VideoWithAudio src={article.coverImage} id={article.id} />
              ) : (
                <img src={article.coverImage || '/placeholder.jpg'} alt={article.title} style={isDynamic ? styles.gifImage : styles.image} />
              )}
              <div style={styles.content}>
                <h3 style={styles.articleTitle}>{article.title}</h3>
                <p style={styles.excerpt}>{article.excerpt}</p>
                <div style={styles.meta}>
                  <span>{new Date(article.createdAt).toLocaleDateString('zh-CN')}</span>
                  <span>❤️ {article.likes} 👁️ {article.views}</span>
                </div>
              </div>
              <div style={styles.actions}>
                <Link to={`/editor/${article.id}`} style={styles.editBtn}>编辑</Link>
                <button onClick={() => handleDelete(article.id)} style={styles.deleteBtn}>删除</button>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '2rem auto',
    padding: '0 1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    color: '#111827',
  },
  createBtn: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    borderRadius: '8px',
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    padding: '4rem',
    fontSize: '1.2rem',
  },
  empty: {
    textAlign: 'center',
    padding: '4rem',
    color: '#6b7280',
    fontSize: '1.1rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1.5rem',
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  image: {
    width: '150px',
    height: '100px',
    minWidth: '150px',
    minHeight: '100px',
    objectFit: 'cover',
    borderRadius: '8px',
    flexShrink: 0,
    overflow: 'hidden',
  },
  mediaContainer: {
    width: '150px',
    maxWidth: '150px',
    borderRadius: '8px',
    flexShrink: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
  },
  gifImage: {
    width: '150px',
    height: 'auto',
    maxHeight: '200px',
    objectFit: 'contain',
    borderRadius: '8px',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  articleTitle: {
    fontSize: '1.25rem',
    marginBottom: '0.5rem',
    color: '#111827',
  },
  excerpt: {
    color: '#6b7280',
    marginBottom: '0.5rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  meta: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.875rem',
    color: '#9ca3af',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    justifyContent: 'center',
  },
  editBtn: {
    padding: '0.5rem 1rem',
    background: '#3b82f6',
    color: '#fff',
    borderRadius: '6px',
    textAlign: 'center',
    fontSize: '0.875rem',
  },
  deleteBtn: {
    padding: '0.5rem 1rem',
    background: '#ef4444',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '0.875rem',
  },
};

export default ManageArticles;
