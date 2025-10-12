import React from "react";

export default function SavedCollectionModal({ savedItems, onClose, onCardClick, onRemove, genreMap }) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-[#232323] rounded-xl w-full max-w-6xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#232323] flex items-center justify-between p-6 border-b border-gray-600 z-10">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[#1793d1]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/>
            </svg>
            <h2 className="text-white font-bold text-2xl">Saved Collection</h2>
            <span className="bg-[#1793d1] text-white text-sm px-3 py-1 rounded-full">
              {savedItems.length} items
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {savedItems.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-20 h-20 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <p className="text-gray-400 text-lg mb-2">No saved items yet</p>
              <p className="text-gray-500 text-sm">Click "Save for Later" on any item to add it to your collection</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {savedItems.map(saved => (
                <div
                  key={`${saved.item_type}-${saved.item_id}`}
                  className="bg-[#181314] rounded-xl p-4 flex flex-col items-center cursor-pointer hover:ring-2 hover:ring-yellow-500 shadow-lg relative transition-all duration-200 hover:scale-105"
                  onClick={() => {
                    onCardClick(saved.item_type, saved);
                    onClose();
                  }}
                >
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(saved.item_id, saved.item_type, 'saved');
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
                    title="Remove from collection"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </button>
                  
                  {/* Poster */}
                  <div className="w-full flex justify-center items-center mb-3" style={{ aspectRatio: "3/4", background: "#232323" }}>
                    <img
                      src={saved.poster_url || "https://via.placeholder.com/160x220?text=No+Image"}
                      alt={saved.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* Title */}
                  <div className="font-semibold text-white text-sm text-center mb-1 line-clamp-2 w-full">
                    {saved.title}
                  </div>
                  
                  {/* Type Badge */}
                  <div className="text-yellow-400 text-xs mb-1">
                    {saved.item_type === 'movie' ? '🎬' : saved.item_type === 'book' ? '📚' : '🎵'}
                  </div>
                  
                  {/* Genre */}
                  <div className="text-gray-400 text-xs truncate w-full text-center">
                    {saved.item_type === "movie" && Array.isArray(saved.genre)
                      ? saved.genre.map(g => genreMap && genreMap[g] ? genreMap[g] : g).slice(0, 2).join(", ")
                      : (saved.genre || []).slice(0, 2).join(", ")
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#232323] p-6 border-t border-gray-600">
          <button
            onClick={onClose}
            className="w-full bg-[#1793d1] text-white py-3 rounded-lg font-semibold hover:bg-[#106fa0] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
