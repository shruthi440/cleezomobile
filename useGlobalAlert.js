import { useState } from 'react';

export const useGlobalAlert = () => {
  const [alertData, setAlertData] = useState({ visible: false, title: '', message: '', onClose: () => {} });

  const showAlert = (title, message) => {
    setAlertData({
      visible: true,
      title,
      message,
      onClose: () => setAlertData({ visible: false }), // Close the alert when it's clicked
    });
  };

  return { alertData, showAlert };
};
