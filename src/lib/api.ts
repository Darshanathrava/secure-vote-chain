import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:1322/api' });
//                                              ↑ Change 5000 to 1322 (your actual port)
export default api;