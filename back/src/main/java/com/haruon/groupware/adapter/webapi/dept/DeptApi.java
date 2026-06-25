package com.haruon.groupware.adapter.webapi.dept;

import com.haruon.groupware.application.dept.deptService.dto.response.DeptInfoResponse;
import com.haruon.groupware.application.dept.deptService.dto.response.projection.DeptMemberInfo;
import com.haruon.groupware.application.dept.provided.DeptRetriever;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DeptApi {

    private final DeptRetriever deptRetriever;

    @GetMapping
    public ResponseEntity<Page<DeptInfoResponse>> getDepts(
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String keyword,
            @PageableDefault(page = 0, size = 10) Pageable pageable
    ) {
        Page<DeptInfoResponse> responses = deptRetriever.retrieveDeptInfoList(isActive, keyword, pageable);

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/{deptId}/members")
    public ResponseEntity<Page<DeptMemberInfo>> getDeptMembers(
            @PathVariable Long deptId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean isEmpActive,
            @PageableDefault(page = 0, size = 10) Pageable pageable
    ) {
        Page<DeptMemberInfo> responses = deptRetriever.retrieveDeptMemberList(deptId, keyword, isEmpActive, pageable);

        return ResponseEntity.ok().body(responses);
    }

    @GetMapping("/{deptId}")
    public ResponseEntity<DeptInfoResponse> getDept(
            @PathVariable Long deptId
    ) {
        DeptInfoResponse response = deptRetriever.retrieveDeptInfo(deptId);

        return ResponseEntity.ok().body(response);
    }

//    @GetMapping("/tree")
//    public ResponseEntity<DeptTreeNodeResponse> getDeptTree() {
//        DeptTreeNodeResponse response = deptRetriever.retrieveDeptTree();
//
//        return ResponseEntity.ok().body(response);
//    }
}
