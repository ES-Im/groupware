[//]: # (//todo )
[application 로직 초안 완성 후 예외 정리 때 참고, 이후 삭제 할 문서]

1) Controler -> Validate -> Exception
2) Application -> Custom Exception
3) Domain -> requiredNonNull, state 등 이용 및 JAVA Exception이용
4) Repository -> 
 - 엔티티명NotFoundException(조회) 
 - 조회 외에는 원인을 명시한 repository 실패 원인 위주 
   - Exception(DataIntegrityViolationException같이 이미 있으면 그거 사용, 없으면 커스텀)


