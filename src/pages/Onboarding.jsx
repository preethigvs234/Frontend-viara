import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { API_ENDPOINTS } from "../api/config";

// === SIMPLIFIED & WORKING GENRE/LANGUAGE OPTIONS ===

// Movie Genres (mapped to TMDb IDs in backend)
const movieGenres = [
  "Action", "Romance", "Comedy", "Drama", "Thriller", "Horror", 
  "Adventure", "Fantasy", "Sci-Fi", "Animation"
];

// Book Genres (works with Google Books API)
const bookGenres = [
  "Fiction", "Romance", "Mystery", "Thriller", "Fantasy", 
  "Biography", "History", "Self-Help", "Drama"
];

// Album Genres (works with Deezer & Spotify)
const albumGenres = [
  "Pop", "Rock", "Hip-Hop", "Jazz", "Classical", "Indie",
  "Romantic", "Bollywood", "Tollywood", "Folk", "Devotional"
];

// Languages (comprehensive support)
const languagesList = [
  "English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam"
];

const languageCodeMap = {
  "English": "en", 
  "Hindi": "hi", 
  "Telugu": "te", 
  "Tamil": "ta",
  "Kannada": "kn", 
  "Malayalam": "ml"
};

export default function Onboarding() {
  const [selectedMovieGenres, setSelectedMovieGenres] = useState([]);
  const [selectedMovieLanguages, setSelectedMovieLanguages] = useState([]);
  const [selectedBookGenres, setSelectedBookGenres] = useState([]);
  const [selectedBookLanguages, setSelectedBookLanguages] = useState([]);
  const [selectedAlbumGenres, setSelectedAlbumGenres] = useState([]);
  const [selectedAlbumLanguages, setSelectedAlbumLanguages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); // Clear previous error

    if (
      selectedMovieGenres.length < 2 || selectedMovieLanguages.length < 2 ||
      selectedBookGenres.length < 2 || selectedBookLanguages.length < 2 ||
      selectedAlbumGenres.length < 2 || selectedAlbumLanguages.length < 2
    ) {
      setError("Please select at least 2 genres and 2 languages for each category (movies, books, albums) to continue.");
      return;
    }

    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
      setError("User not found. Please sign in again.");
      setLoading(false);
      return;
    }

    // Convert genres and languages to lowercase for backend consistency
    const movieGenresLower = selectedMovieGenres.map(g => g.toLowerCase());
    const bookGenresLower = selectedBookGenres.map(g => g.toLowerCase());
    const albumGenresLower = selectedAlbumGenres.map(g => g.toLowerCase());
    
    const movieLangCodes = selectedMovieLanguages.map(l => languageCodeMap[l] || l.toLowerCase());
    const bookLangCodes = selectedBookLanguages.map(l => languageCodeMap[l] || l.toLowerCase());
    const albumLangNames = selectedAlbumLanguages.map(l => l.toLowerCase()); // lowercase for Spotify/Deezer

    // Update user preferences directly in Supabase users table
    const { error: updateError } = await supabase
      .from("users")
      .update({
        movie_genres: movieGenresLower,
        movie_languages: movieLangCodes,
        book_genres: bookGenresLower,
        book_languages: bookLangCodes,
        album_genres: albumGenresLower,
        album_languages: albumLangNames,
      })
      .eq("id", user.id);

    if (updateError) {
      setError("Failed to save preferences. Please try again.");
      setLoading(false);
      return;
    }

    // === Backend API call to trigger recommendation workflow ===
    try {
      console.log('🚀 Calling backend:', API_ENDPOINTS.onboarding);
      console.log('📦 Payload:', {
        user_id: user.id,
        email: user.email,
        movie_genres: movieGenresLower,
        book_genres: bookGenresLower,
        album_genres: albumGenresLower,
        movie_languages: movieLangCodes,
        book_languages: bookLangCodes,
        album_languages: albumLangNames,
      });
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      const backendRes = await fetch(API_ENDPOINTS.onboarding, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          movie_genres: movieGenresLower,
          book_genres: bookGenresLower,
          album_genres: albumGenresLower,
          movie_languages: movieLangCodes,
          book_languages: bookLangCodes,
          album_languages: albumLangNames,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('✅ Backend response:', backendRes.status);

      if (!backendRes.ok) {
        setError("Failed to start recommendations. Please try again.");
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('❌ Backend error:', err);
      if (err.name === 'AbortError') {
        setError("Request timeout. The server is taking too long. Please try again or contact support.");
      } else {
        setError("Backend error. Please check your connection and try again.");
      }
      setLoading(false);
      return;
    }

    setLoading(false);

    // Redirect to signup success or dashboard
    navigate("/signup-success");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-[#181314] via-[#222] to-[#1793d1]/30 transition-all duration-500 relative overflow-hidden">
      <div className="bg-[#181314]/80 w-full max-w-2xl rounded-xl shadow-2xl px-8 py-10 flex flex-col backdrop-blur-md border border-[#1793d1]/30 mt-8 mb-12">
        <h2 className="text-4xl font-extrabold text-[#1793d1] mb-2 text-center">Personalize Your Experience</h2>
        <p className="text-center text-gray-300 mb-6 text-lg">
          Select your favorite genres and languages for each category
        </p>
        <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
          <CategorySelect
            title="Movies"
            genres={movieGenres}
            selectedGenres={selectedMovieGenres}
            setSelectedGenres={setSelectedMovieGenres}
            languages={languagesList}
            selectedLanguages={selectedMovieLanguages}
            setSelectedLanguages={setSelectedMovieLanguages}
          />
          <CategorySelect
            title="Books"
            genres={bookGenres}
            selectedGenres={selectedBookGenres}
            setSelectedGenres={setSelectedBookGenres}
            languages={languagesList}
            selectedLanguages={selectedBookLanguages}
            setSelectedLanguages={setSelectedBookLanguages}
          />
          <CategorySelect
            title="Albums"
            genres={albumGenres}
            selectedGenres={selectedAlbumGenres}
            setSelectedGenres={setSelectedAlbumGenres}
            languages={languagesList}
            selectedLanguages={selectedAlbumLanguages}
            setSelectedLanguages={setSelectedAlbumLanguages}
          />
          <button
            type="submit"
            className={`w-full py-4 rounded-2xl bg-[#1793d1] text-white font-bold text-lg mt-2 shadow hover:bg-[#106fa0] hover:scale-105 focus:scale-105 transition-all active:bg-[#106fa0]${loading ? " opacity-70 cursor-not-allowed" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating your personalized recommendations...
              </span>
            ) : "Save & Continue"}
          </button>
          {loading && (
            <p className="text-yellow-400 text-center text-sm animate-pulse">
              ⏳ Fetching content from multiple sources... This may take 30-60 seconds
            </p>
          )}
          {error && (
            <p className="text-red-500 text-center mt-2">{error}</p>
          )}
        </form>
        <p className="text-xs text-center text-gray-400 mt-4">
          Powered by Google Gemini
        </p>
      </div>
    </div>
  );
}

function CategorySelect({
  title,
  genres,
  selectedGenres,
  setSelectedGenres,
  languages,
  selectedLanguages,
  setSelectedLanguages
}) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-[#1793d1] mb-2">{title}</h3>
      <div className="mb-4">
        <span className="font-semibold text-white block mb-1">Genres</span>
        <div className="flex flex-wrap gap-2">
          {genres.map(genre => (
            <button
              key={genre}
              type="button"
              className={`rounded-lg px-4 py-2 font-medium transition-all
                ${selectedGenres.includes(genre)
                  ? "bg-[#1793d1] text-white border-2 border-[#1793d1]"
                  : "bg-gray-700 text-gray-200 hover:bg-[#1793d1] hover:text-white"}
              `}
              onClick={() => setSelectedGenres(
                selectedGenres.includes(genre)
                  ? selectedGenres.filter(g => g !== genre)
                  : [...selectedGenres, genre]
              )}
            >
              {genre}
            </button>
          ))}
        </div>
        <div className="text-gray-400 text-sm mt-2">{selectedGenres.length} selected</div>
      </div>
      <div>
        <span className="font-semibold text-white block mb-1">Languages</span>
        <div className="flex flex-wrap gap-2">
          {languages.map(lang => (
            <button
              key={lang}
              type="button"
              className={`rounded-full px-4 py-2 font-medium transition-all
                ${selectedLanguages.includes(lang)
                  ? "bg-[#1793d1] text-white border-2 border-[#1793d1]"
                  : "bg-gray-700 text-gray-200 hover:bg-[#1793d1] hover:text-white"}
              `}
              onClick={() => setSelectedLanguages(
                selectedLanguages.includes(lang)
                  ? selectedLanguages.filter(l => l !== lang)
                  : [...selectedLanguages, lang]
              )}
            >
              {lang}
            </button>
          ))}
        </div>
        <div className="text-gray-400 text-sm mt-2">{selectedLanguages.length} selected</div>
      </div>
    </div>
  );
}