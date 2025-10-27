import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  PolarAreaController,
  DoughnutController,
  RadialLinearScale,
  ArcElement,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import { Chart } from 'react-chartjs-2';
import RadialGradientSpinner from './RadialGradientSpinner';
import LoadFail from './LoadFail';

export default function DoughnutChart({ doughnutData, isMobile, isPolar }) {
  ChartJS.register(
    PolarAreaController,
    DoughnutController,
    RadialLinearScale,
    ArcElement,
    Tooltip,
    Legend,
    Title,
    BarElement,
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Legend,
    Tooltip,
  );
  const [sortedDoughnutData, setSortedDoughnutData] = useState([]);
  const [sortedRowData, setSortedRowData] = useState([]);
  const [chartData, setChartData] = useState(null);
  const totalSum = sortedDoughnutData
    ? sortedDoughnutData.reduce((acc, [_, value]) => acc + value, 0)
    : null;

  function getLogScaledData(entries) {
    return entries.map(([label, value]) => [label, Math.log(value + 1)]);
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    zIndex: 0,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          generateLabels(chart) {
            const original = ChartJS.overrides.doughnut.plugins.legend.labels.generateLabels;
            const labels = original(chart);
            return labels.slice(0, 10).reverse();
          },
          font: {
            size: isMobile ? 8 : 14,
          },
          boxWidth: 10, // 색상 박스 너비 (기본 40px 정도)
          boxHeight: 10, // 색상 박스 높이 (기본 없음, boxWidth와 같음)
          padding: 8,
        },
      },
    },
  };

  useEffect(() => {
    if (doughnutData) {
      setSortedDoughnutData(
        isPolar
          ? getLogScaledData(
              Object.entries(doughnutData)
                .sort((a, b) => a[1] - b[1])
                .slice(Object.entries(doughnutData).length - 5),
            )
          : Object.entries(doughnutData).sort((a, b) => a[1] - b[1]),
      );
    }
  }, [doughnutData]);
  useEffect(() => {
    setSortedRowData(
      sortedDoughnutData?.map(entries => {
        return entries[0];
      }),
    );
  }, [sortedDoughnutData]);
  useEffect(() => {
    if (!sortedRowData.length !== 0)
      setChartData({
        labels: sortedRowData,
        datasets: [
          {
            type: isPolar ? 'polarArea' : 'doughnut',
            data: sortedDoughnutData
              ? sortedDoughnutData.map(entries => {
                  return entries[1];
                })
              : [],
            borderColor: 'rgba(0, 0, 0, 0.5)',
            borderWidth:1,

            backgroundColor: sortedDoughnutData
              ? sortedDoughnutData.map(entries => {
                  const minLightness = 50;
                  const maxLightness = 100;
                  const ratio = entries[1] / totalSum;
                  const label = entries[0];

                  const lightness = isPolar
                    ? 60 +
                      (minLightness +
                        (maxLightness - minLightness) * (1 - Math.min(ratio * 10, 2))) *
                        3
                    : minLightness + (maxLightness - minLightness) * (1 - Math.min(ratio * 10, 1)); // 값이 클수록 더 진하게 (50%~100% 밝기)
                  
                  let HUE = 220;
                  let SATURATION = '90%';
                  let FINAL_LIGHTNESS = lightness;

                  if(label.includes('깊은 수면')) {
                    HUE = 0;
                    SATURATION='0%';
                    FINAL_LIGHTNESS=15;
                  }else if(label.includes('렘 수면')){
                    HUE=0;
                    SATURATION='0%';
                    FINAL_LIGHTNESS=45;
                  }else if(label.includes('얕은 수면')){
                    HUE=0;
                    SATURATION='0%';
                    FINAL_LIGHTNESS=75;
                  }
                  return `hsl(${HUE}, ${SATURATION}, ${FINAL_LIGHTNESS}%,${isPolar ? 0.8 : 1})`; // 파란색(hue 220) 계열
                })
              : [],
            fill: false,
            tension: 0,
            yAxisID: 'y',
          },
        ],
      });
  }, [sortedDoughnutData, sortedRowData]);
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
        marginBottom:'1rem'
      }}
    >
      {doughnutData && chartData ? (
        Object.values(doughnutData).length === 0 ? (
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
        ) : isPolar ? (
          <Chart
            type="polarArea"
            data={chartData}
            options={options}
            style={{ minHeight: '300px', minWidth:'200px', background: 'transparent' }}
          />
        ) : (
          <Chart
            type="doughnut"
            data={chartData}
            options={options}
            style={{ minHeight: '300px', minWidth:'200px', background: 'transparent' }}
          />
        )
      ) : doughnutData === undefined ? (
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
