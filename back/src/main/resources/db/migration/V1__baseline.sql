-- =====================================================================
-- Flyway baseline migration : V1__baseline.sql
-- Project : haruon-groupware

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- Company
-- =====================================================================
CREATE TABLE company (
                         id                    BIGINT       NOT NULL AUTO_INCREMENT,
                         created_at            DATETIME(6)  NOT NULL,
                         updated_at            DATETIME(6)  NULL,
                         company_name          VARCHAR(50)  NOT NULL,
                         location              VARCHAR(200) NOT NULL,
                         presented_email       VARCHAR(150) NOT NULL,
                         presented_external_no VARCHAR(20)  NOT NULL,
                         owner_name            VARCHAR(20)  NOT NULL,
                         home_page_url         VARCHAR(200) NOT NULL,
                         edited_at             DATETIME(6)  NOT NULL,
                         PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =====================================================================
-- Employee & Organization
-- =====================================================================
CREATE TABLE dept (
                      id             BIGINT      NOT NULL AUTO_INCREMENT,
                      created_at     DATETIME(6) NOT NULL,
                      updated_at     DATETIME(6) NULL,
                      dept_code      VARCHAR(3)  NOT NULL,
                      dept_name      VARCHAR(20) NOT NULL,
                      is_active      BIT(1)      NOT NULL,
                      parent_dept_id BIGINT      NULL,
                      PRIMARY KEY (id),
                      CONSTRAINT uk_dept_dept_code UNIQUE (dept_code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE emp (
                     id            BIGINT       NOT NULL AUTO_INCREMENT,
                     created_at    DATETIME(6)  NOT NULL,
                     updated_at    DATETIME(6)  NULL,
                     emp_no        VARCHAR(9)   NOT NULL,
                     emp_name      VARCHAR(20)  NOT NULL,
                     login_id      VARCHAR(20)  NOT NULL,
                     emp_password  VARCHAR(100) NOT NULL,
                     extension_no  VARCHAR(8)   NULL,
                     status        VARCHAR(20)  NOT NULL,
                     hired_at      DATE         NULL,
                     resigned_at   DATE         NULL,
                     company_email VARCHAR(150) NOT NULL,
                     PRIMARY KEY (id),
                     CONSTRAINT uk_emp_emp_no        UNIQUE (emp_no),
                     CONSTRAINT uk_emp_login_id      UNIQUE (login_id),
                     CONSTRAINT uk_emp_company_email UNIQUE (company_email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- @ElementCollection Set<SystemRoleCode>
CREATE TABLE system_roles (
                              emp_id BIGINT      NOT NULL,
                              role   VARCHAR(20) NOT NULL,
                              PRIMARY KEY (emp_id, role)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE emp_file (
                          id            BIGINT       NOT NULL AUTO_INCREMENT,
                          created_at    DATETIME(6)  NOT NULL,
                          updated_at    DATETIME(6)  NULL,
                          original_name VARCHAR(200) NOT NULL,
                          stored_name   VARCHAR(200) NOT NULL,
                          mime_type     VARCHAR(100) NOT NULL,
                          extension     VARCHAR(20)  NOT NULL,
                          file_size     BIGINT       NOT NULL,
                          stored_path   VARCHAR(500) NOT NULL,
                          file_type     VARCHAR(20)  NOT NULL,
                          is_active     BIT(1)       NOT NULL,
                          emp_id        BIGINT       NOT NULL,
                          PRIMARY KEY (id),
                          CONSTRAINT uk_emp_file_stored_name UNIQUE (stored_name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE emp_belongings (
                                id         BIGINT      NOT NULL AUTO_INCREMENT,
                                created_at DATETIME(6) NOT NULL,
                                updated_at DATETIME(6) NULL,
                                position   VARCHAR(20) NOT NULL,
                                is_primary BIT(1)      NOT NULL,
                                start_at   DATE        NOT NULL,
                                end_at     DATE        NULL,
                                emp_id     BIGINT      NOT NULL,
                                dept_id    BIGINT      NOT NULL,
                                PRIMARY KEY (id),
                                CONSTRAINT uk_emp_belongings_emp_dept_start UNIQUE (emp_id, dept_id, start_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE dept_leader (
                             id         BIGINT      NOT NULL AUTO_INCREMENT,
                             created_at DATETIME(6) NOT NULL,
                             updated_at DATETIME(6) NULL,
                             start_at   DATE        NOT NULL,
                             end_at     DATE        NULL,
                             dept_id    BIGINT      NOT NULL,
                             emp_id     BIGINT      NOT NULL,
                             PRIMARY KEY (id),
                             CONSTRAINT uk_dept_leader_dept_emp_start UNIQUE (dept_id, emp_id, start_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE attendance (
                            id                BIGINT       NOT NULL AUTO_INCREMENT,
                            created_at        DATETIME(6)  NOT NULL,
                            updated_at        DATETIME(6)  NULL,
                            attendance_status VARCHAR(20)  NULL,
                            attendance_date   DATE         NOT NULL,
                            start_at          TIME(6)      NULL,
                            end_at            TIME(6)      NULL,
                            approved_at       DATETIME(6)  NULL,
                            edited_at         DATETIME(6)  NULL,
                            edit_reason       VARCHAR(100) NULL,
                            emp_id            BIGINT       NOT NULL,
                            approved_emp_id   BIGINT       NULL,
                            edited_emp_id     BIGINT       NULL,
                            PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE emp_leave (
                           id                       BIGINT      NOT NULL AUTO_INCREMENT,
                           created_at               DATETIME(6) NOT NULL,
                           updated_at               DATETIME(6) NULL,
                           grant_year               BIGINT      NOT NULL,
                           annual_base_grant_days   DOUBLE      NOT NULL,
                           annual_used_days         DOUBLE      NOT NULL,
                           special_grant_days       DOUBLE      NOT NULL,
                           special_used_days        DOUBLE      NOT NULL,
                           compensatory_grant_days  DOUBLE      NOT NULL,
                           compensatory_used_days   DOUBLE      NOT NULL,
                           emp_id                   BIGINT      NOT NULL,
                           PRIMARY KEY (id),
                           CONSTRAINT uk_emp_leave_emp_grant_year UNIQUE (emp_id, grant_year)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =====================================================================
-- Schedule
-- =====================================================================
CREATE TABLE schedule (
                          id           BIGINT       NOT NULL AUTO_INCREMENT,
                          created_at   DATETIME(6)  NOT NULL,
                          updated_at   DATETIME(6)  NULL,
                          source_key   VARCHAR(36)  NOT NULL,
                          schedule_type VARCHAR(20) NOT NULL,
                          title        VARCHAR(100) NOT NULL,
                          content      TEXT         NOT NULL,
                          schedule_date DATE        NOT NULL,
                          start_at     TIME(6)      NOT NULL,
                          end_at       TIME(6)      NOT NULL,
                          is_all_day   BIT(1)       NOT NULL,
                          is_canceled  BIT(1)       NOT NULL,
                          owner_emp_id BIGINT       NOT NULL,
                          PRIMARY KEY (id),
                          CONSTRAINT uk_schedule_type_source_owner_date UNIQUE (schedule_type, source_key, owner_emp_id, schedule_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE schedule_participant (
                                      id             BIGINT      NOT NULL AUTO_INCREMENT,
                                      created_at     DATETIME(6) NOT NULL,
                                      updated_at     DATETIME(6) NULL,
                                      schedule_id    BIGINT      NOT NULL,
                                      participant_id BIGINT      NOT NULL,
                                      PRIMARY KEY (id),
                                      CONSTRAINT uk_schedule_participant UNIQUE (schedule_id, participant_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =====================================================================
-- Draft (JOINED inheritance: draft = root, subtype tables share PK)
-- =====================================================================
CREATE TABLE draft (
                       id           BIGINT       NOT NULL AUTO_INCREMENT,
                       created_at   DATETIME(6)  NOT NULL,
                       updated_at   DATETIME(6)  NULL,
                       draft_type   VARCHAR(31)  NOT NULL,
                       source_key   VARCHAR(36)  NOT NULL,
                       title        VARCHAR(100) NOT NULL,
                       content      TEXT         NOT NULL,
                       submitted_at DATETIME(6)  NULL,
                       drafter_id   BIGINT       NOT NULL,
                       PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE general_draft (
                               id BIGINT NOT NULL,
                               PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE leave_draft (
                             id             BIGINT      NOT NULL,
                             start_at       DATETIME(6) NOT NULL,
                             end_at         DATETIME(6) NOT NULL,
                             leave_type     VARCHAR(20) NOT NULL,
                             reserved_hours BIGINT      NOT NULL,
                             PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE sales_draft (
                             id           BIGINT     NOT NULL,
                             report_month VARCHAR(7) NOT NULL,
                             sales_amount BIGINT     NOT NULL,
                             franchise_id BIGINT     NOT NULL,
                             PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE business_trip_draft (
                                     id          BIGINT       NOT NULL,
                                     start_at    DATETIME(6)  NOT NULL,
                                     end_at      DATETIME(6)  NOT NULL,
                                     destination VARCHAR(200) NOT NULL,
                                     purpose     VARCHAR(200) NOT NULL,
                                     PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE business_trip_participant (
                                           id                     BIGINT      NOT NULL AUTO_INCREMENT,
                                           created_at             DATETIME(6) NOT NULL,
                                           updated_at             DATETIME(6) NULL,
                                           business_trip_draft_id BIGINT      NOT NULL,
                                           emp_id                 BIGINT      NOT NULL,
                                           PRIMARY KEY (id),
                                           CONSTRAINT uk_business_trip_participant UNIQUE (business_trip_draft_id, emp_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE leave_cancel_draft (
                                    id BIGINT NOT NULL,
                                    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE business_trip_cancel_draft (
                                            id BIGINT NOT NULL,
                                            PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE draft_file (
                            id            BIGINT       NOT NULL AUTO_INCREMENT,
                            created_at    DATETIME(6)  NOT NULL,
                            updated_at    DATETIME(6)  NULL,
                            original_name VARCHAR(200) NOT NULL,
                            stored_name   VARCHAR(200) NOT NULL,
                            mime_type     VARCHAR(100) NOT NULL,
                            extension     VARCHAR(20)  NOT NULL,
                            file_size     BIGINT       NOT NULL,
                            stored_path   VARCHAR(500) NOT NULL,
                            draft_id      BIGINT       NOT NULL,
                            PRIMARY KEY (id),
                            CONSTRAINT uk_draft_file_stored_name UNIQUE (stored_name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE approval (
                          id         BIGINT      NOT NULL AUTO_INCREMENT,
                          created_at DATETIME(6) NOT NULL,
                          updated_at DATETIME(6) NULL,
                          status     VARCHAR(20) NOT NULL,
                          draft_id   BIGINT      NOT NULL,
                          PRIMARY KEY (id),
                          CONSTRAINT uk_approval_draft_id UNIQUE (draft_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE approver (
                          id             BIGINT      NOT NULL AUTO_INCREMENT,
                          created_at     DATETIME(6) NOT NULL,
                          updated_at     DATETIME(6) NULL,
                          role           VARCHAR(10) NOT NULL,
                          approval_order INT         NOT NULL,
                          approved_at    DATETIME(6) NULL,
                          reject_reason  TEXT        NULL,
                          rejected_at    DATETIME(6) NULL,
                          approval_id    BIGINT      NOT NULL,
                          approver_id    BIGINT      NOT NULL,
                          PRIMARY KEY (id),
                          CONSTRAINT uk_approver_approval_approver UNIQUE (approval_id, approver_id),
                          CONSTRAINT uk_approver_approval_order    UNIQUE (approval_id, approval_order)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE circulation (
                             id         BIGINT      NOT NULL AUTO_INCREMENT,
                             created_at DATETIME(6) NOT NULL,
                             updated_at DATETIME(6) NULL,
                             read_at    DATETIME(6) NULL,
                             draft_id   BIGINT      NOT NULL,
                             emp_id     BIGINT      NOT NULL,
                             PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =====================================================================
-- Meeting
-- =====================================================================
CREATE TABLE meeting_room (
                              id          BIGINT      NOT NULL AUTO_INCREMENT,
                              created_at  DATETIME(6) NOT NULL,
                              updated_at  DATETIME(6) NULL,
                              name        VARCHAR(50) NOT NULL,
                              capacity    BIGINT      NOT NULL,
                              description TEXT        NOT NULL,
                              is_available BIT(1)     NOT NULL,
                              PRIMARY KEY (id),
                              CONSTRAINT uk_meeting_room_name UNIQUE (name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE meeting (
                         id           BIGINT       NOT NULL AUTO_INCREMENT,
                         created_at   DATETIME(6)  NOT NULL,
                         updated_at   DATETIME(6)  NULL,
                         source_key   VARCHAR(36)  NOT NULL,
                         title        VARCHAR(100) NOT NULL,
                         meeting_date DATE         NOT NULL,
                         start_at     TIME(6)      NOT NULL,
                         end_at       TIME(6)      NOT NULL,
                         is_cancel    BIT(1)       NOT NULL,
                         room_id      BIGINT       NOT NULL,
                         reserver_id  BIGINT       NOT NULL,
                         PRIMARY KEY (id),
                         CONSTRAINT uk_meeting_source_key UNIQUE (source_key)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE meeting_participant (
                                     id             BIGINT      NOT NULL AUTO_INCREMENT,
                                     created_at     DATETIME(6) NOT NULL,
                                     updated_at     DATETIME(6) NULL,
                                     participant_id BIGINT      NOT NULL,
                                     meeting_id     BIGINT      NOT NULL,
                                     PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE meeting_room_file (
                                   id            BIGINT       NOT NULL AUTO_INCREMENT,
                                   created_at    DATETIME(6)  NOT NULL,
                                   updated_at    DATETIME(6)  NULL,
                                   original_name VARCHAR(200) NOT NULL,
                                   stored_name   VARCHAR(200) NOT NULL,
                                   mime_type     VARCHAR(100) NOT NULL,
                                   extension     VARCHAR(20)  NOT NULL,
                                   file_size     BIGINT       NOT NULL,
                                   stored_path   VARCHAR(500) NOT NULL,
                                   room_id       BIGINT       NOT NULL,
                                   PRIMARY KEY (id),
                                   CONSTRAINT uk_meeting_room_file_stored_name UNIQUE (stored_name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =====================================================================
-- Franchise
-- =====================================================================
CREATE TABLE franchise (
                           id              BIGINT       NOT NULL AUTO_INCREMENT,
                           created_at      DATETIME(6)  NOT NULL,
                           updated_at      DATETIME(6)  NULL,
                           business_number VARCHAR(12)  NOT NULL,
                           franchise_name  VARCHAR(50)  NOT NULL,
                           address         VARCHAR(200) NOT NULL,
                           owner_name      VARCHAR(50)  NOT NULL,
                           contact_number  VARCHAR(50)  NOT NULL,
                           business_status VARCHAR(20)  NOT NULL,
                           memo            TEXT         NULL,
                           manager_id      BIGINT       NULL,
                           contact_email   VARCHAR(150) NOT NULL,
                           PRIMARY KEY (id),
                           CONSTRAINT uk_franchise_contact_email UNIQUE (contact_email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE franchise_daily_sales (
                                       id           BIGINT       NOT NULL AUTO_INCREMENT,
                                       created_at   DATETIME(6)  NOT NULL,
                                       updated_at   DATETIME(6)  NULL,
                                       external_id  VARCHAR(100) NOT NULL,
                                       sales_date   DATE         NOT NULL,
                                       sales_amount BIGINT       NOT NULL,
                                       order_count  BIGINT       NOT NULL,
                                       franchise_id BIGINT       NOT NULL,
                                       PRIMARY KEY (id),
                                       CONSTRAINT uk_franchise_daily_sales_external_id UNIQUE (external_id),
                                       CONSTRAINT uk_franchise_daily_sales_date_franchise UNIQUE (sales_date, franchise_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE education (
                           id             BIGINT      NOT NULL AUTO_INCREMENT,
                           created_at     DATETIME(6) NOT NULL,
                           updated_at     DATETIME(6) NULL,
                           education_code VARCHAR(20) NULL,
                           education_date DATETIME    NOT NULL,
                           place          VARCHAR(50) NOT NULL,
                           title          VARCHAR(50) NOT NULL,
                           content        MEDIUMTEXT  NOT NULL,
                           capacity       BIGINT      NOT NULL,
                           is_active      BIT(1)      NOT NULL,
                           register_id    BIGINT      NOT NULL,
                           PRIMARY KEY (id),
                           CONSTRAINT uk_education_education_code UNIQUE (education_code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE education_file (
                                id            BIGINT       NOT NULL AUTO_INCREMENT,
                                created_at    DATETIME(6)  NOT NULL,
                                updated_at    DATETIME(6)  NULL,
                                original_name VARCHAR(200) NOT NULL,
                                stored_name   VARCHAR(200) NOT NULL,
                                mime_type     VARCHAR(100) NOT NULL,
                                extension     VARCHAR(20)  NOT NULL,
                                file_size     BIGINT       NOT NULL,
                                stored_path   VARCHAR(500) NOT NULL,
                                education_id  BIGINT       NOT NULL,
                                PRIMARY KEY (id),
                                CONSTRAINT uk_education_file_stored_name UNIQUE (stored_name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE education_application (
                                       id            BIGINT       NOT NULL AUTO_INCREMENT,
                                       created_at    DATETIME(6)  NOT NULL,
                                       updated_at    DATETIME(6)  NULL,
                                       external_id   VARCHAR(100) NOT NULL,
                                       applied_count BIGINT       NOT NULL,
                                       applied_at    DATETIME(6)  NOT NULL,
                                       education_id  BIGINT       NOT NULL,
                                       franchise_id  BIGINT       NOT NULL,
                                       PRIMARY KEY (id),
                                       CONSTRAINT uk_education_application_external_id UNIQUE (external_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE franchise_inquiry (
                                   id              BIGINT       NOT NULL AUTO_INCREMENT,
                                   created_at      DATETIME(6)  NOT NULL,
                                   updated_at      DATETIME(6)  NULL,
                                   external_id     VARCHAR(100) NOT NULL,
                                   inquirer_contact VARCHAR(50) NOT NULL,
                                   inquiry_at      DATETIME(6)  NOT NULL,
                                   inquiry_title   VARCHAR(50)  NOT NULL,
                                   inquiry_content MEDIUMTEXT   NOT NULL,
                                   inquiry_status  VARCHAR(255) NOT NULL,
                                   franchise_id    BIGINT       NOT NULL,
                                   assigned_emp_id BIGINT       NULL,
                                   PRIMARY KEY (id),
                                   CONSTRAINT uk_franchise_inquiry_external_id UNIQUE (external_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE franchise_inquiry_answer (
                                          id          BIGINT      NOT NULL AUTO_INCREMENT,
                                          created_at  DATETIME(6) NOT NULL,
                                          updated_at  DATETIME(6) NULL,
                                          content     MEDIUMTEXT  NOT NULL,
                                          answered_at DATETIME(6) NULL,
                                          inquiry_id  BIGINT      NOT NULL,
                                          PRIMARY KEY (id),
                                          CONSTRAINT uk_franchise_inquiry_answer_inquiry_id UNIQUE (inquiry_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =====================================================================
-- Board
-- =====================================================================
CREATE TABLE category (
                          id         BIGINT      NOT NULL AUTO_INCREMENT,
                          created_at DATETIME(6) NOT NULL,
                          updated_at DATETIME(6) NULL,
                          name       VARCHAR(30) NOT NULL,
                          is_visible BIT(1)      NOT NULL,
                          PRIMARY KEY (id),
                          CONSTRAINT uk_category_name UNIQUE (name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE board (
                       id            BIGINT      NOT NULL AUTO_INCREMENT,
                       created_at    DATETIME(6) NOT NULL,
                       updated_at    DATETIME(6) NULL,
                       title         VARCHAR(50) NOT NULL,
                       content       MEDIUMTEXT  NOT NULL,
                       is_draft      BIT(1)      NOT NULL,
                       published_at  DATETIME(6) NULL,
                       modified_at   DATETIME(6) NULL,
                       view_count    BIGINT      NOT NULL,
                       like_count    BIGINT      NOT NULL,
                       comment_count BIGINT      NOT NULL,
                       author_id     BIGINT      NOT NULL,
                       category_id   BIGINT      NOT NULL,
                       PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE board_file (
                            id            BIGINT       NOT NULL AUTO_INCREMENT,
                            created_at    DATETIME(6)  NOT NULL,
                            updated_at    DATETIME(6)  NULL,
                            original_name VARCHAR(200) NOT NULL,
                            stored_name   VARCHAR(200) NOT NULL,
                            mime_type     VARCHAR(100) NOT NULL,
                            extension     VARCHAR(20)  NOT NULL,
                            file_size     BIGINT       NOT NULL,
                            stored_path   VARCHAR(500) NOT NULL,
                            board_id      BIGINT       NOT NULL,
                            PRIMARY KEY (id),
                            CONSTRAINT uk_board_file_stored_name UNIQUE (stored_name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE board_comment (
                               id                BIGINT       NOT NULL AUTO_INCREMENT,
                               created_at        DATETIME(6)  NOT NULL,
                               updated_at        DATETIME(6)  NULL,
                               content           VARCHAR(300) NOT NULL,
                               register_at       DATETIME(6)  NOT NULL,
                               edited_at         DATETIME(6)  NULL,
                               is_deleted        BIT(1)       NOT NULL,
                               board_id          BIGINT       NOT NULL,
                               author_id         BIGINT       NOT NULL,
                               parent_comment_id BIGINT       NULL,
                               PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE board_like (
                            id         BIGINT      NOT NULL AUTO_INCREMENT,
                            created_at DATETIME(6) NOT NULL,
                            updated_at DATETIME(6) NULL,
                            board_id   BIGINT      NOT NULL,
                            emp_id     BIGINT      NOT NULL,
                            PRIMARY KEY (id),
                            CONSTRAINT uk_board_like_board_emp UNIQUE (board_id, emp_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =====================================================================
-- Message
-- =====================================================================
CREATE TABLE message (
                         id         BIGINT      NOT NULL AUTO_INCREMENT,
                         created_at DATETIME(6) NOT NULL,
                         updated_at DATETIME(6) NULL,
                         title      VARCHAR(50) NOT NULL,
                         content    MEDIUMTEXT  NOT NULL,
                         sent_at    DATETIME(6) NULL,
                         PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE message_sending (
                                 id         BIGINT      NOT NULL AUTO_INCREMENT,
                                 created_at DATETIME(6) NOT NULL,
                                 updated_at DATETIME(6) NULL,
                                 deleted_at DATETIME(6) NULL,
                                 trashed_at DATETIME(6) NULL,
                                 message_id BIGINT      NOT NULL,
                                 sender_id  BIGINT      NOT NULL,
                                 PRIMARY KEY (id),
                                 CONSTRAINT uk_message_sending_message_id UNIQUE (message_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE message_receiving (
                                   id          BIGINT      NOT NULL AUTO_INCREMENT,
                                   created_at  DATETIME(6) NOT NULL,
                                   updated_at  DATETIME(6) NULL,
                                   read_at     DATETIME(6) NULL,
                                   deleted_at  DATETIME(6) NULL,
                                   trashed_at  DATETIME(6) NULL,
                                   message_id  BIGINT      NOT NULL,
                                   receiver_id BIGINT      NOT NULL,
                                   PRIMARY KEY (id),
                                   CONSTRAINT uk_message_receiving_message_receiver UNIQUE (message_id, receiver_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE message_file (
                              id            BIGINT       NOT NULL AUTO_INCREMENT,
                              created_at    DATETIME(6)  NOT NULL,
                              updated_at    DATETIME(6)  NULL,
                              original_name VARCHAR(200) NOT NULL,
                              stored_name   VARCHAR(200) NOT NULL,
                              mime_type     VARCHAR(100) NOT NULL,
                              extension     VARCHAR(20)  NOT NULL,
                              file_size     BIGINT       NOT NULL,
                              stored_path   VARCHAR(500) NOT NULL,
                              message_id    BIGINT       NOT NULL,
                              PRIMARY KEY (id),
                              CONSTRAINT uk_message_file_stored_name UNIQUE (stored_name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =====================================================================
-- Chat
-- =====================================================================
CREATE TABLE chat_room (
                           id              BIGINT      NOT NULL AUTO_INCREMENT,
                           created_at      DATETIME(6) NOT NULL,
                           updated_at      DATETIME(6) NULL,
                           is_group        BIT(1)      NOT NULL,
                           last_message_at DATETIME(6) NULL,
                           closed_at       DATETIME(6) NULL,
                           room_owner_id   BIGINT      NOT NULL,
                           PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE chat_message (
                              id                BIGINT      NOT NULL AUTO_INCREMENT,
                              created_at        DATETIME(6) NOT NULL,
                              updated_at        DATETIME(6) NULL,
                              client_message_id VARCHAR(36) NOT NULL,
                              content           MEDIUMTEXT  NOT NULL,
                              sent_at           DATETIME(6) NOT NULL,
                              room_id           BIGINT      NOT NULL,
                              sender_id         BIGINT      NOT NULL,
                              PRIMARY KEY (id),
                              CONSTRAINT uk_chat_message_sender_client UNIQUE (sender_id, client_message_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE chat_member (
                             id              BIGINT      NOT NULL AUTO_INCREMENT,
                             created_at      DATETIME(6) NOT NULL,
                             updated_at      DATETIME(6) NULL,
                             room_name       VARCHAR(20) NULL,
                             is_book_marked  BIT(1)      NOT NULL,
                             joined_at       DATETIME(6) NOT NULL,
                             left_at         DATETIME(6) NULL,
                             room_id         BIGINT      NOT NULL,
                             member_id       BIGINT      NOT NULL,
                             last_message_id BIGINT      NULL,
                             PRIMARY KEY (id),
                             CONSTRAINT uk_chat_member_room_member UNIQUE (room_id, member_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =====================================================================
-- Sync
-- =====================================================================
CREATE TABLE franchise_sync_request (
                                        id                 BIGINT       NOT NULL AUTO_INCREMENT,
                                        created_at         DATETIME(6)  NOT NULL,
                                        updated_at         DATETIME(6)  NULL,
                                        status             VARCHAR(255) NOT NULL,
                                        sync_type          VARCHAR(255) NOT NULL,
                                        external_id        VARCHAR(255) NOT NULL,
                                        endpoint_path      VARCHAR(255) NOT NULL,
                                        retry_count        BIGINT          NOT NULL,
                                        last_error_message VARCHAR(255) NULL,
                                        started_at         DATETIME(6)  NULL,
                                        finished_at        DATETIME(6)  NULL,
                                        item_idx           BIGINT       NOT NULL,
                                        franchise_id       BIGINT       NOT NULL,
                                        education_id       BIGINT       NULL,
                                        PRIMARY KEY (id),
                                        CONSTRAINT uk_franchise_sync_type_external_item UNIQUE (sync_type, external_id, item_idx)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =====================================================================
-- Foreign keys
-- =====================================================================

-- Organization
ALTER TABLE dept
    ADD CONSTRAINT fk_dept_parent_dept FOREIGN KEY (parent_dept_id) REFERENCES dept (id);

ALTER TABLE system_roles
    ADD CONSTRAINT fk_system_roles_emp FOREIGN KEY (emp_id) REFERENCES emp (id);

ALTER TABLE emp_file
    ADD CONSTRAINT fk_emp_file_emp FOREIGN KEY (emp_id) REFERENCES emp (id);

ALTER TABLE emp_belongings
    ADD CONSTRAINT fk_emp_belongings_emp  FOREIGN KEY (emp_id)  REFERENCES emp (id),
    ADD CONSTRAINT fk_emp_belongings_dept FOREIGN KEY (dept_id) REFERENCES dept (id);

ALTER TABLE dept_leader
    ADD CONSTRAINT fk_dept_leader_dept FOREIGN KEY (dept_id) REFERENCES dept (id),
    ADD CONSTRAINT fk_dept_leader_emp  FOREIGN KEY (emp_id)  REFERENCES emp (id);

ALTER TABLE attendance
    ADD CONSTRAINT fk_attendance_emp          FOREIGN KEY (emp_id)          REFERENCES emp (id),
    ADD CONSTRAINT fk_attendance_approved_emp FOREIGN KEY (approved_emp_id) REFERENCES emp (id),
    ADD CONSTRAINT fk_attendance_edited_emp   FOREIGN KEY (edited_emp_id)   REFERENCES emp (id);

ALTER TABLE emp_leave
    ADD CONSTRAINT fk_emp_leave_emp FOREIGN KEY (emp_id) REFERENCES emp (id);

-- Schedule
ALTER TABLE schedule
    ADD CONSTRAINT fk_schedule_owner_emp FOREIGN KEY (owner_emp_id) REFERENCES emp (id);

ALTER TABLE schedule_participant
    ADD CONSTRAINT fk_schedule_participant_schedule FOREIGN KEY (schedule_id)    REFERENCES schedule (id),
    ADD CONSTRAINT fk_schedule_participant_emp      FOREIGN KEY (participant_id) REFERENCES emp (id);

-- Draft
ALTER TABLE draft
    ADD CONSTRAINT fk_draft_drafter FOREIGN KEY (drafter_id) REFERENCES emp (id);

ALTER TABLE general_draft
    ADD CONSTRAINT fk_general_draft_draft FOREIGN KEY (id) REFERENCES draft (id);

ALTER TABLE leave_draft
    ADD CONSTRAINT fk_leave_draft_draft FOREIGN KEY (id) REFERENCES draft (id);

ALTER TABLE sales_draft
    ADD CONSTRAINT fk_sales_draft_draft     FOREIGN KEY (id)           REFERENCES draft (id),
    ADD CONSTRAINT fk_sales_draft_franchise FOREIGN KEY (franchise_id) REFERENCES franchise (id);

ALTER TABLE business_trip_draft
    ADD CONSTRAINT fk_business_trip_draft_draft FOREIGN KEY (id) REFERENCES draft (id);

ALTER TABLE business_trip_participant
    ADD CONSTRAINT fk_btp_business_trip_draft FOREIGN KEY (business_trip_draft_id) REFERENCES business_trip_draft (id),
    ADD CONSTRAINT fk_btp_emp                 FOREIGN KEY (emp_id)                 REFERENCES emp (id);

ALTER TABLE leave_cancel_draft
    ADD CONSTRAINT fk_leave_cancel_draft_draft FOREIGN KEY (id) REFERENCES draft (id);

ALTER TABLE business_trip_cancel_draft
    ADD CONSTRAINT fk_business_trip_cancel_draft_draft FOREIGN KEY (id) REFERENCES draft (id);

ALTER TABLE draft_file
    ADD CONSTRAINT fk_draft_file_draft FOREIGN KEY (draft_id) REFERENCES draft (id);

ALTER TABLE approval
    ADD CONSTRAINT fk_approval_draft FOREIGN KEY (draft_id) REFERENCES draft (id);

ALTER TABLE approver
    ADD CONSTRAINT fk_approver_approval FOREIGN KEY (approval_id) REFERENCES approval (id),
    ADD CONSTRAINT fk_approver_approver FOREIGN KEY (approver_id) REFERENCES emp (id);

ALTER TABLE circulation
    ADD CONSTRAINT fk_circulation_draft  FOREIGN KEY (draft_id) REFERENCES draft (id),
    ADD CONSTRAINT fk_circulation_viewer FOREIGN KEY (emp_id)   REFERENCES emp (id);

-- Meeting
ALTER TABLE meeting
    ADD CONSTRAINT fk_meeting_room     FOREIGN KEY (room_id)     REFERENCES meeting_room (id),
    ADD CONSTRAINT fk_meeting_reserver FOREIGN KEY (reserver_id) REFERENCES emp (id);

ALTER TABLE meeting_participant
    ADD CONSTRAINT fk_meeting_participant_meeting FOREIGN KEY (meeting_id)     REFERENCES meeting (id),
    ADD CONSTRAINT fk_meeting_participant_emp     FOREIGN KEY (participant_id) REFERENCES emp (id);

ALTER TABLE meeting_room_file
    ADD CONSTRAINT fk_meeting_room_file_room FOREIGN KEY (room_id) REFERENCES meeting_room (id);

-- Franchise
ALTER TABLE franchise
    ADD CONSTRAINT fk_franchise_manager FOREIGN KEY (manager_id) REFERENCES emp (id);

ALTER TABLE franchise_daily_sales
    ADD CONSTRAINT fk_franchise_daily_sales_franchise FOREIGN KEY (franchise_id) REFERENCES franchise (id);

ALTER TABLE education
    ADD CONSTRAINT fk_education_register FOREIGN KEY (register_id) REFERENCES emp (id);

ALTER TABLE education_file
    ADD CONSTRAINT fk_education_file_education FOREIGN KEY (education_id) REFERENCES education (id);

ALTER TABLE education_application
    ADD CONSTRAINT fk_education_application_education FOREIGN KEY (education_id) REFERENCES education (id),
    ADD CONSTRAINT fk_education_application_franchise FOREIGN KEY (franchise_id) REFERENCES franchise (id);

ALTER TABLE franchise_inquiry
    ADD CONSTRAINT fk_franchise_inquiry_franchise    FOREIGN KEY (franchise_id)    REFERENCES franchise (id),
    ADD CONSTRAINT fk_franchise_inquiry_assigned_emp FOREIGN KEY (assigned_emp_id) REFERENCES emp (id);

ALTER TABLE franchise_inquiry_answer
    ADD CONSTRAINT fk_franchise_inquiry_answer_inquiry FOREIGN KEY (inquiry_id) REFERENCES franchise_inquiry (id);

-- Board
ALTER TABLE board
    ADD CONSTRAINT fk_board_author   FOREIGN KEY (author_id)   REFERENCES emp (id),
    ADD CONSTRAINT fk_board_category FOREIGN KEY (category_id) REFERENCES category (id);

ALTER TABLE board_file
    ADD CONSTRAINT fk_board_file_board FOREIGN KEY (board_id) REFERENCES board (id);

ALTER TABLE board_comment
    ADD CONSTRAINT fk_board_comment_board  FOREIGN KEY (board_id)          REFERENCES board (id),
    ADD CONSTRAINT fk_board_comment_author FOREIGN KEY (author_id)         REFERENCES emp (id),
    ADD CONSTRAINT fk_board_comment_parent FOREIGN KEY (parent_comment_id) REFERENCES board_comment (id);

ALTER TABLE board_like
    ADD CONSTRAINT fk_board_like_board FOREIGN KEY (board_id) REFERENCES board (id),
    ADD CONSTRAINT fk_board_like_emp   FOREIGN KEY (emp_id)   REFERENCES emp (id);

-- Message
ALTER TABLE message_sending
    ADD CONSTRAINT fk_message_sending_message FOREIGN KEY (message_id) REFERENCES message (id),
    ADD CONSTRAINT fk_message_sending_sender  FOREIGN KEY (sender_id)  REFERENCES emp (id);

ALTER TABLE message_receiving
    ADD CONSTRAINT fk_message_receiving_message  FOREIGN KEY (message_id)  REFERENCES message (id),
    ADD CONSTRAINT fk_message_receiving_receiver FOREIGN KEY (receiver_id) REFERENCES emp (id);

ALTER TABLE message_file
    ADD CONSTRAINT fk_message_file_message FOREIGN KEY (message_id) REFERENCES message (id);

-- Chat
ALTER TABLE chat_room
    ADD CONSTRAINT fk_chat_room_owner FOREIGN KEY (room_owner_id) REFERENCES emp (id);

ALTER TABLE chat_message
    ADD CONSTRAINT fk_chat_message_room   FOREIGN KEY (room_id)   REFERENCES chat_room (id),
    ADD CONSTRAINT fk_chat_message_sender FOREIGN KEY (sender_id) REFERENCES emp (id);

ALTER TABLE chat_member
    ADD CONSTRAINT fk_chat_member_room         FOREIGN KEY (room_id)         REFERENCES chat_room (id),
    ADD CONSTRAINT fk_chat_member_emp          FOREIGN KEY (member_id)       REFERENCES emp (id),
    ADD CONSTRAINT fk_chat_member_last_message FOREIGN KEY (last_message_id) REFERENCES chat_message (id);

-- Sync
ALTER TABLE franchise_sync_request
    ADD CONSTRAINT fk_franchise_sync_franchise FOREIGN KEY (franchise_id) REFERENCES franchise (id),
    ADD CONSTRAINT fk_franchise_sync_education FOREIGN KEY (education_id) REFERENCES education (id);

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- Read model : MessageMailboxReadModel
-- ---------------------------------------------------------------------
-- This @Entity (adapter.persistence.message.readmodel.MessageMailboxReadModel)
-- READ-ONLY projection backed by a database VIEW, not a physical table.
