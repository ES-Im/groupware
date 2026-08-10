ALTER TABLE draft
    ADD COLUMN approval_id BIGINT NULL;

UPDATE draft d
JOIN approval a
    ON a.draft_id = d.id
SET d.approval_id = a.id;

ALTER TABLE draft
    MODIFY COLUMN approval_id BIGINT NOT NULL,
    ADD CONSTRAINT uk_draft_approval_id UNIQUE (approval_id),
    ADD CONSTRAINT fk_draft_approval FOREIGN KEY (approval_id) REFERENCES approval (id);

ALTER TABLE approval
    DROP FOREIGN KEY fk_approval_draft;

ALTER TABLE approval
    DROP INDEX uk_approval_draft_id,
    DROP COLUMN draft_id;
