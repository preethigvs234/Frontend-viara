import React, { useState } from 'react';
import { API_ENDPOINTS } from '../api/config';

const GENRE_OPTIONS = {
  movies: ['Action', 'Romance', 'Comedy', 'Drama', 'Thriller', 'Animation', 'Adventure', 'Crime', 'Family', 'Fantasy', 'History', 'Horror', 'Mystery', 'Science Fiction', 'Music', 'War', 'Western'],
  books: ['Fiction', 'Mystery', 'Romance', 'Thriller', 'Fantasy', 'Science Fiction', 'Biography', 'History', 'Self-Help', 'Business', 'Health', 'Travel', 'Cooking', 'Art', 'Religion', 'Philosophy'],
  albums: ['Pop', 'Rock', 'Electro', 'Jazz', 'Classical', 'Hip-hop', 'Soundtrack', 'Metal', 'Indie', 'Folk', 'Dance', 'R&B', 'Reggae', 'Country', 'Blues']
};

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Telugu', 'Tamil', 'Bengali', 'Marathi', 'Malayalam', 'Kannada', 'Punjabi', 'Gujarati', 'Urdu'];

export default function RegenerateModal({ user_id, onClose, onRegenerate }) {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('genres');

  const handleGenreToggle = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleLanguageToggle = (language) => {
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const handleRegenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.regenerate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user_id,
          movie_genres: selectedGenres.filter(g => GENRE_OPTIONS.movies.includes(g)),
          book_genres: selectedGenres.filter(g => GENRE_OPTIONS.books.includes(g)),
          album_genres: selectedGenres.filter(g => GENRE_OPTIONS.albums.includes(g)),
          movie_languages: selectedLanguages,
          book_languages: selectedLanguages,
          album_languages: selectedLanguages
        })
      });

      const data = await response.json();
      if (data.ok) {
        // Pass back the preferences that were used
        const usedPreferences = {
          movieGenres: selectedGenres.filter(g => GENRE_OPTIONS.movies.includes(g)),
          bookGenres: selectedGenres.filter(g => GENRE_OPTIONS.books.includes(g)),
          albumGenres: selectedGenres.filter(g => GENRE_OPTIONS.albums.includes(g)),
          movieLanguages: selectedLanguages,
          bookLanguages: selectedLanguages,
          albumLanguages: selectedLanguages
        };
        onRegenerate(usedPreferences);
        onClose();
      }
    } catch (error) {
      console.error('Regeneration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const allGenres = [...new Set([...GENRE_OPTIONS.movies, ...GENRE_OPTIONS.books, ...GENRE_OPTIONS.albums])].sort();

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-[#232323] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div>
            <h2 className="text-white font-bold text-xl">Customize Your Recommendations</h2>
            <p className="text-gray-400 text-sm mt-1">Choose specific genres and languages, or leave empty to use your original preferences</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-600">
          <button
            onClick={() => setActiveTab('genres')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'genres' 
                ? 'text-[#1793d1] border-b-2 border-[#1793d1] bg-[#181314]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Genres ({selectedGenres.length})
          </button>
          <button
            onClick={() => setActiveTab('languages')}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'languages' 
                ? 'text-[#1793d1] border-b-2 border-[#1793d1] bg-[#181314]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Languages ({selectedLanguages.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'genres' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-300 text-sm">Select genres you want to explore:</p>
                <button
                  onClick={() => setSelectedGenres([])}
                  className="text-[#1793d1] text-sm hover:underline"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {allGenres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => handleGenreToggle(genre)}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedGenres.includes(genre)
                        ? 'bg-[#1793d1] text-white'
                        : 'bg-[#181314] text-gray-300 hover:bg-[#2a2a2a] border border-gray-600'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'languages' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-300 text-sm">Select languages you want to explore:</p>
                <button
                  onClick={() => setSelectedLanguages([])}
                  className="text-[#1793d1] text-sm hover:underline"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {LANGUAGE_OPTIONS.map(language => (
                  <button
                    key={language}
                    onClick={() => handleLanguageToggle(language)}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedLanguages.includes(language)
                        ? 'bg-[#1793d1] text-white'
                        : 'bg-[#181314] text-gray-300 hover:bg-[#2a2a2a] border border-gray-600'
                    }`}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-600 bg-[#181314]">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {selectedGenres.length === 0 && selectedLanguages.length === 0 
                ? "Will use your original preferences" 
                : `${selectedGenres.length} genres, ${selectedLanguages.length} languages selected`
              }
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                disabled={isLoading}
                className="bg-[#1793d1] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#106fa0] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Generating...' : 'Generate New Recommendations'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}