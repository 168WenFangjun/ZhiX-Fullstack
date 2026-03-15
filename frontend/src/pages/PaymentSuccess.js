import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>✓</div>
        <h1 style={styles.title}>支付成功！</h1>
        <p style={styles.message}>恭喜您成为极志社区会员</p>
        {orderId && (
          <p style={styles.orderId}>订单号：{orderId}</p>
        )}
        <div style={styles.benefits}>
          <p>✓ 已解锁所有付费文章</p>
          <p>✓ 无广告阅读体验</p>
          <p>✓ 专属会员标识</p>
        </div>
        <Link to="/" style={styles.btn}>返回首页</Link>
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
    textAlign: 'center',
    maxWidth: '500px',
  },
  icon: {
    fontSize: '4rem',
    color: '#10b981',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '2rem',
    color: '#111827',
    marginBottom: '1rem',
  },
  message: {
    fontSize: '1.2rem',
    color: '#6b7280',
    marginBottom: '1rem',
  },
  orderId: {
    fontSize: '0.9rem',
    color: '#9ca3af',
    marginBottom: '2rem',
  },
  benefits: {
    textAlign: 'left',
    margin: '2rem auto',
    maxWidth: '300px',
    padding: '1.5rem',
    background: '#f0fdf4',
    borderRadius: '8px',
  },
  btn: {
    display: 'inline-block',
    padding: '1rem 2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    borderRadius: '24px',
    fontSize: '1rem',
    fontWeight: 'bold',
    marginTop: '1rem',
  },
};

export default PaymentSuccess;
