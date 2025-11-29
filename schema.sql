-- Neon Database Schema for Document Management System

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Temporary access permissions table
CREATE TABLE IF NOT EXISTS temporary_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    document_id INTEGER NOT NULL REFERENCES documents(id),
    granted_by INTEGER NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    permissions JSONB NOT NULL, -- Store permissions as JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document permissions for contributors (specific document access)
CREATE TABLE IF NOT EXISTS document_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    document_id INTEGER NOT NULL REFERENCES documents(id),
    can_read BOOLEAN DEFAULT true,
    can_write BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    granted_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, document_id)
);

-- Access rules table (for temporary access to documents, folders, tags, categories)
CREATE TABLE IF NOT EXISTS access_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('document', 'folder', 'tag', 'category')),
    target_id VARCHAR(255) NOT NULL,
    target_name VARCHAR(255),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name) VALUES 
('admin'),
('contributor'), 
('reader')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_temporary_access_user ON temporary_access(user_id);
CREATE INDEX IF NOT EXISTS idx_temporary_access_document ON temporary_access(document_id);
CREATE INDEX IF NOT EXISTS idx_temporary_access_expires ON temporary_access(expires_at);
CREATE INDEX IF NOT EXISTS idx_document_permissions_user ON document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_document ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_access_rules_user ON access_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_access_rules_target ON access_rules(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_access_rules_dates ON access_rules(start_date, end_date);

-- Function to check if temporary access has expired
CREATE OR REPLACE FUNCTION is_temporary_access_valid(access_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM temporary_access 
        WHERE id = access_id AND expires_at > CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;
