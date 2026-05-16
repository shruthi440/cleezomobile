import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

const CustomAlert = ({ visible, title, message, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: '#fffFFF', padding: 20, borderRadius: 10, width: 300, alignItems: 'center' },
  alertTitle: { color: '#35776D', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  alertMessage: { color: '#333333', fontSize: 16, marginBottom: 10, textAlign: 'center' },
  closeButton: { backgroundColor: '#35776D', padding: 10, borderRadius: 5, width: '50%', alignItems: 'center' },
  closeText: { color: '#fffFFF', fontSize: 16 },
});
