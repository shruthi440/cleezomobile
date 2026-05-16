import { globalStyles as innerGlobalStyles } from './inner';
import {
  globalStyles as baseGlobalStyles,
  attendanceStyles as baseAttendanceStyles,
  attendanceModalStyles,
} from './styles';

export const globalStyles = {
  ...innerGlobalStyles,
  ...baseGlobalStyles,
};

export const attendanceStyles = baseAttendanceStyles;

export const behaviorStyles = baseAttendanceStyles;

export const timetableStyles = {
  ...baseAttendanceStyles,
  modeSelector: baseAttendanceStyles.actionsRow,
  modeButton: baseAttendanceStyles.secondaryButton,
  modeButtonActive: baseAttendanceStyles.primaryButton,
  modeButtonText: baseAttendanceStyles.secondaryButtonText,
  modeButtonTextActive: baseAttendanceStyles.primaryButtonText,
  timetableCard: baseAttendanceStyles.card,
  dropdownShell: baseAttendanceStyles.dropdownShell,
};

export {
  attendanceModalStyles,
};
