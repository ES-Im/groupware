# 🏢 Groupware - 엔터프라이즈 통합 사원 관리 시스템

> Spring Boot 3.5 / Java 21 기반 엔터프라이즈급 인사, 근태, 협업 플랫폼 백엔드 API 서버

## 📋 프로젝트 개요

이 프로젝트는 **엔터프라이즈급 통합 사원 관리 및 협업 플랫폼(ERP/HRM 시스템)**입니다. 회사 전체의 인사, 근태, 연차, 출장, 회의실 예약, 게시판, 채팅 등을 일관되게 관리하는 종합 그룹웨어 백엔드 API 서버입니다.

---

## ✨ 주요 기능

### 1. 인사 관리 (Employee Management)
- **사원 정보 관리**: 입사, 퇴사, 직급, 부서 배치, 파일(증명사진 등)
- **부서 관리**: 부서 생성, 부서장 지정, 부서 활성화/비활성화
- **회사 정보**: 회사 기본정보 이력 관리 (스냅샷 기반 버전 관리)
- **권한 관리**: 시스템 권한(`EMPLOYEE`, `DEPT_MANAGER`, `ADMIN`) + 업무 권한(`HR`, `FRANCHISE`, `FACILITY`, `IT`)

### 2. 근태 관리 (Attendance)
- **출퇴근 기록**: 출근/퇴근 시간 기록 및 조회
- **배치 처리**: 자동 근태 마감 (자동화된 배치 작업)
- **월별 통계**: 사원의 월별 근태 현황 조회

### 3. 연차 관리 (Leave Management)
- **연차 신청 (Draft)**: 일반/반차/시간 단위 연차 신청
- **연차 정산**: 사원 별 보유 연차 잔액 관리
- **승인 Workflow**: 부서장/HR 승인 절차

### 4. 출장 관리 (Business Trip)
- **출장 신청**: 출장 일정 신청 및 승인
- **출장 비용**: 출장 비용 정산

### 5. 일정 관리 (Schedule / Calendar)
- **개인 일정**: 수동 입력 일정 관리
- **회의 일정**: 회의실 예약과 연동
- **연차/출장 일정**: 연차 및 출장 승인 시 자동 일정 등록
- **일정 범위 조회**: 특정 기간의 사원 일정 조회

### 6. 회의실 예약 (Meeting Room)
- **회의실 관리**: 회의실 정보, 활성화/비활성화
- **회의 예약**: 시간대별 회의실 예약
- **회의 참석자**: 회의 참석자 관리
- **예약 충돌 방지**: 중복 예약 방지 로직

### 7. 게시판 (Board)
- **게시물 관리**: 작성, 수정, 삭제
- **댓글/반응**: 댓글 및 이모지 반응
- **Redis 기반 카운팅**: 조회수/좋아요 실시간 카운팅
- **배치 작업**: Redis 카운팅을 DB에 동기화

### 8. 메시지/메일 (Message)
- **메시지 발송**: 사용자 간 메시지 송수신
- **읽기 모델 최적화**: Hibernate `@Subselect` 또는 MySQL 뷰 기반 조회

### 9. 실시간 채팅 (Chat)
- **실시간 채팅**: WebSocket + STOMP
- **Redis Pub/Sub**: 실시간 메시지 브로드캐스트
- **채팅방 관리**: 채팅방 생성, 참여자 관리
- **메시지 저장**: 채팅 기록 DB 저장

### 10. 결재 (Draft/Approval Workflow)
- **결재 라인**: 다단계 승인 설정
- **결재 상태 추적**: 대기, 승인, 반려, 철회
- **결재 이력**: 결재 과정의 전체 기록

### 11. 가맹점 연동 (Franchise Integration)
- **외부 API 연동**: Mockoon을 통한 가맹점 API 시뮬레이션
- **매출 데이터 동기화**: 일일 판매 현황 수신
- **교육 프로그램**: 가맹점 대상 교육 관리
- **문의 관리**: 가맹점 문의 및 답변

---

## 🛠 기술 스택

### 핵심 프레임워크
| 기술 | 버전 | 설명 |
|------|------|------|
| **Spring Boot** | 3.5.8 | 현대적 Java 웹 프레임워크 |
| **Java** | 21 | 최신 LTS 버전 (Gradle 툴체인으로 강제) |
| **Spring Data JPA** | - | ORM 기반 DB 접근 |
| **QueryDSL** | 7.1 | 타입 안전 동적 쿼리 빌더 |

### 데이터베이스 & 캐싱
| 기술 | 설명 |
|------|------|
| **MySQL** | 주요 데이터 저장소 |
| **Redis** | 캐싱, 실시간 카운팅, Pub/Sub (채팅) |
| **Spring Batch** | 배치 작업 (자동 근태 마감, 게시판 동기화) |

### 인증 & 보안
| 기술 | 설명 |
|------|------|
| **JWT (jjwt 0.12.6)** | Token 기반 인증 |
| **Spring Security + OAuth2 Client** | 보안 설정 및 소셜 로그인 |
| **NullAway + ErrorProne** | Null 안전성 및 정적 코드 분석 |

### 실시간 통신
| 기술 | 설명 |
|------|------|
| **WebSocket + Spring STOMP** | 실시간 채팅 |
| **Redis Pub/Sub** | 메시지 브로드캐스트 |

### 문서화 & 테스트
| 기술 | 설명 |
|------|------|
| **Spring REST Docs** | API 문서 자동 생성 |
| **AsciiDoctor** | 문서 빌드 |
| **JUnit 5** | 단위/통합 테스트 |
| **Mockito** | Mock 객체 생성 |

### 외부 API 연동
| 기술 | 설명 |
|------|------|
| **OpenFeign** | HTTP 클라이언트 |
| **Mockoon** | Mock 서버 (가맹점 API 시뮬레이션) |

### 기타
| 기술 | 설명 |
|------|------|
| **Lombok** | 보일러플레이트 코드 감소 |
| **Docker Compose** | MySQL, Redis, Mock 서버 자동 실행 |
| **Gradle (Kotlin DSL)** | 빌드 자동화 |

---

## 📁 프로젝트 구조

```
back/
├── src/
│   ├── main/
│   │   ├── java/com/haruon/groupware/
│   │   │   ├── domain/                    # 핵심 비즈니스 로직 (엔티티, 애그리거트)
│   │   │   │   ├── employee/             # 사원, 부서, 출퇴근 엔티티
│   │   │   │   ├── draft/                # 결재 신청서 (연차, 출장 등)
│   │   │   │   ├── schedule/             # 일정 엔티티
│   │   │   │   ├── meeting/              # 회의실 예약
│   │   │   │   ├── message/              # 메시지
│   │   │   │   ├── chat/                 # 채팅
│   │   │   │   ├── board/                # 게시판
│   │   │   │   ├── franchise/            # 가맹점 데이터
│   │   │   │   ├── event/                # 도메인/애플리케이션 이벤트
│   │   │   │   └── shared/               # 공용 VO (Email 등)
│   │   │   │
│   │   │   ├── application/              # 비즈니스 유즈케이스 (서비스)
│   │   │   │   ├── auth/                 # 인증 (login, token refresh)
│   │   │   │   ├── employee/             # 사원 관리 서비스
│   │   │   │   ├── draft/                # 결재 신청 서비스
│   │   │   │   ├── schedule/             # 일정 관리 서비스
│   │   │   │   ├── meeting/              # 회의실 관리 서비스
│   │   │   │   ├── message/              # 메시지 서비스
│   │   │   │   ├── chat/                 # 채팅 서비스
│   │   │   │   ├── board/                # 게시판 서비스
│   │   │   │   ├── franchise/            # 가맹점 서비스
│   │   │   │   ├── company/              # 회사 정보 서비스
│   │   │   │   ├── dept/                 # 부서 관리 서비스
│   │   │   │   ├── exception/            # 커스텀 예외 정의
│   │   │   │   ├── provided/             # 포트: 커맨드/조회 유즈케이스 인터페이스
│   │   │   │   ├── required/             # 포트: Repository 인터페이스
│   │   │   │   ├── service/              # 서비스 구현체 (command, query)
│   │   │   │   └── event/                # 이벤트 발행/구독
│   │   │   │
│   │   │   └── adapter/                  # 외부와의 상호작용
│   │   │       ├── webapi/               # REST 컨트롤러 (@RestController)
│   │   │       ├── persistence/          # Repository 구현체 (QueryDSL/JPQL)
│   │   │       ├── websocket/            # WebSocket/STOMP 컨트롤러
│   │   │       ├── security/             # 보안 설정, JWT 필터
│   │   │       ├── batch/                # 배치 작업 (Attendance, Board 동기화)
│   │   │       ├── redis/                # Redis 작업 (Pub/Sub, 캐싱)
│   │   │       ├── file/                 # 파일 저장/변환 (Local FS, PDF 변환)
│   │   │       └── mockoon/              # Mockoon HTTP 클라이언트
│   │   │
│   │   └── resources/
│   │       ├── application.yml           # 기본 설정
│   │       ├── application-dev.yml       # 개발 환경
│   │       ├── application-test.yml      # 테스트 환경
│   │       ├── application-prod.yml      # 프로덕션 환경
│   │       ├── env.yml                   # 환경 변수 (DB, JWT secret, Redis 등)
│   │       └── Dockerfile
│   │
│   └── test/java/com/haruon/groupware/   # 테스트 코드
│       ├── application/                  # 통합 테스트
│       └── adapter/
│           └── docs/                     # REST Docs 테스트 (자동 API 문서화)
│
├── build.gradle.kts                      # Gradle 빌드 설정
├── settings.gradle.kts                   # Gradle 마울티 프로젝트 설정
└── build/
    ├── generated-snippets/               # REST Docs 테스트 결과물
    └── docs/asciidoc/                    # 최종 API 문서
```

---

## 🏗 아키텍처 원칙

### 헥사고날 (포트-어댑터) 아키텍처
```
┌─────────────────────────────────────────┐
│           ADAPTER LAYER                 │
│  (REST, WebSocket, Persistence, Redis)  │
└─────────────────────────────────────────┘
            ↓         ↑
      [Ports/Interfaces]
            ↓         ↑
┌─────────────────────────────────────────┐
│        APPLICATION LAYER                │
│      (Service/Usecase Implementation)   │
└─────────────────────────────────────────┘
            ↓         ↑
┌─────────────────────────────────────────┐
│           DOMAIN LAYER                  │
│    (Pure Business Logic / Entities)     │
└─────────────────────────────────────────┘
```

### 명령/조회 분리 (CQRS 패턴)
- **Command** (쓰기):
  - Adapter: `XxxManagement` / `XxxSender` 인터페이스
  - Service: `XxxService` 구현체
  - Repository: `XxxRepository` (쓰기 + 단순 조회)

- **Query** (읽기):
  - Adapter: `XxxRetriever` 인터페이스
  - Service: `XxxQueryService` 구현체
  - Repository: `XxxQueryRepository` (QueryDSL/JPQL 복잡 조회)

### Bounded Context 패턴
각 도메인(사원, 결재, 일정 등)은 독립적인 비즈니스 컨텍스트로 구성
```
domain/{context}/
application/{context}/
adapter/.../{context}/
```

### 예외 계층
- **Domain**: 순수 Java 예외 (`requireNonNull`, `IllegalStateException`)
- **Application**: `ApplicationException` 하위 커스텀 예외
- **Adapter**: `AdapterException` (파일 변환, 외부 API 호출 실패)

---

## 🚀 시작하기

### 필수 요구사항
- **Java 21** (Gradle 툴체인으로 자동 제공)
- **Gradle 8.x+**
- **Docker & Docker Compose** (MySQL, Redis, Mockoon 자동 실행)

### 환경 설정

1. **env.yml 파일 생성** (`.gitignore` 대상)
   ```bash
   # back/src/main/resources/env.yml
   cp back/src/main/resources/env.yml.example back/src/main/resources/env.yml
   # 또는 직접 작성:
   ```

   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3306/groupware
       username: root
       password: your_password
     
     jwt:
       secret: your-secret-key-at-least-256-bits-long
       front:
         redirect:
           base: http://localhost:5173
         callback:
           path: /auth/callback
       access-token:
         expiration-time: 3600000  # 1시간
       refresh-token:
         expiration-time: 604800000  # 7일
     
     data:
       redis:
         host: localhost
         port: 6379
   
   app:
     frontend:
       base-url: http://localhost:5173
     franchise:
       base-url: http://localhost:3001  # Mockoon
   ```

2. **애플리케이션 실행**
   ```bash
   cd back
   
   # 전체 빌드 (테스트 + 문서 생성 + bootJar)
   ./gradlew build
   
   # 개발 서버 실행 (Docker Compose 자동 실행)
   ./gradlew bootRun
   
   # 또는 jar 실행
   java -jar build/libs/groupware-0.0.1-SNAPSHOT.jar
   ```

3. **테스트 실행**
   ```bash
   # 전체 테스트
   ./gradlew test
   
   # 특정 테스트 클래스
   ./gradlew test --tests "com.haruon.groupware.application.chat.provided.ChatSenderTest"
   
   # 특정 테스트 메서드
   ./gradlew test --tests "*ChatSenderTest.send_success"
   ```

### API 문서 확인
- **자동 생성 문서**: `build/docs/asciidoc/index.html`
- **실행 중 접근**: `http://localhost:8080/docs/index.html`
- 문서는 REST Docs 테스트(`adapter.docs.webapi.**`)를 기반으로 자동 생성됨

---

## 📝 주요 명령어

### 백엔드

```bash
# 전체 빌드 (테스트 + asciidoctor 문서 + bootJar)
./gradlew build

# 전체 테스트 실행
./gradlew test

# 특정 테스트 실행
./gradlew test --tests "com.haruon.groupware.application.chat.provided.ChatSenderTest"
./gradlew test --tests "*ChatSenderTest.send_success"

# 앱 실행 (profile: dev, docker compose 자동 실행)
./gradlew bootRun

# 특정 클래스만 컴파일
./gradlew compileJava

# 캐시 제거 후 재빌드
./gradlew clean build
```

---

## 🔐 보안 & 권한

### 인증 (Authentication)
- **JWT 기반**: Access Token + Refresh Token
- **토큰 전달**: `Authorization: Bearer {token}`
- **WebSocket**: STOMP `CONNECT` 프레임에서 동일 JWT 검증

### 권한 (Authorization)
**2-Layer 구조**:

1. **시스템 권한** (굵은 단위 접근 제어):
   - `EMPLOYEE` - 일반 직원
   - `DEPT_MANAGER` - 부서장
   - `ADMIN` - 시스템 관리자 (상위 권한 포함)

2. **업무 권한** (세부 기능별 접근 제어):
   - `HR` - 인사 관리
   - `FRANCHISE` - 가맹점 관리
   - `FACILITY` - 회의실 관리
   - `IT` - 시스템 관리

**권한 검사**:
- 굵은 단위: `SecurityConfig`의 `authorizeHttpRequests`에서 처리
- 세밀한 스코프: Application Service 내부에서 처리
  - 같은 부서 여부
  - 리소스 소유권
  - 애그리거트 상태 (이미 승인됨, 이미 퇴직 등)

---

## 🔄 현재 개발 현황

### 완료된 기능
✅ Employee (사원 관리) - API, 테스트, 문서화  
✅ Attendance (근태) - API, 배치, 문서화  
✅ Schedule (일정) - API, 문서화  
✅ Meeting (회의실) - API, 문서화  
✅ Message (메시지) - 읽기 모델 최적화, API, 문서화  
✅ Board (게시판) - Redis 카운팅, 배치 동기화  
✅ Draft (결재) - 다단계 승인 workflow  
✅ Company (회사 정보) - 이력 관리  

### 진행 중인 기능
🔄 **Chat** (채팅)
  - WebSocket + Redis Pub/Sub 구현
  - 채팅방 조회 로직 완료
  - Command API 및 이벤트 발행 진행 중

🔄 **Franchise** (가맹점 연동)
  - 외부 Mockoon API 연동
  - 도메인 엔티티 및 동기화 기능 설계 중

### 품질 관리
✅ **ErrorProne + NullAway**: Null 안전성 강제 (Main 컴파일에만 적용)  
✅ **Spring REST Docs**: 모든 API 엔드포인트 자동 문서화  
✅ **통합 테스트**: 모든 주요 유즈케이스 커버  

---

## 📚 설계 문서

- **도메인 모델**: `docs/도메인모델.md`
  - 각 애그리거트별 엔티티 정의
  - 비즈니스 규칙 명시
  - 필드 타입 및 검증 규칙

- **권한 규칙**: `docs/권한규칙.md`
  - 시스템 권한 및 업무 권한
  - 각 API별 필요 권한

- **개발 가이드**: `CLAUDE.md` (이 저장소의 AI 가이드)
  - 아키텍처 패턴
  - 네이밍 컨벤션
  - 코드 작성 규칙

---

## 🧪 테스트 전략

### 통합 테스트
- `@TestIntegrationConfig` 메타 어노테이션 사용
- 테스트 클래스는 Java `record`로 작성
- 생성자 주입으로 테스트 대상 빈 제공

### REST Docs 테스트
- `RestDocsSupport` 상속
- MockMvc 기반 (전체 Spring 컨텍스트 불필요)
- 자동 API 문서 생성
- 인증 헬퍼: `employeeAuthentication()`, `hrAuthentication()` 등

### 테스트 픽스처
- `application/dbFixture` 아래에 위치
- 예: `EmpFixture.saveApprovedEmp()`

---

## 📖 API 문서

API 문서는 다음 위치에서 확인할 수 있습니다:
- **로컬 실행**: `http://localhost:8080/docs/index.html`
- **빌드 산출물**: `build/docs/asciidoc/index.html`

문서는 Spring REST Docs 테스트를 기반으로 자동 생성되므로, 코드와 항상 동기화됩니다.

---

## 🐳 Docker Compose

MySQL, Redis, Mockoon Mock 서버가 Docker Compose로 자동 실행됩니다:
- **MySQL**: `localhost:3306` (groupware DB)
- **Redis**: `localhost:6379`
- **Mockoon**: `localhost:3001` (가맹점 API Mock)

```bash
# 수동 실행 (자동 실행 되므로 보통 불필요)
docker compose up -d

# 중지
docker compose down
```

---

## 📊 프로젝트 통계

| 항목 | 수치 |
|------|------|
| **바운디드 컨텍스트** | 10개 (employee, draft, schedule, meeting, message, chat, board, franchise, company, dept) |
| **엔티티** | 30개+ |
| **REST 엔드포인트** | 50개+ |
| **테스트 클래스** | 20개+ |
| **자동 생성 API 문서** | 50+ 스니펫 |

---

## 🎯 주요 특징

✅ **확장 가능한 아키텍처**: 헥사고날 패턴으로 새로운 도메인 추가 용이  
✅ **타입 안전성**: Java 21 + NullAway로 Null 예외 사전 방지  
✅ **자동 문서화**: Spring REST Docs로 테스트 기반 API 문서 자동 생성  
✅ **실시간 기능**: WebSocket + Redis로 채팅/알림 구현  
✅ **배치 자동화**: Spring Batch로 일일 마감, 데이터 동기화  
✅ **권한 2-layer**: 시스템 권한(큰 범위) + 업무 권한(세부 범위)  
✅ **외부 연동**: OpenFeign + Mockoon으로 안전한 테스트 환경  
✅ **명령/조회 분리**: CQRS 패턴으로 복잡한 쿼리 최적화  
✅ **이벤트 기반**: 도메인/애플리케이션 이벤트로 느슨한 결합  

---

## 📞 개발 가이드

### 새로운 기능 추가 순서
1. **Domain** - 엔티티 및 비즈니스 로직 구현
2. **Application** - 포트 인터페이스 및 서비스 구현
3. **Adapter** - 컨트롤러 및 리포지토리 구현
4. **Test** - 통합 테스트 및 REST Docs 테스트 작성
5. **Docs** - `도메인모델.md` 업데이트

### 코드 스타일
- **언어**: 한국어 커밋 메시지, 한국어 설명 주석
- **식별자**: 영문 클래스/메서드명 (기존 관례 따름)
- **예외 메시지**: 한국어
- **테스트 DisplayName**: 한국어

---

## 📄 라이센스

이 프로젝트는 내부용 엔터프라이즈 소프트웨어입니다.

---

## 👥 기여 가이드

### 브랜치 전략
- `master` - Main branch (프로덕션 배포)
- Feature 브랜치는 작은 단위의 기능별로 생성

### 커밋 메시지 규칙
```
[기능 영역] 한글 설명

더 자세한 설명 (선택사항)
- 내용 1
- 내용 2
```

예:
```
[Chat] 채팅 메시지 저장 및 Redis Pub/Sub 구현

- WebSocket STOMP 메시지 수신 처리
- Redis Pub/Sub으로 실시간 메시지 브로드캐스트
- ChatMessageCreatedEvent 이벤트 발행
```

---

**Updated**: 2026-06-27  
**Version**: 0.0.1-SNAPSHOT
