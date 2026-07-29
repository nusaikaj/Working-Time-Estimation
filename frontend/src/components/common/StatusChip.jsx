import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
import { TASK_STATUS_LABEL, TASK_STATUS_COLOR } from '../../utils/constants';

export default function StatusChip({ status, size = 'small' }) {
  return <Chip size={size} label={TASK_STATUS_LABEL[status] || status} color={TASK_STATUS_COLOR[status] || 'default'} />;
}

StatusChip.propTypes = {
  status: PropTypes.string.isRequired,
  size: PropTypes.string,
};
