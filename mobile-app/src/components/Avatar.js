import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { assetUrl } from '../api/client';
import { useTheme } from '../context/ThemeContext';

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

/** Portrait with an initials fallback. radius defaults to a full circle. */
export default function Avatar({ uri, name, size = 56, radius, style }) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const src = assetUrl(uri);
  const r = radius === undefined ? size / 2 : radius;
  const box = { width: size, height: size, borderRadius: r, overflow: 'hidden' };

  if (!src || failed) {
    return (
      <View style={[box, { backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Text style={{ color: colors.gold, fontWeight: '800', fontSize: size * 0.34 }}>{initials(name)}</Text>
      </View>
    );
  }
  return <Image source={{ uri: src }} style={[box, style]} resizeMode="cover" onError={() => setFailed(true)} />;
}
