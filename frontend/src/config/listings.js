import axios from "axios";
import { buildApiUrl, API_ENDPOINTS } from "./api";

export async function getSkillListingById(listingId) {
  const endpoint = API_ENDPOINTS.LISTINGS.BY_ID(listingId);
  const res = await axios.get(buildApiUrl(endpoint), { withCredentials: true });
  return res.data.listing;
}

export async function getAllSkillListings() {
  const endpoint = API_ENDPOINTS.LISTINGS.ALL;
  const res = await axios.get(buildApiUrl(endpoint), { withCredentials: true });
  return res.data.listings;
}
