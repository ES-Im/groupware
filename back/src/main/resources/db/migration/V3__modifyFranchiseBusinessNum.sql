UPDATE franchise
SET business_number = REPLACE(business_number, '-', '');

ALTER TABLE franchise
    MODIFY business_number VARCHAR(10) NOT NULL;