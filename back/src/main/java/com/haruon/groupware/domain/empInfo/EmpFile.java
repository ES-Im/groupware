package com.haruon.groupware.domain.empInfo;

import com.haruon.groupware.domain.AbstractFileEntity;
import com.haruon.groupware.domain.empInfo.dto.EmpFileParam;
import com.haruon.groupware.domain.empInfo.enums.FileType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

import static java.util.Objects.requireNonNull;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmpFile extends AbstractFileEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="emp_id", nullable=false)
    private Emp emp;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private FileType fileType;

    @Column(nullable = false)
    private Boolean isActive;


    static EmpFile addFile(Emp emp,EmpFileParam request) {
        EmpFile empFile = new EmpFile();

        empFile.storedName = UUID.randomUUID().toString();
        empFile.isActive = true;

        empFile.emp = requireNonNull(emp);
        empFile.fileType = requireNonNull(request.fileType());
        empFile.originalName = requireNonNull(request.fileParam().originalName());
        empFile.extension = requireNonNull(request.fileParam().extension());
        empFile.fileSize = requireNonNull(request.fileParam().fileSize());

        return empFile;
    }

    void activateFile() {
        this.isActive = true;
    }

    void deactivateFile() {
        this.isActive = false;
    }

}
