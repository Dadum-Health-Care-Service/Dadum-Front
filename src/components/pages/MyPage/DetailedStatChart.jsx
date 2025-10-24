import React, { useState, useMemo } from 'react';
import styles from './DetailedStatChart.module.css'; 

const KEY_MAP = {
    'step': { dataKey: 'stepData', timeKey: 'currentTime', unit: '걸음' },
    'heartRate': { dataKey: 'heartRateData', timeKey: 'time', unit: 'bpm' },
    'distance': { dataKey: 'distanceWalked', timeKey: 'currentTime', unit: 'km' },
    'calories': { dataKey: 'caloriesBurnedData', timeKey: 'currentTime', unit: 'kcal' },
    'activeCal': { dataKey: 'activeCaloriesBurned', timeKey: 'currentTime', unit: 'kcal' },
    'sleep': { dataKey: 'totalSleepMinutes', timeKey: 'currentTime', unit: '분' },
};

// Y축 최댓값 조정 함수
const adjustMax = (currentMax) => {
    if (currentMax <= 0) return 100;
    if (currentMax >= 1000) {
        return Math.ceil(currentMax / 100) * 100;
    } 
    if (currentMax >= 100) {
        return Math.ceil(currentMax / 10) * 10;
    }
    if (currentMax >= 10) {
        return Math.ceil(currentMax / 5) * 5;
    }
    return Math.ceil(currentMax);
};

// KST (한국 표준시) 기준 오늘 날짜의 자정을 구하는 함수
const getKSTStartOfDay = (date) => {
    const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    const kstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000)); // KST = UTC + 9

    const startOfDay = new Date(kstDate.getFullYear(), kstDate.getMonth(), kstDate.getDate());
    
    return new Date(startOfDay.getTime() - (9 * 60 * 60 * 1000)); 
};

const getChartConfig = (healthKey, rawData, filterType) => {
    
    const config = KEY_MAP[healthKey] || {};
    const { dataKey, timeKey, unit } = config;

    let title ="데이터";
    let valueFormatter = (value)=> Math.round(value).toLocaleString();
    switch(healthKey){
        case 'step': title = '걸음 수'; break;
        case 'heartRate': title = '심박수'; break;
        case 'distance': title = '걷기 거리'; valueFormatter = (value) => value.toFixed(2); break;
        case 'calories': title = '칼로리'; break;
        case 'activeCal': title = '활동 칼로리'; break;
        case 'sleep': title = '수면 시간'; break;
        default: break;
    }

    if (!Array.isArray(rawData) || rawData.length === 0) {
        return {
            title: title, unit: unit, avgValue: 0,
            yAxisMax: '100', yAxisMid: '50', valueFormatter: valueFormatter,
            extractedData: [], getBarHeights: () => [], filterType: filterType
        };
    }
    
    const now = new Date();
    const kstTodayStart = getKSTStartOfDay(now);
    
    let filterStart = new Date(kstTodayStart);
    let filterEnd = new Date(kstTodayStart); 
    filterEnd.setDate(kstTodayStart.getDate() + 1);

    if (filterType === '주') {
        filterStart.setDate(kstTodayStart.getDate() - 6);
    } else if (filterType === '월') {
        filterStart.setDate(kstTodayStart.getDate() - 29);
    } 

    const filteredRawData = rawData.filter(item => {
        const itemDate = new Date(item.currentTime); 
        return itemDate >= filterStart && itemDate < filterEnd; 
    });
    
    const extractedData = filteredRawData
        .map(item => {
            let dataValue = 0;
            let timeValue = item.currentTime; 

            if (!item) return null;

            if (dataKey === 'stepData' && Array.isArray(item.stepData)) {
                dataValue = item.stepData[0] || 0;

            } else if (dataKey === 'heartRateData') {
                const hrData = item.heartRateData;
                if (Array.isArray(hrData) && hrData.length > 0) {
                    dataValue = hrData[0].bpm || 0;
                    timeValue = hrData[0][timeKey]; 
                } else {
                     dataValue = 0;
                }
            } else if(dataKey === 'distanceWalked') {
                dataValue = (item.distanceWalked /1000) || 0;
            } else {
                dataValue = item[dataKey] || 0;
            }
            
            return dataValue > 0 ? { data: dataValue, time: timeValue } : null;
        })
        .filter(item => item !== null);

    if (extractedData.length === 0) {
        return {
            title: title, unit: unit, avgValue: 0,
            yAxisMax: '100', yAxisMid: '50', valueFormatter: valueFormatter,
            extractedData: [], getBarHeights: () => [], filterType: filterType
        };
    }

    const values = extractedData.map(d => d.data);
    const avgVal = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const actualMax = Math.max(...values, 1);
    const maxVal = adjustMax(actualMax);
    const yAxisMid = maxVal === 1 ? (maxVal/2).toFixed(1) : Math.round(maxVal / 2).toLocaleString();

    return { 
        title, unit, avgValue: avgVal,
        yAxisMax: maxVal.toLocaleString(), yAxisMid, 
        valueFormatter, extractedData, filterType,
        getBarHeights: () => values.map(val => `${(val / maxVal) * 100}%`)
    };
};

const DetailedStatChart = ({ healthData, healthKey, valueClass }) => {
  const [selectedTab, setSelectedTab] = useState('일'); 
  
  const chartConfig = useMemo(() => {
    if (!KEY_MAP[healthKey]) {
         return {
            title: '데이터 없음', unit: '', avgValue: 0,
            yAxisMax: '100', yAxisMid: '50', valueFormatter: (v) => v,
            extractedData: [], getBarHeights: () => [], filterType: selectedTab
        };
    }
    return getChartConfig(healthKey, healthData, selectedTab);
  }, [healthKey, healthData, selectedTab]);

  const barHeights = chartConfig.getBarHeights(); 
  
  const xAxisLabels = chartConfig.extractedData.map(d => {
    const date = new Date(d.time);
    
    if (selectedTab === '일') {
        return date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: 'numeric', timeZone: 'Asia/Seoul' });
    } else {
        return date.toLocaleDateString('ko-KR', { day: 'numeric', timeZone: 'Asia/Seoul' }); 
    }
  });

  const currentMonth = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', timeZone: 'Asia/Seoul' });

  return (
    <div className={styles.container}>
        <header className={styles.header}>
            <h1 className={styles.title}>{chartConfig.title}</h1>
        </header>
        
        <nav className={styles.tabs}>
            {['일', '주', '월'].map((tab) => (
            <button 
                key={tab} 
                className={`${styles.tab} ${tab === selectedTab ? styles.activeTab : ''}`}
                onClick={() => setSelectedTab(tab)}
            >
                {tab}
            </button>
            ))}
        </nav>

        {barHeights.length>0?(
            <>
                <section className={styles.averageInfo}>
                    <p className={styles.averageLabel}>{selectedTab}별 평균</p>
                    <p className={styles.averageValue}>
                        {chartConfig.valueFormatter(chartConfig.avgValue)}
                        <span className={styles.unitText}>{chartConfig.unit}</span>
                    </p>
                    <p className={styles.dateText}>{currentMonth}</p>
                </section>
                <section className={styles.graphContainer}>
                    {/* Y축 레이블 */}
                    <div className={styles.yAxisLabels}>
                        <span className={styles.yLabel}>{chartConfig.yAxisMax}</span>
                        <span className={styles.yLabel}>{chartConfig.yAxisMid}</span>
                        <span className={`${styles.yLabel} ${styles.yLabelBottom}`}>0</span>
                    </div>

                    {/* 실제 막대 그래프 */}
                    <div className={styles.barChart}>
                        {barHeights.length > 0 ? (
                            <div className={styles.barSet}>
                                {barHeights.map((height, index) => (
                                    <div 
                                        key={index} 
                                        className={styles.bar} 
                                        style={{ height: height, backgroundColor:valueClass }}
                                    ></div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.noData}>선택한 기간에 데이터가 없습니다.</div>
                        )}
                        
                        {/* X축 레이블 */}
                        <div className={styles.xAxisLabels} style={{ gridTemplateColumns: `repeat(${xAxisLabels.length}, 1fr)` }}>
                            {xAxisLabels.map((label, index) => (
                                <span key={index}>{label}</span>
                            ))}
                        </div>
                    </div>
                </section>
            </>
        ) : (
            <div className="text-center p-2 mb-3">선택한 기간에 데이터가 없습니다.</div>
        )}
    </div>
  );
};

export default DetailedStatChart;