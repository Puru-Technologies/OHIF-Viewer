export const REPORT_STATUS = {
  APPROVED: 'APPROVED',
  WAITING: 'WAITING',
  IN_PROGRESS: 'IN_PROGRESS',
  ARRIVED: 'ARRIVED',
  PARTIALLY_ARRIVED: 'PARTIALLY_ARRIVED',
  REJECTED: 'REJECTED',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  NOT_REQUIRED: 'NOT_REQUIRED',
};

export function statusLabel(status) {
  switch (status) {
    case REPORT_STATUS.APPROVED:
      return 'Approved';
    case REPORT_STATUS.WAITING:
      return 'Send to radiologist';
    case REPORT_STATUS.IN_PROGRESS:
      return 'In progress';
    case REPORT_STATUS.ARRIVED:
      return 'Awaiting approval';
    case REPORT_STATUS.PARTIALLY_ARRIVED:
      return 'Partial';
    case REPORT_STATUS.REJECTED:
      return 'Rejected';
    case REPORT_STATUS.NOT_APPLICABLE:
      return 'Not applicable';
    case REPORT_STATUS.NOT_REQUIRED:
      return 'Not required';
    default:
      return status || 'Unknown';
  }
}

export function statusTone(status) {
  switch (status) {
    case REPORT_STATUS.APPROVED:
      return 'approved';
    case REPORT_STATUS.WAITING:
    case REPORT_STATUS.IN_PROGRESS:
      return 'pending';
    case REPORT_STATUS.ARRIVED:
    case REPORT_STATUS.PARTIALLY_ARRIVED:
      return 'arrived';
    case REPORT_STATUS.REJECTED:
      return 'rejected';
    default:
      return 'muted';
  }
}
