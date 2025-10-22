import React, { useState, useEffect } from 'react';
import { useApi } from '../../../utils/api/useApi';

const PlaceItem = ({ place, userId }) => {
  const [votes, setVotes] = useState({ upvotes: 0, downvotes: 0 });
  const { POST, GET } = useApi();

  const fetchVotes = async () => {
    try {
      const res = await GET(`/places/vote/count/${encodeURIComponent(place.placeUrl)}`);
      setVotes(res.data);
    } catch (e) {
      console.error('투표 수 조회 실패', e);
    }
  };

  useEffect(() => {
    fetchVotes();
  }, []);

  const vote = async (upvote) => {
    try {
      await POST('/places/vote', {
        userId,
        placeId: place.placeUrl,
        upvote
      });
      fetchVotes(); // 투표 후 다시 투표 수 갱신
    } catch (e) {
      console.error('투표 실패', e);
    }
  };

  return (
    <li>
      <strong>{place.placeName}</strong>
      <div>
        <button onClick={() => vote(true)}>👍 {votes.upvotes}</button>
        <button onClick={() => vote(false)}>👎 {votes.downvotes}</button>
      </div>
    </li>
  );
};

export default PlaceItem;
