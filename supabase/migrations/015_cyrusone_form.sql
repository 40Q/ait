-- form_variant on companies lets admins configure which request form variant each company sees.
-- 'standard' is the default for all existing companies.
-- 'cyrusone' enables CyrusOne-specific form fields (metal/wood categories, e-waste checkbox, etc.)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS form_variant TEXT NOT NULL DEFAULT 'standard';

-- comments field for image/equipment tab (CyrusOne-specific, optional)
ALTER TABLE requests ADD COLUMN IF NOT EXISTS comments TEXT;
