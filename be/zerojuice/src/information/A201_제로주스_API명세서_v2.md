# ZeroJuice API 명세서

## 1. 개요

| 항목 | 내용 |
| --- | --- |
| Base URL | `https://api.zerojuice.com/api/v1` |
| 인증 방식 | JWT Bearer Token |
| Content-Type | application/json |

---

## 2. 공통 사항

### 2.1 인증 헤더

```
Authorization: Bearer {accessToken}
```

### 2.2 공통 응답 형식

```json
{
    "success": true,
    "data": { }
}
```

### 2.3 에러 응답 형식

```json
{
    "success": false,
    "error": {
        "message": "에러 메시지",
        "errorCode": "ERROR_CODE"
    }
}
```

### 2.4 공통 에러 코드

| HTTP 상태 | 에러코드 | 설명 |
| --- | --- | --- |
| 400 | BAD_REQUEST | 잘못된 요청 |
| 401 | UNAUTHORIZED | 인증 실패 |
| 403 | FORBIDDEN | 권한 없음 |
| 404 | NOT_FOUND | 리소스 없음 |
| 500 | INTERNAL_ERROR | 서버 오류 |

---

## 3. 웹 API (관리자용)

### 3.1 인증

#### 3.1.1 관리자 로그인

| 항목 | 내용 |
| --- | --- |
| URL | `POST /auth/client/login` |
| 인증 | 불필요 |

**Request**

```json
{
    "clientId": "admin01",
    "password": "password1"
}
```

**Response**

```json
{
    "success": true,
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "clientName": "제로주스 주차장"
    }
}
```

---

#### 3.1.2 관리자 로그아웃

| 항목 | 내용 |
| --- | --- |
| URL | `POST /auth/client/logout` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Response**

```json
{
    "success": true
}
```

---

### 3.2 대시보드

#### 3.2.1 주차장 현황 요약

| 항목 | 내용 |
| --- | --- |
| URL | `GET /dashboard/summary` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Response**

```json
{
    "success": true,
    "data": {
        "totalSlots": 100,
        "emptySlots": 45,
        "occupiedSlots": 50,
        "parkingSlots": 5,
        "dailyRevenue": 125000
    }
}
```

---

#### 3.2.2 시간대별 혼잡도

| 항목 | 내용 |
| --- | --- |
| URL | `GET /dashboard/hourly-stats` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| date | String | N | 조회일 (YYYY-MM-DD), 기본값: 오늘 |

**Response**

```json
{
    "success": true,
    "data": {
        "date": "2025-01-20",
        "hourlyStats": [
            { "hour": 0, "occupancyRate": 45.5 },
            { "hour": 1, "occupancyRate": 42.0 },
            { "hour": 23, "occupancyRate": 38.0 }
        ]
    }
}
```

> **구현 참고**: CCTV 노트북에서 정각마다 API로 혼잡률 계산해서 전송. CCTV에서는 date, 혼잡률 정보를 보내야 함.

---

#### 3.2.3 4주간 같은 요일 평균 혼잡도

| 항목 | 내용 |
| --- | --- |
| URL | `GET /dashboard/day-of-week-average` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| date | String | N | 조회일 (YYYY-MM-DD), 기본값: 오늘 |

**Response**

```json
{
    "success": true,
    "data": {
        "date": "2025-01-20",
        "dayOfWeekAverage": [
            { "hour": 0, "occupancyRate": 45.5 },
            { "hour": 1, "occupancyRate": 42.0 },
            { "hour": 23, "occupancyRate": 38.0 }
        ]
    }
}
```

---

### 3.3 입출차 관리

#### 3.3.0 최근 입출차 로그 조회

| 항목 | 내용 |
| --- | --- |
| URL | `GET /parking/logs/recent` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| limit | Integer | N | 조회 개수 (기본값: 3) |

**Response**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "vehicleNo": "123가4567",
            "slotNo": "A-01",
            "entryTime": "2025-01-20T14:30:00",
            "exitTime": null,
            "status": "PARKED"
        },
        {
            "id": 2,
            "vehicleNo": "456나7890",
            "slotNo": "B-05",
            "entryTime": "2025-01-20T14:25:00",
            "exitTime": "2025-01-20T14:28:00",
            "status": "COMPLETED"
        }
    ]
}
```

---

#### 3.3.1 입출차 로그 조회

| 항목 | 내용 |
| --- | --- |
| URL | `GET /parking/logs` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| page | Integer | N | 페이지 번호 (기본값: 0) |
| size | Integer | N | 페이지 크기 (기본값: 10) |
| vehicleNo | String | N | 차량번호 검색 |
| startDate | String | N | 시작일 (YYYY-MM-DD) |
| endDate | String | N | 종료일 (YYYY-MM-DD) |
| status | String | N | 상태 필터 (PARKING/PARKED/EXITING/COMPLETED) |

**Response**

```json
{
    "success": true,
    "data": {
        "content": [
            {
                "id": 1,
                "vehicleNo": "123가4567",
                "slotNo": "A-01",
                "entryTime": "2025-01-20T09:30:00",
                "exitTime": "2025-01-20T14:20:00",
                "status": "COMPLETED",
                "paymentStatus": "SUCCESS"
            }
        ],
        "totalElements": 150,
        "totalPages": 8,
        "currentPage": 0
    }
}
```

---

#### 3.3.2 입차 등록 (번호판 인식)

| 항목 | 내용 |
| --- | --- |
| URL | `POST /parking/entry` |
| 인증 | 불필요 (내부 시스템 호출) |

> **보안 참고**: CCTV/임베디드에서 호출하므로 IP 제한 또는 API Key 인증 권장

**Request Body**

```json
{
    "vehicleNo": "12가3456"
}
```

**Response**

```json
{
    "success": true
}
```

---

#### 3.3.3 출차 처리 (번호판 인식)

| 항목 | 내용 |
| --- | --- |
| URL | `POST /parking/exit` |
| 인증 | 불필요 (내부 시스템 호출) |

> **보안 참고**: CCTV/임베디드에서 호출하므로 IP 제한 또는 API Key 인증 권장

**Request Body**

```json
{
    "vehicleNo": "123가4567"
}
```

**Response**

```json
{
    "success": true
}
```

---

#### 3.3.4 주차면 배정

| 항목 | 내용 |
| --- | --- |
| URL | `POST /parking/assign` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Request Body**

```json
{
    "vehicleNo": "123가4567"
}
```

**Response**

```json
{
    "success": true,
    "data": {
        "slotNo": "A-15",
        "coordinates": {
            "x": 12.5000,
            "y": 8.3000
        }
    }
}
```

---

### 3.4 주차면 관리

#### 3.4.1 주차면 전체 조회

| 항목 | 내용 |
| --- | --- |
| URL | `GET /parking-slots` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Response**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "slotNo": "A-01",
            "posX": 1.0000,
            "posY": 1.0000,
            "status": "EMPTY"
        },
        {
            "id": 2,
            "slotNo": "A-02",
            "posX": 3.5000,
            "posY": 1.0000,
            "status": "OCCUPIED"
        }
    ]
}
```

---

#### 3.4.2 주차면 상태 조회

| 항목 | 내용 |
| --- | --- |
| URL | `GET /parking-slots/status` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Response**

```json
{
    "success": true,
    "data": {
        "slots": [
            { "slotNo": "A-01", "status": "EMPTY" },
            { "slotNo": "A-02", "status": "OCCUPIED" },
            { "slotNo": "A-03", "status": "PARKING" }
        ]
    }
}
```

---

### 3.5 설정

#### 3.5.1 설정 조회

| 항목 | 내용 |
| --- | --- |
| URL | `GET /settings` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Response**

```json
{
    "success": true,
    "data": {
        "fee_base_free_minutes": "30",
        "fee_per_10min": "500",
        "fee_max_daily": "15000"
    }
}
```

---

#### 3.5.2 설정 수정

| 항목 | 내용 |
| --- | --- |
| URL | `PUT /settings` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Request Body**

```json
{
    "fee_base_free_minutes": "30",
    "fee_per_10min": "600",
    "fee_max_daily": "20000"
}
```

**Response**

```json
{
    "success": true
}
```

---

## 4. 앱 API (사용자용)

### 4.1 인증

#### 4.1.1 회원가입

| 항목 | 내용 |
| --- | --- |
| URL | `POST /auth/user/signup` |
| 인증 | 불필요 |

**Request Body**

```json
{
    "mobile": "01012345678",
    "password": "Password123!",
    "carNo": "123가4567"
}
```

**Response**

```json
{
    "success": true,
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
        "userId": 1,
        "carNo": "123가4567"
    }
}
```

---

#### 4.1.2 SMS 인증번호 발송

| 항목 | 내용 |
| --- | --- |
| URL | `POST /auth/user/send-verification` |
| 인증 | 불필요 |

**Request Body**

```json
{
    "phone": "01012345678"
}
```

**Response**

```json
{
    "success": true,
    "data": {
        "expireAt": "2025-01-20T14:35:00"
    }
}
```

---

#### 4.1.3 SMS 인증번호 확인

| 항목 | 내용 |
| --- | --- |
| URL | `POST /auth/user/verify-code` |
| 인증 | 불필요 |

**Request Body**

```json
{
    "phone": "01012345678",
    "code": "123456"
}
```

**Response**

```json
{
    "success": true,
    "data": {
        "verified": true
    }
}
```

---

#### 4.1.4 사용자 로그인

| 항목 | 내용 |
| --- | --- |
| URL | `POST /auth/user/login` |
| 인증 | 불필요 |

**Request Body**

```json
{
    "phone": "01012345678",
    "password": "Password123!"
}
```

**Response**

```json
{
    "success": true,
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
        "userId": 1,
        "name": "홍길동",
        "vehicleNo": "123가4567"
    }
}
```

---

#### 4.1.5 사용자 로그아웃

| 항목 | 내용 |
| --- | --- |
| URL | `POST /auth/user/logout` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Response**

```json
{
    "success": true,
    "data": null
}
```

---

#### 4.1.6 토큰 갱신

| 항목 | 내용 |
| --- | --- |
| URL | `POST /auth/user/refresh` |
| 인증 | 불필요 |

**Request Body**

```json
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response**

```json
{
    "success": true,
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

---

### 4.2 주차

#### 4.2.1 현재 주차 상태 조회

| 항목 | 내용 |
| --- | --- |
| URL | `GET /user/parking-status` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Response (주차중)**

```json
{
    "success": true,
    "data": {
        "isParking": true,
        "record": {
            "recordId": 123,
            "slotNo": "A-15",
            "entryTime": "2025-01-20T09:30:00",
            "status": "PARKED",
            "currentFee": 8500,
            "coordinates": {
                "x": 12.5000,
                "y": 8.3000
            }
        }
    }
}
```

**Response (미주차)**

```json
{
    "success": true,
    "data": {
        "isParking": false,
        "record": null
    }
}
```

> **구현 참고**: currentFee 포함 여부는 개발 여건 고려하여 결정

---

#### 4.2.2 입차 요청

| 항목 | 내용 |
| --- | --- |
| URL | `POST /parking/request-entry` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Response**

```json
{
    "success": true,
    "data": {
        "recordId": 123,
        "slotNo": "A-15",
        "coordinates": {
            "x": 12.5000,
            "y": 8.3000
        }
    }
}
```

---

#### 4.2.3 출차 요청

| 항목 | 내용 |
| --- | --- |
| URL | `POST /parking/request-exit` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Response**

```json
{
    "success": true,
    "data": {
        "recordId": 123,
        "fee": 12000
    }
}
```

---

#### 4.2.4 차량 실시간 위치 조회

| 항목 | 내용 |
| --- | --- |
| URL | `GET /vehicle/location` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Response**

```json
{
    "success": true,
    "data": {
        "position": {
            "x": 10.2500,
            "y": 5.7800
        },
        "status": "PARKING",
        "updatedAt": "2025-01-20T14:30:01"
    }
}
```

---

### 4.3 결제

#### 4.3.1 결제 정보 조회

| 항목 | 내용 |
| --- | --- |
| URL | `GET /payment/{recordId}` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| recordId | Long | Y | 주차기록 ID |

**Response**

```json
{
    "success": true,
    "data": {
        "recordId": 123,
        "entryTime": "2025-01-20T09:30:00",
        "currentTime": "2025-01-20T14:20:00",
        "parkingMinutes": 290,
        "fee": 12000,
        "isPaid": false
    }
}
```

---

#### 4.3.2 결제 처리 (RFID 자동)

| 항목 | 내용 |
| --- | --- |
| URL | `POST /payment/process` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Request Body**

```json
{
    "recordId": 123,
    "method": "RFID",
    "rfidTag": "RFID123456"
}
```

**Response**

```json
{
    "success": true,
    "data": {
        "paymentId": 456,
        "recordId": 123,
        "amount": 12000,
        "method": "RFID",
        "status": "SUCCESS",
        "paidAt": "2025-01-20T14:20:00"
    }
}
```

---

### 4.4 사용자 정보

#### 4.4.1 내 정보 조회

| 항목 | 내용 |
| --- | --- |
| URL | `GET /user/me` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Response**

```json
{
    "success": true,
    "data": {
        "userId": 1,
        "phone": "01012345678",
        "name": "홍길동",
        "vehicleNo": "123가4567",
        "rfidTag": "RFID123456",
        "createdAt": "2025-01-15T10:00:00"
    }
}
```

---

#### 4.4.2 내 정보 수정

| 항목 | 내용 |
| --- | --- |
| URL | `PUT /user/me` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Request Body**

```json
{
    "name": "홍길동",
    "vehicleNo": "456나7890"
}
```

**Response**

```json
{
    "success": true,
    "data": {
        "userId": 1,
        "phone": "01012345678",
        "name": "홍길동",
        "vehicleNo": "456나7890",
        "rfidTag": "RFID123456",
        "createdAt": "2025-01-15T10:00:00"
    }
}
```

---

#### 4.4.3 주차 이력 조회

| 항목 | 내용 |
| --- | --- |
| URL | `GET /user/parking-history` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| page | Integer | N | 페이지 번호 (기본값: 0) |
| size | Integer | N | 페이지 크기 (기본값: 10) |

**Response**

```json
{
    "success": true,
    "data": {
        "content": [
            {
                "recordId": 123,
                "slotNo": "A-15",
                "entryTime": "2025-01-20T09:30:00",
                "exitTime": "2025-01-20T14:20:00",
                "status": "COMPLETED",
                "fee": 12000,
                "paymentStatus": "SUCCESS",
                "paymentMethod": "RFID"
            },
            {
                "recordId": 100,
                "slotNo": "B-03",
                "entryTime": "2025-01-18T11:00:00",
                "exitTime": "2025-01-18T13:30:00",
                "status": "COMPLETED",
                "fee": 7500,
                "paymentStatus": "SUCCESS",
                "paymentMethod": "RFID"
            }
        ],
        "totalElements": 25,
        "totalPages": 3,
        "currentPage": 0
    }
}
```

---

### 4.5 알림

#### 4.5.1 FCM 토큰 등록/갱신

| 항목 | 내용 |
| --- | --- |
| URL | `POST /user/fcm-token` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Request Body**

```json
{
    "fcmToken": "fCm_ToKeN_123..."
}
```

**Response**

```json
{
    "success": true,
    "data": null
}
```

---

#### 4.5.2 Geofence 진입 알림

| 항목 | 내용 |
| --- | --- |
| URL | `POST /notification/geofence-entry` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Request Body**

```json
{
    "latitude": 37.5665,
    "longitude": 126.9780
}
```

**Response**

```json
{
    "success": true,
    "data": {
        "isInRange": true,
        "parkingLotName": "제로주스 주차장"
    }
}
```

---

## 5. 임베디드 API (차량용)

### 5.1 MQTT 토픽

#### 5.1.1 관제 명령 수신

| 항목 | 내용 |
| --- | --- |
| Topic | `vehicle/{vehicleId}/command` |
| QoS | 1 |
| 방향 | 서버 → 차량 |

**Payload**

```json
{
    "type": "PARK",
    "destination": {
        "x": 12.5000,
        "y": 8.3000,
        "yaw": 1.57
    },
    "slotNo": "A-15",
    "timestamp": "2025-01-20T14:30:00"
}
```

**type 종류:**

| type | 설명 |
| --- | --- |
| PARK | 주차 명령 |
| EXIT | 출차 명령 |
| MOVE | 이동 명령 |
| STOP | 정지 명령 |

---

#### 5.1.2 차량 상태 리포팅

| 항목 | 내용 |
| --- | --- |
| Topic | `vehicle/{vehicleId}/status` |
| QoS | 0 |
| 방향 | 차량 → 서버 |

**Payload**

```json
{
    "position": {
        "x": 10.2500,
        "y": 5.7800,
        "yaw": 0.785
    },
    "speed": 0.5,
    "battery": 85,
    "state": "PARKING",
    "timestamp": "2025-01-20T14:30:01"
}
```

**state 종류:**

| state | 설명 |
| --- | --- |
| IDLE | 대기 중 |
| PARKING | 주차 진행 중 |
| PARKED | 주차 완료 |
| EXITING | 출차 진행 중 |
| ERROR | 오류 상태 |

---

#### 5.1.3 명령 응답 (ACK)

| 항목 | 내용 |
| --- | --- |
| Topic | `vehicle/{vehicleId}/ack` |
| QoS | 1 |
| 방향 | 차량 → 서버 |

**Payload**

```json
{
    "commandType": "PARK",
    "result": "ACCEPTED",
    "timestamp": "2025-01-20T14:30:00"
}
```

---

## 6. 실시간 통신

### 6.1 SSE (Server-Sent Events)

#### 6.1.1 대시보드 실시간 업데이트

| 항목 | 내용 |
| --- | --- |
| URL | `GET /sse/dashboard` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

**Event Stream**

```
event: slot-update
data: {"slotNo":"A-01","status":"OCCUPIED"}

event: entry
data: {"vehicleNo":"12가3456","entryTime":"2025-01-20T14:30:00"}

event: exit
data: {"vehicleNo":"12가3456","exitTime":"2025-01-20T14:35:00","fee":1000}
```

---

### 6.2 CCTV 스트리밍

#### 6.2.1 HLS 스트리밍

| 항목 | 내용 |
| --- | --- |
| URL | `GET /stream/cctv/{cameraId}/playlist.m3u8` |
| 인증 | 필요 |

**Request Header**

| 헤더 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| Authorization | String | Y | Bearer {accessToken} |

---

## 7. 요금 계산 규칙

```
기본 무료: 30분
10분당 요금: 500원
일 최대 요금: 15,000원

예시:
- 1시간 주차 → (60-30)/10 × 500 = 1,500원
- 5시간 주차 → (300-30)/10 × 500 = 13,500원
- 10시간 주차 → 15,000원 (최대 요금 적용)
```

---

## 변경 이력

| 버전 | 일자 | 변경 내용 |
|---|---|---|
| v1.0 | 2025-01-20 | 초기 작성 |
| v2.0 | 2026-01-21 | 오류 수정 (JSON 문법, Response 구조, 인증 표기), 최근 로그 API 추가, 주석 정리 |
| v2.1 | 2026-01-21 | 사용자 정보 API 추가 (내 정보 조회/수정, 주차 이력 조회) |
