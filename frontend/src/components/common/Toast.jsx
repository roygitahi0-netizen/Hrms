import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideToast } from '../../store/slices/uiSlice';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const Toast = () => {
  const dispatch = useDispatch();
  const { toast } = useSelector((state) => state.ui);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle2 color="var(--accent-emerald)" size={20} />;
      case 'error': return <AlertCircle color="var(--accent-rose)" size={20} />;
      default: return <Info color="var(--accent-cyan)" size={20} />;
    }
  };

  return (
    <div className="toast-container">
      <div className={`toast toast-${toast.type || 'info'}`}>
        {getIcon()}
        <span>{toast.message}</span>
      </div>
    </div>
  );
};

export default Toast;
