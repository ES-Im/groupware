package com.haruon.groupware.adapter.batch.franchise;

public class MaxRetryCount {

    public static Integer MAX_RETRY_COUNT = 3;  //todo - 외부 API Franchise 데이터 DB(sync -> franchise aggregate)적용과정 재시도 횟수 상수이용할 것 (syn.retry_count 필드관련임)

    public static Integer PROCESSING_KILL_SECOND = 600; //process startedAt 기준 해당 상수 만큼 시간이 흐르면 처리 중단
}
