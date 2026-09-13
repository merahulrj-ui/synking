import React from 'react';
import { Modal } from 'react-native';
import { AuthLandingScreen } from './AuthLandingScreen';

interface Props {
  visible: boolean;
  onClose: () => void;
  targetUserName?: string;
}

export const AuthModal: React.FC<Props> = ({ visible, onClose, targetUserName }) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <AuthLandingScreen
        onClose={onClose}
        onSuccess={onClose}
        showCloseButton={true}
        targetUserName={targetUserName}
      />
    </Modal>
  );
};
