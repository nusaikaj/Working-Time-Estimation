export const ROLES = { PM: 'PM', ENGINEER: 'ENGINEER' };

export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

export const TASK_STATUS_LABEL = {
  [TASK_STATUS.PENDING]: 'Pending',
  [TASK_STATUS.IN_PROGRESS]: 'In Progress',
  [TASK_STATUS.COMPLETED]: 'Completed',
};

export const TASK_STATUS_COLOR = {
  [TASK_STATUS.PENDING]: 'warning',
  [TASK_STATUS.IN_PROGRESS]: 'info',
  [TASK_STATUS.COMPLETED]: 'success',
};
