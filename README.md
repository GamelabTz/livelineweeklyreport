# TANESCO Weekly Report System

A web application for managing weekly reports for TANESCO transmission line maintenance.

## Features

- Create and manage weekly reports
- Track work days, towers, and insulators
- Upload images for documentation
- Generate Excel exports
- Create monthly summaries
- Cloud storage with Supabase

## Setup

1. Clone this repository
2. Update the Supabase configuration in `js/config.js`
3. Deploy to Netlify or run locally

## Database Setup

Run the SQL commands in the Supabase SQL editor to create the necessary tables:

```sql
-- Create reports table
CREATE TABLE reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    line VARCHAR(255) NOT NULL,
    from_person VARCHAR(255) NOT NULL,
    to_person VARCHAR(255) NOT NULL,
    report_date DATE NOT NULL,
    team VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    ref VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create work_days table
CREATE TABLE work_days (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    day_name VARCHAR(20) NOT NULL,
    work_date DATE NOT NULL,
    work_type VARCHAR(20) NOT NULL,
    no_work_reason VARCHAR(255),
    no_work_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create towers table
CREATE TABLE towers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    work_day_id UUID REFERENCES work_days(id) ON DELETE CASCADE,
    tower_number INTEGER NOT NULL,
    tower_type VARCHAR(10) NOT NULL,
    insulators_r INTEGER DEFAULT 0,
    insulators_y INTEGER DEFAULT 0,
    insulators_b INTEGER DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create images table
CREATE TABLE images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    work_day_id UUID REFERENCES work_days(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    file_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lines table for storing transmission lines
CREATE TABLE transmission_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    voltage INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default transmission lines
INSERT INTO transmission_lines (name, voltage) VALUES
('UBUNGO - CHALINZE', 132),
('CHALINZE - HALE', 132),
('CHALINZE - KINYEREZI MG II', 220),
('MOROGORO - CHALINZE MG II', 220);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE towers ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE transmission_lines ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all operations for authenticated users" ON reports
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON work_days
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON towers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON images
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read for all users" ON transmission_lines
    FOR SELECT USING (true);
```
