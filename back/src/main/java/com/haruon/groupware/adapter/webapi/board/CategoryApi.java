package com.haruon.groupware.adapter.webapi.board;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.board.provided.CategoryRetriever;
import com.haruon.groupware.application.board.service.dto.response.CategoryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/categories")
public class CategoryApi {
    private final CategoryRetriever categoryRetriever;

    // 카테고리 관리용 목록 출력
    @GetMapping("/management")
    public ResponseEntity<Page<CategoryResponse>> getCategoriesForManagement(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "true") Boolean isVisible,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<CategoryResponse> responses = categoryRetriever.retrieveCategoriesForManagement(
                details.getEmpId(), keyword, isVisible, pageable
        );

        return ResponseEntity.ok().body(responses);
    }

    // 카테고리 목록들 출력
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getVisibleCategories() {
        List<CategoryResponse> responses = categoryRetriever.retrieveVisibleCategories();

        return ResponseEntity.ok().body(responses);
    }
}
