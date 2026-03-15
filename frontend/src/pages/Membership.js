import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PAYMENT_API_URL } from '../config';

const Membership = () => {
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
      setApplePayAvailable(true);
    }
  }, []);

  const handleApplePay = async () => {
    if (!applePayAvailable) {
      alert('您的设备不支持Apple Pay');
      return;
    }

    setProcessing(true);

    try {
      const paymentRequest = {
        countryCode: 'CN',
        currencyCode: 'CNY',
        supportedNetworks: ['visa', 'masterCard', 'chinaUnionPay'],
        merchantCapabilities: ['supports3DS'],
        total: {
          label: 'ZhiX会员订阅',
          amount: '39.99',
          type: 'final'
        }
      };

      const session = new ApplePaySession(3, paymentRequest);

      session.onvalidatemerchant = async (event) => {
        try {
          const response = await fetch(`${PAYMENT_API_URL}/apple-pay/verify-merchant`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              validationURL: event.validationURL
            })
          });

          const merchantSession = await response.json();
          session.completeMerchantValidation(merchantSession);
        } catch (error) {
          session.abort();
          setProcessing(false);
        }
      };

      session.onpaymentauthorized = async (event) => {
        try {
          const response = await fetch(`${PAYMENT_API_URL}/apple-pay`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              paymentToken: JSON.stringify(event.payment.token),
              amount: 39.99,
              currency: 'CNY',
              description: 'ZhiX会员订阅',
              userId: user?.id
            })
          });

          const result = await response.json();

          if (result.success) {
            session.completePayment(ApplePaySession.STATUS_SUCCESS);
            setPaymentSuccess(true);
            setTimeout(() => {
              navigate(`/payment/success?orderId=${result.orderId}`);
            }, 2000);
          } else {
            session.completePayment(ApplePaySession.STATUS_FAILURE);
            alert('支付失败，请重试');
          }
        } catch (error) {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          alert('支付失败，请重试');
        } finally {
          setProcessing(false);
        }
      };

      session.oncancel = () => {
        setProcessing(false);
      };

      session.begin();
    } catch (error) {
      alert('启动Apple Pay失败');
      setProcessing(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>开通会员</h1>
        <div style={styles.price}>
          <span style={styles.priceAmount}>¥39.99</span>
          <span style={styles.pricePeriod}>/月</span>
        </div>
        <ul style={styles.features}>
          <li>✓ 解锁所有付费文章</li>
          <li>✓ 无广告阅读体验</li>
          <li>✓ 优先评论通知</li>
          <li>✓ 专属会员标识</li>
        </ul>
        
        <div style={styles.paymentSection}>
          {applePayAvailable ? (
            <>
              <div style={styles.paymentInfo}>
                <p style={styles.paymentText}>Apple Pay</p>
                <p style={styles.paymentSubtext}>安全、便捷的支付方式</p>
              </div>
              <button
                style={styles.applePayBtn}
                onClick={handleApplePay}
                disabled={processing}
              >
                {processing ? '处理中...' : ' Apple Pay'}
              </button>
            </>
          ) : (
            <div style={styles.notAvailable}>
              <p>您的设备不支持Apple Pay</p>
              <p style={styles.notAvailableSubtext}>请使用Safari浏览器或支持Apple Pay的设备</p>
            </div>
          )}
        </div>

        {paymentSuccess && (
          <div style={styles.successSection}>
            <div style={styles.successIcon}>✓</div>
            <p style={styles.successText}>支付成功！会员已开通</p>
          </div>
        )}
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
    maxWidth: '500px',
    textAlign: 'center',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '2rem',
    color: '#111827',
  },
  price: {
    marginBottom: '2rem',
  },
  priceAmount: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  pricePeriod: {
    fontSize: '1.5rem',
    color: '#6b7280',
  },
  features: {
    listStyle: 'none',
    textAlign: 'left',
    marginBottom: '2rem',
    padding: '0 2rem',
  },
  paymentSection: {
    marginBottom: '1rem',
  },
  paymentInfo: {
    textAlign: 'center',
    marginBottom: '1rem',
    padding: '1rem',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  paymentText: {
    fontSize: '1rem',
    fontWeight: 'bold',
    marginBottom: '0.25rem',
  },
  paymentSubtext: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  applePayBtn: {
    width: '100%',
    padding: '1rem',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  notAvailable: {
    padding: '2rem',
    background: '#fef3c7',
    borderRadius: '8px',
    textAlign: 'center',
  },
  notAvailableSubtext: {
    fontSize: '0.875rem',
    color: '#92400e',
    marginTop: '0.5rem',
  },
  successSection: {
    marginTop: '2rem',
    padding: '2rem',
    background: '#d1fae5',
    borderRadius: '8px',
    textAlign: 'center',
  },
  successIcon: {
    fontSize: '3rem',
    color: '#10b981',
    marginBottom: '0.5rem',
  },
  successText: {
    color: '#065f46',
    fontSize: '1.1rem',
    fontWeight: 'bold',
  },
};

export default Membership;
