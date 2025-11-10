import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card } from 'react-bootstrap';
import { Chart } from 'react-chartjs-2';
import LoadFail from './LoadFail';
import RadialGradientSpinner from './RadialGradientSpinner';

export default function BarChart({ barData, isMobile }) {
  ChartJS.register(
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Legend,
    Tooltip,
  );

  const allDates = barData?.map(data => data?.data?.substring(0,10)).filter((data,index,self)=>self.indexOf(data)===index).sort();

  const allRouIds = barData?.map(data=>data?.rouId).filter((id,index,self)=>self.indexOf(id)===index).sort((a,b)=>a-b);

  const chartDataByRouId = allRouIds?.reduce((acc,rouId)=>{
    acc[rouId] = allDates.map(date=>{
      const sumKcal = barData.filter(d=>d?.rouId === rouId && d?.data?.substring(0,10)===date).reduce((sum,r)=>sum+r.kcal,0);
      return sumKcal > 0 ? sumKcal : null;
    });
    return acc;
  },{});  

  //색상용 (파랑)
  const baseHue = 220;
  const baseSaturation = 80;
  const maxLightness = 70;
  const minLightness = 40;

  const stackedBarDatasets = allRouIds?.map((rouId,i)=>{
    const totalRoutines = allRouIds.length || 1;
    const ratio = 1-i/(totalRoutines-1||1);
    const lightness = minLightness+(maxLightness-minLightness)*ratio;

    return {
      type:'bar',
      label:`루틴 ${i+1}`,
      data:chartDataByRouId[rouId],
      backgroundColor: `hsl(${baseHue}, ${baseSaturation}%, ${lightness}%)`,
      barThickness: allRouIds.length > 5 ? (isMobile?5:15):isMobile?20:50,
    };
  })||[];

  const lineDataset = {
    type: 'line',
    label: '총 칼로리 소모 추이',
    data: allDates?.map(date=>{
      return barData.filter(d=>d?.data?.substring(0,10)===date).reduce((sum,r)=>sum+r.kcal,0);
    }),
    borderColor: 'rgba(0, 0, 0, 0.5)',
    backgroundColor: '#3d8bfd',
    borderWidth:2,
    fill: false,
    tension: 0,
    yAxisID: 'y',
  };
 
  const datasets = [lineDataset, ...stackedBarDatasets];
  const data = barData
    ? {
        labels: allDates,
        datasets: datasets,
      }
    : null;
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    zIndex: 0,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        beginAtZero: true,
        stacked: true,
      },
    },
  };

  return (
    <Card
      style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        padding:'20px',
        zIndex:'0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {barData ? (
        barData.length === 0 ? (
          <div
            style={{
              minHeight: '300px',
              background: 'transparent',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: '1em',
            }}
          >
            <i className={`fa-solid fa-file-circle-xmark fa-4x`} style={{ color: '#808080ff' }}></i>
            기간 내 운동 기록이 없어요
          </div>
        ) : (
          <Chart
            data={data}
            options={options}
            style={{ 
              minHeight: '300px', 
              minWidth: '200px',
              background: 'transparent' 
            }}
          />
        )
      ) : barData === undefined ? (
        <div
          style={{
            minHeight: '300px',
            background: 'transparent',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <LoadFail />
        </div>
      ) : (
        <div
          style={{
            minHeight: '300px',
            background: 'transparent',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <RadialGradientSpinner />
        </div>
      )}
    </Card>
  );
}
