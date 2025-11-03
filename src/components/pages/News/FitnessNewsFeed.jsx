import React, { useEffect, useState } from "react";
import { getWorkoutNews } from "../../../services/newsApi";

export default function FitnessNewsFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 화면 크기에 따른 뉴스 개수 결정 (최대 5개, 항상 1줄 유지)
  const getNewsCount = () => {
    const width = window.innerWidth;
    console.log("[FitnessNewsFeed] 현재 화면 너비:", width);

    if (width < 480) {
      console.log("[FitnessNewsFeed] 모바일 소형 - 1개 요청");
      return 1; // 모바일 소형: 1개
    } else if (width < 640) {
      console.log("[FitnessNewsFeed] 모바일 - 1개 요청");
      return 1; // 모바일: 1개
    } else if (width < 768) {
      console.log("[FitnessNewsFeed] 모바일 중형 - 2개 요청");
      return 2; // 모바일 중형: 2개
    } else if (width < 1024) {
      console.log("[FitnessNewsFeed] 태블릿 - 2개 요청");
      return 2; // 태블릿: 2개
    } else if (width < 1280) {
      console.log("[FitnessNewsFeed] PC 소형 - 3개 요청");
      return 3; // PC 소형: 3개
    } else if (width < 1536) {
      console.log("[FitnessNewsFeed] PC 중형 - 4개 요청");
      return 4; // PC 중형: 4개
    } else {
      console.log("[FitnessNewsFeed] PC 대형 - 5개 요청");
      return 5; // PC 대형: 5개
    }
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      // ✅ 화면 크기에 따른 뉴스 개수 결정
      const newsCount = getNewsCount();
      const news = await getWorkoutNews(newsCount, true);
      console.log(
        "[FitnessNewsFeed] 요청 개수:",
        newsCount,
        "받은 뉴스:",
        news?.length
      );
      setItems(Array.isArray(news) ? news : []);
    } catch (e) {
      console.error(e);
      setError("뉴스를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 화면 크기 변경 시 뉴스 개수 업데이트 (디바운싱 적용)
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("[FitnessNewsFeed] 화면 크기 변경 감지 - 재로드");
        load();
      }, 500); // 500ms 디바운싱
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="w-full pb-4 min-h-0">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-center mb-4 relative">
        <h2
          className="text-2xl font-extrabold text-center"
          style={{ color: "#0A66FF" }}
        >
          뉴스
        </h2>
        <button
          onClick={load}
          className="absolute right-0 flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
          title="새로고침"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* 카드 그리드 */}
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
        <div
          className="grid gap-4 min-h-0"
          style={{
            gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, 1fr)`,
          }}
        >
          {items.map((n) => (
            <a
              key={n.id}
              href={n.link || n.originallink}
              target="_blank"
              rel="noreferrer"
              className="group block rounded-2xl overflow-hidden border hover:shadow-md transition-all duration-200 bg-white min-w-0 flex-1"
            >
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <img
                  src={n.thumbnail}
                  alt={n.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/400x225/4CAF50/ffffff?text=피트니스+뉴스";
                  }}
                />
              </div>
              <div className="p-4">
                {/* ✅ 카테고리 표시는 각 뉴스의 실제 카테고리 사용 */}
                <div
                  className="text-xs mb-1 flex items-center gap-2"
                  style={{ color: "#64748B", whiteSpace: "pre" }}
                >
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100"
                    style={{ color: "#64748B" }}
                  >
                    {n.category || "건강 뉴스"}
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
                <h3
                  className="text-lg font-extrabold leading-snug line-clamp-3 group-hover:text-blue-600 transition-colors"
                  style={{ color: "#0F172A" }}
                >
                  {n.title}
                </h3>
                {n.summary && (
                  <p
                    className="mt-2 text-sm leading-relaxed line-clamp-3"
                    style={{ color: "#64748B" }}
                  >
                    {n.summary}
                  </p>
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
  );
}
