import React from "react";

export default function DiveDeepSection({ onCardClick }) {
  const cards = [
    {
      type: "movie",
      title: "Movies",
      icon: "🎬",
      gradient: "from-purple-500 to-pink-500",
      description: "Explore by mood & era"
    },
    {
      type: "music",
      title: "Music",
      icon: "🎵",
      gradient: "from-blue-500 to-cyan-500",
      description: "Discover curated vibes"
    },
    {
      type: "book",
      title: "Books",
      icon: "📚",
      gradient: "from-green-500 to-teal-500",
      description: "Find your next read"
    }
  ];

  return (
    <div className="mt-16 mb-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Want to Dive Deep?
        </h2>
        <p className="text-gray-400">
          Explore personalized recommendations with advanced filters
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {cards.map((card) => (
          <button
            key={card.type}
            onClick={() => onCardClick(card.type)}
            className="group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="text-6xl mb-4">{card.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{card.title}</h3>
              <p className="text-white/80 text-sm">{card.description}</p>
            </div>

            {/* Hover Effect */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-300"></div>
          </button>
        ))}
      </div>
    </div>
  );
}
