
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(255) NOT NULL UNIQUE,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255) NOT NULL,
    phone NVARCHAR(50),
    city NVARCHAR(100),
    role NVARCHAR(20) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    total_points INT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);


CREATE TABLE enterprises (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    company_name NVARCHAR(255) NOT NULL,
    license_number NVARCHAR(100),
    accepted_waste_types NVARCHAR(MAX) NOT NULL,
    service_area NVARCHAR(255),
    max_capacity_kg INT,
    address NVARCHAR(MAX),
    is_verified BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_enterprise_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);


CREATE TABLE collectors (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    enterprise_id BIGINT NOT NULL,
    user_id BIGINT,
    CONSTRAINT fk_collector_user FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE TABLE collection_requests (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    citizen_id BIGINT NOT NULL,
    enterprise_id BIGINT,
    assigned_collector_id BIGINT,
    status NVARCHAR(50) NOT NULL,
    waste_type NVARCHAR(50) NOT NULL,
    description NVARCHAR(MAX),
    photo_url NVARCHAR(255),
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    address_text NVARCHAR(MAX),
    proof_image_url NVARCHAR(255),
    reject_reason NVARCHAR(MAX),
    version INT,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_request_citizen FOREIGN KEY (citizen_id) REFERENCES users(id),
    CONSTRAINT fk_request_enterprise FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
    CONSTRAINT fk_request_collector FOREIGN KEY (assigned_collector_id) REFERENCES collectors(id)
);


CREATE TABLE complaints (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    request_id BIGINT NOT NULL,
    citizen_id BIGINT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'OPEN',
    resolved_by BIGINT,
    resolution NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    resolved_at DATETIME2,
    CONSTRAINT fk_complaint_request FOREIGN KEY (request_id) REFERENCES collection_requests(id),
    CONSTRAINT fk_complaint_citizen FOREIGN KEY (citizen_id) REFERENCES users(id),
    CONSTRAINT fk_complaint_resolver FOREIGN KEY (resolved_by) REFERENCES users(id)
);


CREATE TABLE point_rules (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    enterprise_id BIGINT NOT NULL,
    waste_type NVARCHAR(50) NOT NULL,
    base_points INT NOT NULL DEFAULT 0,
    bonus_points INT NOT NULL DEFAULT 0,
    bonus_condition NVARCHAR(MAX),
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_point_rule_enterprise FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
);


CREATE TABLE point_transactions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    citizen_id BIGINT NOT NULL,
    request_id BIGINT,
    rule_id BIGINT,
    points INT NOT NULL,
    reason NVARCHAR(255),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_point_tx_citizen FOREIGN KEY (citizen_id) REFERENCES users(id),
    CONSTRAINT fk_point_tx_request FOREIGN KEY (request_id) REFERENCES collection_requests(id),
    CONSTRAINT fk_point_tx_rule FOREIGN KEY (rule_id) REFERENCES point_rules(id)
);


CREATE TABLE request_status_history (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    request_id BIGINT NOT NULL,
    from_status NVARCHAR(50),
    to_status NVARCHAR(50) NOT NULL,
    changed_by BIGINT NOT NULL,
    note NVARCHAR(MAX),
    changed_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_history_request FOREIGN KEY (request_id) REFERENCES collection_requests(id),
    CONSTRAINT fk_history_user FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE TABLE enterprise_collectors (
    enterprise_id BIGINT NOT NULL,
    collector_id BIGINT NOT NULL,
    joined_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (enterprise_id, collector_id),
    CONSTRAINT fk_ec_enterprise FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
    CONSTRAINT fk_ec_collector FOREIGN KEY (collector_id) REFERENCES users(id)
);

CREATE TABLE point_history (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    request_id BIGINT,
    rule_id BIGINT,
    points INT NOT NULL,
    reason NVARCHAR(255),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_ph_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_ph_request FOREIGN KEY (request_id) REFERENCES collection_requests(id),
    CONSTRAINT fk_ph_rule FOREIGN KEY (rule_id) REFERENCES point_rules(id)
);
