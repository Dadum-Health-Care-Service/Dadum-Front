import React from "react";
import ContainerComponent from "../../../common/ContainerComponent";

const WatchDetails = ({ healthItems }) => {
  if (!healthItems || healthItems.length === 0) return null;

  return (
    <ContainerComponent className="report-section">
      <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#212121', margin: '0 0 16px 0', paddingBottom: '12px', borderBottom: '2px solid #D6E4FF' }}>
        워치 상세 데이터
      </h2>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>기록시각</th>
              <th>걸음수</th>
              <th>칼로리 (kcal)</th>
              <th>거리 (km)</th>
              <th>심박수 (bpm)</th>
            </tr>
          </thead>
          <tbody>
            {healthItems.map((item, index) => (
              <tr key={index}>
                <td>
                  {new Date(item.recordTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td>{item.steps || 0}</td>
                <td>{item.caloriesKcal || 0}</td>
                <td>{item.distanceKm || 0}</td>
                <td>{item.heartRateAvg || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2" style={{ fontSize: "13px", color: "#718096" }}>
        총 {healthItems.length}건의 워치 데이터
      </div>
    </ContainerComponent>
  );
};

export default WatchDetails;
