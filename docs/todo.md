1. 예외 기준
   1) Controler -> Validate -> Exception
   2) Application -> Custom Exception
   3) Domain -> requiredNonNull, state 등 이용 및 JAVA Exception이용
   4) Repository -> 
   - 엔티티명NotFoundException(조회) 
   - 조회 외에는 원인을 명시한 repository 실패 원인 위주 
     - Exception(DataIntegrityViolationException같이 이미 있으면 그거 사용, 없으면 커스텀)

2. 시큐리티 어떻게 할건지?
 **- 이거먼저 하는게 맞나??**

3. Repository 정리해야함
 - 조회용, 수정용 따로 둘거고,
 - 조회용은 read-only + JPQL로 adapter.persistence에서 진행.
 - 다만, 의존성 역전 현상 막기 위해서 수정용으로 나두는 application repository에 있는 조회 메서드들은 그냥 둘것
 - application은 agrregate root 기준으로 패키지/인터페이스를 구성했다면
 **- 어댑터에서는 유즈케이스 기준으로 패키지/인터페이스를 구성 할 것**

4. application 쪽 아직 안끝남
 - 얘는 배치 지금 공부하고있으니까 다른거 하면서 공부하다가 좀 나중에 할겨
 - 근태 : batch로 처리할 거
 - 연가 정보 
   - 매년 1월 1일 배치처리
 - 가맹점 외부 api로 들어온거 
   - kafka 메시징큐로 받고 
   - 야를 어떻게 반영할건지..?
 - 게시판 좋아요/조회수 최신화 
   - 야는 redis로 저장해놨다가 일정시간에 db 저장하는 식으로 할겨 안그럼 IO/LO 쪽에 부담갈거 가텨

5. api_초안 
 **- 이거 부터 restAPi 쫙 정리해서 rest api docs를 구성하는게 맞나?**



```
api_초안.md를 REST API 문서 초안으로 재정리
URL / Method / 설명 / 권한 / Request / Response / 예외 기준

예외 응답 표준 확정
예: code, message, fieldErrors, timestamp

시큐리티 문서의 2-layer 권한 모델을 API 문서에 연결
각 API가 EMPLOYEE, HR, FRANCHISE, FACILITY, DEPT_MANAGER, ADMIN 중 뭘 요구하는지 표시

그다음 Auth 최소 구현
PasswordEncoder, findByLoginId, JWT Provider, Filter, AuthController

```


# 나중에 추가할 공통 예외

- `UNAUTHORIZED`: 인증 필요 또는 access token 없음
- `ACCESS_DENIED`: 권한 부족
- `INVALID_REQUEST`: request body, path variable, query parameter 검증 실패
- `NOT_FOUND`: 대상 aggregate 또는 조회 대상 없음
- `DOMAIN_STATE_VIOLATION`: 도메인 상태상 수행 불가


# 다음에 새 프로젝트 하면?
1. jakarta.validation를 엄격하게 나누지 않을거야 
 - 이유는 service에서 @Validated를 붙여야 하는 상황이 있으니까, 현 프로젝트에서는 이 Valid하는 방식을 application 내에선 if문으로 검사하고 adapter에서는 Validation Annotation을 썼는데, 굳이 인거 같음. 이거때문에 DTO도 레이어별로 만드니 생각보다 많이 별론듯
 - 그리고 Batch 등 Controller안타는 검증이 있을 수 있는데, @Validated 딸깍 한번이면 Controller 안탈때도 검증이 안정적으로 돌아가는데 if문으로 돌아가면서 쓰니까 유지보수가 더 어려워질것 같아. 
 - 다음에 팀프로젝트하면 무조건 이대로 나누지 말자. 클린스프링 강의에서 토비강사님이 `Domain Entity/DTO를 Adapter로 노출해도 된다.` 라고 했는데, 그 내용이랑 관련 있음. 프로젝트 끝나면 다시 숙지 해보자 
 - 



# provided/required 조회 네이밍
```
[인터페이스]
조회 행위(Use-case/Provided)
→ XxxRetriever

외부에서 조회 요구(Required)
→ XxxFinder

[서비스]
조회 : XxxQueryService
조회 외 : XxxCommandService

[repository]
조회 : XxxQueryRepository
조회 외 : XxxRepository
```