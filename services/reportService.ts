
import { Report, ReportReason } from '../types';

export const reportService = {
  submitReport: async (
    reporterId: string,
    reportedUserId: string,
    reason: ReportReason,
    details: string
  ): Promise<boolean> => {
    // Simulate API Call
    return new Promise((resolve) => {
      setTimeout(() => {
        const newReport: Report = {
          id: Date.now().toString(),
          reporterId,
          reportedUserId,
          reason,
          details,
          timestamp: new Date(),
          status: 'pending'
        };
        
        console.log('Report Submitted:', newReport);
        resolve(true);
      }, 1000);
    });
  }
};
