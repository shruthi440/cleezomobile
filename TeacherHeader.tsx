import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'; //
import { stopPersistentAttendanceTracking } from './AttendanceService';

const TeacherHeader: React.FC = () => {
  const navigation = useNavigation<any>();

  const handleLogout = async () => {
    try {
      await stopPersistentAttendanceTracking();

      // 1. Clear all saved user data (username, userType, schoolCode, etc.)
      await AsyncStorage.clear();

      // 2. Reset navigation to the Login screen (Home)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.iconRow}>

          {/* Bell Icon with Badge */}
          <TouchableOpacity style={styles.iconContainer}>
            <Ionicons name="notifications-outline" size={30} color="#000" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}></Text>
            </View>
          </TouchableOpacity>

          {/* Power Icon → Clear Data & Navigate to Home */}
          <TouchableOpacity
            style={[styles.iconContainer, { marginLeft: 20 }]}
            onPress={handleLogout}
          >
            <Ionicons name="power-outline" size={32} color="#000" />
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 50, // Increased height for better visibility
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: 'transparent', // Match image (no background)
  },
  badgeText: {
    color: 'red',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
export default TeacherHeader;
