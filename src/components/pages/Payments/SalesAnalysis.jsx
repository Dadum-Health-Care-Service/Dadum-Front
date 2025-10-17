import React, { useState, useEffect } from 'react';
import { useApi } from '../../../utils/api/useApi';
import ButtonComponent from '../../common/ButtonComponent';
import CardComponent from '../../common/CardComponent';
import SalesChart from './components/SalesChart';
import styles from './SalesAnalysis.module.css';

const SalesAnalysis = () => {
  const { GET } = useApi();
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 기간 옵션
  const periodOptions = [
    { value: '7days', label: '최근 7일' },
    { value: '30days', label: '최근 30일' },
    { value: '90days', label: '최근 90일' },
    { value: '1year', label: '최근 1년' },
    { value: 'custom', label: '사용자 지정' }
  ];

  // 카테고리 옵션
  const categoryOptions = [
    { value: 'all', label: '전체' },
    { value: 'equipment', label: '운동기구' },
    { value: 'clothing', label: '운동복' },
    { value: 'supplement', label: '보충제' }
  ];

  // 매출 데이터 로드
  const loadSalesData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 여러 API 엔드포인트에서 데이터를 병렬로 가져오기
      const [summaryResponse, dailyResponse, categoryResponse, productsResponse] = await Promise.allSettled([
        GET('/seller/analytics/summary', {
          period: selectedPeriod,
          category: selectedCategory
        }),
        GET('/seller/analytics/daily-sales', {
          period: selectedPeriod,
          category: selectedCategory
        }),
        GET('/seller/analytics/category-sales', {
          period: selectedPeriod,
          category: selectedCategory
        }),
        GET('/seller/analytics/top-products', {
          period: selectedPeriod,
          category: selectedCategory,
          limit: 5
        })
      ]);

      // 응답 데이터 처리 및 변환
      console.log('📊 API 응답 데이터:', {
        summary: summaryResponse.status === 'fulfilled' ? summaryResponse.value.data : null,
        daily: dailyResponse.status === 'fulfilled' ? dailyResponse.value.data : null,
        category: categoryResponse.status === 'fulfilled' ? categoryResponse.value.data : null,
        products: productsResponse.status === 'fulfilled' ? productsResponse.value.data : null
      });

      const summaryData = summaryResponse.status === 'fulfilled' 
        ? transformApiData(summaryResponse.value.data, 'summary')
        : null;
      const dailyData = dailyResponse.status === 'fulfilled' 
        ? transformApiData(dailyResponse.value.data.dailySales, 'dailySales')
        : [];
      const categoryData = categoryResponse.status === 'fulfilled' 
        ? transformApiData(categoryResponse.value.data.categorySales, 'categorySales')
        : [];
      const productsData = productsResponse.status === 'fulfilled' 
        ? transformApiData(productsResponse.value.data.topProducts, 'topProducts')
        : [];

      // 데이터 통합
      const integratedData = {
        summary: summaryData || {
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          growthRate: 0
        },
        dailySales: dailyData,
        categorySales: categoryData,
        topProducts: productsData,
        monthlyTrend: [] // 월별 트렌드는 별도 API 호출 필요시 구현
      };

      setSalesData(integratedData);
    } catch (err) {
      console.error('매출 데이터 로드 실패:', err);
      
      // 에러 타입에 따른 메시지 분기
      if (err.response?.status === 401) {
        setError('로그인이 필요합니다. 다시 로그인해주세요.');
      } else if (err.response?.status === 403) {
        setError('매출 데이터에 접근할 권한이 없습니다.');
      } else if (err.response?.status === 404) {
        setError('매출 데이터를 찾을 수 없습니다.');
      } else if (err.code === 'NETWORK_ERROR') {
        setError('네트워크 연결을 확인해주세요.');
      } else {
        setError('매출 데이터를 불러오는데 실패했습니다.');
      }
      
      // 백엔드 API가 없을 경우 더미 데이터 사용
      setSalesData(getDummyData());
    } finally {
      setLoading(false);
    }
  };

  // 백엔드 API 응답 데이터 변환 함수
  const transformApiData = (apiData, dataType) => {
    console.log(`🔄 변환 중 - 타입: ${dataType}, 데이터:`, apiData);
    
    // 데이터가 null이거나 undefined인 경우 처리
    if (!apiData) {
      console.log(`⚠️ 데이터 없음 - 타입: ${dataType}`);
      return dataType === 'summary' ? null : [];
    }

    switch (dataType) {
      case 'summary':
        return {
          totalSales: apiData?.totalSales || apiData?.total_amount || 0,
          totalOrders: apiData?.totalOrders || apiData?.total_orders || 0,
          averageOrderValue: apiData?.averageOrderValue || apiData?.avg_order_value || 0,
          growthRate: apiData?.growthRate || apiData?.growth_rate || 0
        };
      
      case 'dailySales':
        // apiData가 배열인지 확인
        const dailyArray = Array.isArray(apiData) ? apiData : [];
        return dailyArray.map(item => ({
          date: item.date || item.sale_date,
          sales: Number(item.sales || item.total_amount || 0) || 0,
          orders: Number(item.orders || item.order_count || 0) || 0
        }));
      
      case 'categorySales':
        // apiData가 배열인지 확인
        const categoryArray = Array.isArray(apiData) ? apiData : [];
        return categoryArray.map(item => ({
          category: item.category || item.category_name,
          name: item.name || item.category_display_name,
          sales: Number(item.sales || item.total_amount || 0) || 0,
          percentage: Number(item.percentage || item.sales_percentage || 0) || 0
        }));
      
      case 'topProducts':
        // apiData가 배열인지 확인
        const productsArray = Array.isArray(apiData) ? apiData : [];
        return productsArray.map(item => ({
          id: item.id || item.product_id,
          name: item.name || item.product_name,
          sales: Number(item.sales || item.total_amount || 0) || 0,
          orders: Number(item.orders || item.order_count || 0) || 0
        }));
      
      default:
        return apiData;
    }
  };

  // 테스트용 더미 데이터
  const getDummyData = () => ({
    summary: {
      totalSales: 12500000,
      totalOrders: 156,
      averageOrderValue: 80128,
      growthRate: 12.5
    },
    dailySales: [
      { date: '2024-01-01', sales: 450000, orders: 8 },
      { date: '2024-01-02', sales: 320000, orders: 5 },
      { date: '2024-01-03', sales: 680000, orders: 12 },
      { date: '2024-01-04', sales: 890000, orders: 15 },
      { date: '2024-01-05', sales: 1200000, orders: 18 },
      { date: '2024-01-06', sales: 980000, orders: 14 },
      { date: '2024-01-07', sales: 750000, orders: 11 }
    ],
    categorySales: [
      { category: 'equipment', name: '운동기구', sales: 8500000, percentage: 68 },
      { category: 'clothing', name: '운동복', sales: 2500000, percentage: 20 },
      { category: 'supplement', name: '보충제', sales: 1500000, percentage: 12 }
    ],
    topProducts: [
      { id: 1, name: '프리미엄 덤벨 세트', sales: 1200000, orders: 15 },
      { id: 2, name: '요가 매트', sales: 890000, orders: 22 },
      { id: 3, name: '프로틴 파우더', sales: 650000, orders: 18 },
      { id: 4, name: '운동복 세트', sales: 420000, orders: 12 },
      { id: 5, name: '헬스장 장갑', sales: 380000, orders: 25 }
    ],
    monthlyTrend: [
      { month: '2023-10', sales: 8500000 },
      { month: '2023-11', sales: 9200000 },
      { month: '2023-12', sales: 10800000 },
      { month: '2024-01', sales: 12500000 }
    ]
  });

  useEffect(() => {
    loadSalesData();
  }, [selectedPeriod, selectedCategory]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('ko-KR').format(number);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩중...</span>
          </div>
          <p className={styles.loadingText}>매출 데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error && !salesData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2 className={styles.errorTitle}>데이터를 불러올 수 없습니다</h2>
          <p className={styles.errorText}>{error}</p>
          <ButtonComponent variant="primary" onClick={loadSalesData}>
            다시 시도
          </ButtonComponent>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.title}>📊 매출 분석</h1>
        <p className={styles.subtitle}>상세한 매출 데이터와 인사이트를 확인하세요</p>
      </div>

      {/* 필터 컨트롤 */}
      <div className={styles.filterContainer}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>기간</label>
          <select 
            className={styles.filterSelect}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>카테고리</label>
          <select 
            className={styles.filterSelect}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <ButtonComponent 
          variant="primary" 
          onClick={loadSalesData}
          className={styles.refreshButton}
        >
          🔄 새로고침
        </ButtonComponent>
      </div>

      {/* 요약 카드 */}
      <div className={styles.summaryGrid}>
        <CardComponent className={styles.summaryCard}>
          <div className={styles.summaryIcon}>💰</div>
          <div className={styles.summaryContent}>
            <h3 className={styles.summaryTitle}>총 매출</h3>
            <p className={styles.summaryValue}>
              {formatCurrency(salesData?.summary?.totalSales || 0)}
            </p>
            <p className={styles.summaryGrowth}>
              +{salesData?.summary?.growthRate || 0}% 전년 대비
            </p>
          </div>
        </CardComponent>

        <CardComponent className={styles.summaryCard}>
          <div className={styles.summaryIcon}>📦</div>
          <div className={styles.summaryContent}>
            <h3 className={styles.summaryTitle}>총 주문수</h3>
            <p className={styles.summaryValue}>
              {formatNumber(salesData?.summary?.totalOrders || 0)}건
            </p>
            <p className={styles.summaryGrowth}>
              평균 주문금액: {formatCurrency(salesData?.summary?.averageOrderValue || 0)}
            </p>
          </div>
        </CardComponent>

        <CardComponent className={styles.summaryCard}>
          <div className={styles.summaryIcon}>📈</div>
          <div className={styles.summaryContent}>
            <h3 className={styles.summaryTitle}>성장률</h3>
            <p className={styles.summaryValue}>
              +{salesData?.summary?.growthRate || 0}%
            </p>
            <p className={styles.summaryGrowth}>
              전년 동기 대비
            </p>
          </div>
        </CardComponent>
      </div>

      {/* 차트 섹션 */}
      <div className={styles.chartSection}>
        <CardComponent className={styles.chartCard}>
          <h3 className={styles.chartTitle}>📈 일별 매출 추이</h3>
          <div className={styles.chartContainer}>
            <SalesChart 
              data={salesData?.dailySales || []} 
              type="line" 
              title="일별 매출 추이"
            />
          </div>
        </CardComponent>

        <CardComponent className={styles.chartCard}>
          <h3 className={styles.chartTitle}>🥧 카테고리별 매출</h3>
          <div className={styles.chartContainer}>
            <SalesChart 
              data={salesData?.categorySales || []} 
              type="pie" 
              title="카테고리별 매출 비율"
            />
          </div>
        </CardComponent>
      </div>

      {/* 상세 데이터 테이블 */}
      <div className={styles.tableSection}>
        <CardComponent className={styles.tableCard}>
          <h3 className={styles.tableTitle}>🏆 인기 상품 TOP 5</h3>
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>상품명</th>
                  <th>매출액</th>
                  <th>주문수</th>
                </tr>
              </thead>
              <tbody>
                {salesData?.topProducts?.map((product, index) => (
                  <tr key={product.id}>
                    <td className={styles.rankCell}>
                      <span className={styles.rankBadge}>{index + 1}</span>
                    </td>
                    <td className={styles.productCell}>{product.name}</td>
                    <td className={styles.salesCell}>
                      {formatCurrency(product.sales)}
                    </td>
                    <td className={styles.ordersCell}>
                      {formatNumber(product.orders)}건
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardComponent>
      </div>
    </div>
  );
};

export default SalesAnalysis;
