import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import DiscoveryMode from "../components/DiscoveryMode";
import RegenerateModal from "../components/RegenerateModal";
import SavedCollectionModal from "../components/SavedCollectionModal";
import { API_ENDPOINTS } from "../api/config";

// TMDb genre mapping (extend as needed)
const TMDB_GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 18: "Drama", 80: "Crime",
  10749: "Romance", 14: "Fantasy", 53: "Thriller", 35: "Comedy", 10402: "Music",
  9648: "Mystery", 27: "Horror", 36: "History", 878: "Sci-Fi", 10752: "War",
  37: "Western", 10751: "Family"
};

const PAGE_SIZE = 5;
const MAX_REFRESH = 5; // 5 refreshes = 6 pages (initial + 5 refreshes)

export default function UserDashboard() {
  const [recs, setRecs] = useState({ movies: [], books: [], albums: [] });
  const [loading, setLoading] = useState(true);
  const [regenLoading, setRegenLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, item: null, cross: null, type: null });
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [initialPreferences, setInitialPreferences] = useState(null);
  const [currentPreferences, setCurrentPreferences] = useState(null);
  const [pageIdx, setPageIdx] = useState({ movies: 0, books: 0, albums: 0 });
  const [showDiscoveryMode, setShowDiscoveryMode] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSavedCollection, setShowSavedCollection] = useState(false);
  // Feedback state
  const [likedItems, setLikedItems] = useState(new Set());
  const [dislikedItems, setDislikedItems] = useState(new Set());
  const [savedItems, setSavedItems] = useState(new Set());
  const [smartRecs, setSmartRecs] = useState([]);
  const [loadingSmartRecs, setLoadingSmartRecs] = useState(false);
  const [savedItemsDetails, setSavedItemsDetails] = useState([]);
  const [processingFeedback, setProcessingFeedback] = useState(new Set()); // Track items being processed
  const navigate = useNavigate();
  const userIdRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      userIdRef.current = user.id;
      setUserName(
        user.user_metadata?.first_name ||
        user.user_metadata?.full_name ||
        user.email
      );
      setUserEmail(user.email);
      
      // Get initial preferences from metadata (onboarding)
      if (user.user_metadata) {
        const prefs = {
          movieGenres: user.user_metadata.movie_genres || [],
          bookGenres: user.user_metadata.book_genres || [],
          albumGenres: user.user_metadata.album_genres || [],
          movieLanguages: user.user_metadata.movie_languages || [],
          bookLanguages: user.user_metadata.book_languages || [],
          albumLanguages: user.user_metadata.album_languages || []
        };
        setInitialPreferences(prefs);
        setCurrentPreferences(prefs); // Initially same as onboarding
      }
      
      await fetchAllRecs();
      await loadUserFeedback(); // Load user's feedback
      await loadSmartRecommendations(); // Load personalized recommendations
    })();
     
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Load user's existing feedback
  async function loadUserFeedback() {
    try {
      const resp = await fetch(API_ENDPOINTS.getFeedback(userIdRef.current));
      const data = await resp.json();
      
      const liked = new Set();
      const disliked = new Set();
      const saved = new Set();
      
      data.forEach(item => {
        const key = `${item.item_type}-${item.item_id}`;
        if (item.feedback_type === 'like') liked.add(key);
        else if (item.feedback_type === 'dislike') disliked.add(key);
        else if (item.feedback_type === 'saved') saved.add(key);
      });
      
      setLikedItems(liked);
      setDislikedItems(disliked);
      setSavedItems(saved);
      
      // Match saved items with full recommendation details
      updateSavedItemsDetails(saved);
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  }

  // Update saved items details by matching with current recommendations
  function updateSavedItemsDetails(savedSet) {
    const savedDetails = [];
    const allItems = [...recs.movies, ...recs.books, ...recs.albums];
    
    savedSet.forEach(key => {
      const [itemType, itemId] = key.split('-');
      const item = allItems.find(i => i.item_id === itemId);
      if (item) {
        savedDetails.push({
          ...item,
          item_type: itemType
        });
      }
    });
    
    setSavedItemsDetails(savedDetails);
  }

  // Load smart recommendations
  async function loadSmartRecommendations() {
    setLoadingSmartRecs(true);
    try {
      const resp = await fetch(API_ENDPOINTS.smartRecommendations, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userIdRef.current })
      });
      const data = await resp.json();
      setSmartRecs(data.recommendations || []);
    } catch (error) {
      console.error('Error loading smart recommendations:', error);
      setSmartRecs([]);
    } finally {
      setLoadingSmartRecs(false);
    }
  }

  // Submit feedback
  async function handleFeedback(itemId, itemType, feedbackType) {
    const key = `${itemType}-${itemId}`;
    
    // Prevent duplicate requests
    if (processingFeedback.has(key)) return;
    
    // Mark as processing
    setProcessingFeedback(prev => new Set(prev).add(key));
    
    try {
      // Remove opposite feedback first
      if (feedbackType === 'like' && dislikedItems.has(key)) {
        await removeFeedback(itemId, itemType, 'dislike');
      } else if (feedbackType === 'dislike' && likedItems.has(key)) {
        await removeFeedback(itemId, itemType, 'like');
      }
      
      // Toggle current feedback
      const currentSet = feedbackType === 'like' ? likedItems : 
                        feedbackType === 'dislike' ? dislikedItems : savedItems;
      
      if (currentSet.has(key)) {
        await removeFeedback(itemId, itemType, feedbackType);
      } else {
        await fetch(API_ENDPOINTS.feedback, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userIdRef.current,
            item_id: itemId,
            item_type: itemType,
            feedback_type: feedbackType
          })
        });
        
        const newSet = new Set(currentSet);
        newSet.add(key);
        if (feedbackType === 'like') setLikedItems(newSet);
        else if (feedbackType === 'dislike') setDislikedItems(newSet);
        else {
          setSavedItems(newSet);
          // Update saved items details display
          updateSavedItemsDetails(newSet);
        }
        
        // Reload smart recommendations after feedback
        await loadSmartRecommendations();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      // Remove from processing
      setProcessingFeedback(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  }

  // Remove feedback
  async function removeFeedback(itemId, itemType, feedbackType) {
    const key = `${itemType}-${itemId}`;
    
    try {
      await fetch(API_ENDPOINTS.removeFeedback, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userIdRef.current,
          item_id: itemId,
          item_type: itemType,
          feedback_type: feedbackType
        })
      });
      
      const currentSet = feedbackType === 'like' ? likedItems : 
                        feedbackType === 'dislike' ? dislikedItems : savedItems;
      const newSet = new Set(currentSet);
      newSet.delete(key);
      
      if (feedbackType === 'like') setLikedItems(newSet);
      else if (feedbackType === 'dislike') setDislikedItems(newSet);
      else {
        setSavedItems(newSet);
        // Update saved items details display
        updateSavedItemsDetails(newSet);
      }
    } catch (error) {
      console.error('Error removing feedback:', error);
    }
  }

  async function fetchAllRecs() {
    setLoading(true);
    const resp = await fetch(API_ENDPOINTS.recommendations(userIdRef.current));
    const data = await resp.json();
    setRecs(data);
    setLoading(false);
    setPageIdx({ movies: 0, books: 0, albums: 0 }); // reset pages on reload
    
    // Update saved items details after recommendations load
    updateSavedItemsDetails(savedItems);
  }

  async function handleRegenerateComplete(usedPreferences) {
    setRegenLoading(true);
    // Update current preferences with what was used in regeneration
    if (usedPreferences) {
      setCurrentPreferences(usedPreferences);
    }
    await fetchAllRecs();
    setRegenLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  function handleRefresh(section) {
    setPageIdx(idx => {
      const maxPages = Math.ceil((recs[section]?.length || 0) / PAGE_SIZE);
      const nextPage = idx[section] + 1;
      if (nextPage >= maxPages || nextPage > MAX_REFRESH) return idx;
      return { ...idx, [section]: nextPage };
    });
  }

  function handleCardClick(type, item) {
    setModal({ open: true, type, item, cross: null });
    // Don't automatically fetch cross-recommendations anymore
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181314]">
        <div className="text-white text-xl">Loading recommendations...</div>
      </div>
    );

  return (
    <div className="bg-[#181314] min-h-screen transition-all duration-300">
      {/* Navbar */}
      <nav className="bg-[#232323] px-4 md:px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="text-2xl font-bold text-[#1793d1]">
          Viara
        </div>
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="text-white hover:text-[#1793d1] p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-[#232323] rounded-lg shadow-xl border border-gray-600 z-50">
              <button
                onClick={() => {
                  setShowProfileModal(true);
                  setShowProfileDropdown(false);
                }}
                className="w-full text-left px-4 py-3 text-white hover:bg-[#1793d1] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                Profile
              </button>
              <button
                onClick={() => {
                  setShowSavedCollection(true);
                  setShowProfileDropdown(false);
                }}
                className="w-full text-left px-4 py-3 text-white hover:bg-[#1793d1] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/>
                </svg>
                Saved Collection
                {savedItems.size > 0 && (
                  <span className="ml-auto bg-[#1793d1] text-white text-xs px-2 py-0.5 rounded-full">
                    {savedItems.size}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-white hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="px-2 md:px-6 py-6">
        {/* Greeting and Mode toggle */}
        <div className="bg-[#232323] rounded-xl p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between shadow-lg">
        <div>
          <div className="text-2xl font-bold text-white mb-1">Welcome back, {userName}!</div>
          <div className="text-gray-300 mt-1 text-md">
            Discover your next favorite movie, book, or song with AI-powered recommendations.
          </div>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <button 
            onClick={() => setShowDiscoveryMode(true)}
            className="bg-[#1793d1] text-white px-4 py-2 rounded-2xl font-semibold shadow hover:bg-[#106fa0] focus:outline-none"
          >
            Discovery Mode
          </button>
          <button
            onClick={() => setShowRegenerateModal(true)}
            className="bg-[#232323] border border-[#1793d1] text-[#1793d1] px-4 py-2 rounded-2xl font-semibold shadow hover:bg-[#1793d1] hover:text-white focus:outline-none"
            disabled={regenLoading}
            style={{ minWidth: 180 }}
          >
            Regenerate Recommendations
          </button>
        </div>
      </div>

      {/* Smart Recommendations Section */}
      {!loadingSmartRecs && smartRecs.length > 0 && (
        <div className="mb-10">
          <div className="text-lg font-bold text-white flex items-center gap-2 mb-2">
            🎯 Recommended For You
            <span className="text-xs text-gray-400 font-normal">Based on your likes and users with similar taste</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {smartRecs.slice(0, 5).map(rec => (
              <div
                key={`${rec.item_type}-${rec.item_id}`}
                className="bg-[#232323] rounded-xl p-4 flex flex-col items-center cursor-pointer hover:ring-2 hover:ring-green-500 shadow"
                onClick={() => handleCardClick(rec.item_type, rec)}
              >
                <div className="w-full flex justify-center items-center" style={{ aspectRatio: "3/4", background: "#181314" }}>
                  <img
                    src={rec.poster_url || "https://via.placeholder.com/160x220?text=No+Image"}
                    alt={rec.title}
                    className="max-h-56 w-auto object-contain rounded-lg"
                  />
                </div>
                <div className="font-semibold text-white mt-2 truncate w-full text-center">{rec.title}</div>
                <div className="text-green-400 text-xs text-center mt-1">
                  {rec.reason || "Recommended for you"}
                </div>
                {rec.confidence_score && (
                  <div className="text-gray-400 text-xs mt-1">
                    {Math.round(rec.confidence_score * 100)}% match
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <CardRow
        title="Movies for You"
        section="movies"
        items={recs.movies}
        pageIdx={pageIdx.movies}
        onRefresh={handleRefresh}
        onCardClick={item => handleCardClick("movie", item)}
        genreMap={TMDB_GENRE_MAP}
        likedItems={likedItems}
        dislikedItems={dislikedItems}
        onFeedback={handleFeedback}
        processingFeedback={processingFeedback}
      />
      <CardRow
        title="Books to Explore"
        section="books"
        items={recs.books}
        pageIdx={pageIdx.books}
        onRefresh={handleRefresh}
        onCardClick={item => handleCardClick("book", item)}
        likedItems={likedItems}
        dislikedItems={dislikedItems}
        onFeedback={handleFeedback}
        processingFeedback={processingFeedback}
      />
      <CardRow
        title="Albums for You"
        section="albums"
        items={recs.albums}
        pageIdx={pageIdx.albums}
        onRefresh={handleRefresh}
        onCardClick={item => handleCardClick("album", item)}
        likedItems={likedItems}
        dislikedItems={dislikedItems}
        onFeedback={handleFeedback}
        processingFeedback={processingFeedback}
      />

      {modal.open &&
        <DetailModal
          item={modal.item}
          cross={modal.cross}
          type={modal.type}
          onClose={() => setModal({ open: false, item: null, cross: null, type: null })}
          genreMap={TMDB_GENRE_MAP}
          savedItems={savedItems}
          onFeedback={handleFeedback}
          processingFeedback={processingFeedback}
        />}

      {showDiscoveryMode && (
        <DiscoveryMode
          user_id={userIdRef.current}
          onClose={() => setShowDiscoveryMode(false)}
        />
      )}

      {showRegenerateModal && (
        <RegenerateModal
          user_id={userIdRef.current}
          onClose={() => setShowRegenerateModal(false)}
          onRegenerate={handleRegenerateComplete}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          userName={userName}
          userEmail={userEmail}
          initialPreferences={initialPreferences}
          currentPreferences={currentPreferences}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {showSavedCollection && (
        <SavedCollectionModal
          savedItems={savedItemsDetails}
          onClose={() => setShowSavedCollection(false)}
          onCardClick={handleCardClick}
          onRemove={handleFeedback}
          genreMap={TMDB_GENRE_MAP}
        />
      )}
      </div>
    </div>
  );
}

function CardRow({ title, section, items, pageIdx, onRefresh, onCardClick, genreMap, likedItems, dislikedItems, onFeedback, processingFeedback }) {
  const PAGE_SIZE = 5;
  const start = pageIdx * PAGE_SIZE;
  const data = items.slice(start, start + PAGE_SIZE);
  const maxPages = Math.ceil(items.length / PAGE_SIZE);
  const refreshDisabled = pageIdx + 1 >= maxPages || pageIdx >= MAX_REFRESH;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-bold text-white flex items-center gap-2">
          {section === "movies" && <>🎬</>}
          {section === "books" && <>📚</>}
          {section === "albums" && <>🎵</>}
          {title}
        </div>
        
        <button
          title={refreshDisabled ? "Refresh limit reached" : "Next 5"}
          className={`text-sm px-3 py-1 rounded-lg border border-[#1793d1] text-[#1793d1] bg-[#181314] hover:bg-[#1793d1] hover:text-white transition ${
            refreshDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => onRefresh(section)}
          disabled={refreshDisabled}
        >
          Refresh
        </button>
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
        style={{ minHeight: "310px" }}
      >
        {data.map(item => {
          const itemType = section === "movies" ? "movie" : section === "books" ? "book" : "album";
          const key = `${itemType}-${item.item_id}`;
          const isLiked = likedItems?.has(key);
          const isDisliked = dislikedItems?.has(key);
          const isProcessing = processingFeedback?.has(key);
          
          return (
          <div
            key={item.item_id}
            className="bg-[#232323] rounded-xl px-4 pt-4 pb-3 flex flex-col items-center cursor-pointer hover:ring-2 hover:ring-[#1793d1] relative shadow group"
            onClick={() => onCardClick(item)}
            style={{ transition: "box-shadow 0.2s", minWidth: 0 }}
          >
            {/* Like/Dislike buttons - show on hover */}
            <div className="absolute top-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedback(item.item_id, itemType, 'like');
                }}
                disabled={isProcessing}
                className={`${
                  isLiked ? 'bg-green-500' : 'bg-black bg-opacity-50'
                } ${
                  isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                } text-white p-2 rounded-full transition-transform shadow-lg`}
                title={isProcessing ? "Processing..." : "Like"}
              >
                {isProcessing ? '⏳' : '👍'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedback(item.item_id, itemType, 'dislike');
                }}
                disabled={isProcessing}
                className={`${
                  isDisliked ? 'bg-red-500' : 'bg-black bg-opacity-50'
                } ${
                  isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                } text-white p-2 rounded-full transition-transform shadow-lg`}
                title={isProcessing ? "Processing..." : "Dislike"}
              >
                {isProcessing ? '⏳' : '👎'}
              </button>
            </div>
            
            <div className="w-full flex justify-center items-center" style={{ aspectRatio: "3/4", background: "#181314" }}>
              <img
                src={item.poster_url || "https://via.placeholder.com/160x220?text=No+Image"}
                alt={item.title}
                className="max-h-56 w-auto object-contain rounded-lg"
                style={{ background: "#181314" }}
              />
            </div>
            <div className="font-semibold text-white mt-2 truncate w-full text-center">{item.title}</div>
            {/* Author for books */}
            {section === "books" && (
              <div className="text-gray-300 text-xs truncate w-full text-center">
                {item.author ? (Array.isArray(item.author) ? item.author.join(", ") : item.author) : ""}
              </div>
            )}
            {/* Genre names */}
            <div className="text-gray-400 text-xs truncate w-full text-center">
              {section === "movies" && Array.isArray(item.genre)
                ? item.genre.map(g => genreMap && genreMap[g] ? genreMap[g] : g).join(", ")
                : (item.genre || []).join(", ")
              }
            </div>
            {item.rating && item.rating > 0 && (
              <div className="absolute top-4 right-4 bg-[#1793d1] text-white px-2 py-1 rounded-full text-xs font-bold shadow">
                ⭐ {item.rating}
              </div>
            )}
            {/* WHY THIS AI EXPLANATION */}
            {item.ai_explanation && (
              <div className="text-xs text-[#1793d1] mt-2 italic text-center">{item.ai_explanation}</div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
}

function DetailModal({ item, cross, type, onClose, genreMap, savedItems, onFeedback, processingFeedback }) {
  const [isLoadingCross, setIsLoadingCross] = React.useState(false);
  const [crossData, setCrossData] = React.useState(cross);
  const [userIdForModal, setUserIdForModal] = React.useState(null);

  // Get user ID from parent
  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserIdForModal(user.id);
      }
    })();
  }, []);

  const handleFetchCrossRecommendations = async () => {
    if (!userIdForModal || !item.item_id) return;
    
    setIsLoadingCross(true);
    try {
      const response = await fetch(
        API_ENDPOINTS.crossRecommend(userIdForModal, item.item_id, type)
      );
      const data = await response.json();
      setCrossData(data);
    } catch (error) {
      console.error('Cross-domain recommendations error:', error);
      setCrossData({ movies: [], books: [], albums: [] });
    } finally {
      setIsLoadingCross(false);
    }
  };

  const genres = type === "movie"
    ? (Array.isArray(item.genre) ? item.genre.map(g => genreMap && genreMap[g] ? genreMap[g] : g) : [])
    : (item.genre || []);
  const authorOrDirector = type === "book"
    ? (item.author ? (Array.isArray(item.author) ? item.author.join(", ") : item.author) : "")
    : (item.director || item.artist || "");
  
  const key = `${type}-${item.item_id}`;
  const isSaved = savedItems?.has(key);
  const isProcessing = processingFeedback?.has(key);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-[#232323] rounded-xl p-6 w-full max-w-4xl relative shadow-xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl hover:text-[#1793d1] z-10">&times;</button>
        
        {/* Horizontal Layout: Poster Left, Content Right */}
        <div className="flex gap-6">
          {/* Poster on the left */}
          <div className="flex-shrink-0">
            <img
              src={item.poster_url || "https://via.placeholder.com/240x330?text=No+Image"}
              alt={item.title}
              className="w-48 h-72 object-contain rounded-xl bg-[#181314]"
            />
          </div>
          
          {/* Content on the right */}
          <div className="flex-1 min-w-0">
            <div className="text-2xl text-white font-bold mb-2">{item.title}</div>
        <div className="text-gray-400 text-sm mb-1">
          {genres.join(", ")}{genres.length > 0 && " | "}{Array.isArray(item.language) ? item.language.join(", ") : item.language}
        </div>
        {type === "book" && authorOrDirector && (
          <div className="text-gray-300 text-xs mb-1">by {authorOrDirector}</div>
        )}
        {type === "movie" && item.rating && item.rating > 0 && (
          <div className="text-[#1793d1] font-bold mb-1">⭐ {item.rating}</div>
        )}
        <div className="text-gray-300 mb-2">{item.description}</div>
        {/* WHY THIS AI EXPLANATION */}
        {item.ai_explanation && (
          <div className="text-xs text-[#1793d1] mb-2 italic">{item.ai_explanation}</div>
        )}
        {/* Where to watch/read/listen */}
        {item.detail_url && (
          <a href={item.detail_url} target="_blank" rel="noopener noreferrer" className="text-[#1793d1] underline mt-2 block">
            {type === "movie"
              ? "Where to watch"
              : type === "book"
              ? "Where to read"
              : "Where to listen"}
          </a>
        )}
        
        {/* Save for Later Button */}
        <div className="mt-3">
          <button
            onClick={() => onFeedback(item.item_id, type, 'saved')}
            disabled={isProcessing}
            className={`${
              isSaved ? 'bg-yellow-500' : 'bg-gray-600'
            } ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
            } text-white px-4 py-2 rounded-lg font-semibold transition-opacity flex items-center gap-2`}
          >
            {isProcessing ? (
              <>
                <span>⏳</span>
                <span>Processing...</span>
              </>
            ) : isSaved ? (
              <>
                <span>⭐</span>
                <span>Saved</span>
              </>
            ) : (
              <>
                <span>📌</span>
                <span>Save for Later</span>
              </>
            )}
          </button>
        </div>
        
        {/* Cross-Recommendations Button */}
        <div className="mt-4">
          <button
            onClick={handleFetchCrossRecommendations}
            disabled={isLoadingCross || crossData !== null}
            className="bg-[#1793d1] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#106fa0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoadingCross ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Finding Related Content...</span>
              </>
            ) : crossData ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>Related Content Loaded</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>
                  {type === "movie" ? "Show Soundtrack & Related Books" : 
                   type === "album" ? "Show Related Movies" : 
                   "Show Related Movies & Music"}
                </span>
              </>
            )}
          </button>
        </div>
          </div>
        </div>
        
        {/* Smart Cross-domain recommendations */}
        {crossData && (
          <div>
            {crossData.movies && crossData.movies.length > 0 && (
              <div className="mt-4">
                <div className="text-[#1793d1] font-bold mb-1">
                  {type === "album" ? "🎬 Related Movies" : "🎬 Related Movies"}
                </div>
                <div className="flex gap-3 overflow-x-auto">
                  {crossData.movies.map(m => (
                    <a
                      href={m.detail_url}
                      key={m.item_id}
                      className="bg-[#181314] p-2 rounded w-28 flex-shrink-0 text-xs hover:ring-1 hover:ring-[#1793d1]"
                      target="_blank" rel="noopener noreferrer"
                    >
                      <img src={m.poster_url || "https://via.placeholder.com/80x110?text=No+Image"} alt={m.title} className="w-full h-20 object-contain rounded"/>
                      <div className="text-white font-semibold truncate mt-1">{m.title}</div>
                      {m.rating && m.rating > 0 && <div className="text-yellow-400 text-xs">⭐ {m.rating}</div>}
                      <div className="text-gray-400 text-xs truncate">{(m.genre || []).join(", ")}</div>
                      {m.explanation && <div className="text-gray-500 text-xs mt-1">{m.explanation}</div>}
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {crossData.books && crossData.books.length > 0 && (
              <div className="mt-4">
                <div className="text-[#1793d1] font-bold mb-1">📚 Related Books</div>
                <div className="flex gap-3 overflow-x-auto">
                  {crossData.books.map(b => (
                    <a
                      href={b.detail_url}
                      key={b.item_id}
                      className="bg-[#181314] p-2 rounded w-28 flex-shrink-0 text-xs hover:ring-1 hover:ring-[#1793d1]"
                      target="_blank" rel="noopener noreferrer"
                    >
                      <img src={b.poster_url || "https://via.placeholder.com/80x110?text=No+Image"} alt={b.title} className="w-full h-20 object-contain rounded"/>
                      <div className="text-white font-semibold truncate mt-1">{b.title}</div>
                      <div className="text-gray-400 text-xs truncate">{b.author ? (Array.isArray(b.author) ? b.author.join(", ") : b.author) : ""}</div>
                      <div className="text-gray-400 text-xs truncate">{(b.genre || []).join(", ")}</div>
                      {b.explanation && <div className="text-gray-500 text-xs mt-1">{b.explanation}</div>}
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {crossData.albums && crossData.albums.length > 0 && (
              <div className="mt-4">
                <div className="text-[#1793d1] font-bold mb-1">
                  {type === "movie" ? "🎵 Soundtrack" : "🎵 Related Music"}
                </div>
                <div className="flex gap-3 overflow-x-auto">
                  {crossData.albums.map(a => (
                    <a
                      href={a.detail_url}
                      key={a.item_id}
                      className="bg-[#181314] p-2 rounded w-28 flex-shrink-0 text-xs hover:ring-1 hover:ring-[#1793d1]"
                      target="_blank" rel="noopener noreferrer"
                    >
                      <img src={a.poster_url || "https://via.placeholder.com/80x80?text=No+Image"} alt={a.title} className="w-full h-20 object-contain rounded"/>
                      <div className="text-white font-semibold truncate mt-1">{a.title}</div>
                      <div className="text-gray-400 text-xs truncate">{a.artist || ""}</div>
                      <div className="text-gray-400 text-xs truncate">{(a.genre || []).join(", ")}</div>
                      {a.explanation && <div className="text-gray-500 text-xs mt-1">{a.explanation}</div>}
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {/* Show message if no cross-recommendations found */}
            {(!crossData.movies || crossData.movies.length === 0) && 
             (!crossData.books || crossData.books.length === 0) && 
             (!crossData.albums || crossData.albums.length === 0) && (
              <div className="mt-4 text-center text-gray-400 text-sm py-4 bg-[#181314] rounded-lg">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No related content found at the moment.</p>
                <p className="text-xs mt-1">Try again later or explore other recommendations!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileModal({ userName, userEmail, initialPreferences, currentPreferences, onClose }) {
  const hasChanged = JSON.stringify(initialPreferences) !== JSON.stringify(currentPreferences);
  
  const renderPreferences = (preferences, type) => {
    const colorClass = type === "initial" ? "bg-[#1793d1]" : "bg-green-600";
    const langColorClass = type === "initial" ? "bg-[#106fa0]" : "bg-green-500";
    
    return (
      <>
        {/* Movies */}
        {(preferences.movieGenres?.length > 0 || preferences.movieLanguages?.length > 0) && (
          <div>
            <span className="text-gray-400 text-sm">Movies:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {preferences.movieGenres?.map(genre => (
                <span key={genre} className={`${colorClass} text-white text-xs px-2 py-1 rounded`}>
                  {genre}
                </span>
              ))}
              {preferences.movieLanguages?.map(lang => (
                <span key={lang} className={`${langColorClass} text-white text-xs px-2 py-1 rounded`}>
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Books */}
        {(preferences.bookGenres?.length > 0 || preferences.bookLanguages?.length > 0) && (
          <div>
            <span className="text-gray-400 text-sm">Books:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {preferences.bookGenres?.map(genre => (
                <span key={genre} className={`${colorClass} text-white text-xs px-2 py-1 rounded`}>
                  {genre}
                </span>
              ))}
              {preferences.bookLanguages?.map(lang => (
                <span key={lang} className={`${langColorClass} text-white text-xs px-2 py-1 rounded`}>
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Music */}
        {(preferences.albumGenres?.length > 0 || preferences.albumLanguages?.length > 0) && (
          <div>
            <span className="text-gray-400 text-sm">Music:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {preferences.albumGenres?.map(genre => (
                <span key={genre} className={`${colorClass} text-white text-xs px-2 py-1 rounded`}>
                  {genre}
                </span>
              ))}
              {preferences.albumLanguages?.map(lang => (
                <span key={lang} className={`${langColorClass} text-white text-xs px-2 py-1 rounded`}>
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-[#232323] rounded-xl w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-white font-bold text-xl">Profile</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* User Info */}
          <div>
            <h3 className="text-[#1793d1] font-semibold mb-2">Personal Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Name:</span>
                <span className="text-white">{userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-white">{userEmail}</span>
              </div>
            </div>
          </div>

          {/* Initial Preferences */}
          {initialPreferences && (
            <div>
              <h3 className="text-[#1793d1] font-semibold mb-2">Initial Preferences (Onboarding)</h3>
              <div className="space-y-3">
                {renderPreferences(initialPreferences, "initial")}
              </div>
            </div>
          )}

          {/* Current Preferences */}
          {currentPreferences && hasChanged && (
            <div>
              <h3 className="text-green-400 font-semibold mb-2">Current Preferences (After Updates)</h3>
              <div className="space-y-3">
                {renderPreferences(currentPreferences, "current")}
              </div>
            </div>
          )}

          {/* Show message if no updates */}
          {!hasChanged && currentPreferences && (
            <div className="text-center text-gray-400 text-sm italic">
              Using original onboarding preferences
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-600 bg-[#181314] rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full bg-[#1793d1] text-white py-2 rounded-lg font-semibold hover:bg-[#106fa0] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}