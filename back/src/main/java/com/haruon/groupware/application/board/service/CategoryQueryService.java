package com.haruon.groupware.application.board.service;

import com.haruon.groupware.application.board.provided.CategoryRetriever;
import com.haruon.groupware.application.board.required.CategoryQueryRepository;
import com.haruon.groupware.application.board.service.dto.response.CategoryResponse;
import com.haruon.groupware.application.utils.AuthValidator;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CategoryQueryService implements CategoryRetriever {

    private final CategoryQueryRepository categoryQueryRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

    @Override
    public List<CategoryResponse> retrieveVisibleCategories() {
        return categoryQueryRepository.findCategoriesByVisibleTrue();
    }

    @Override
    public Page<CategoryResponse> retrieveCategoriesForManagement(
            Long adminEmpId, String categoryNameKeyword, @Nullable Boolean isVisible, Pageable pageable
    ) {
        AuthValidator.checkAdminById(authorizationQueryRepository, adminEmpId);

        return categoryQueryRepository.findCategories(
                categoryNameKeyword, isVisible, pageable
        );
    }
}
