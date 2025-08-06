import { invoke } from '@tauri-apps/api/core';

// 将窗口置于 Dock 上方
export const setWindowAboveDock = async (): Promise<void> => {
  try {
    await invoke('set_above_dock');
    console.log('窗口已置于 Dock 上方');
  } catch (error) {
    console.error('设置窗口层级失败:', error);
  }
};

// 重置窗口层级为正常
export const resetWindowLevel = async (): Promise<void> => {
  try {
    await invoke('reset_window_level');
    console.log('窗口层级已重置');
  } catch (error) {
    console.error('重置窗口层级失败:', error);
  }
};

// 显示窗口
export const showWindow = async (): Promise<void> => {
  try {
    await invoke('show_window');
    console.log('窗口已显示');
  } catch (error) {
    console.error('显示窗口失败:', error);
  }
};

// 隐藏窗口
export const hideWindow = async (): Promise<void> => {
  try {
    await invoke('hide_window');
    console.log('窗口已隐藏');
  } catch (error) {
    console.error('隐藏窗口失败:', error);
  }
};

// 设置任务栏图标可见性
export const setTaskbarIconVisible = async (visible: boolean): Promise<void> => {
  try {
    await invoke('show_taskbar_icon', { visible });
    console.log(`任务栏图标${visible ? '已显示' : '已隐藏'}`);
  } catch (error) {
    console.error('设置任务栏图标失败:', error);
  }
};