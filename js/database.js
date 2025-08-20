// Database operations
class Database {
    // Get all transmission lines
    static async getLines() {
        try {
            const { data, error } = await supabase
                .from('transmission_lines')
                .select('*')
                .order('name');
                
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching lines:', error);
            return [];
        }
    }
    
    // Add a new transmission line
    static async addLine(name, voltage) {
        try {
            const { data, error } = await supabase
                .from('transmission_lines')
                .insert([{ name, voltage }])
                .select();
                
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error adding line:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Save a report (draft or completed)
    static async saveReport(reportData, isCompleted = false) {
        try {
            // First save the report
            const { data: report, error: reportError } = await supabase
                .from('reports')
                .insert([{
                    line: reportData.line,
                    from_person: reportData.fromPerson,
                    to_person: reportData.toPerson,
                    report_date: reportData.reportDate,
                    team: reportData.team,
                    location: reportData.location,
                    ref: reportData.reference,
                    status: isCompleted ? 'completed' : 'draft'
                }])
                .select();
                
            if (reportError) throw reportError;
            
            // Then save work days and their associated towers
            for (const workDay of reportData.workDays) {
                const { data: day, error: dayError } = await supabase
                    .from('work_days')
                    .insert([{
                        report_id: report[0].id,
                        day_name: workDay.dayName,
                        work_date: workDay.date,
                        work_type: workDay.workType,
                        no_work_reason: workDay.noWorkReason,
                        no_work_details: workDay.noWorkDetails
                    }])
                    .select();
                    
                if (dayError) throw dayError;
                
                // Save towers if this is a normal work day
                if (workDay.workType === 'normal' && workDay.towers.length > 0) {
                    const towersData = workDay.towers.map(tower => ({
                        work_day_id: day[0].id,
                        tower_number: tower.number,
                        tower_type: tower.type,
                        insulators_r: tower.insulators.r,
                        insulators_y: tower.insulators.y,
                        insulators_b: tower.insulators.b,
                        remarks: tower.remarks
                    }));
                    
                    const { error: towersError } = await supabase
                        .from('towers')
                        .insert(towersData);
                        
                    if (towersError) throw towersError;
                }
                
                // Save images if any
                if (workDay.images && workDay.images.length > 0) {
                    for (const image of workDay.images) {
                        // First upload the image to storage
                        const fileName = `${Date.now()}_${image.name}`;
                        const { error: uploadError } = await supabase.storage
                            .from('report_images')
                            .upload(fileName, image.file);
                            
                        if (uploadError) throw uploadError;
                        
                        // Get the public URL
                        const { data: urlData } = supabase.storage
                            .from('report_images')
                            .getPublicUrl(fileName);
                            
                        // Save image reference to database
                        const { error: imageError } = await supabase
                            .from('images')
                            .insert([{
                                work_day_id: day[0].id,
                                image_url: urlData.publicUrl,
                                caption: image.caption,
                                file_name: image.name
                            }]);
                            
                        if (imageError) throw imageError;
                    }
                }
            }
            
            return { success: true, reportId: report[0].id };
        } catch (error) {
            console.error('Error saving report:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Get all reports
    static async getReports(filters = {}) {
        try {
            let query = supabase
                .from('reports')
                .select('*')
                .order('report_date', { ascending: false });
                
            // Apply filters if provided
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            
            if (filters.line) {
                query = query.eq('line', filters.line);
            }
            
            if (filters.search) {
                query = query.or(`line.ilike.%${filters.search}%,team.ilike.%${filters.search}%`);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching reports:', error);
            return [];
        }
    }
    
    // Get a single report with all details
    static async getReportDetails(reportId) {
        try {
            // Get the report
            const { data: report, error: reportError } = await supabase
                .from('reports')
                .select('*')
                .eq('id', reportId)
                .single();
                
            if (reportError) throw reportError;
            
            // Get work days
            const { data: workDays, error: daysError } = await supabase
                .from('work_days')
                .select('*')
                .eq('report_id', reportId)
                .order('work_date');
                
            if (daysError) throw daysError;
            
            // For each work day, get towers and images
            const fullWorkDays = await Promise.all(workDays.map(async (day) => {
                // Get towers
                const { data: towers, error: towersError } = await supabase
                    .from('towers')
                    .select('*')
                    .eq('work_day_id', day.id);
                    
                if (towersError) throw towersError;
                
                // Get images
                const { data: images, error: imagesError } = await supabase
                    .from('images')
                    .select('*')
                    .eq('work_day_id', day.id);
                    
                if (imagesError) throw imagesError;
                
                return {
                    ...day,
                    towers: towers || [],
                    images: images || []
                };
            }));
            
            return {
                ...report,
                workDays: fullWorkDays
            };
        } catch (error) {
            console.error('Error fetching report details:', error);
            return null;
        }
    }
    
    // Delete a report
    static async deleteReport(reportId) {
        try {
            const { error } = await supabase
                .from('reports')
                .delete()
                .eq('id', reportId);
                
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting report:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Get dashboard statistics
    static async getDashboardStats() {
        try {
            // Get total reports count
            const { count: totalReports, error: totalError } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true });
                
            if (totalError) throw totalError;
            
            // Get completed reports count
            const { count: completedReports, error: completedError } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed');
                
            if (completedError) throw completedError;
            
            // Get draft reports count
            const { count: draftReports, error: draftError } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'draft');
                
            if (draftError) throw draftError;
            
            // Get total towers count
            const { data: towers, error: towersError } = await supabase
                .from('towers')
                .select('id');
                
            if (towersError) throw towersError;
            
            return {
                totalReports: totalReports || 0,
                completedReports: completedReports || 0,
                draftReports: draftReports || 0,
                totalTowers: towers ? towers.length : 0
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return {
                totalReports: 0,
                completedReports: 0,
                draftReports: 0,
                totalTowers: 0
            };
        }
    }
}
