const PRODUCTION_API_URL = 'https://api.zhix.club/api';
const PRODUCTION_PAYMENT_URL = 'https://payment.zhix.club/api/payment';

const DEV_API_URL = 'http://localhost:8080/api';
const DEV_PAYMENT_URL = 'http://localhost:8081/api/payment';

export const API_BASE_URL = process.env.NODE_ENV === 'production' ? PRODUCTION_API_URL : DEV_API_URL;
export const PAYMENT_API_URL = process.env.NODE_ENV === 'production' ? PRODUCTION_PAYMENT_URL : DEV_PAYMENT_URL;
