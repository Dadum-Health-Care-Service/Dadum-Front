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
            borderColor: 'rgba(0, 0, 0, 1)',

            backgroundColor: sortedDoughnutData
              ? sortedDoughnutData.map(entries => {
                  const minLightness = 50;
                  const maxLightness = 100;
                  const ratio = entries[1] / totalSum;

                  const lightness = isPolar
                    ? 60 +
                      (minLightness +
                        (maxLightness - minLightness) * (1 - Math.min(ratio * 10, 2))) *
                        3
                    : minLightness + (maxLightness - minLightness) * (1 - Math.min(ratio * 10, 1)); // 값이 클수록 더 진하게 (50%~100% 밝기)
                  return `hsl(45, 100%, ${lightness}%,${isPolar ? 0.65 : 1})`; // 노란색(hue 45) 계열
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
        width: '90%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        zIndex: '0!important',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
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
            style={{ minHeight: '300px', background: 'transparent' }}
          />
        ) : (
          <Chart
            type="doughnut"
            data={chartData}
            options={options}
            style={{ minHeight: '300px', background: 'transparent' }}
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
