import React, { useState, useEffect } from 'react';
import { useApi } from '../../../utils/api/useApi';

const PlaceRecommendation = ({ userId }) => {
  const [keyword, setKeyword] = useState('카페');
  const [places, setPlaces] = useState([]);
  const [votes, setVotes] = useState({}); // { placeUrl: { upvotes, downvotes } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { POST, GET } = useApi();

  // 장소 검색
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await POST('/places/recommend', { keyword });
      setPlaces(res.data);

      // 투표 데이터 초기화 및 불러오기
      const voteCounts = {};
      for (const place of res.data) {
        voteCounts[place.placeUrl] = { upvotes: 0, downvotes: 0 };
      }
      setVotes(voteCounts);

      // 각 장소별 투표 수 조회
      for (const place of res.data) {
        fetchVoteCounts(place.placeUrl);
      }
    } catch (err) {
      setError('장소 추천 불러오기 실패');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 투표 수 조회
  const fetchVoteCounts = async (placeUrl) => {
    try {
      const res = await GET(`/places/vote/count/${encodeURIComponent(placeUrl)}`);
      setVotes((prev) => ({
        ...prev,
        [placeUrl]: res.data,
      }));
    } catch (e) {
      console.error('투표 수 조회 실패', e);
    }
  };

  // 투표 (찬성 or 반대)
  const vote = async (placeUrl, upvote) => {
    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }
    try {
      await POST('/places/vote', {
        userId,
        placeId: placeUrl,
        upvote,
      });
      fetchVoteCounts(placeUrl); // 투표 후 최신 투표 수 갱신
    } catch (e) {
      console.error('투표 실패', e);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>중간 지점 장소 추천 & 투표</h2>

      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="검색 키워드 입력 (예: 카페, 식당)"
        style={{ padding: 8, width: '60%' }}
      />
      <button onClick={handleSearch} style={{ marginLeft: 8, padding: '8px 16px' }}>
        검색
      </button>

      {loading && <p>로딩 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul style={{ marginTop: 20 }}>
        {places.map((place) => {
          const voteCount = votes[place.placeUrl] || { upvotes: 0, downvotes: 0 };
          return (
            <li key={place.placeUrl} style={{ marginBottom: 12 }}>
              <strong>{place.placeName}</strong><br />
              {place.addressName || place.roadAddressName}<br />
              전화: {place.phone || '없음'}<br />
              <a href={place.placeUrl} target="_blank" rel="noreferrer">지도에서 보기</a>
              <div style={{ marginTop: 6 }}>
                <button onClick={() => vote(place.placeUrl, true)}>👍 {voteCount.upvotes}</button>
                <button onClick={() => vote(place.placeUrl, false)} style={{ marginLeft: 8 }}>👎 {voteCount.downvotes}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PlaceRecommendation;
