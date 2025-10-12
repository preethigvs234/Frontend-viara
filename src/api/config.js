// API Configuration
// Use environment variable or fallback to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_URL ;
console.log("API_BASE_URL:", API_BASE_URL);
// API endpoints
export const API_ENDPOINTS = {
  onboarding: `${API_BASE_URL}/api/user/onboarding-complete`,
  recommendations: (userId) => `${API_BASE_URL}/api/user/recommendations?user_id=${userId}`,
  feedback: `${API_BASE_URL}/api/user/feedback`,
  removeFeedback: `${API_BASE_URL}/api/user/feedback/remove`,
  getFeedback: (userId) => `${API_BASE_URL}/api/user/feedback/${userId}`,
  smartRecommendations: `${API_BASE_URL}/api/user/smart-recommendations`,
  crossRecommend: (userId, itemId, itemType) => 
    `${API_BASE_URL}/api/user/cross-recommend?user_id=${userId}&item_id=${itemId}&item_type=${itemType}`,
  discovery: `${API_BASE_URL}/api/user/discovery`,
  regenerate: `${API_BASE_URL}/api/user/regenerate-recommendations`,
};
