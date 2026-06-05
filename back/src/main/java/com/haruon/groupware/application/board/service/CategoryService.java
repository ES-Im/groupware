package com.haruon.groupware.application.board.service;

import com.haruon.groupware.application.board.provided.CategoryManagement;
import com.haruon.groupware.application.board.required.CategoryRepository;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.domain.board.Category;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import static com.haruon.groupware.application.board.service.BoardUtils.findCategory;
import static com.haruon.groupware.application.utils.AuthValidator.checkAdminById;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService implements CategoryManagement {

    private final AuthorizationQueryRepository authorizationQueryRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public long registerCategory(Long editorId, String categoryName) {
        checkAdminById(authorizationQueryRepository, editorId);

        Category category = Category.create(categoryName);

        return categoryRepository.save(category).getId();
    }

    @Override
    public void changeCategoryName(Long editorId, Long categoryId, String categoryName) {
        checkAdminById(authorizationQueryRepository, editorId);

        Category category = findCategory(categoryRepository, categoryId);

        category.changeCategoryName(categoryName);
    }


    @Override
    public void showCategory(Long editorId, Long categoryId) {
        checkAdminById(authorizationQueryRepository, editorId);

        Category category = findCategory(categoryRepository, categoryId);

        category.changeVisibility(true);
    }

    @Override
    public void hideCategory(Long editorId, Long categoryId) {
        checkAdminById(authorizationQueryRepository, editorId);

        Category category = findCategory(categoryRepository, categoryId);

        category.changeVisibility(false);
    }

}
