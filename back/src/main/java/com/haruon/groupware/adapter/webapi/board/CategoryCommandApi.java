package com.haruon.groupware.adapter.webapi.board;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.board.dto.CommandCategoryNameRequest;
import com.haruon.groupware.application.board.provided.forCommand.CategoryManagement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/categories")
public class CategoryCommandApi {

    private final CategoryManagement categoryManagement;

    @PostMapping
    public ResponseEntity<Void> categories(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid CommandCategoryNameRequest request
    ) {
        categoryManagement.registerCategory(details.getEmpId(), request.categoryName());

        return ResponseEntity.status(201).build();
    }

    @PatchMapping("/{categoryId}/name")
    public ResponseEntity<Void> updateCategoryName(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long categoryId,
            @RequestBody @Valid CommandCategoryNameRequest request
    ) {
        categoryManagement.changeCategoryName(details.getEmpId(), categoryId, request.categoryName());

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{categoryId}/visibility/activation")
    public ResponseEntity<Void> activateCategory(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long categoryId
    ) {
        categoryManagement.showCategory(details.getEmpId(), categoryId);

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{categoryId}/visibility/deactivation")
    public ResponseEntity<Void> deactivateCategory(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long categoryId
    ) {
        categoryManagement.hideCategory(details.getEmpId(), categoryId);

        return ResponseEntity.status(204).build();
    }


}
