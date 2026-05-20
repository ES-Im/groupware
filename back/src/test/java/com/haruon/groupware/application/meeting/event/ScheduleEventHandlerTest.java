package com.haruon.groupware.application.meeting.event;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.draft.provided.BusinessTripDraftManagement;
import com.haruon.groupware.application.draft.provided.LeaveDraftManagement;
import com.haruon.groupware.application.draft.required.BusinessTripDraftRepository;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.required.LeaveDraftRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.meeting.provided.MeetingManagement;
import com.haruon.groupware.application.meeting.required.MeetingRepository;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import org.junit.jupiter.api.AfterEach;

@TestIntegrationConfig
record ScheduleEventIntegrationTest(
        BusinessTripDraftManagement businessTripDraftManagement,
        LeaveDraftManagement leaveDraftManagement,
        MeetingManagement meetingManagement,

        BusinessTripDraftRepository businessTripDraftRepository,
        LeaveDraftRepository leaveDraftRepository,
        DraftRepository draftRepository,
        MeetingRepository meetingRepository,
        EmpRepository empRepository,

        ScheduleRepository scheduleRepository
) {

    @AfterEach
    void tearDown() {
        scheduleRepository.deleteAll();

        businessTripDraftRepository.deleteAll();
        leaveDraftRepository.deleteAll();
        draftRepository.deleteAll();
        meetingRepository.deleteAll();

        empRepository.deleteAll();
    }


}