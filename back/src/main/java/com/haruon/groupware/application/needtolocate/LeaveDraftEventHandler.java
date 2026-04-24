package com.haruon.groupware.application.needtolocate;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LeaveDraftEventHandler {

    // draft 결재 완료 되면 LeaveUsageMethod_need_change_naming <- 여기에서 해당 타입의 연가를 소요
}
