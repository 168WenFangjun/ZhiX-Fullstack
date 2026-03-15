import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    coverImage: '',
    content: '',
    contentLink: '',
    tags: '',
    isPaid: false,
    excerpt: ''
  });
  const [contentType, setContentType] = useState('content');
  const [coverMediaType, setCoverMediaType] = useState(null);

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/articles/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setFormData({
      ...data,
      tags: data.tags?.join(', ') || '',
      contentLink: data.contentLink || ''
    });
    setContentType(data.contentLink ? 'link' : 'content');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('请填写文章标题');
      return;
    }
    if (!formData.author.trim()) {
      alert('请填写作者');
      return;
    }
    if (!formData.coverImage.trim()) {
      alert('请填写封面图片URL');
      return;
    }
    if (!formData.coverImage.startsWith('http://') && !formData.coverImage.startsWith('https://')) {
      alert('封面URL必须以 http:// 或 https:// 开头');
      return;
    }
    const validExtensions = /\.(jpe?g|png|webp|gif|apng|mp4|webm)(\?.*)?$/i;
    if (!validExtensions.test(formData.coverImage)) {
      alert('封面仅支持：JPEG、PNG、WebP、GIF、APNG、MP4、WebM 格式');
      return;
    }
    if (!formData.tags.trim()) {
      alert('请填写标签');
      return;
    }
    if (contentType === 'content' && !formData.content.trim()) {
      alert('请填写文章内容');
      return;
    }
    if (contentType === 'link' && !formData.contentLink.trim()) {
      alert('请填写文章内容链接');
      return;
    }
    
    const token = localStorage.getItem('token');
    const payload = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    const url = id 
      ? `${API_BASE_URL}/articles/${id}`
      : `${API_BASE_URL}/articles`;
    
    const res = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      navigate('/');
    }
  };

  const handleContentLinkClick = async () => {
    if (!formData.contentLink.trim()) return;
    
    if (formData.contentLink.startsWith('http://') || formData.contentLink.startsWith('https://')) {
      window.open(formData.contentLink, '_blank');
    } else if (formData.contentLink.startsWith('GetArticle/')) {
      try {
        const res = await fetch(`${API_BASE_URL}/articles/${formData.contentLink}`);
        const data = await res.json();
        if (data.contentLink) {
          window.open(data.contentLink, '_blank');
        }
      } catch (error) {
        alert('获取文章链接失败');
      }
    }
  };



  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>{id ? '编辑文章' : '创建文章'}</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="文章标题"
          value={formData.title}
          onChange={e => setFormData({...formData, title: e.target.value})}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="作者"
          value={formData.author}
          onChange={e => setFormData({...formData, author: e.target.value})}
          style={styles.input}
        />
        <div style={styles.coverInputGroup}>
          <input
            type="text"
            placeholder="封面URL（支持：JPEG、PNG、WebP、GIF、APNG、MP4、WebM）"
            value={formData.coverImage}
            onChange={e => {
              const url = e.target.value;
              setFormData({...formData, coverImage: url});
              if (url) {
                const isVideo = /\.(mp4|webm)(\?.*)?$/i.test(url);
                setCoverMediaType(isVideo ? 'video' : 'image');
              } else {
                setCoverMediaType(null);
              }
            }}
            style={{...styles.input, marginBottom: 0}}
          />
          <button type="button" onClick={async () => {
            const res = await fetch(`${API_BASE_URL}/cover/random`);
            const data = await res.json();
            setFormData({...formData, coverImage: data.coverImage});
            setCoverMediaType('image');
          }} style={styles.randomBtn}>
            随机封面
          </button>
          <button type="button" onClick={async () => {
            const res = await fetch(`${API_BASE_URL}/cover/cartoon`);
            const data = await res.json();
            setFormData({...formData, coverImage: data.coverImage});
            setCoverMediaType('image');
          }} style={styles.randomCartoonBtn}>
            随机动态封面
          </button>
          <button type="button" onClick={async () => {
            const res = await fetch(`${API_BASE_URL}/cover/video`);
            const data = await res.json();
            setFormData({...formData, coverImage: data.coverVideo});
            setCoverMediaType('video');
          }} style={styles.randomVideoBtn}>
            随机视频
          </button>
        </div>
        {formData.coverImage && (
          <div style={styles.preview}>
            {coverMediaType === 'video' ? (
              <video src={formData.coverImage} controls style={styles.previewMedia} />
            ) : (
              <img src={formData.coverImage} alt="封面预览" style={styles.previewMedia} />
            )}
          </div>
        )}
        <input
          type="text"
          placeholder="标签（用逗号分隔）"
          value={formData.tags}
          onChange={e => setFormData({...formData, tags: e.target.value})}
          style={styles.input}
        />
        <textarea
          placeholder="文章摘要"
          value={formData.excerpt}
          onChange={e => setFormData({...formData, excerpt: e.target.value})}
          style={{...styles.input, minHeight: '350px'}}
        />
        <div style={styles.contentTypeSelector}>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="content"
              checked={contentType === 'content'}
              onChange={e => setContentType(e.target.value)}
            />
            <span style={{marginLeft: '0.5rem'}}>文章内容</span>
          </label>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="link"
              checked={contentType === 'link'}
              onChange={e => setContentType(e.target.value)}
            />
            <span style={{marginLeft: '0.5rem'}}>文章内容链接</span>
          </label>
        </div>
        {contentType === 'content' ? (
          <textarea
            placeholder="文章内容"
            value={formData.content}
            onChange={e => setFormData({...formData, content: e.target.value, contentLink: ''})}
            style={{...styles.input, minHeight: '700px'}}
          />
        ) : (
          <div>
            <input
              type="text"
              placeholder="文章内容链接（例如：https://example.com/article 或 GetArticle/1/1/1）"
              value={formData.contentLink}
              onChange={e => setFormData({...formData, contentLink: e.target.value, content: ''})}
              style={styles.input}
            />
            {formData.contentLink && (
              <button type="button" onClick={handleContentLinkClick} style={styles.previewBtn}>
                预览链接
              </button>
            )}
          </div>
        )}
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={formData.isPaid}
            onChange={e => setFormData({...formData, isPaid: e.target.checked})}
          />
          <span style={{marginLeft: '0.5rem'}}>付费文章</span>
        </label>
        <button type="submit" style={styles.submitBtn}>
          {id ? '更新文章' : '发布文章'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '2rem auto',
    padding: '0 1rem',
  },
  heading: {
    fontSize: '2rem',
    marginBottom: '2rem',
    color: '#111827',
  },
  form: {
    background: '#fff',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '1rem',
  },
  contentTypeSelector: {
    display: 'flex',
    gap: '2rem',
    marginBottom: '1rem',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    padding: '1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  preview: {
    marginBottom: '1rem',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  previewMedia: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'contain',
  },
  previewBtn: {
    padding: '0.75rem 1.5rem',
    background: '#10b981',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '0.9rem',
    marginBottom: '1rem',
  },
  coverInputGroup: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  randomBtn: {
    padding: '0.75rem 1.5rem',
    background: '#8b5cf6',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
  },
  randomCartoonBtn: {
    padding: '0.75rem 1.5rem',
    background: '#ec4899',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
  },
  randomVideoBtn: {
    padding: '0.75rem 1.5rem',
    background: '#f59e0b',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
  },
};

export default Editor;
