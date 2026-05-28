package com.haruon.groupware.adapter.webapi.emp;

import com.haruon.groupware.adapter.file.MultipartFileConverter;
import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpFileReplaceParam;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpRegisterRequest;
import com.haruon.groupware.application.empInfo.empService.dto.request.EmpUpdateRequestBySelf;
import com.haruon.groupware.application.empInfo.empService.dto.response.*;
import com.haruon.groupware.application.empInfo.provided.EmpAccountManager;
import com.haruon.groupware.application.empInfo.provided.EmpAccountRetriever;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/employees")
public class EmpAccountApi {
    
    private final EmpAccountManager empAccountManager;
    private final EmpAccountRetriever retriever;

    @PostMapping
    public ResponseEntity<Void> register(
            @RequestBody @Valid EmpRegisterRequest request
    ) {
        empAccountManager.registerEmp(request);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<EmpInfoResponse> me(
             @AuthenticationPrincipal EmpDetails details
    ) {
        EmpInfoResponse response = retriever.retrieveEmpAccountInfo(details.getEmpId());

        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/me/files")
    public ResponseEntity<List<EmpFileListInfo>> meFiles(
            @AuthenticationPrincipal EmpDetails details
    ) {
        List<EmpFileListInfo> response = retriever.retrieveEmpFilesInfo(details.getEmpId());

        return ResponseEntity.ok().body(response);
    }

    @GetMapping("/me/belongings")
    public ResponseEntity<List<BelongingInfo>> meBelongings(
            @AuthenticationPrincipal EmpDetails details
    ) {
        List<BelongingInfo> response = retriever.retrieveEmpBelongingsInfo(details.getEmpId());

        return ResponseEntity.ok().body(response);
    }

    @PatchMapping("/me")
    public ResponseEntity<Void> updateMe(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid EmpUpdateRequestBySelf request
    ) {
        empAccountManager.updateInfoBySelf(request, details.getEmpId());

        return ResponseEntity.ok().build();
    }

    @PatchMapping(value = "/me/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> addMeFile(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam("fileType") FileType fileType,
            @RequestPart("file") MultipartFile file
    ) {
        EmpFileReplaceParam request = EmpFileReplaceParam.builder()
                .fileType(fileType)
                .file(MultipartFileConverter.from(file))
                .build();

        empAccountManager.updateEmpFileBySelf(request, details.getEmpId());

        return ResponseEntity.ok().build();
    }

    @PatchMapping("/me/files/{fileId}/status")
    public ResponseEntity<Void> updateMeFileStatus(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long fileId,
            @RequestParam("isForActivate") Boolean isForActivate
    ) {
        empAccountManager.updateFileActiveStatusBySelf(fileId, isForActivate, details.getEmpId());

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/me/files/{fileId}")
    public ResponseEntity<Void> deleteMeFile(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long fileId
    ) {
        empAccountManager.deleteEmpFileBySelf(fileId, details.getEmpId());

        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Page<EmpInfoForManagement>> empsForManagement(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) EmpStatus status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(page = 0, size = 10) Pageable pageable
    ) {
        Page<EmpInfoForManagement> responses =
                retriever.retrieveEmpAccountInfoListForManagement(
                        details.getEmpId(),
                        details.getBelongings(),
                        deptId,
                        status,
                        keyword,
                        pageable
                );

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/new")
    public ResponseEntity<Page<EmpBasicInfo>> newEmpsForManagement(
            @AuthenticationPrincipal EmpDetails empDetails,
            @RequestParam(required = false) String keyword,
            @PageableDefault(page = 0, size = 10) Pageable pageable
    ) {
        Page<EmpBasicInfo> newEmpList =
                retriever.retrieveNewEmpInfoList(
                        empDetails.getEmpId(),
                        keyword,
                        pageable
                );

        return ResponseEntity.ok().body(newEmpList);
    }

    @GetMapping("/{empId}/profile")
    public ResponseEntity<Page<EmpFileListInfo>> empProfile(
            @AuthenticationPrincipal EmpDetails empDetails,
            @PathVariable Long empId,
            @PageableDefault(page = 0, size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok().body(null);
    }









}
