import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      alert('密码至少需要6个字符');
      return;
    }
    const success = await register(email, password, phone, nickname);
    if (success) {
      alert('注册成功，请登录');
      navigate('/login');
    } else {
      alert('注册失败，邮箱可能已存在');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>注册极志社区</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="tel"
            placeholder="手机号"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="text"
            placeholder="昵称（选填，默认：极客的志向）"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="密码（至少6位）"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            minLength={6}
            required
          />
          <button type="submit" style={styles.submitBtn}>注册</button>
        </form>
        <p style={styles.footer}>
          已有账号？<Link to="/login" style={styles.link}>立即登录</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: 'calc(100vh - 200px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  card: {
    background: '#fff',
    padding: '3rem',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '1.75rem',
    marginBottom: '2rem',
    textAlign: 'center',
    color: '#111827',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '1rem',
  },
  submitBtn: {
    padding: '1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    marginTop: '1rem',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
    color: '#6b7280',
  },
  link: {
    color: '#667eea',
    fontWeight: 'bold',
  },
};

export default Register;
