import React, { useState, useEffect, useCallback } from "react";
import { API_ENDPOINTS } from "../api/config";

export default function DiveDeepModal({ isOpen, onClose, itemType, userId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cooldownHours, setCooldownHours] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  
  // Filter states
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [cachedFilters, setCachedFilters] = useState(null);

  // Filter configurations
  const filterConfig = {
    movie: {
      timePeriods: [
        { value: "latest", label: "Latest", subtitle: "2020+" },
        { value: "medium", label: "Medium", subtitle: "2000-2019" },
        { value: "old", label: "Old", subtitle: "<2000" }
      ],
      moods: [
        { value: "Feel Good", label: "Feel Good", emoji: "😊" },
        { value: "Intense", label: "Intense", emoji: "🔥" },
        { value: "Emotional", label: "Emotional", emoji: "💔" },
        { value: "Thrilling", label: "Thrilling", emoji: "😱" },
        { value: "Inspiring", label: "Inspiring", emoji: "✨" },
        { value: "Dark", label: "Dark", emoji: "🌑" }
      ],
      needsTimePeriod: true
    },
    music: {
      timePeriods: [
        { value: "latest", label: "Latest", subtitle: "2020+" },
        { value: "medium", label: "Medium", subtitle: "2000-2019" },
        { value: "old", label: "Old", subtitle: "<2000" }
      ],
      moods: [
        { value: "Energetic", label: "Energetic", emoji: "⚡" },
        { value: "Chill", label: "Chill", emoji: "🌊" },
        { value: "Romantic", label: "Romantic", emoji: "💕" },
        { value: "Melancholic", label: "Melancholic", emoji: "🌧️" },
        { value: "Party", label: "Party", emoji: "🎉" },
        { value: "Focus", label: "Focus", emoji: "🎯" }
      ],
      needsTimePeriod: true
    },
    book: {
      moods: [
        { value: "Light Read", label: "Light Read", emoji: "☀️" },
        { value: "Deep Dive", label: "Deep Dive", emoji: "🤿" },
        { value: "Page Turner", label: "Page Turner", emoji: "📖" },
        { value: "Motivational", label: "Motivational", emoji: "💪" },
        { value: "Educational", label: "Educational", emoji: "🎓" },
        { value: "Escapist", label: "Escapist", emoji: "🌈" }
      ],
      needsTimePeriod: false
    }
  };

  const config = filterConfig[itemType] || {};

  // Check for cached results when modal opens or itemType changes
  const checkForCachedResults = useCallback(async () => {
    try {
      // Make a dummy request to check cache (backend will return cached if available)
      const response = await fetch(`${API_ENDPOINTS.DEEP_DIVE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          item_type: itemType,
          time_period: null,  // Will use cached filters
          mood_theme: null
        })
      });

      const data = await response.json();

      if (data.ok && data.cached && data.recommendations?.length > 0) {
        // Found cached results - show them immediately
        const seen = new Set();
        const uniqueRecs = (data.recommendations || []).filter(rec => {
          if (seen.has(rec.item_id)) return false;
          seen.add(rec.item_id);
          return true;
        });
        
        setRecommendations(uniqueRecs);
        setIsCached(true);
        setCachedFilters(data.filters_used);
        setSelectedTimePeriod(data.filters_used?.time_period);
        setSelectedMood(data.filters_used?.mood_theme);
        setShowResults(true);
        
        // Calculate hours remaining
        if (data.hours_until_next) {
          setCooldownHours(data.hours_until_next);
        }
      }
    } catch (err) {
      console.error("Cache check error:", err);
      // Silently fail - user can still generate new recommendations
    }
  }, [userId, itemType]);

  useEffect(() => {
    if (isOpen && userId && itemType) {
      checkForCachedResults();
    }
  }, [isOpen, itemType, userId, checkForCachedResults]);

  useEffect(() => {
    // Reset everything when modal closes
    if (!isOpen) {
      setShowResults(false);
      setRecommendations([]);
      setError(null);
      setIsCached(false);
      setSelectedTimePeriod(null);
      setSelectedMood(null);
      setCooldownHours(null);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!selectedMood) {
      setError("Please select a mood/theme");
      return;
    }

    if (config.needsTimePeriod && !selectedTimePeriod) {
      setError("Please select a time period");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.DEEP_DIVE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          item_type: itemType,
          time_period: selectedTimePeriod,
          mood_theme: selectedMood
        })
      });

      const data = await response.json();

      if (data.ok) {
        // Deduplicate recommendations by item_id
        const seen = new Set();
        const uniqueRecs = (data.recommendations || []).filter(rec => {
          if (seen.has(rec.item_id)) return false;
          seen.add(rec.item_id);
          return true;
        });
        
        setRecommendations(uniqueRecs);
        setIsCached(data.cached || false);
        setCachedFilters(data.filters_used);
        setShowResults(true);
        
        // Set cooldown info
        if (data.hours_until_next) {
          setCooldownHours(data.hours_until_next);
        }
        
        if (data.cached && data.message) {
          setError(data.message);
        }
      } else {
        if (data.hours_remaining) {
          setCooldownHours(data.hours_remaining);
          setError(`Deep Dive available in ${data.hours_remaining} hours`);
        } else {
          setError(data.message || "Failed to generate recommendations");
        }
      }
    } catch (err) {
      console.error("Deep dive error:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getTitle = () => {
    const titles = {
      movie: "🎬 Deep Dive into Movies",
      music: "🎵 Deep Dive into Music",
      book: "📚 Deep Dive into Books"
    };
    return titles[itemType] || "Deep Dive";
  };

  const renderFilterSelection = () => (
    <div className="space-y-6">
      {/* Time Period Selection (Movies & Music only) */}
      {config.needsTimePeriod && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Select Time Period</h3>
          <div className="grid grid-cols-3 gap-3">
            {config.timePeriods.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedTimePeriod(period.value)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedTimePeriod === period.value
                    ? "border-blue-500 bg-blue-500/20 scale-105"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
              >
                <div className="text-white font-semibold">{period.label}</div>
                <div className="text-gray-400 text-sm">{period.subtitle}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mood/Theme Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          Select {itemType === "book" ? "Theme" : "Mood"}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {config.moods.map((mood) => (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedMood === mood.value
                  ? "border-purple-500 bg-purple-500/20 scale-105"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              <div className="text-3xl mb-2">{mood.emoji}</div>
              <div className="text-white font-semibold text-sm">{mood.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-lg ${cooldownHours ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-red-500/20 border border-red-500'}`}>
          <p className={`${cooldownHours ? 'text-yellow-300' : 'text-red-300'} text-center`}>
            {error}
          </p>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || (!selectedMood || (config.needsTimePeriod && !selectedTimePeriod))}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
      >
        {loading ? "Generating..." : "Generate Recommendations"}
      </button>
    </div>
  );

  const renderResults = () => (
    <div>
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          Your Recommendations ({recommendations.length})
        </h3>
        {!isCached && (
          <button
            onClick={() => {
              setShowResults(false);
              setRecommendations([]);
              setError(null);
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            ← Change Filters
          </button>
        )}
        {isCached && cachedFilters && (
          <div className="text-sm text-gray-400">
            Filters: {cachedFilters.time_period || ''} {cachedFilters.mood_theme}
          </div>
        )}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto">
        {recommendations.map((item, idx) => (
          <div
            key={`${item.item_id}-${idx}`}
            className="bg-gray-800/50 rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200"
          >
            {/* Poster/Image */}
            <div className="aspect-[2/3] bg-gray-700 relative">
              {item.poster_url || item.image_url ? (
                <img
                  src={item.poster_url || item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No Image
                </div>
              )}
              
              {/* Special Badges */}
              {item.is_bollywood_top && (
                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                  Top 50
                </div>
              )}
              {item.is_curated && (
                <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                  Curated
                </div>
              )}
              
              {/* Rating */}
              {item.rating && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                  ⭐ {item.rating}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                {item.title}
              </h4>
              {item.artist && (
                <p className="text-gray-400 text-xs line-clamp-1">{item.artist}</p>
              )}
              {item.author && (
                <p className="text-gray-400 text-xs line-clamp-1">{item.author}</p>
              )}
              {item.release_year && (
                <p className="text-gray-500 text-xs mt-1">{item.release_year}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-6">
            😕 No recommendations found with these filters.
          </div>
          <button
            onClick={() => {
              setShowResults(false);
              setRecommendations([]);
              setError(null);
              setIsCached(false);
              setSelectedTimePeriod(null);
              setSelectedMood(null);
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-200"
          >
            ← Try Different Filters
          </button>
        </div>
      )}

      {/* Cooldown Message */}
      {recommendations.length > 0 && cooldownHours !== null && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl">
          <p className="text-center text-purple-300 text-sm">
            ⏰ You can deep dive into {itemType === 'movie' ? 'movies' : itemType === 'music' ? 'music' : 'books'} again in{' '}
            <span className="font-bold text-purple-200">
              {cooldownHours < 1 
                ? `${Math.round(cooldownHours * 60)} minutes` 
                : `${Math.round(cooldownHours * 10) / 10} hours`}
            </span>
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {showResults ? renderResults() : renderFilterSelection()}
        </div>
      </div>
    </div>
  );
}
