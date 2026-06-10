package com.haruon.groupware.application.board.provided;

import com.haruon.groupware.application.board.service.dto.response.CategoryResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CategoryRetriever {

    List<CategoryResponse> retrieveVisibleCategories();

    Page<CategoryResponse> retrieveCategoriesForManagement(
            Long adminEmpId,
            @Nullable String categoryNameKeyword,
            @Nullable Boolean isVisible,
            Pageable pageable
    );
}
