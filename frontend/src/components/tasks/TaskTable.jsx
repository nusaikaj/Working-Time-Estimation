import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import StatusChip from '../common/StatusChip';
import EmptyState from '../common/EmptyState';
import UserAvatar from '../common/UserAvatar';
import { formatDateTime } from '../../utils/dateFormat';

const SKELETON_ROWS = 5;

export default function TaskTable({ tasks, pagination, loading, onPageChange, onRowsPerPageChange, showEngineer }) {
  const navigate = useNavigate();

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              {showEngineer && <TableCell>Engineer</TableCell>}
              <TableCell>Estimate (days)</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>Calculated End</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <TableRow key={i}>
                  {Array.from({ length: showEngineer ? 6 : 5 }).map((__, j) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <TableCell key={j}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading &&
              tasks.map((task) => (
                <TableRow
                  key={task.id}
                  hover
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 320 }}>
                      {task.title}
                    </Typography>
                  </TableCell>
                  {showEngineer && (
                    <TableCell>
                      {task.engineer ? (
                        <Stack direction="row" alignItems="center" spacing={1.25}>
                          <UserAvatar name={task.engineer.name} profileImage={task.engineer.profileImage} size={28} />
                          <Typography variant="body2">{task.engineer.name}</Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          Unassigned
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell>{task.estimateDays ?? '—'}</TableCell>
                  <TableCell>{formatDateTime(task.startDateTime)}</TableCell>
                  <TableCell>{formatDateTime(task.calculatedEndDateTime)}</TableCell>
                  <TableCell>
                    <StatusChip status={task.status} />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && tasks.length === 0 && (
        <EmptyState title="No tasks found" subtitle="Try adjusting your search or filters." />
      )}

      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          onPageChange={(e, newPage) => onPageChange(newPage + 1)}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}
    </Paper>
  );
}

TaskTable.propTypes = {
  tasks: PropTypes.array.isRequired,
  pagination: PropTypes.shape({
    total: PropTypes.number,
    page: PropTypes.number,
    limit: PropTypes.number,
  }),
  loading: PropTypes.bool,
  onPageChange: PropTypes.func.isRequired,
  onRowsPerPageChange: PropTypes.func.isRequired,
  showEngineer: PropTypes.bool,
};
