import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const AvatarSelector = () => {
  const { user, updateUser } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const avatars = Array.from({ length: 60 }, (_, i) => 
    `https://cdn.jsdelivr.net/gh/168WenFangjun/zhix-articles@main/avatars/avatar-${i + 1}.png`
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/user/avatar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: selectedAvatar })
      });

      if (res.ok) {
        const updatedUser = { ...user, avatar: selectedAvatar };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        updateUser(updatedUser);
        alert('头像更新成功！');
        navigate('/');
      }
    } catch (error) {
      alert('更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>选择头像</h1>
        <div style={styles.currentAvatar}>
          <img src={selectedAvatar} alt="当前头像" style={styles.currentImg} />
          <p>当前选择</p>
        </div>
        <div style={styles.grid}>
          {avatars.map((avatar, index) => (
            <img
              key={index}
              src={avatar}
              alt={`头像${index + 1}`}
              style={{
                ...styles.avatarImg,
                border: selectedAvatar === avatar ? '3px solid #667eea' : '2px solid #e5e7eb'
              }}
              onClick={() => setSelectedAvatar(avatar)}
            />
          ))}
        </div>
        <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? '保存中...' : '保存头像'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: 'calc(100vh - 200px)',
    padding: '2rem',
    background: '#f9fafb',
  },
  card: {
    maxWidth: '900px',
    margin: '0 auto',
    background: '#fff',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '1.75rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: '#111827',
  },
  currentAvatar: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  currentImg: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    border: '3px solid #667eea',
    marginBottom: '0.5rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  avatarImg: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  saveBtn: {
    width: '100%',
    padding: '1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
  },
};

export default AvatarSelector;
