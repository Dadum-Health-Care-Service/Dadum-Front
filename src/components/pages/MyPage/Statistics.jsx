import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useApi } from "../../../utils/api/useApi";
import { useModal } from "../../../context/ModalContext";
import RoutineStatPage from "./RoutineStatistics";
import DetailedStatChart from "./DetailedStatChart";

/*우측 화살표 아이콘*/
const ChevronRightIcon = (props) => (
  <svg
    style={{
      width: "16px",
      height: "16px",
      color: "#C7C7CC",
    }}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

/*데이터 카드 */
const StatCard = ({
  title,
  value,
  unit = "",
  detail,
  valueClass = "#1C1C1E",
  onClick,
}) => {
  const chartBars = [...Array(10)].map((_, i) => (
    <div
      key={i}
      style={{
        height: `${(Math.sin(i * 0.8) + 1.5) * 40}%`,
        flexGrow: 1,
        backgroundColor: "#E5E5EA",
        borderRadius: "2px",
      }}
    />
  ));

  const handleCardClick = onClick;

  return (
    <div>
      <div
        className="bg-white p-3 d-flex flex-column justify-content-between"
        style={{
          borderRadius: "12px",
          minHeight: "140px",
          width: "170px",
          textDecoration: "none",
          color: "inherit",
          cursor: "pointer",
        }}
        onClick={handleCardClick}
      >
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h3 style={{ fontSize: "14px" }}>{title}</h3>
          <ChevronRightIcon />
        </div>
        <div
          className="d-flex flex-column justify-content-between"
          style={{ flexGrow: 1 }}
        >
          <div className="d-flex align-items-end">
            <span
              style={{
                fontSize: "30px",
                fontWeight: 700,
                lineHeight: 1.1,
                color: valueClass,
              }}
            >
              {value}
            </span>
            <span
              className="ml-1"
              style={{ fontSize: "14px", color: "#8E8E93" }}
            >
              {unit}
            </span>
          </div>
          {detail && (
            <p className="mt-1" style={{ fontSize: "12px", color: "#8E8E93" }}>
              {detail}
            </p>
          )}
          <div
            className="d-flex align-items-end"
            style={{ height: "30px", marginTop: "10px", gap: "2px" }}
          >
            {chartBars}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Statistics() {
  const [dataType, setDataType] = useState("health");
  const { user } = useContext(AuthContext);
  const { GET } = useApi();
  const { showBasicModal } = useModal();
  const [healthData, setHealthData] = useState({});
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    if (!user || !user.usersId) {
      showConfirmModal(
        "사용자 정보를 찾을 수 없습니다",
        "네트워크 에러",
        "확인을 누르시면 로그아웃 됩니다",
        () => {
          dispatch({ type: "LOGOUT" });
        }
      );
      return;
    }
    const fetchHealthData = async () => {
      try {
        const res = await GET(`/health/${user.usersId}`, {}, false);
        const sorted = res.data.sort(
          (a, b) => new Date(a.currentTime) - new Date(b.currentTime)
        );
        console.log(sorted);
        setHealthData(sorted);
      } catch (e) {
        showBasicModal(
          "사용자의 신체 데이터 조회에 실패하였습니다",
          "네트워크 오류"
        );
      }
    };

    fetchHealthData();
  }, [user?.usersId, dataType]);

  const HealthStatPage = () => {
    const latestHealthData = healthData[healthData.length - 1];
    const latestHeartRate =
      !latestHealthData?.heartRateData ||
      latestHealthData?.heartRateData.length === 0
        ? null
        : latestHealthData?.heartRateData[
            latestHealthData?.heartRateData.length - 1
          ];
    const latestTime =
      latestHealthData?.currentTime.substring(0, 10) +
        " " +
        latestHealthData?.currentTime.substring(11, 19) || "오늘";
    const latestStep =
      !latestHealthData?.stepData || !latestHealthData?.stepData.length === 0
        ? null
        : latestHealthData?.stepData.reduce((sum, current) => sum + current, 0);
    const chartContainerRef = useRef(null);

    useEffect(() => {
      if (selectedKey !== null && chartContainerRef.current) {
        chartContainerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, [selectedKey]);

    const statCardsdata = [
      {
        title: "심박수",
        value: latestHeartRate?.bpm || 0,
        unit: "BPM",
        detail:
          latestHeartRate?.time.substring(0, 10) +
            " " +
            latestHeartRate?.time.substring(11, 19) || "오늘",
        key: "heartRate",
        valueClass: "#ff1616ff",
      },
      {
        title: "걸음 수",
        value: latestStep || 0,
        unit: "",
        detail: latestTime,
        key: "step",
        valueClass: "#947DFF",
      },
      {
        title: "걷기 거리",
        value:
          ((latestHealthData?.distanceWalked || 0) / 1000 >= 1
            ? parseFloat(
                ((latestHealthData?.distanceWalked || 0) / 1000).toFixed(2)
              )
            : latestHealthData?.distanceWalked || 0) || 0,
        unit: (latestHealthData?.distanceWalked || 0) / 1000 >= 1 ? "KM" : "M",
        detail: latestTime,
        key: "distance",
        valueClass: "#3399FF",
      },
      {
        title: "칼로리",
        value: latestHealthData?.caloriesBurnedData || 0,
        unit: "KCAL",
        detail: latestTime,
        key: "calories",
        valueClass: "#33CC33",
      },
      {
        title: "활동 칼로리",
        value: latestHealthData?.activeCaloriesBurned || 0,
        unit: "KCAL",
        detail: latestTime,
        key: "activeCal",
        valueClass: "#FF3366",
      },
      {
        title: "수면 시간",
        value: latestHealthData?.totalSleepMinutes || 0,
        unit: "분",
        detail: latestTime,
        key: "sleep",
        valueClass: "#1C1C1E",
      },
    ];

    const selectedStat = statCardsdata.find((stat) => stat.key === selectedKey);

    return (
      <>
        <div
          className="mx-2 pb-4"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "flex-start",
          }}
        >
          {statCardsdata.map((stat) => (
            <StatCard
              key={stat.key}
              title={stat.title}
              value={stat.value}
              unit={stat.unit}
              detail={stat.detail}
              valueClass={stat.valueClass}
              onClick={() => {
                setSelectedKey((prevKey) =>
                  prevKey === stat.key ? null : stat.key
                );
              }}
            />
          ))}
        </div>
        <div>
          {selectedStat && (
            <div className="mx-2 pb-4" ref={chartContainerRef}>
              <hr className="text-secondary pb-2" />
              <DetailedStatChart
                healthData={healthData}
                healthKey={selectedStat.key}
                valueClass={selectedStat.valueClass}
              />
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <div className="pb-3">
        <div className="d-flex justify-content-end mx-2 pb-3">
          <div
            style={{
              display: "flex",
              borderRadius: "16px",
              border: "1px solid #E5E5EA",
              overflow: "hidden",
              backgroundColor: "#FFF",
            }}
          >
            <button
              onClick={() => setDataType("health")}
              style={{
                padding: "6px 12px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s",
                backgroundColor:
                  dataType === "health" ? "#007AFF" : "transparent",
                color: dataType === "health" ? "#FFF" : "#C7C7CC",
                borderRadius: "0",
                fontSize: "12px",
                borderRight:
                  dataType === "health" || dataType === "routine"
                    ? "none"
                    : "1px solid #E5E5EA",
              }}
            >
              신체
            </button>
            <button
              onClick={() => setDataType("routine")}
              style={{
                padding: "6px 12px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s",
                backgroundColor:
                  dataType === "routine" ? "#007AFF" : "transparent",
                color: dataType === "routine" ? "#FFF" : "#C7C7CC",
                fontSize: "12px",
                borderRadius: "0",
              }}
            >
              루틴
            </button>
          </div>
        </div>

        {dataType === "health" ? <HealthStatPage /> : <RoutineStatPage />}
      </div>
    </>
  );
}
