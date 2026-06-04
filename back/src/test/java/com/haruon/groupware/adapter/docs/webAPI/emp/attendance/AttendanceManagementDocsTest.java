package com.haruon.groupware.adapter.docs.webAPI.emp.attendance;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.emp.attendacne.AttendanceManagementApi;
import com.haruon.groupware.application.empInfo.attendance.provided.AttendanceEditing;
import com.haruon.groupware.application.empInfo.attendance.provided.AttendanceRetriever;

import static org.mockito.Mockito.mock;

public class AttendanceManagementDocsTest extends RestDocsSupport {

    private final AttendanceRetriever attendanceRetriever = mock(AttendanceRetriever.class);
    private final AttendanceEditing attendanceEditing = mock(AttendanceEditing.class);
    private final String REQUEST_MAPPING_URL = "/api/employees/attendances";

    @Override
    protected Object initController() {
        return new AttendanceManagementApi(attendanceRetriever, attendanceEditing);
    }
}
