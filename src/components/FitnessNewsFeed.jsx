import React, { useEffect, useState } from 'react';
import { getWorkoutNews } from '../services/newsApi';

const TABS = [
  { key: 'fitness', label: '피트니스' },
  { key: 'yoga', label: '요가/필라테스' },
  { key: 'hometraining', label: '홈트레이닝' },
  { key: 'weight', label: '웨이트' },
  { key: 'diet', label: '다이어트' }
];

const TAB_SEARCH_TERMS = {
  fitness: '스포츠 피트니스',
  yoga: '요가 필라테스',
  hometraining: '홈트레이닝 운동',
  weight: '웨이트 트레이닝',
  diet: '다이어트 운동'
};

const FitnessNewsFeed = ({ perTabCount = 2 }) => {
  const [active, setActive] = useState('fitness');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const searchTerm = TAB_SEARCH_TERMS[active];
      const news = await getWorkoutNews(perTabCount, true); // forceRefresh = true
      setItems(news);
    } catch (err) {
      setError('뉴스를 불러오는데 실패했습니다.');
      console.error('뉴스 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [active, perTabCount]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-center mb-4 relative">
        <h2 className="text-2xl font-bold text-gray-900 text-center">뉴스</h2>
        <button
          onClick={load}
          className="absolute right-0 p-2 rounded-full border bg-white hover:bg-gray-50 transition-colors"
          title="새로고침"
        >
          🔄
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              active === tab.key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-4">
        {loading && (
          <div className="flex items-center gap-3 p-6 rounded-2xl border">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="text-gray-600">불러오는 중...</span>
          </div>
        )}

        {!loading && error && (
          <div className="p-6 rounded-2xl border border-red-200 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((n) => (
              <a
                key={n.id}
                href={n.link || n.originallink}
                target="_blank"
                rel="noreferrer"
                className="group block rounded-2xl overflow-hidden border hover:shadow-md transition-all duration-200 bg-white"
              >
                <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                  <img
                    src={n.thumbnail}
                    alt={n.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x225/4CAF50/ffffff?text=피트니스+뉴스';
                    }}
                  />
                </div>
                <div className="p-4">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {TABS.find((t) => t.key === active)?.label || "피트니스"}
                    </span>
                    <span>•</span>
                    <span>{n.time}</span>
                    {n.source && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[140px]" title={n.source}>
                          {n.source}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-base font-semibold leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {n.title}
                  </h3>
                  {n.summary && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{n.summary}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="p-6 rounded-2xl border text-gray-600 text-center">
            표시할 뉴스가 없습니다.
          </div>
        )}
      </div>

    </div>
  );
};

export default FitnessNewsFeed;
