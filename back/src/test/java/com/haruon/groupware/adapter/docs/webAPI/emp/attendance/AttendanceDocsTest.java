package com.haruon.groupware.adapter.docs.webAPI.emp.attendance;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.emp.attendacne.MyAttendanceApi;
import com.haruon.groupware.application.empInfo.attendance.provided.AttendanceRecord;
import com.haruon.groupware.application.empInfo.attendance.provided.AttendanceRetriever;

import static org.mockito.Mockito.mock;

public class AttendanceDocsTest extends RestDocsSupport {

    private final AttendanceRetriever attendanceRetriever = mock(AttendanceRetriever.class);
    private final AttendanceRecord attendanceRecord = mock(AttendanceRecord.class);
    private final String REQUEST_MAPPING_URL = "/api/employees/attendances/me";


    @Override
    protected Object initController() {
        return new MyAttendanceApi(attendanceRetriever, attendanceRecord);
    }
}
