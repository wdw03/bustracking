-- ============================================================================
-- Migration 011: Withdrawal Requests
-- School admins can request payouts. Super admin approves/rejects.
-- ============================================================================

-- ── Table ──
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    requested_by    UUID REFERENCES profiles(id),
    amount          DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    bank_name       TEXT,
    account_number  TEXT,
    ifsc_code       TEXT,
    account_holder  TEXT,
    upi_id          TEXT,
    notes           TEXT,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    rejection_reason TEXT,
    processed_by    UUID REFERENCES profiles(id),
    processed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE withdrawal_requests IS 'School payout/withdrawal requests. Super admin approves/rejects.';

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_withdrawal_school ON withdrawal_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_requests(status);

-- ── RLS ──
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Super admin: full access
CREATE POLICY withdrawal_super_admin_all ON withdrawal_requests
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- School admin: can view and insert for their own school
CREATE POLICY withdrawal_school_admin_select ON withdrawal_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM school_members sm
            WHERE sm.user_id = auth.uid()
            AND sm.school_id = withdrawal_requests.school_id
            AND sm.is_active = true
        )
    );

CREATE POLICY withdrawal_school_admin_insert ON withdrawal_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM school_members sm
            WHERE sm.user_id = auth.uid()
            AND sm.school_id = withdrawal_requests.school_id
            AND sm.is_active = true
        )
    );

-- ── Trigger: auto update updated_at ──
CREATE OR REPLACE FUNCTION update_withdrawal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_withdrawal_updated
    BEFORE UPDATE ON withdrawal_requests
    FOR EACH ROW EXECUTE FUNCTION update_withdrawal_timestamp();
