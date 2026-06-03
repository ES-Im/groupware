package com.haruon.groupware.domain;

import com.haruon.groupware.domain.shared.Email;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

import static com.haruon.groupware.domain.shared.RegexpUtil.EMAIL_PATTERN;
import static com.haruon.groupware.domain.shared.RegexpUtil.EMAIL_PATTERN_MESSAGE;
import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@ToString(callSuper = true)
@SuppressWarnings("NullAway.Init")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Company extends AbstractEntity {

    private String companyName;

    private String location;

    private Email presentedEmail;

    private String presentedExternalNo;

    private String ownerName;

    private String homePageURL;

    private LocalDateTime editedAt;


    public static Company register(
            String companyName,
            String location,
            String presentedEmail,
            String presentedExternalNo,
            String ownerName,
            String homePageURL,
            LocalDateTime editedAt
    ) {
        Company company = new Company();

        company.companyName = requireText(companyName, "회사명");
        company.location = requireText(location, "회사 위치");
        company.presentedEmail = createEmail(presentedEmail);
        company.presentedExternalNo = requireText(presentedExternalNo, "대표 외부 연락처");
        company.ownerName = requireText(ownerName, "대표자명");
        company.homePageURL = requireHomePageURL(homePageURL);
        company.editedAt = requireNonNull(editedAt, "수정일시는 필수입니다.");

        return company;
    }

    public Company editCompanyInfo(
            @Nullable String companyName,
            @Nullable String location,
            @Nullable String ownerName,
            LocalDateTime editedAt
    ) {
        state(companyName != null || location != null || ownerName != null, "변경할 내용이 없습니다.");

        return copy(
                companyName != null ? requireText(companyName, "회사명") : this.companyName,
                location != null ? requireText(location, "회사 위치") : this.location,
                this.presentedEmail.email(),
                this.presentedExternalNo,
                ownerName != null ? requireText(ownerName, "대표자명") : this.ownerName,
                this.homePageURL,
                editedAt
        );
    }

    public Company editPresentedContact(
            @Nullable String presentedEmail,
            @Nullable String presentedExternalNo,
            LocalDateTime editedAt
    ) {
        state(presentedEmail != null || presentedExternalNo != null, "변경할 내용이 없습니다.");

        return copy(
                this.companyName,
                this.location,
                presentedEmail != null ? presentedEmail : this.presentedEmail.email(),
                presentedExternalNo != null ? requireText(presentedExternalNo, "대표 외부 연락처") : this.presentedExternalNo,
                this.ownerName,
                this.homePageURL,
                editedAt
        );
    }

    public Company editHomePageURL(String homePageURL, LocalDateTime editedAt) {
        return copy(
                this.companyName,
                this.location,
                this.presentedEmail.email(),
                this.presentedExternalNo,
                this.ownerName,
                requireHomePageURL(homePageURL),
                editedAt
        );
    }

    private Company copy(
            String companyName,
            String location,
            String presentedEmail,
            String presentedExternalNo,
            String ownerName,
            String homePageURL,
            LocalDateTime editedAt
    ) {
        LocalDateTime requiredEditedAt = requireNonNull(editedAt, "수정일시는 필수입니다.");
        state(requiredEditedAt.isAfter(this.editedAt), "수정일시는 기존 수정일시 이후여야 합니다.");

        return register(
                companyName,
                location,
                presentedEmail,
                presentedExternalNo,
                ownerName,
                homePageURL,
                requiredEditedAt
        );
    }

    private static Email createEmail(String presentedEmail) {
        String email = requireText(presentedEmail, "대표 이메일");
        state(email.matches(EMAIL_PATTERN), EMAIL_PATTERN_MESSAGE);

        return new Email(email);
    }

    private static String requireHomePageURL(String homePageURL) {
        String url = requireText(homePageURL, "홈페이지 URL");
        state(url.startsWith("http://") || url.startsWith("https://"), "홈페이지 URL 형식이 올바르지 않습니다.");

        return url;
    }

    private static String requireText(String value, String fieldName) {
        requireNonNull(value, fieldName + "은 필수입니다.");
        state(!value.isBlank(), fieldName + "은 공백일 수 없습니다.");

        return value;
    }

}
