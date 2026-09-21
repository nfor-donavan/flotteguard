// Two full palettes, same keys, so screens never branch on mode directly -
// they just read whichever colors object useTheme() hands them.
export const lightColors = {
  mode: 'light',
  navy: '#0B1F3A',
  navyLight: '#16345C',
  gold: '#F2A93B',
  background: '#F6F7FB',
  card: '#FFFFFF',
  ink: '#16213A',
  inkMuted: '#5B6478',
  border: '#E4E7EF',
  success: '#1F9D55',
  danger: '#D64545',
  white: '#FFFFFF'
};

export const darkColors = {
  mode: 'dark',
  navy: '#0B1F3A',
  navyLight: '#1C3A63',
  gold: '#F2A93B',
  background: '#0D1526',
  card: '#131C30',
  ink: '#EEF1F8',
  inkMuted: '#94A0B8',
  border: '#223049',
  success: '#3DDC84',
  danger: '#FF6B6B',
  white: '#FFFFFF'
};
