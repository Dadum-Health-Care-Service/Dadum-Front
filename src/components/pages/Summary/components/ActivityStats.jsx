import React from "react";
import ContainerComponent from "../../../common/ContainerComponent";
import CardComponent from "../../../common/CardComponent";

const ActivityStats = ({ activityStats }) => {
  if (!activityStats) return null;

  return (
    <ContainerComponent className="report-section">
      <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#212121', margin: '0 0 16px 0', paddingBottom: '12px', borderBottom: '2px solid #D6E4FF' }}>
        활동량 현황
      </h2>
      <div className="summary-grid">
        <CardComponent className="summary-card-component">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '500', color: '#0A66FF' }}>걸음수</div>
            <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#0A66FF' }}>
              {(activityStats?.totalSteps || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.8, color: '#0A66FF' }}>/ 10,000 보</div>
          </div>
        </CardComponent>
        <CardComponent className="summary-card-component">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '500', color: '#0A66FF' }}>이동 거리</div>
            <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#0A66FF' }}>
              {(activityStats?.totalDistance || 0).toFixed(1)}km
            </div>
          </div>
        </CardComponent>
        <CardComponent className="summary-card-component">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '500', color: '#0A66FF' }}>소모 칼로리</div>
            <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#0A66FF' }}>
              {activityStats?.totalCaloriesBurned || 0}kcal
            </div>
          </div>
        </CardComponent>
        {(activityStats?.avgHeartRate || 0) > 0 && (
          <CardComponent className="summary-card-component">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '500', color: '#0A66FF' }}>평균 심박수</div>
              <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#0A66FF' }}>
                {activityStats?.avgHeartRate || 0}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8, color: '#0A66FF' }}>bpm</div>
            </div>
          </CardComponent>
        )}
      </div>
      
      {/* 걸음수 진행바 */}
      <div className="stat-bar">
        <div className="stat-bar-label">
          목표 달성률
          <div style={{ fontSize: '11px', color: '#999', fontWeight: 'normal', marginTop: '2px' }}>
            (10,000보 기준)
          </div>
        </div>
        <div className="stat-bar-visual">
          {(activityStats?.stepsProgress || 0) > 0 && (
            <div className="stat-bar-fill" style={{ width: `${activityStats?.stepsProgress || 0}%`, height: '100%', minHeight: '21px' }}>
              {(activityStats?.stepsProgress || 0) >= 15 && `${Math.round(activityStats?.stepsProgress || 0)}%`}
            </div>
          )}
        </div>
        <div className="stat-bar-value">{Math.round(activityStats?.stepsProgress || 0)}%</div>
      </div>
    </ContainerComponent>
  );
};

export default ActivityStats;
