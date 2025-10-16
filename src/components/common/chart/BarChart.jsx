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
  
  const rowData = barData?.map(data => {
    return data.date.substring(0, 10);
  });
  const chartRow = rowData?.filter((data, index) => {
    return rowData.indexOf(data) === index;
  });
  const chartData = chartRow?.reduce((acc, date) => {
    acc[date] = [];
    return acc;
  }, {});
  barData?.forEach(data => {
    chartData[data.date.substring(0, 10)].push(data.kcal);
  });

  const maxLength = chartData ? Math.max(...Object.values(chartData).map(arr => arr.length)) : null;

  //색상용 (노랑)
  const baseHue = 45;
  const baseSaturation = 100;
  const maxLightness = 80;
  const minLightness = 50;

  const stackedBarDatasets = Array.from({ length: maxLength }, (_, i) => {
    const ratio = 1 - i / (maxLength - 1 || 1);
    const lightness = minLightness + (maxLightness - minLightness) * ratio;
    return {
      type: 'bar',
      label: `루틴 ${i + 1}`,
      data: chartRow.map(label => chartData[label][i] ?? null),
      backgroundColor: `hsl(${baseHue}, ${baseSaturation}%, ${lightness}%)`,
      barThickness: chartRow.length > 7 ? (isMobile ? 5 : 20) : isMobile ? 20 : 50,
    };
  });

  const lineDataset = {
    type: 'line',
    label: '칼로리 소모 추이',
    data: chartRow?.map(label => {
      const values = Array.from({ length: maxLength }, (_, i) => chartData[label][i] ?? 0);
      const sum = values.reduce((a, b) => a + b, 0);
      return values.length ? sum / values.length : 0;
    }),
    borderColor: 'rgba(0, 0, 0, 1)',
    backgroundColor: '#ffc800',
    fill: false,
    tension: 0,
    yAxisID: 'y',
  };
  const datasets = [lineDataset, ...stackedBarDatasets];
  const data = barData
    ? {
        labels: chartRow,
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
        width: '90%',
        height: '100%',
        zIndex: '10',
        position: 'relative',
        overflow: 'hidden',
        zIndex: '0!important',
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
            style={{ minHeight: '300px', background: 'transparent' }}
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
