package com.haruon.groupware.adapter.webapi.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CommandCategoryNameRequest(@NotNull @NotBlank @Size(max = 30) String categoryName) {
}