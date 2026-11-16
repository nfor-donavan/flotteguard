import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { assetUrl } from '../api/client';
import { useTheme } from '../context/ThemeContext';

/** <Image> that falls back to a quiet placeholder when there is no photo or it fails to load. */
export default function Photo({ uri, style, resizeMode = 'cover', iconSize = 34 }) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const src = assetUrl(uri);

  if (!src || failed) {
    return (
      <View style={[{ backgroundColor: colors.skeleton, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Text style={{ fontSize: iconSize, opacity: 0.5 }}>🚗</Text>
      </View>
    );
  }
  return <Image source={{ uri: src }} style={style} resizeMode={resizeMode} onError={() => setFailed(true)} />;
}
