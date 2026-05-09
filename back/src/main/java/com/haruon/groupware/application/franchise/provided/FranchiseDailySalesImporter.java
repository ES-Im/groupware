package com.haruon.groupware.application.franchise.provided;

import com.haruon.groupware.application.franchise.service.dto.DailySalesRequest;

/**
 * 메시지큐 & 배치처리로 받은 가맹점 일 매출 데이터를 저장/수정하는 Port
 */
public interface FranchiseDailySalesImporter {

    long importDailySales(long franchiseId, DailySalesRequest request);

}
