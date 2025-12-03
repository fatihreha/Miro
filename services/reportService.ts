
import { supabase } from './supabase';
import { Report, ReportReason } from '../types';

export const reportService = {
  /**
   * Submit a report to the database
   */
  submitReport: async (
    reporterId: string,
    reportedUserId: string,
    reason: ReportReason,
    details: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: reporterId,
          reported_user_id: reportedUserId,
          reason,
          description: details,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error submitting report:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Submit report error:', error);
      return false;
    }
  },

  /**
   * Get reports by user (for admins)
   */
  getReportsByUser: async (userId: string): Promise<Report[]> => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('reported_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        return [];
      }

      return data.map(r => ({
        id: r.id,
        reporterId: r.reporter_id,
        reportedUserId: r.reported_user_id,
        reason: r.reason,
        details: r.description,
        timestamp: new Date(r.created_at),
        status: r.status
      }));
    } catch (error) {
      console.error('Get reports error:', error);
      return [];
    }
  },

  /**
   * Update report status
   */
  updateReportStatus: async (reportId: string, status: 'pending' | 'reviewed' | 'resolved'): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', reportId);

      return !error;
    } catch (error) {
      console.error('Update report status error:', error);
      return false;
    }
  }
};
