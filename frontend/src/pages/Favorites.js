import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [activeAudioId, setActiveAudioId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [user, navigate]);

  const fetchFavorites = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/favorites`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setArticles(data || []);
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
      <div ref={containerRef} style={{overflowAnchor: 'none'}}>
        <video ref={videoRef} src={src} autoPlay loop muted playsInline style={styles.video} />
        <audio ref={audioRef} src={audioSrc} loop style={{position: 'absolute', left: '-9999px'}} tabIndex="-1" />
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>我的收藏</h1>
      {articles.length === 0 ? (
        <p style={styles.empty}>暂无收藏文章</p>
      ) : (
        <div style={styles.grid}>
          {articles.map(article => {
            const isVideo = article.coverImage && /\.(mp4|webm)(\?.*)?$/i.test(article.coverImage);
            return (
              <div key={article.id} style={styles.card} onClick={() => navigate(`/article/${article.id}`)}>
                {isVideo ? (
                  <VideoWithAudio src={article.coverImage} id={article.id} />
                ) : (
                  <img src={article.coverImage} alt={article.title} style={styles.image} />
                )}
                <div style={styles.content}>
                  <h3 style={styles.articleTitle}>{article.title}</h3>
                  <p style={styles.excerpt}>{article.excerpt}</p>
                  <div style={styles.meta}>
                    <span>{article.author}</span>
                    <span>❤️ {article.likes}</span>
                  </div>
                </div>
              </div>
            );
          })}
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
  title: {
    fontSize: '2rem',
    marginBottom: '2rem',
  },
  empty: {
    textAlign: 'center',
    color: '#6b7280',
    padding: '4rem',
  },
  grid: {
    columnCount: 3,
    columnGap: '2rem',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
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
    padding: '1rem',
  },
  articleTitle: {
    fontSize: '1.25rem',
    marginBottom: '0.5rem',
  },
  excerpt: {
    color: '#6b7280',
    marginBottom: '1rem',
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: '#9ca3af',
  },
};

export default Favorites;
