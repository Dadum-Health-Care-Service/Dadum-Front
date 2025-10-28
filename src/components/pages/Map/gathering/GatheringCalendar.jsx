import React, { useState, useMemo, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useParticipatedGatherings } from "../../Social/hooks/useParticipatedGatherings";
import { useGatheringCategories } from "./gtHooks";
import styles from "./GatheringCalendar.module.css";

// 한국어 설정
moment.updateLocale("ko", {
  months: "1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월".split("_"),
  monthsShort: "1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월".split("_"),
  weekdays: "일요일_월요일_화요일_수요일_목요일_금요일_토요일".split("_"),
  weekdaysShort: "일_월_화_수_목_금_토".split("_"),
  weekdaysMin: "일_월_화_수_목_금_토".split("_"),
});

const localizer = momentLocalizer(moment);

const GatheringCalendar = () => {
  const { participatedGatherings, loading, error } =
    useParticipatedGatherings();
  const { findCategory } = useGatheringCategories();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);

  // 모임 데이터를 달력 이벤트로 변환 (숨김 처리)
  const events = useMemo(() => {
    if (!participatedGatherings) return [];

    console.log("=== 캘린더 이벤트 생성 ===");
    console.log("참여한 모임 수:", participatedGatherings.length);
    console.log("참여한 모임 목록:", participatedGatherings);

    return participatedGatherings
      .filter((gathering) => gathering.nextMeetingDate) // nextMeetingDate가 있는 모임만
      .map((gathering) => {
        // nextMeetingDate를 사용하여 정확한 날짜/시간으로 이벤트 생성
        const startDate = moment(gathering.nextMeetingDate).toDate();
        const endDate = moment(startDate).add(2, "hours").toDate(); // 2시간 동안

        console.log("이벤트 생성:", {
          id: gathering.gatheringId,
          title: gathering.title,
          nextMeetingDate: gathering.nextMeetingDate,
          startDate: startDate,
        });

        return {
          id: gathering.gatheringId,
          title: "●", // 작은 점으로 표시
          start: startDate,
          end: endDate,
          resource: {
            gathering: gathering,
            scheduleDetails: gathering.scheduleDetails,
          },
        };
      })
      .filter(Boolean);
  }, [participatedGatherings]);

  // 특정 날짜의 모임 목록 가져오기
  const getGatheringsForDate = useCallback(
    (date) => {
      console.log("getGatheringsForDate 호출됨:", date);
      console.log("participatedGatherings:", participatedGatherings);

      if (!participatedGatherings) {
        console.log("participatedGatherings가 없음");
        return [];
      }

      const targetDate = moment(date).format("YYYY-MM-DD");
      console.log("targetDate:", targetDate);

      const filteredGatherings = participatedGatherings.filter((gathering) => {
        if (!gathering.nextMeetingDate) {
          console.log("gathering.nextMeetingDate가 없음:", gathering.title);
          return false;
        }
        const gatheringDate = moment(gathering.nextMeetingDate).format(
          "YYYY-MM-DD"
        );
        console.log("gatheringDate:", gatheringDate, "targetDate:", targetDate);
        return gatheringDate === targetDate;
      });

      console.log("필터링된 모임들:", filteredGatherings);
      return filteredGatherings;
    },
    [participatedGatherings]
  );

  // 날짜 클릭 핸들러
  const handleDateClick = useCallback((slotInfo) => {
    console.log("날짜 클릭됨:", slotInfo);
    const date = slotInfo.start;
    setSelectedDate(date);
    setShowDateModal(true);
  }, []);

  // 모바일/데스크탑용 직접 클릭 이벤트
  React.useEffect(() => {
    const handleDateClick = (event) => {
      console.log("클릭 이벤트 발생:", event.target);
      const target = event.target;
      const dateCell = target.closest(".rbc-date-cell");

      console.log("dateCell 찾음:", dateCell);

      if (dateCell) {
        // 여러 방법으로 날짜 정보 가져오기
        const dateString =
          dateCell.getAttribute("data-date") ||
          dateCell.getAttribute("data-rbc-date") ||
          dateCell.querySelector("[data-date]")?.getAttribute("data-date");

        console.log("dateString:", dateString);

        if (dateString) {
          const clickedDate = new Date(dateString);
          console.log("클릭된 날짜:", clickedDate);
          setSelectedDate(clickedDate);
          setShowDateModal(true);
        } else {
          // 날짜 텍스트에서 파싱 시도
          const dayText = dateCell.textContent.trim();
          if (dayText && dayText.match(/^\d+$/)) {
            const today = new Date();
            const clickedDate = new Date(
              today.getFullYear(),
              today.getMonth(),
              parseInt(dayText)
            );
            console.log("텍스트에서 파싱된 날짜:", clickedDate);
            setSelectedDate(clickedDate);
            setShowDateModal(true);
          }
        }
      }
    };

    // 이벤트 리스너 추가 (클릭과 터치 모두)
    const addEventListeners = () => {
      const calendarElement = document.querySelector(".rbc-calendar");
      if (calendarElement) {
        console.log("이벤트 리스너 추가됨");
        calendarElement.addEventListener("click", handleDateClick);
        calendarElement.addEventListener("touchstart", handleDateClick);
        return calendarElement;
      }
      return null;
    };

    // 즉시 시도
    let element = addEventListeners();

    // 요소를 찾지 못했다면 잠시 후 재시도
    if (!element) {
      const timeoutId = setTimeout(() => {
        element = addEventListeners();
      }, 500);

      return () => {
        clearTimeout(timeoutId);
        if (element) {
          element.removeEventListener("click", handleDateClick);
          element.removeEventListener("touchstart", handleDateClick);
        }
      };
    }

    return () => {
      if (element) {
        element.removeEventListener("click", handleDateClick);
        element.removeEventListener("touchstart", handleDateClick);
      }
    };
  }, []);

  // 이벤트 클릭 핸들러 (무시)
  const handleSelectEvent = useCallback((event) => {
    // 이벤트 클릭은 무시하고 날짜 클릭만 처리
    console.log("이벤트 클릭됨 (무시):", event);
  }, []);

  // 이벤트 스타일 커스터마이징
  const eventStyleGetter = useCallback((event) => {
    const gathering = event.resource.gathering;
    let backgroundColor = "#3174ad";

    switch (gathering.category) {
      case "fitness":
        backgroundColor = "#e74c3c";
        break;
      case "running":
        backgroundColor = "#27ae60";
        break;
      case "yoga":
        backgroundColor = "#9b59b6";
        break;
      case "swimming":
        backgroundColor = "#3498db";
        break;
      case "cycling":
        backgroundColor = "##2196f3";
        break;
      default:
        backgroundColor = "#3174ad";
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.calendarContainer}>
        <h3 className={styles.calendarTitle}>모임 일정</h3>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.calendarContainer}>
        <h3 className={styles.calendarTitle}>모임 일정</h3>
        <div className={styles.error}>
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.calendarContainer}>
      <h3
        className={styles.calendarTitle}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: "pointer" }}
      >
        📅 모임 일정
        <span className={styles.expandIcon}>{isExpanded ? "▼" : "▶"}</span>
      </h3>

      {isExpanded && (
        <div className={styles.calendarWrapper}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 400 }}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleDateClick}
            eventPropGetter={eventStyleGetter}
            views={["month"]}
            defaultView="month"
            culture="ko"
            selectable={true}
            selectableStart="00:00"
            selectableEnd="23:59"
            popup={true}
            messages={{
              next: "다음",
              previous: "이전",
              today: "오늘",
              month: "월",
              week: "주",
              day: "일",
              agenda: "일정",
              date: "날짜",
              time: "시간",
              event: "이벤트",
              noEventsInRange: "이 기간에 일정이 없습니다.",
              showMore: (total) => `+${total}개 더 보기`,
            }}
          />
        </div>
      )}

      {/* 날짜별 일정 모달 */}
      {showDateModal && (
        <div className={styles.dateModal}>
          <div className={styles.dateModalContent}>
            <div className={styles.dateModalHeader}>
              <h4>
                {selectedDate
                  ? moment(selectedDate).format("YYYY년 MM월 DD일")
                  : "일정"}{" "}
                일정
              </h4>
              <button
                className={styles.closeButton}
                onClick={() => {
                  console.log("모달 닫기 버튼 클릭");
                  setShowDateModal(false);
                }}
              >
                ✕
              </button>
            </div>
            <div className={styles.dateModalBody}>
              {getGatheringsForDate(selectedDate).map((gathering) => (
                <div
                  key={gathering.gatheringId}
                  className={styles.gatheringItem}
                  onClick={() => {
                    // 일정 목록 모달은 닫고 모임 상세 모달 열기
                    setShowDateModal(false);
                    window.dispatchEvent(
                      new CustomEvent("showGatheringDetail", {
                        detail: { gathering },
                      })
                    );
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.gatheringTitle}>{gathering.title}</div>
                  <div className={styles.gatheringTime}>
                    {moment(gathering.nextMeetingDate).format("HH:mm")}
                  </div>
                  <div className={styles.gatheringCategory}>
                    {findCategory(gathering.category)?.icon}{" "}
                    {findCategory(gathering.category)?.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GatheringCalendar;
