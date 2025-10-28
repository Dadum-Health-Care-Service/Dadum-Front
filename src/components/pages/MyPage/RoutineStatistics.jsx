import { useContext, useEffect, useMemo, useState } from 'react';
import styles from './RoutineStatistics.module.css';
import { AuthContext } from '../../../context/AuthContext';
import { useApi } from '../../../utils/api/useApi';
import { Badge, Card, CardBody, Container, Dropdown } from 'react-bootstrap';
import BarChart from '../../common/chart/BarChart';
import LineChart from '../../common/chart/LineChart';
import DoughnutChart from '../../common/chart/DoughnutChart';
import LoadFail from '../../common/chart/LoadFail';
import RadialGradientSpinner from '../../common/chart/RadialGradientSpinner';
import { useModal } from '../../../context/ModalContext';
import ContainerComponent from '../../common/ContainerComponent';

const keyMap = {
    muscle:'근육 사용량',
    setTotal: '총 세트수',
    volumeTotal: '볼륨 총합',
    rouTime: '총 운동시간',
};

const redKeyMap = {
    muscle:'근육 사용량',
    kcal : '칼로리 소모량',
    reSet:'총 세트 수',
    setNum:'세트별 횟수',
    volum:'운동 볼륨',
    rouTime: '총 운동 시간',
    exVolum:'특정 종목 수행 수',
};

const toLocalDateTime = date => {
    const offsetMs = 9 * 60 * 60 * 1000; // UTC+9
    const koreaTime = new Date(date.getTime() + offsetMs);
    return koreaTime.toISOString().slice(0, 19);
};

const dataToChart = (type, data)=>{
    if(!data) return undefined;
    switch (type){
        case 'kcal':
            return data.map(routine => {
                return {data: routine.tEnd, kcal: routine.routineResult.kcal, rouId: routine.id};
            });
        case 'growth':
            return data.map(routine => {
                return {
                    data: routine.tEnd,
                    muscle: routine.routineResult.muscle,
                    setTotal: routine.routineResult.reSet * routine.routineResult.setNum,
                    volumeTotal: routine.routineResult.volum,
                    rouTime: routine.routineResult.rouTime,
                };
            });
        case 'activity':
            const activitySet = {};
            data.forEach(routine=>{
                routine.routineEndDetails.forEach(red=>{
                    if(red.srName !== '운동이름'){
                        if(activitySet[red.srName]){
                            activitySet[red.srName] += red.reps * red.setNumber;
                        } else {
                            activitySet[red.srName] = red.reps * red.setNumber;
                        }
                    }
                });
            });
            return activitySet;
        default: return undefined;
    }
};

const dataToCompare = (type, thisData, lastData) =>{
    if (!thisData || !lastData){
        return type === 'growth' ? [0,0,0,0] : 0;
    }
    const reduceFn = (data,key)=> data.reduce((acc,val)=> acc + (val.routineResult[key]||0),0);
    switch (type){
        case 'kcal':
            return reduceFn(thisData,'kcal') - reduceFn(lastData,'kcal');
        case 'growth':
            const keys = ['muscle', 'reSet', 'volum', 'rouTime'];
            return keys.map(key => reduceFn(thisData, key) - reduceFn(lastData, key));
        case 'activity':
            const getUniqueActivities = data => new Set(data.flatMap(e => e.routineEndDetails.map(detail => detail.srName))).size;
            return getUniqueActivities(thisData) - getUniqueActivities(lastData);
        default: return 0;
    }
};

export default function RoutineStatPage(){
    const { user }= useContext(AuthContext);
    const { POST } = useApi();
    const { showConfirmModal }= useModal();
    const [toggle, setToggle] = useState('week');
    const [originData, setOriginData]= useState(null);
    const [chartData, setChartData]=useState({
        bar:null, line:null, doughnut: null
    });
    const [compareCalcs, setCompareCalcs] = useState({
        kcal: 0, growth: [], activity:0, activityTop:''
    });
    const [selectMenu, setSelectMenu]=useState('muscle');

    const [mobile,setMobile]=useState(window.innerWidth <= 450);

    const fetchRoutineData = async (type, last) =>{
        const interval = type === 'week' ? 7 : 30;

        const endDate = new Date();
        if (last) {
            endDate.setDate(endDate.getDate()-interval); 
        }

        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - interval);

        try {
            const res = await POST('/routine/result',{
                startDate: toLocalDateTime(startDate), 
                endDate: toLocalDateTime(endDate)
            });
            console.log('fetch Data:',res.data);
            return res.data;
        } catch (e){
            console.log(`fetch${type}Data Error:`,e);
        }
    };

    useEffect(()=>{
        const handleResize = ()=>setMobile(window.innerWidth <=450);
        window.addEventListener('resize',handleResize);
        return ()=> window.removeEventListener('resize',handleResize);
    },[mobile]);

    useEffect(()=>{
        if(!user?.usersId) {
            showConfirmModal('사용자 정보를 찾을 수 없습니다','네트워크 에러','확인을 누르시면 로그아웃 됩니다',()=>{dispatch({ type: "LOGOUT" });});
            return;
        };

        const setInitData = async ()=>{
            setOriginData(null);

            const currentData = await fetchRoutineData(toggle);
            const compareData = await fetchRoutineData(toggle, true);

            if(!currentData){
                setOriginData([]);
                setChartData({bar:null, line:null, doughnut:null});
                return;
            }

            const bar = dataToChart('kcal',currentData);
            const line = dataToChart('growth',currentData);
            const doughnut = dataToChart('activity', currentData);

            setOriginData(currentData);
            setChartData({bar,line,doughnut});

            const kcalCalc = dataToCompare('kcal',currentData, compareData);
            const growthCalc = dataToCompare('growth',currentData, compareData);
            const activityCalc = dataToCompare('activity',currentData, compareData);

            let activityTop = '';
            if(doughnut && Object.keys(doughnut).length >0){
                activityTop = Object.entries(doughnut).sort((a,b)=>b[1]-a[1])[0][0];
            } else {
                activityTop='기록된 활동';
            }

            setCompareCalcs({
                kcal: kcalCalc,
                growth: growthCalc,
                activity: activityCalc,
                activityTop: activityTop
            });
        };

        setInitData();
    },[user?.usersId, toggle]);

    const redCalcMap = useMemo(()=>{
        const [muscle, setTotal, volumeTotal, rouTime] = compareCalcs.growth;
        return {
            muscle: `${muscle}%`,
            setTotal: `${setTotal}회`,
            volumeTotal: `${volumeTotal}kg`,
            rouTime: `${(rouTime / 60).toFixed(2)}시간`,
        };
    },[compareCalcs.growth]);
    
    const RenderStatus = ({data})=>{
        if(data === null) return <RadialGradientSpinner />;
        if(data.length===0){
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: '#808080ff', gap: '1em' }}>
                    <i className={`fa-solid fa-file-circle-xmark fa-4x`}></i>
                    기간 내 운동 기록이 없어요
                </div>
            );
        }
        return <LoadFail />;
    };

    const LogSection = () =>{
        if (originData === null || originData.length === 0) {
            return (
                <div className={styles['stats-logs']}>
                    <RenderStatus data={originData} />
                </div>
            );
        }

        return (
            <div className={styles['stats-logs']}>
                {originData.map((data, i) => (
                    <Card key={i} style={{ 
                        minHeight: '200px', 
                        minWidth: '200px',
                        height:'100%',
                        width:'100%',
                        marginBottom: '10px'
                        }}
                    >
                        <Card.Header>{`루틴 ${data.tStart.substring(0, 10)} ${data.tStart.substring(11, 16)} ~ ${data.tEnd.substring(11, 16)}`}</Card.Header>
                        <Card.Body>
                            <div className={styles['red-details']}>
                                {Object.entries(data.routineResult).map(entry => {
                                    if (entry[0] === 'rrId') return null;
                                    return (
                                        <div className={styles['red-detail']} key={entry[0]}>
                                            <div className={styles['red-key']}>{redKeyMap[entry[0]]}</div>
                                            <div className={styles['red-value']}>{entry[1]}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className='pt-3'>
                                {data.routineEndDetails.map((red, index) => (
                                    <Badge key={index} bg="undefined" className={styles['red-badge']}>
                                        {red.srName}
                                    </Badge>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <ContainerComponent variant='elevated' className='mb-4'>
            <div className={styles.stats}>
                <div className={styles['stats-title']}>
                    <h1 style={{ fontWeight: 'bold' }}>
                        이번 <span className={styles['stats-span']}>{toggle === 'week' ? '주' : '달'}</span> 운동 통계
                    </h1>
                    <div className={styles['stats-toggle']}>
                        <div
                            className={`${styles['stats-toggle-item']} ${toggle === 'week' ? styles['on'] : styles['off']}`}
                            onClick={() => { setToggle('week'); }}
                        >
                            <i className='fa-solid fa-calendar-week'></i> 주별
                        </div>

                        <div
                            className={`${styles['stats-toggle-item']} ${toggle === 'month' ? styles['on'] : styles['off']}`}
                            onClick={() => { setToggle('month'); }}
                        >
                            <i className="fa-solid fa-calendar-days"></i> 월별
                        </div>
                    </div>
                </div>

                
                <ContainerComponent variant='filled' className={mobile ? '' : 'p-3'}>
                    <div className='d-flex flex-column' style={{gap:'1rem'}}>
                        {/* 1. 칼로리 소모량 (Bar Chart) */}
                        <div className={mobile ? styles['shadow-overlay-mobile'] : styles['shadow-overlay']}>
                            <div className={mobile ? styles['stats-chart-mobile'] : styles['stats-chart']}>
                                <div className={styles['chart-title']}>
                                    <div className={styles['title-container']}>
                                        <h2 className={styles['stats-h2']}>
                                            이번 {toggle === 'week' ? '주' : '달'} <span className={styles['stats-span']}>칼로리</span> 소모량
                                        </h2>
                                        <h5 className={styles['stats-h5']}>
                                            저번{toggle === 'week' ? '주' : '달'} 보다 {compareCalcs.kcal} kcal 더 소모했어요
                                        </h5>
                                    </div>
                                </div>
                                <BarChart barData={chartData.bar} isMobile={mobile} />
                            </div>
                        </div>

                        {/* 2. 성장 추이 (Line Chart) */}
                        <div className={mobile ? styles['shadow-overlay-mobile'] : styles['shadow-overlay']}>
                            <div className={mobile ? styles['stats-chart-mobile'] : styles['stats-chart']}>
                                <div className={styles['chart-title']}>
                                    <div className={styles['title-container']}>
                                        <div className={mobile ? styles['title-dropdown-mobile'] : styles['title-dropdown']}>
                                            <div className={styles['title']}>
                                                <h2 className={styles['stats-h2']}>
                                                    이번 {toggle === 'week' ? '주' : '달'} <span className={styles['stats-span']}>{keyMap[selectMenu]}</span> 성장 추이
                                                </h2>
                                                <h5 className={styles['stats-h5']}>
                                                    저번{toggle === 'week' ? '주' : '달'}보다 {redCalcMap[selectMenu]} 더 성장했어요
                                                </h5>
                                            </div>
                                            <Dropdown className="pb-2">
                                                <Dropdown.Toggle 
                                                    style={{
                                                        minWidth: mobile ? '70px' : '100px', 
                                                        fontSize: mobile ? '9px' : 'inherit', 
                                                        ...({
                                                            backgroundColor: '#3d8bfd', 
                                                            border: 'none', 
                                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                                                        })
                                                    }}
                                                >
                                                    {keyMap[selectMenu] || '선택'}
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu 
                                                    style={{ 
                                                        width: mobile ? '100%' : 'unset', 
                                                        minWidth: 'unset', 
                                                        fontSize: mobile ? '9px' : 'inherit' 
                                                    }}
                                                >
                                                    {Object.keys(keyMap).map((data, i) => (
                                                        <Dropdown.Item key={i} onClick={() => { setSelectMenu(data); }} >
                                                            {keyMap[data]}
                                                        </Dropdown.Item>
                                                    ))}
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </div>
                                    </div>
                                </div>
                                <LineChart lineData={chartData.line} lineState={selectMenu} isMobile={mobile} />
                            </div>
                        </div>

                        {/* 3. 운동 트렌드 & 퍼포먼스 (Doughnut Charts) */}
                        <div className={mobile ? styles['shadow-overlay-mobile'] : styles['shadow-overlay']}>
                            <div className={mobile ? styles['stats-chart-mobile'] : styles['stats-chart-side']}>
                                <div className={styles['chart-title']}>
                                    <h2 className={styles['stats-h2']}>이번 {toggle === 'week' ? '주' : '달'} 운동 <span className={styles['stats-span']}>트렌드</span></h2>
                                    <h5 className={styles['stats-h5']}>
                                        {`이번 ${toggle === 'week' ? '주는' : '달은'} ${compareCalcs.activityTop}을 가장 많이 했어요`}
                                    </h5>
                                </div>
                                <DoughnutChart doughnutData={chartData.doughnut} isPolar={true} isMobile={mobile} />

                                <div className={styles['chart-title']}>
                                    <h2 className={styles['stats-h2']}>이번 {toggle === 'week' ? '주' : '달'} 운동 <span className={styles['stats-span']}>퍼포먼스</span></h2>
                                    <h5 className={styles['stats-h5']}>
                                        저번{toggle === 'week' ? '주' : '달'}보다 {compareCalcs.activity}개 더 다양하게 운동했어요
                                    </h5>
                                </div>
                                <DoughnutChart doughnutData={chartData.doughnut} isPolar={false} isMobile={mobile} />
                            </div>
                        </div>

                        {/* 4. 운동 퍼포먼스 로그 (Log Section) */}
                        <div className={mobile ? styles['shadow-overlay-mobile'] : styles['shadow-overlay']}>
                            <div className={mobile ? styles['stats-chart-mobile'] : styles['stats-chart']}>
                                <div className={styles['chart-title']}>
                                    <h2 className={styles['stats-h2']}>이번 {toggle === 'week' ? '주' : '달'} <span className={styles['stats-span']}>운동 퍼포먼스</span> 로그</h2>
                                    <h5 className={styles['stats-h5']}>
                                        이번 {toggle === 'week' ? '주' : '달'} 운동의 더 상세한 데이터를 볼 수 있어요
                                    </h5>
                                </div>
                                <LogSection />
                            </div>
                        </div>
                    </div>
                </ContainerComponent>    
            </div>
        </ContainerComponent>
    );
}