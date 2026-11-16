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
  white: '#FFFFFF',
  skeleton: '#E6E9F1',
  goldSoft: '#FEF3E2'
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
  white: '#FFFFFF',
  skeleton: '#1B2740',
  goldSoft: 'rgba(242,169,59,0.16)'
};

// Shared spacing / radius / elevation scale so cards look like one family.
export const radius = { sm: 10, md: 16, lg: 20, xl: 28 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export function shadow(level = 1) {
  const o = level === 2 ? 0.16 : 0.08;
  return {
    shadowColor: '#0B1F3A',
    shadowOffset: { width: 0, height: level === 2 ? 8 : 3 },
    shadowOpacity: o,
    shadowRadius: level === 2 ? 16 : 8,
    elevation: level === 2 ? 6 : 2
  };
}
