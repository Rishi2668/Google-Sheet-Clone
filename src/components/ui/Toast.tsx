import React, { useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../state/store';
import { hideToast } from '../../state/slices/uiSlice';

// Define animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
`;

// Define styled components
const ToastContainer = styled.div<{ 
  visible: boolean; 
  type: 'info' | 'success' | 'warning' | 'error';
}>`
  position: fixed;
  bottom: 24px;
  right: 24px;
  min-width: 250px;
  max-width: 350px;
  padding: 14px 16px;
  border-radius: 4px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.16);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1100;
  animation: ${props => props.visible ? css`${fadeIn} 0.3s ease-out` : css`${fadeOut} 0.3s ease-in`};
  
  /* Background color based on type */
  background-color: ${props => {
    switch (props.type) {
      case 'info':
        return '#1a73e8';
      case 'success':
        return '#0f9d58';
      case 'warning':
        return '#f9ab00';
      case 'error':
        return '#ea4335';
      default:
        return '#1a73e8';
    }
  }};
  
  color: white;
  font-size: 14px;
`;

const ToastMessage = styled.div`
  flex: 1;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-left: 16px;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
  }
`;

const Toast: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Get toast state from Redux
  const toast = useSelector((state: RootState) => state.ui.toast);
  
  // Close toast when close button is clicked
  const handleClose = () => {
    dispatch(hideToast());
  };
  
  // If toast is not visible, check if we need to animate out
  if (!toast.visible) {
    return null;
  }
  
  return (
    <ToastContainer
      visible={toast.visible}
      type={toast.type}
    >
      <ToastMessage>{toast.message}</ToastMessage>
      <CloseButton onClick={handleClose}>×</CloseButton>
    </ToastContainer>
  );
};

export default Toast;