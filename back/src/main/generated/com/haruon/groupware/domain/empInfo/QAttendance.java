package com.haruon.groupware.domain.empInfo;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QAttendance is a Querydsl query type for Attendance
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAttendance extends EntityPathBase<Attendance> {

    private static final long serialVersionUID = -1934479405L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QAttendance attendance = new QAttendance("attendance");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final DateTimePath<java.time.LocalDateTime> approvedAt = createDateTime("approvedAt", java.time.LocalDateTime.class);

    public final QEmp approvedBy;

    public final DatePath<java.time.LocalDate> attendanceDate = createDate("attendanceDate", java.time.LocalDate.class);

    public final EnumPath<com.haruon.groupware.domain.empInfo.enums.AttendanceStatus> attendanceStatus = createEnum("attendanceStatus", com.haruon.groupware.domain.empInfo.enums.AttendanceStatus.class);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final DateTimePath<java.time.LocalDateTime> editedAt = createDateTime("editedAt", java.time.LocalDateTime.class);

    public final QEmp editedBy;

    public final StringPath editReason = createString("editReason");

    public final QEmp emp;

    public final TimePath<java.time.LocalTime> endAt = createTime("endAt", java.time.LocalTime.class);

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final TimePath<java.time.LocalTime> startAt = createTime("startAt", java.time.LocalTime.class);

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QAttendance(String variable) {
        this(Attendance.class, forVariable(variable), INITS);
    }

    public QAttendance(Path<? extends Attendance> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QAttendance(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QAttendance(PathMetadata metadata, PathInits inits) {
        this(Attendance.class, metadata, inits);
    }

    public QAttendance(Class<? extends Attendance> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.approvedBy = inits.isInitialized("approvedBy") ? new QEmp(forProperty("approvedBy"), inits.get("approvedBy")) : null;
        this.editedBy = inits.isInitialized("editedBy") ? new QEmp(forProperty("editedBy"), inits.get("editedBy")) : null;
        this.emp = inits.isInitialized("emp") ? new QEmp(forProperty("emp"), inits.get("emp")) : null;
    }

}

