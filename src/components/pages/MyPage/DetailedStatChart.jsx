import React, { useState, useMemo, useRef, useEffect } from 'react';
import styles from './DetailedStatChart.module.css'; 
import DoughnutChart from '../../common/chart/DoughnutChart';

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

    return startOfDay;
    //return new Date(startOfDay.getTime() - (9 * 60 * 60 * 1000)); 
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
        filterStart.setDate(kstTodayStart.getDate() - 7);
    } else if (filterType === '월') {
        filterStart.setDate(kstTodayStart.getDate() - 30);
    } 

    const filteredRawData = rawData.filter(item => {
        const itemDate = new Date(item.currentTime); 
        return itemDate >= filterStart && itemDate < filterEnd; 
    });

    const groupData = new Map();
    filteredRawData.forEach(item => {
        const itemDate = new Date(item.currentTime);
        let groupKey = '';
        let dataValue = 0;

        if(filterType === '일'){
            groupKey = itemDate.toLocaleTimeString('ko-KR',{hour:'2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' });
        } else {
            groupKey = itemDate.toISOString().substring(0,10);
        }

        if(dataKey === 'stepData' && Array.isArray(item.stepData)){
            dataValue = item.stepData.reduce((sum, current)=> sum+current, 0);
        } else if(dataKey === 'heartRateData'){
            const hrData = item.heartRateData;
            if(Array.isArray(hrData) && hrData.length >0){
                dataValue = hrData[hrData.length-1].bpm || 0;
            } else dataValue = 0;
        } else if(dataKey === 'distanceWalked'){
            dataValue = (item.distanceWalked / 1000) || 0;
        } else if(dataKey === 'totalSleepMinutes'){
            dataValue = {
                total:(item.totalSleepMinutes) ||0,
                rem:(item.remSleepMinutes)||0,
                deep:(item.deepSleepMinutes)||0,
                light:(item.lightSleepMinutes)||0
            };
        } else {
            dataValue = item[dataKey] || 0;
        }

        if(healthKey === 'sleep'){
            const current = groupData.get(groupKey) || {
                sumTotal:0, sumRem:0, sumDeep:0, sumLight:0, count:0, firstTime:item.currentTime
            };
            current.sumTotal += dataValue.total;
            current.sumRem += dataValue.rem;
            current.sumDeep += dataValue.deep;
            current.sumLight += dataValue.light;
            current.count++;
            groupData.set(groupKey, current);
        } else if(healthKey==='heartRate'){
            if(filterType==='일'){
                groupData.set(
                    item.currentTime, 
                    {sum:dataValue, count:1, firstTime:(Array.isArray(item.heartRateData) && item.heartRateData.length >0)
                                                        ?(item.heartRateData[item.heartRateData.lengh-1]?.time || 0)
                                                        :item.currentTime}
                )
            } else {
                const current = groupData.get(groupKey) || {sum:0, count:0, firstTime:item.currentTime};
                current.sum += dataValue;
                current.count++;
                groupData.set(groupKey, current);
            }
        } else {
            const current = groupData.get(groupKey) || { sum: 0, count: 0, firstTime: item.currentTime };
            current.sum += dataValue;
            current.count++;
            groupData.set(groupKey, current);
        }
    });

    const extractedData = [];
    groupData.forEach((group, key)=>{
        if(healthKey === 'sleep'){
            if(group.sumTotal > 0){
                extractedData.push({
                    data:{
                        totalSleepMinutes: group.sumTotal,
                        remSleepMinutes: group.sumRem,
                        deepSleepMinutes: group.sumDeep,
                        lightSleepMinutes: group.sumLight
                    },
                    time: group.firstTime
                });
            }
        } else if(healthKey==='heartRate' && filterType==='일'){
            if(group.sum >0){
                extractedData.push({data: group.sum, time: group.firstTime});
            }
        } else {
            if(group.count > 0 && group.sum >0){
                const avgValue = group.sum / group.count;
                extractedData.push({data:avgValue, time:group.firstTime});
            }
        }
    });

    if (extractedData.length === 0) {
        return {
            title: title, unit: unit, avgValue: 0,
            yAxisMax: '100', yAxisMid: '50', valueFormatter: valueFormatter,
            extractedData: [], getBarHeights: () => [], filterType: filterType
        };
    }

    const values = extractedData.map(d => {
        return healthKey === 'sleep' ? d.data.totalSleepMinutes : d.data
    });
    const avgVal = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const actualMax = Math.max(...values, 1);
    const maxVal = adjustMax(actualMax);
    const yAxisMid = maxVal === 1 ? (maxVal/2).toFixed(1) : Math.round(maxVal / 2).toLocaleString();

    if(healthKey==='sleep'){
        const totalREM = extractedData.reduce((sum,d)=> sum+(d?.data?.remSleepMinutes || 0),0);
        const totalLight = extractedData.reduce((sum,d)=> sum+(d?.data?.lightSleepMinutes|| 0),0);
        const totalDeep = extractedData.reduce((sum,d)=>sum+(d?.data?.deepSleepMinutes || 0),0);

        const avgDisplayValue = avgVal;

        const totalSleepData={
            '렘 수면':totalREM,
            '얕은 수면':totalLight,
            '깊은 수면':totalDeep,
        };

        return {
            title, unit, avgValue:avgDisplayValue,
            yAxisMax: maxVal.toLocaleString(), yAxisMid, 
            valueFormatter, extractedData, filterType, totalSleepData,
            getBarHeights:()=>values.map(val=>`${(val/maxVal)*100}%`)
        };

    }

    return { 
        title, unit, avgValue: avgVal,
        yAxisMax: maxVal.toLocaleString(), yAxisMid, 
        valueFormatter, extractedData, filterType,
        getBarHeights: () => values.map(val => `${(val / maxVal) * 100}%`)
    };
};

const DetailedStatChart = ({ healthData, healthKey, valueClass }) => {
  const [selectedTab, setSelectedTab] = useState('일'); 
  const [showDoughnut, setShowDoughnut] = useState(false);
  const doughnutContainerRef = useRef(null);

  const toggleDoughnut = ()=>{
    if(healthKey==='sleep'){
        setShowDoughnut(prev => !prev);
    }
  };

  useEffect(()=>{
    if(showDoughnut&&doughnutContainerRef.current){
        doughnutContainerRef.current.scrollIntoView({
            behavior:'smooth',
            block:'start'
        });
    }
  },[showDoughnut]);
  
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

  const graphContainerStyle = healthKey==='sleep'?{cursor:'pointer'}:{};
  const clickableClass = healthKey==='sleep'? styles.clickableGraph:'';
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
                <section className={`${styles.graphContainer} ${clickableClass}`} style={graphContainerStyle} onClick={toggleDoughnut}>
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
        {healthKey==='sleep' && showDoughnut && chartConfig.totalSleepData && (
            <div style={{marginTop:'20px'}} onClick={toggleDoughnut} ref={doughnutContainerRef}>
                <DoughnutChart
                    doughnutData={chartConfig.totalSleepData}
                    isMobile={false}
                    isPolar={false}
                />
            </div>
        )}
    </div>
  );
};

export default DetailedStatChart;