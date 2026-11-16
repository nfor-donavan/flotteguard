import React, { useRef, useState } from 'react';
import { View, FlatList, TouchableOpacity, Modal, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Photo from './Photo';
import { useLanguage } from '../context/LanguageContext';

/**
 * Full-bleed swipeable photo pager with dot indicators. Tapping a photo opens
 * a full-screen viewer (also swipeable).
 */
export default function PhotoGallery({ photos = [], height = 260 }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const viewerRef = useRef(null);

  const data = photos.length ? photos : [null];

  function onScrollEnd(e) {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  function openViewer(i) {
    if (!photos.length) return;
    setViewerIndex(i);
    setViewerOpen(true);
  }

  return (
    <View>
      <FlatList
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, i) => `${item || 'none'}-${i}`}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item, index: i }) => (
          <TouchableOpacity activeOpacity={0.95} onPress={() => openViewer(i)}>
            <Photo uri={item} style={{ width, height }} iconSize={56} />
          </TouchableOpacity>
        )}
      />
      {data.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {data.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}

      <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <View style={styles.viewer}>
          <FlatList
            ref={viewerRef}
            data={photos}
            horizontal
            pagingEnabled
            initialScrollIndex={viewerIndex}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => `${item}-${i}`}
            renderItem={({ item }) => (
              <View style={{ width, flex: 1, justifyContent: 'center' }}>
                <Photo uri={item} style={{ width, height: width * 0.75 }} resizeMode="contain" />
              </View>
            )}
          />
          <TouchableOpacity style={[styles.close, { top: insets.top + 12 }]} onPress={() => setViewerOpen(false)}>
            <Text style={styles.closeText}>{t('close')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 20, backgroundColor: '#F2A93B' },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  close: { position: 'absolute', right: 16, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)' },
  closeText: { color: '#fff', fontWeight: '700' }
});
