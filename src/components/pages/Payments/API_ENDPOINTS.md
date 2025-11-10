# 매출 분석 API 엔드포인트

## 개요
매출 분석 페이지에서 사용하는 백엔드 API 엔드포인트들입니다.

## API 엔드포인트

### 1. 매출 요약 데이터
```
GET /seller/analytics/summary
```

**쿼리 파라미터:**
- `period`: 기간 (7days, 30days, 90days, 1year, custom)
- `category`: 카테고리 (all, equipment, clothing, supplement)

**응답 형식:**
```json
{
  "totalSales": 12500000,
  "totalOrders": 156,
  "averageOrderValue": 80128,
  "growthRate": 12.5
}
```

### 2. 일별 매출 데이터
```
GET /seller/analytics/daily-sales
```

**쿼리 파라미터:**
- `period`: 기간
- `category`: 카테고리

**응답 형식:**
```json
[
  {
    "date": "2024-01-01",
    "sales": 450000,
    "orders": 8
  },
  {
    "date": "2024-01-02", 
    "sales": 320000,
    "orders": 5
  }
]
```

### 3. 카테고리별 매출 데이터
```
GET /seller/analytics/category-sales
```

**쿼리 파라미터:**
- `period`: 기간
- `category`: 카테고리

**응답 형식:**
```json
[
  {
    "category": "equipment",
    "name": "운동기구",
    "sales": 8500000,
    "percentage": 68
  },
  {
    "category": "clothing",
    "name": "운동복", 
    "sales": 2500000,
    "percentage": 20
  }
]
```

### 4. 인기 상품 데이터
```
GET /seller/analytics/top-products
```

**쿼리 파라미터:**
- `period`: 기간
- `category`: 카테고리
- `limit`: 상위 N개 (기본값: 5)

**응답 형식:**
```json
[
  {
    "id": 1,
    "name": "프리미엄 덤벨 세트",
    "sales": 1200000,
    "orders": 15
  },
  {
    "id": 2,
    "name": "요가 매트",
    "sales": 890000,
    "orders": 22
  }
]
```

## 백엔드 구현 가이드

### 1. 데이터베이스 쿼리 예시

**매출 요약 쿼리:**
```sql
SELECT 
  SUM(amount) as totalSales,
  COUNT(*) as totalOrders,
  AVG(amount) as averageOrderValue,
  -- 전년 동기 대비 성장률 계산
  ((SUM(amount) - LAG(SUM(amount), 365) OVER ()) / LAG(SUM(amount), 365) OVER ()) * 100 as growthRate
FROM payments 
WHERE created_at >= ? AND created_at <= ?
  AND status = 'COMPLETED'
```

**일별 매출 쿼리:**
```sql
SELECT 
  DATE(created_at) as date,
  SUM(amount) as sales,
  COUNT(*) as orders
FROM payments 
WHERE created_at >= ? AND created_at <= ?
  AND status = 'COMPLETED'
GROUP BY DATE(created_at)
ORDER BY date
```

**카테고리별 매출 쿼리:**
```sql
SELECT 
  p.category,
  c.name,
  SUM(p.amount) as sales,
  (SUM(p.amount) / (SELECT SUM(amount) FROM payments WHERE created_at >= ? AND created_at <= ?)) * 100 as percentage
FROM payments p
JOIN products pr ON p.product_id = pr.id
JOIN categories c ON pr.category_id = c.id
WHERE p.created_at >= ? AND p.created_at <= ?
  AND p.status = 'COMPLETED'
GROUP BY p.category, c.name
ORDER BY sales DESC
```

**인기 상품 쿼리:**
```sql
SELECT 
  p.product_id as id,
  pr.name,
  SUM(p.amount) as sales,
  COUNT(*) as orders
FROM payments p
JOIN products pr ON p.product_id = pr.id
WHERE p.created_at >= ? AND p.created_at <= ?
  AND p.status = 'COMPLETED'
GROUP BY p.product_id, pr.name
ORDER BY sales DESC
LIMIT ?
```

### 2. Spring Boot 컨트롤러 예시

```java
@RestController
@RequestMapping("/seller/analytics")
public class AnalyticsController {
    
    @Autowired
    private AnalyticsService analyticsService;
    
    @GetMapping("/summary")
    public ResponseEntity<SalesSummary> getSalesSummary(
            @RequestParam String period,
            @RequestParam String category) {
        SalesSummary summary = analyticsService.getSalesSummary(period, category);
        return ResponseEntity.ok(summary);
    }
    
    @GetMapping("/daily-sales")
    public ResponseEntity<List<DailySales>> getDailySales(
            @RequestParam String period,
            @RequestParam String category) {
        List<DailySales> dailySales = analyticsService.getDailySales(period, category);
        return ResponseEntity.ok(dailySales);
    }
    
    @GetMapping("/category-sales")
    public ResponseEntity<List<CategorySales>> getCategorySales(
            @RequestParam String period,
            @RequestParam String category) {
        List<CategorySales> categorySales = analyticsService.getCategorySales(period, category);
        return ResponseEntity.ok(categorySales);
    }
    
    @GetMapping("/top-products")
    public ResponseEntity<List<TopProduct>> getTopProducts(
            @RequestParam String period,
            @RequestParam String category,
            @RequestParam(defaultValue = "5") int limit) {
        List<TopProduct> topProducts = analyticsService.getTopProducts(period, category, limit);
        return ResponseEntity.ok(topProducts);
    }
}
```

### 3. 권한 및 보안

- 모든 API는 판매자 인증이 필요합니다
- JWT 토큰을 통한 인증
- 판매자별 데이터만 접근 가능하도록 필터링
- API 호출 제한 (Rate Limiting) 적용 권장

### 4. 캐싱 전략

- 매출 요약 데이터: 5분 캐시
- 일별 매출 데이터: 1시간 캐시  
- 카테고리별 매출 데이터: 30분 캐시
- 인기 상품 데이터: 1시간 캐시

### 5. 에러 처리

- 401: 인증 실패
- 403: 권한 없음
- 404: 데이터 없음
- 500: 서버 오류

## 프론트엔드 연동

프론트엔드에서는 `Promise.allSettled`를 사용하여 여러 API를 병렬로 호출하고, 일부 API가 실패해도 다른 API의 데이터는 정상적으로 표시됩니다.

```javascript
const [summaryResponse, dailyResponse, categoryResponse, productsResponse] = await Promise.allSettled([
  GET('/seller/analytics/summary', { period, category }),
  GET('/seller/analytics/daily-sales', { period, category }),
  GET('/seller/analytics/category-sales', { period, category }),
  GET('/seller/analytics/top-products', { period, category, limit: 5 })
]);
```
