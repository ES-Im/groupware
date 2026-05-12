package com.haruon.groupware.application.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // 공통
    REQUIRED_VALUE_MISSING_EXCEPTION(HttpStatus.BAD_REQUEST, "COMMON_001", "필수 값이 누락되었습니다."),
    BLANK_VALUE_NOT_ALLOWED_EXCEPTION(HttpStatus.BAD_REQUEST, "COMMON_002", "공백은 허용되지 않습니다."),
    POSITIVE_VALUE_REQUIRED_EXCEPTION(HttpStatus.BAD_REQUEST, "COMMON_003", "양수가 아니면 허용되지 않습니다."),
    INVALID_FORMAT_EXCEPTION(HttpStatus.BAD_REQUEST, "COMMON_004", "입력값 형식이 올바르지 않습니다."),
    END_TIME_BEFORE_START_TIME_EXCEPTION(HttpStatus.BAD_REQUEST, "COMMON_006", "종료시간은 시작시간보다 이를 수 없습니다"),
    PAST_TIME_NOT_ALLOWED_EXCEPTION(HttpStatus.BAD_REQUEST, "COMMON_007", "과거일시로 지정할 수 없습니다"),

    // file
    UNSUPPORTED_MIME_TYPE_EXCEPTION(HttpStatus.BAD_REQUEST, "FILE_001", "허용되지 않는 MIME TYPE입니다."),
    FILE_SIZE_LIMIT_EXCEEDED_EXCEPTION(HttpStatus.BAD_REQUEST, "FILE_002", "파일 크기 제한을 초과했습니다."),
    UNSUPPORTED_FILE_EXTENSION_EXCEPTION(HttpStatus.BAD_REQUEST, "FILE_003", "허용되지 않는 확장자입니다."),
    INVALID_FILE_NAME_EXCEPTION(HttpStatus.BAD_REQUEST, "FILE_004", "유효한 파일명이 아닙니다"),
    FILE_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "FILE_005", "조회된 파일이 없습니다"),

    // 권한
    ACTIVE_EMPLOYEE_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "ROLE_001", "해당 활성화된 사원이 존재하지 않습니다"),
    PERMISSION_DENIED_EXCEPTION(HttpStatus.UNAUTHORIZED, "ROLE_002", "권한이 없습니다"),
    DEPARTMENT_MISMATCH_EXCEPTION(HttpStatus.UNAUTHORIZED, "ROLE_003", "부서 관리자는 같은 부서의 사원만 수정할 수 있습니다."),

    // Board
    CATEGORY_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "BOARD_001", "조회된 카테고리가 없습니다"),
    ACTIVE_CATEGORY_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "BOARD_002", "비활성화된 카테고리입니다."),
    BOARD_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "BOARD_003", "조회된 게시글이 없습니다"),

    // Chat
    CHATROOM_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "CHAT_001", "조회된 채팅방이 없습니다"),
    CHAT_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "CHAT_002", "조회된 채팅이 없습니다"),

    // draft & approval
    APPROVAL_LINE_REQUIRED_EXCEPTION(HttpStatus.BAD_REQUEST, "DRAFT_001", "결재선 설정은 필수입니다."),
    LEAVE_TIME_NOT_ON_THE_HOUR_EXCEPTION(HttpStatus.BAD_REQUEST, "DRAFT_002", "휴가신청 시작 시각과 종료 시각은 정각이어야 합니다."),
    DRAFT_TYPE_MISMATCH_EXCEPTION(HttpStatus.FORBIDDEN, "DRAFT_003", "기안서 양식과 종류가 불일치합니다."),
    DRAFT_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "DRAFT_004", "조회된 기안서가 없습니다"),
    INVALID_LEAVE_HOUR_UNIT_EXCEPTION(HttpStatus.BAD_REQUEST, "DRAFT_005", "휴가는 4시간 단위로만 사용할 수 있습니다."),
    INSUFFICIENT_LEAVE_BALANCE_EXCEPTION(HttpStatus.BAD_REQUEST, "DRAFT_006", "사용 휴가 일수가 잔여 휴가 일수를 초과했습니다."),
    UNREQUESTABLE_LEAVE_TYPE_EXCEPTION(HttpStatus.BAD_REQUEST, "DRAFT_007", "신청할 수 없는 휴가 타입입니다."),
    LEAVE_TIME_OUTSIDE_COMPANY_HOURS_EXCEPTION(HttpStatus.BAD_REQUEST, "DRAFT_008", "휴가 시간은 회사 근무시간 내에서만 신청할 수 있습니다."),
    DRAFT_NOT_APPROVED_EXCEPTION(HttpStatus.BAD_REQUEST, "DRAFT_009", "승인 완료된 기안서만 취소할 수 있습니다."),

    // franchise
    FRANCHISE_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "FRANCHISE_001", "해당 가맹점 정보를 찾을 수 없습니다"),
    FRANCHISE_INQUIRY_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "FRANCHISE_002", "해당 가맹점 문의 정보를 찾을 수 없습니다"),
    EDUCATION_REGISTER_MISMATCH_EXCEPTION(HttpStatus.FORBIDDEN, "FRANCHISE_003", "교육 등록자와 일치하지 않습니다."),
    EDUCATION_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "FRANCHISE_004", "조회된 교육 내역이 없습니다."),
    FRANCHISE_DAILY_SALES_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "FRANCHISE_005", "조회된 일매출 기록이 없습니다."),

    // user-info
    EMPLOYEE_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "EMP_001", "해당 사원이 존재하지 않습니다"),
    DUPLICATE_LOGIN_ID_EXCEPTION(HttpStatus.BAD_REQUEST, "EMP_002", "이미 존재하는 사원 아이디입니다"),
    DUPLICATE_EMP_NO_EXCEPTION(HttpStatus.BAD_REQUEST, "EMP_003", "이미 존재하는 사원 번호입니다"),
    INVALID_RESIGN_DATE_EXCEPTION(HttpStatus.BAD_REQUEST, "EMP_004","퇴직일자는 입사일자보다 이를 수 없습니다."),
    EMP_ALREADY_ACTIVE_EXCEPTION(HttpStatus.BAD_REQUEST,"EMP_005","이미 활성화된 사원입니다."),

    // user-leave-info
    EMP_ANNUAL_LEAVE_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "LEAVE_001", "해당 사원의 연차 정보가 없습니다"),
    GRANTED_DATE_BEFORE_HIRED_DATE_EXCEPTION(HttpStatus.BAD_REQUEST, "LEAVE_002", "연차 부여시점이 입사일자보다 이를 수 없습니다"),
    INVALID_ANNUAL_LEAVE_GRANTED_DATE_EXCEPTION(HttpStatus.BAD_REQUEST, "LEAVE_003", "신입 연차 부여를 제외한 연차 부여일은 매년 1월 1일이어야 합니다."),
    UNSUPPORTED_LEAVE_BALANCE_TYPE_EXCEPTION(HttpStatus.BAD_REQUEST, "LEAVE_004", "해당 휴가 타입은 연차 잔여일수 계산 대상이 아닙니다."),

    // dept
    DEPT_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "DEPT_001", "조회된 부서가 없습니다"),
    DUPLICATE_DEPT_EXCEPTION(HttpStatus.BAD_REQUEST, "DEPT_002", "이미 존재하는 부서 코드입니다"),

    // attendance
    ATTENDANCE_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "ATTENDANCE_001", "조회된 근태 정보가 없습니다."),
    ATTENDANCE_EMP_MISMATCH_EXCEPTION(HttpStatus.FORBIDDEN, "ATTENDANCE_002", "해당 사원의 근태 정보가 아닙니다."),
    WORK_TIME_RANGE_REQUIRED_EXCEPTION(HttpStatus.BAD_REQUEST, "ATTENDANCE_003", "정상근무 시간을 계산하려면 시작시각과 종료시각이 모두 필요합니다."),
    CHECKIN_RECORD_NOT_FOUND_EXCEPTION(HttpStatus.BAD_REQUEST, "ATTENDANCE_004", "출근 기록이 없습니다."),
    CLOSED_ATTENDANCE_EDIT_FORBIDDEN_EXCEPTION(HttpStatus.BAD_REQUEST, "ATTENDANCE_005", "마감된 근태는 사원이 근태시간을 수정할 수 없습니다."),

    // meeting
    MEETING_ROOM_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "meeting_001", "조회된 회의실이 없습니다"),
    MEETING_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "meeting_002", "조회된 회의가 없습니다"),
    INACTIVATED_MEETING_ROOM_EXCEPTION(HttpStatus.FORBIDDEN, "meeting_003", "비활성화된 회의실입니다"),
    RESERVED_MEETING_EXIST_EXCEPTION(HttpStatus.FORBIDDEN, "meeting_004", "예약된 회의가 있어 수정이 불가능한 회의실입니다"),

    // message
    MESSAGE_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "message_001", "조회된 쪽지가 없습니다"),
    MESSAGE_RECEIVER_REQUIRED_EXCEPTION(HttpStatus.BAD_REQUEST, "message_002", "쪽지 수신자 목록이 비어있습니다"),


    // schedule
    UNSUPPORTED_SCHEDULE_TYPE_EXCEPTION(HttpStatus.BAD_REQUEST, "SCHEDULE_001", "지원하지 않는 일정 타입"),
    SCHEDULE_NOT_FOUND_EXCEPTION(HttpStatus.NOT_FOUND, "SCHEDULE_002", "조회된 일정이 없습니다"),
    NOT_MANUAL_SCHEDULE_EXCEPTION(HttpStatus.BAD_REQUEST, "SCHEDULE_003", "수기관리 대상 일정이 아닙니다"),
    EDIT_FORBIDDEN_SCHEDULE_EXCEPTION(HttpStatus.BAD_REQUEST, "SCHEDULE_004", "수정가능한 일정이 아닙니다");

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
