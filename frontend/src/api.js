import axios from 'axios';

const api = axios.create({
  baseURL: 'https://lyfjsshs-qr-attendance-system.onrender.com', // Replace with your actual Render URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;