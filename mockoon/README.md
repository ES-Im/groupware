# Franchise Fake API

Mockoon fake API 산출물입니다. 자세한 한국어 설명과 DB seed fixture 표는 `mockoon.md`를 확인하세요.

```powershell
cd C:\Users\eunse\localRep\groupware
docker compose up mock-server
```

- Health: `GET http://localhost:3001/health`
- Daily sales: `GET http://localhost:3001/api/daily-sales`
- Inquiries: `GET http://localhost:3001/api/inquiries`
- Education applications: `GET http://localhost:3001/api/education-applications`
- Education application cancellations: `GET http://localhost:3001/api/education-application-cancellations`