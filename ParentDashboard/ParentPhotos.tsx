import React, { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

import { RootStackParamList } from '../types';
import { globalStyles as baseStyles } from '../inner';
import { createAppStyles } from '../App.styles';

const { width } = Dimensions.get('window');

const ParentPhotos: React.FC<
  NativeStackScreenProps<RootStackParamList, 'ParentPhotos'> & { embedded?: boolean }
> = ({ embedded = false }) => {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventName, setSelectedEventName] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewStartIndex, setPreviewStartIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [downloadingUri, setDownloadingUri] = useState<string | null>(null);
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
  const phoneWidth = Math.min(Math.max(windowWidth - 24, 320), 390);
  const phoneHeight = Math.min(Math.max(windowHeight - 24, 720), 860);
  const appStyles = createAppStyles({ phoneWidth, phoneHeight });
  const embeddedHeight = Math.max(phoneHeight * 0.78, 620);

  useEffect(() => {
    const fetchMedia = async () => {
      const schoolCode = await AsyncStorage.getItem('schoolCode');
      try {
        const response = await fetch(`http://162.215.210.38:3010/api/media?schoolCode=${schoolCode}`);
        const data = await response.json();
        setMedia(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setMedia([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  const groupedByEvent = media.reduce((acc: Record<string, any[]>, item: any) => {
    const eventName = item?.eventName || 'Untitled Event';
    if (!acc[eventName]) acc[eventName] = [];
    acc[eventName].push(item);
    return acc;
  }, {});

  const eventFolders = Object.keys(groupedByEvent).map((eventName) => ({
    eventName,
    items: groupedByEvent[eventName],
  }));

  const selectedItems = selectedEventName ? groupedByEvent[selectedEventName] || [] : [];
  const imageItems = selectedItems.filter((item: any) => !!item?.attachments);

  const askStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;
    if (Number(Platform.Version) >= 33) return true;

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const getFileExtension = (uri: string) => {
    const cleaned = uri.split('?')[0];
    const ext = cleaned.split('.').pop()?.toLowerCase() || 'jpg';
    if (ext.length > 5) return 'jpg';
    return ext;
  };

  const resolveAttachmentUrl = (uri: string) => {
    const raw = String(uri || '').trim();
    if (!raw) return '';
    if (raw.startsWith('data:')) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    const normalized = raw.startsWith('/') ? raw : `/${raw}`;
    return `http://162.215.210.38:3010${normalized}`;
  };

  const extensionFromMime = (mime: string) => {
    const normalized = String(mime || '').toLowerCase();
    if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg';
    if (normalized.includes('png')) return 'png';
    if (normalized.includes('webp')) return 'webp';
    if (normalized.includes('gif')) return 'gif';
    if (normalized.includes('mp4')) return 'mp4';
    return 'bin';
  };

  const safeName = (value: string) =>
    String(value || 'photo')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);

  const handleDownload = async (uri: string, index: number) => {
    if (!uri) return;
    try {
      const hasPermission = await askStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission needed', 'Please allow storage permission to download images.');
        return;
      }

      setDownloadingUri(uri);
      const finalUrl = resolveAttachmentUrl(uri);
      if (!finalUrl) {
        Alert.alert('Download failed', 'Invalid image URL.');
        return;
      }

      const isDataUri = finalUrl.startsWith('data:');
      const dataUriMatch = finalUrl.match(/^data:([^;]+);base64,(.*)$/);
      const ext = isDataUri
        ? extensionFromMime(dataUriMatch?.[1] || '')
        : getFileExtension(finalUrl);
      const eventLabel = safeName(selectedEventName || 'event');
      const fileName = `${eventLabel}_${Date.now()}_${index}.${ext}`;

      const targets =
        Platform.OS === 'android'
          ? [RNFS.DownloadDirectoryPath, RNFS.ExternalDirectoryPath, RNFS.DocumentDirectoryPath]
          : [RNFS.DocumentDirectoryPath];

      let savedPath = '';
      let lastStatus = 0;

      for (const dir of targets) {
        if (!dir) continue;
        const targetPath = `${dir}/${fileName}`;
        try {
          if (isDataUri) {
            const base64Data = dataUriMatch?.[2] || '';
            if (!base64Data) throw new Error('Invalid base64 payload');
            await RNFS.writeFile(targetPath, base64Data, 'base64');
            lastStatus = 200;
            savedPath = targetPath;
            break;
          }

          const result = await RNFS.downloadFile({
            fromUrl: finalUrl,
            toFile: targetPath,
            background: false,
          }).promise;

          lastStatus = result?.statusCode || 0;
          if (lastStatus >= 200 && lastStatus < 300) {
            savedPath = targetPath;
            break;
          }
        } catch (innerError) {
          console.log('Download attempt failed for path:', targetPath, innerError);
        }
      }

      if (savedPath) {
        Alert.alert('Downloaded', `Saved to:\n${savedPath}`);
      } else {
        Alert.alert('Download failed', `Unable to save image (status ${lastStatus || 'unknown'}).`);
      }
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Download failed', 'Unable to download image.');
    } finally {
      setDownloadingUri(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={baseStyles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 24 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={baseStyles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={baseStyles.scrollView} nestedScrollEnabled>
        <View style={embedded ? [baseStyles.container, { padding: 0 }] : baseStyles.container}>
        


          <View style={[baseStyles.syllabusContainertwo, embedded && { height: embeddedHeight }]}>
        
            <View
              style={[
                baseStyles.gridContainer,
                embedded
                  ? { minHeight: embeddedHeight, height: '100%', marginTop: 0, paddingHorizontal: 0, overflow: 'hidden' }
                  : { minHeight: 420, marginTop: '8%' },
              ]}
            >
              {!selectedEventName ? (
                <View style={{ padding: 8 }}>
                  {eventFolders.length === 0 ? (
                    <Text style={{ padding: 20 }}>No photos found.</Text>
                  ) : (
                    eventFolders.map((folder) => (
                      <TouchableOpacity
                        key={folder.eventName}
                        onPress={() => setSelectedEventName(folder.eventName)}
                        style={{
                          backgroundColor: '#f6f6f7',
                          borderWidth: 1,
                          borderColor: '#ddd',
                          borderRadius: 10,
                          marginBottom: 10,
                          padding: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 24, marginRight: 10 }}>📁</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '700', color: '#111' }}>{folder.eventName}</Text>
                          <Text style={{ color: '#666' }}>{folder.items.length} image(s)</Text>
                        </View>
                        {folder.items[0]?.attachments ? (
                          <Image
                            source={{ uri: resolveAttachmentUrl(folder.items[0].attachments) }}
                            style={{ width: 46, height: 46, borderRadius: 6 }}
                          />
                        ) : null}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              ) : (
                <View style={{ padding: 8 }}>
                  <TouchableOpacity
                    onPress={() => setSelectedEventName(null)}
                    style={{
                      backgroundColor: 'rgb(160, 180, 182)',
                      borderRadius: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      alignSelf: 'flex-start',
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>← Back to Folders</Text>
                  </TouchableOpacity>

                  <Text style={{ fontWeight: '700', color: '#111', marginBottom: 8 }}>
                    {selectedEventName}
                  </Text>
                  {imageItems.length === 0 ? (
                    <Text style={{ padding: 20 }}>No images in this event.</Text>
                  ) : (
                    <FlatList
                      data={imageItems}
                      keyExtractor={(item: any, index: number) => `${item.id || 'img'}-${index}`}
                      numColumns={3}
                      scrollEnabled={false}
                      columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
                      renderItem={({ item, index }) => (
                        <View
                          style={{
                            width: (width - 42) / 3,
                            backgroundColor: '#fff',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#e5e5e5',
                            padding: 4,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              setPreviewStartIndex(index);
                              setPreviewIndex(index);
                              setPreviewVisible(true);
                            }}
                          >
                            <Image
                              source={{ uri: resolveAttachmentUrl(item.attachments) }}
                              style={{ width: '100%', height: 90, borderRadius: 6 }}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDownload(item.attachments, index)}
                            style={{
                              marginTop: 6,
                              borderRadius: 6,
                              backgroundColor: '#2f4f88',
                              paddingVertical: 4,
                            }}
                          >
                            <Text style={{ color: '#fff', textAlign: 'center', fontSize: 11, fontWeight: '700' }}>
                              {downloadingUri === item.attachments ? 'Downloading...' : 'Download'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    />
                  )}
                </View>
              )}
            </View>

          
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.88)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
          }}
        >
          <FlatList
            key={`preview-${previewStartIndex}-${imageItems.length}`}
            data={imageItems}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={previewStartIndex}
            getItemLayout={(_, index) => ({
              length: width - 32,
              offset: (width - 32) * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const nextIndex = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
              setPreviewIndex(nextIndex);
            }}
            renderItem={({ item }) => (
              <View style={{ width: width - 32, alignItems: 'center', justifyContent: 'center' }}>
                <Image
                  source={{ uri: resolveAttachmentUrl(item.attachments) }}
                  resizeMode="contain"
                  style={{ width: '100%', height: '75%', borderRadius: 8 }}
                />
              </View>
            )}
          />
          <Text style={{ color: '#fff', marginTop: 8, fontSize: 12 }}>
            Swipe left or right to view more photos ({previewIndex + 1}/{imageItems.length})
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity
              onPress={() =>
                imageItems[previewIndex]?.attachments &&
                handleDownload(imageItems[previewIndex].attachments, previewIndex)
              }
              style={{ backgroundColor: '#2f4f88', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPreviewVisible(false)}
              style={{ backgroundColor: '#777', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ParentPhotos;
