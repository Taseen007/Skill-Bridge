import axios from 'axios';
import { API_CONFIG } from './api';

export async function getSkillListingById(id) {
  const endpoint = API_CONFIG.ENDPOINTS.LISTINGS.BY_ID(id);
  const res = await axios.get(`${API_CONFIG.BASE_URL}${endpoint}`, { withCredentials: true });
  return res.data.listing || res.data;
}
