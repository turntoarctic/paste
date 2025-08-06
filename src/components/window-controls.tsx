import React from 'react';
import { 
  setWindowAboveDock, 
  resetWindowLevel, 
  showWindow, 
  hideWindow, 
  setTaskbarIconVisible 
} from '../utils/window';

const WindowControls: React.FC = () => {
  const handleSetAboveDock = async () => {
    await setWindowAboveDock();
  };

  const handleResetLevel = async () => {
    await resetWindowLevel();
  };

  const handleShow = async () => {
    await showWindow();
  };

  const handleHide = async () => {
    await hideWindow();
  };

  const handleToggleTaskbar = async (visible: boolean) => {
    await setTaskbarIconVisible(visible);
  };

  return (
    <div className="window-controls" style={{ padding: '20px' }}>
      <h2>窗口控制</h2>
      
      <div style={{ marginBottom: '10px' }}>
        <button onClick={handleSetAboveDock} style={buttonStyle}>
          置于 Dock 上方
        </button>
        <button onClick={handleResetLevel} style={buttonStyle}>
          重置窗口层级
        </button>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={handleShow} style={buttonStyle}>
          显示窗口
        </button>
        <button onClick={handleHide} style={buttonStyle}>
          隐藏窗口
        </button>
      </div>

      <div>
        <button onClick={() => handleToggleTaskbar(true)} style={buttonStyle}>
          显示任务栏图标
        </button>
        <button onClick={() => handleToggleTaskbar(false)} style={buttonStyle}>
          隐藏任务栏图标
        </button>
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  margin: '5px',
  padding: '8px 16px',
  backgroundColor: '#007acc',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

export default WindowControls;