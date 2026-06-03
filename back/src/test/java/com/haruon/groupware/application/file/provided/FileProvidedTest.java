package com.haruon.groupware.application.file.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.board.provided.BoardManagement;
import com.haruon.groupware.application.board.provided.CategoryManagement;
import com.haruon.groupware.application.board.required.BoardRepository;
import com.haruon.groupware.application.board.service.dto.BoardCreateRequest;
import com.haruon.groupware.application.dept.required.DeptRepository;
import com.haruon.groupware.application.draft.provided.GeneralDraftManagement;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.service.dto.CommonDraftCreateRequest;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.file.dto.request.*;
import com.haruon.groupware.application.file.dto.result.FileDisposition;
import com.haruon.groupware.application.file.dto.result.FileResourceResponse;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.application.file.fileService.forManagement.FileManagerResolver;
import com.haruon.groupware.application.file.fileService.forRetriever.FileResourceRetrieverResolver;
import com.haruon.groupware.application.franchise.provided.EducationManagement;
import com.haruon.groupware.application.franchise.required.EducationRepository;
import com.haruon.groupware.application.franchise.service.dto.EducationCreateRequest;
import com.haruon.groupware.application.meeting.provided.MeetingRoomManagement;
import com.haruon.groupware.application.meeting.required.MeetingRoomRepository;
import com.haruon.groupware.application.meeting.service.dto.MeetingRoomCreateRequest;
import com.haruon.groupware.application.message.provided.MessageDraftManagement;
import com.haruon.groupware.application.message.required.MessageRepository;
import com.haruon.groupware.application.message.service.dto.MessageCreateRequest;
import com.haruon.groupware.domain.AbstractFileEntity;
import com.haruon.groupware.domain.board.Board;
import com.haruon.groupware.domain.board.BoardFile;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.DraftFile;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpFile;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.franchise.Education;
import com.haruon.groupware.domain.franchise.EducationFile;
import com.haruon.groupware.domain.meeting.MeetingRoom;
import com.haruon.groupware.domain.meeting.MeetingRoomFile;
import com.haruon.groupware.domain.message.Message;
import com.haruon.groupware.domain.message.MessageFile;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicInteger;

import static com.haruon.groupware.application.dbFixture.EmpFixture.*;
import static com.haruon.groupware.application.file.fileService.forManagement.FileDeleteRequest.toFileDeleteRequest;
import static org.assertj.core.api.Assertions.assertThat;

@Transactional
@TestIntegrationConfig
record FileProvidedTest(
        FileManagerResolver<FileUpload<?>> uploadResolver,
        FileManagerResolver<FileDeletion> deletionResolver,
        FileResourceRetrieverResolver retrieverResolver,

        EmpRepository empRepository,
        DeptRepository deptRepository,
        BoardRepository boardRepository,
        DraftRepository draftRepository,
        MessageRepository messageRepository,
        EducationRepository educationRepository,
        MeetingRoomRepository meetingRoomRepository,

        BoardManagement boardManagement,
        CategoryManagement categoryManagement,
        GeneralDraftManagement generalDraftManagement,
        MessageDraftManagement messageDraftManagement,
        EducationManagement educationManagement,
        MeetingRoomManagement meetingRoomManagement,

        EntityManager entityManager
) {

    private static final AtomicInteger SEQUENCE = new AtomicInteger();

    @Test
    @DisplayName("사원 파일 업로드 테스트 - 사원은 프로필 이미지를 추가할 수 있다")
    void upload_emp_file_success() {
        Emp emp = approvedEmp("emp");
        FileDto file = imageFile(unique("profile") + ".png");

        upload(FileDomain.EMP, EmpFileUploadRequest.builder()
                .empId(emp.getId())
                .fileType(FileType.PROFILE_PICTURE)
                .file(file)
                .build()
        );
        flushAndClear();

        Emp foundEmp = empRepository.findById(emp.getId()).orElseThrow();
        EmpFile empFile = foundEmp.getEmpFiles().getFirst();

        assertThat(foundEmp.getEmpFiles()).hasSize(1);
        assertThat(empFile.getFileType()).isEqualTo(FileType.PROFILE_PICTURE);
        assertThat(empFile.isActive()).isTrue();
        assertFileMetadata(empFile, file, FileDomain.EMP);
    }

    @Test
    @DisplayName("기안서 파일 업로드 테스트 - 기안자는 임시저장 기안서에 첨부파일을 추가할 수 있다")
    void upload_draft_file_success() {
        Emp drafter = approvedEmp("drafter");
        Long draftId = createDraft(drafter);
        FileDto file = pdfFile(unique("draft") + ".pdf");

        uploadDraftFile(drafter, draftId, file);
        flushAndClear();

        Draft draft = draftRepository.findById(draftId).orElseThrow();
        DraftFile draftFile = draft.getDraftFiles().getFirst();

        assertThat(draft.getDraftFiles()).hasSize(1);
        assertFileMetadata(draftFile, file, FileDomain.DRAFT);
    }

    @Test
    @DisplayName("게시글 파일 업로드 테스트 - 작성자는 게시글에 첨부파일을 추가할 수 있다")
    void upload_board_file_success() {
        Emp admin = saveAdmin(empRepository);
        Emp author = approvedEmp("board-author");
        Long boardId = createBoard(admin, author);
        FileDto file = pdfFile(unique("board") + ".pdf");

        uploadBoardFile(author, boardId, file);
        flushAndClear();

        Board board = boardRepository.findById(boardId).orElseThrow();
        BoardFile boardFile = board.getBoardFiles().getFirst();

        assertThat(board.getBoardFiles()).hasSize(1);
        assertFileMetadata(boardFile, file, FileDomain.BOARD);
    }

    @Test
    @DisplayName("쪽지 파일 업로드 테스트 - 작성자는 쪽지 초안에 첨부파일을 추가할 수 있다")
    void upload_message_file_success() {
        Emp writer = approvedEmp("message-writer");
        Long messageId = createMessageDraft(writer);
        FileDto file = pdfFile(unique("message") + ".pdf");

        uploadMessageFile(writer, messageId, file);
        flushAndClear();

        Message message = messageRepository.findById(messageId).orElseThrow();
        MessageFile messageFile = message.getMessageFiles().getFirst();

        assertThat(message.getMessageFiles()).hasSize(1);
        assertFileMetadata(messageFile, file, FileDomain.MESSAGE);
    }

    @Test
    @DisplayName("교육 파일 업로드 테스트 - 교육 등록자는 교육에 첨부파일을 추가할 수 있다")
    void upload_education_file_success() {
        Emp register = roleEmp(SystemRoleCode.FRANCHISE, "franchise-register");
        Long educationId = createEducation(register);
        FileDto file = pdfFile(unique("education") + ".pdf");

        uploadEducationFile(register, educationId, file);
        flushAndClear();

        Education education = educationRepository.findById(educationId).orElseThrow();
        EducationFile educationFile = education.getEducationFiles().getFirst();

        assertThat(education.getEducationFiles()).hasSize(1);
        assertFileMetadata(educationFile, file, FileDomain.EDUCATION);
    }

    @Test
    @DisplayName("회의실 파일 업로드 테스트 - 시설 담당자는 회의실 이미지를 추가할 수 있다")
    void upload_meeting_room_file_success() {
        Emp facility = roleEmp(SystemRoleCode.FACILITY, "facility-editor");
        Long meetingRoomId = createMeetingRoom(facility);
        FileDto file = imageFile(unique("meeting-room") + ".png");

        uploadMeetingRoomFile(facility, meetingRoomId, file);
        flushAndClear();

        MeetingRoom meetingRoom = meetingRoomRepository.findById(meetingRoomId).orElseThrow();
        MeetingRoomFile meetingRoomFile = meetingRoom.getRoomFiles().getFirst();

        assertThat(meetingRoom.getRoomFiles()).hasSize(1);
        assertFileMetadata(meetingRoomFile, file, FileDomain.MEETING_ROOM);
    }

    @Test
    @DisplayName("사원 파일 삭제 테스트 - 사원은 본인의 파일을 삭제할 수 있다")
    void delete_emp_file_success() {
        Emp emp = approvedEmp("emp-delete");
        FileDto file = imageFile(unique("profile-delete") + ".png");
        upload(FileDomain.EMP, EmpFileUploadRequest.builder()
                .empId(emp.getId())
                .fileType(FileType.PROFILE_PICTURE)
                .file(file)
                .build()
        );
        flushAndClear();

        Long fileId = empRepository.findById(emp.getId()).orElseThrow()
                .getEmpFiles().getFirst().getId();

        delete(FileDomain.EMP, emp.getId(), emp.getId(), fileId);
        flushAndClear();

        Emp foundEmp = empRepository.findById(emp.getId()).orElseThrow();
        assertThat(foundEmp.getEmpFiles()).isEmpty();
    }

    @Test
    @DisplayName("기안서 파일 삭제 테스트 - 기안자는 임시저장 기안서의 첨부파일을 삭제할 수 있다")
    void delete_draft_file_success() {
        Emp drafter = approvedEmp("draft-delete");
        Long draftId = createDraft(drafter);
        FileDto file = pdfFile(unique("draft-delete") + ".pdf");
        uploadDraftFile(drafter, draftId, file);
        flushAndClear();

        Long fileId = draftRepository.findById(draftId).orElseThrow()
                .getDraftFiles().getFirst().getId();

        delete(FileDomain.DRAFT, drafter.getId(), draftId, fileId);
        flushAndClear();

        Draft draft = draftRepository.findById(draftId).orElseThrow();
        assertThat(draft.getDraftFiles()).isEmpty();
    }

    @Test
    @DisplayName("게시글 파일 삭제 테스트 - 작성자는 게시글 첨부파일을 삭제할 수 있다")
    void delete_board_file_success() {
        Emp admin = saveAdmin(empRepository);
        Emp author = approvedEmp("board-delete");
        Long boardId = createBoard(admin, author);
        FileDto file = pdfFile(unique("board-delete") + ".pdf");
        uploadBoardFile(author, boardId, file);
        flushAndClear();

        Long fileId = boardRepository.findById(boardId).orElseThrow()
                .getBoardFiles().getFirst().getId();

        delete(FileDomain.BOARD, author.getId(), boardId, fileId);
        flushAndClear();

        Board board = boardRepository.findById(boardId).orElseThrow();
        assertThat(board.getBoardFiles()).isEmpty();
    }

    @Test
    @DisplayName("쪽지 파일 삭제 테스트 - 작성자는 쪽지 초안 첨부파일을 삭제할 수 있다")
    void delete_message_file_success() {
        Emp writer = approvedEmp("message-delete");
        Long messageId = createMessageDraft(writer);
        FileDto file = pdfFile(unique("message-delete") + ".pdf");
        uploadMessageFile(writer, messageId, file);
        flushAndClear();

        Long fileId = messageRepository.findById(messageId).orElseThrow()
                .getMessageFiles().getFirst().getId();

        delete(FileDomain.MESSAGE, writer.getId(), messageId, fileId);
        flushAndClear();

        Message message = messageRepository.findById(messageId).orElseThrow();
        assertThat(message.getMessageFiles()).isEmpty();
    }

    @Test
    @DisplayName("교육 파일 삭제 테스트 - 교육 등록자는 교육 첨부파일을 삭제할 수 있다")
    void delete_education_file_success() {
        Emp register = roleEmp(SystemRoleCode.FRANCHISE, "education-delete");
        Long educationId = createEducation(register);
        FileDto file = pdfFile(unique("education-delete") + ".pdf");
        uploadEducationFile(register, educationId, file);
        flushAndClear();

        Long fileId = educationRepository.findById(educationId).orElseThrow()
                .getEducationFiles().getFirst().getId();

        delete(FileDomain.EDUCATION, register.getId(), educationId, fileId);
        flushAndClear();

        Education education = educationRepository.findById(educationId).orElseThrow();
        assertThat(education.getEducationFiles()).isEmpty();
    }

    @Test
    @DisplayName("회의실 파일 삭제 테스트 - 시설 담당자는 회의실 이미지를 삭제할 수 있다")
    void delete_meeting_room_file_success() {
        Emp facility = roleEmp(SystemRoleCode.FACILITY, "meeting-room-delete");
        Long meetingRoomId = createMeetingRoom(facility);
        FileDto file = imageFile(unique("meeting-room-delete") + ".png");
        uploadMeetingRoomFile(facility, meetingRoomId, file);
        flushAndClear();

        Long fileId = meetingRoomRepository.findById(meetingRoomId).orElseThrow()
                .getRoomFiles().getFirst().getId();

        delete(FileDomain.MEETING_ROOM, facility.getId(), meetingRoomId, fileId);
        flushAndClear();

        MeetingRoom meetingRoom = meetingRoomRepository.findById(meetingRoomId).orElseThrow();
        assertThat(meetingRoom.getRoomFiles()).isEmpty();
    }

    @Test
    @DisplayName("파일 미리보기 테스트 - 미리보기 가능한 파일은 inline 리소스로 조회한다")
    void preview_file_success() throws IOException {
        Emp register = roleEmp(SystemRoleCode.FRANCHISE, "education-preview");
        Long educationId = createEducation(register);
        FileDto file = imageFile(unique("education-preview") + ".png");
        uploadEducationFile(register, educationId, file);
        flushAndClear();

        Long fileId = educationRepository.findById(educationId).orElseThrow()
                .getEducationFiles().getFirst().getId();

        FileResourceResponse response = retrieverResolver.getRetriever(FileDomain.EDUCATION)
                .preview(educationId, fileId);

        assertThat(response.disposition()).isEqualTo(FileDisposition.INLINE);
        assertResource(response, file, FileDomain.EDUCATION);
    }

    @Test
    @DisplayName("파일 다운로드 테스트 - 파일은 attachment 리소스로 조회한다")
    void download_file_success() throws IOException {
        Emp facility = roleEmp(SystemRoleCode.FACILITY, "meeting-room-download");
        Long meetingRoomId = createMeetingRoom(facility);
        FileDto file = imageFile(unique("meeting-room-download") + ".png");
        uploadMeetingRoomFile(facility, meetingRoomId, file);
        flushAndClear();

        Long fileId = meetingRoomRepository.findById(meetingRoomId).orElseThrow()
                .getRoomFiles().getFirst().getId();

        FileResourceResponse response = retrieverResolver.getRetriever(FileDomain.MEETING_ROOM)
                .download(meetingRoomId, fileId);

        assertThat(response.disposition()).isEqualTo(FileDisposition.ATTACHMENT);
        assertResource(response, file, FileDomain.MEETING_ROOM);
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private void upload(FileDomain domain, FileUploadRequest request) {
        FileUpload upload = uploadResolver.getManager(domain);
        upload.uploadResource(request);
    }

    private void delete(FileDomain domain, Long requesterEmpId, Long domainPkId, Long fileId) {
        deletionResolver.getManager(domain)
                .deleteStoredResource(toFileDeleteRequest(requesterEmpId, domainPkId, fileId));
    }

    private void uploadDraftFile(Emp drafter, Long draftId, FileDto file) {
        upload(FileDomain.DRAFT, DraftFileUploadRequest.builder()
                .draftId(draftId)
                .drafterId(drafter.getId())
                .file(file)
                .build()
        );
    }

    private void uploadBoardFile(Emp author, Long boardId, FileDto file) {
        upload(FileDomain.BOARD, BoardFileUploadRequest.builder()
                .boardId(boardId)
                .requesterId(author.getId())
                .modifiedAt(LocalDateTime.of(2026, 3, 2, 0, 0))
                .file(file)
                .build()
        );
    }

    private void uploadMessageFile(Emp writer, Long messageId, FileDto file) {
        upload(FileDomain.MESSAGE, MessageFileUploadRequest.builder()
                .writerId(writer.getId())
                .messageDraftId(messageId)
                .file(file)
                .build()
        );
    }

    private void uploadEducationFile(Emp register, Long educationId, FileDto file) {
        upload(FileDomain.EDUCATION, EducationFileUploadRequest.builder()
                .educationId(educationId)
                .registerId(register.getId())
                .file(file)
                .build()
        );
    }

    private void uploadMeetingRoomFile(Emp facility, Long meetingRoomId, FileDto file) {
        upload(FileDomain.MEETING_ROOM, MeetingRoomFileUploadRequest.builder()
                .editorId(facility.getId())
                .meetingRoomId(meetingRoomId)
                .file(file)
                .build()
        );
    }

    private void assertFileMetadata(AbstractFileEntity fileEntity, FileDto file, FileDomain domain) {
        assertThat(fileEntity).extracting(
                AbstractFileEntity::getOriginalName,
                AbstractFileEntity::getStoredName,
                AbstractFileEntity::getMimeType,
                AbstractFileEntity::getExtension,
                AbstractFileEntity::getFileSize,
                AbstractFileEntity::getStoredPath
        ).containsExactly(
                file.originalFileName(),
                "stored-" + file.originalFileFullName(),
                file.mimeType(),
                file.extension(),
                file.fileSize(),
                "/test/" + domain.name().toLowerCase(Locale.ROOT)
        );
    }

    private void assertResource(FileResourceResponse response, FileDto file, FileDomain domain) throws IOException {
        String resourceContent = StreamUtils.copyToString(
                response.resource().getInputStream(),
                StandardCharsets.UTF_8
        ).replace('\\', '/');

        assertThat(response.originalName()).isEqualTo(file.originalFileName());
        assertThat(response.mimeType()).isEqualTo(file.mimeType());
        assertThat(response.fileSize()).isEqualTo(file.fileSize());
        assertThat(resourceContent)
                .contains("/test/" + domain.name().toLowerCase(Locale.ROOT))
                .contains("stored-" + file.originalFileFullName());
    }

    private Emp approvedEmp(String prefix) {
        int sequence = SEQUENCE.incrementAndGet();

        return saveApprovedEmp(
                empRepository,
                empNo(sequence),
                "emp" + sequence
        );
    }

    private Emp roleEmp(SystemRoleCode role, String prefix) {
        int sequence = SEQUENCE.incrementAndGet();
        Dept dept = saveDept(deptRepository, "D" + sequence, String.format("%03d", sequence));

        return saveEmpWithRoleAndDept(
                empRepository,
                deptRepository,
                empNo(sequence),
                "role" + sequence,
                dept,
                role
        );
    }

    private Long createDraft(Emp drafter) {
        generalDraftManagement.createDraft(
                CommonDraftCreateRequest.builder()
                        .empId(drafter.getId())
                        .title(unique("draft-title"))
                        .content("draft content")
                        .build()
        );

        return draftRepository.findByEmp(drafter).getFirst().getId();
    }

    private Long createBoard(Emp admin, Emp author) {
        long categoryId = categoryManagement.registerCategory(admin.getId(), unique("file-category"));

        return boardManagement.registerBoard(
                author.getId(),
                BoardCreateRequest.builder()
                        .categoryId(categoryId)
                        .title(unique("board-title"))
                        .content("board content")
                        .build()
        );
    }

    private Long createMessageDraft(Emp writer) {
        return messageDraftManagement.saveMessageBeforeSend(
                writer.getId(),
                MessageCreateRequest.builder()
                        .title(unique("message-title"))
                        .content("message content")
                        .build()
        );
    }

    private Long createEducation(Emp register) {
        return educationManagement.createEducation(
                register.getId(),
                EducationCreateRequest.builder()
                        .educationDate(LocalDateTime.of(2026, 4, 1, 10, 0))
                        .place("training room")
                        .title(unique("education-title"))
                        .content("education content")
                        .capacity(10L)
                        .build()
        );
    }

    private Long createMeetingRoom(Emp facility) {
        return meetingRoomManagement.createMeetingRoom(
                MeetingRoomCreateRequest.builder()
                        .editorId(facility.getId())
                        .name(unique("meeting-room"))
                        .description("meeting room description")
                        .capacity(8)
                        .build()
        );
    }

    private FileDto imageFile(String fileName) {
        return file(fileName, "image/png", new byte[]{1, 2, 3});
    }

    private FileDto pdfFile(String fileName) {
        return file(fileName, "application/pdf", "pdf-content".getBytes(StandardCharsets.UTF_8));
    }

    private FileDto file(String fileName, String mimeType, byte[] bytes) {
        return FileDto.builder()
                .mimeType(mimeType)
                .originalFileFullName(fileName)
                .fileSize((long) bytes.length)
                .bytes(bytes)
                .build();
    }

    private String empNo(int sequence) {
        return String.format("8%08d", sequence);
    }

    private String unique(String prefix) {
        return prefix + "-" + SEQUENCE.incrementAndGet();
    }

    private void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }
}
