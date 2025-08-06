import { useState, useEffect, useRef, useCallback } from 'react';
import { ClipboardRecord } from './clipboard';

interface UseClipboardListOptions {
  records: ClipboardRecord[];
  onCopy?: (record: ClipboardRecord) => void;
}

export function useClipboardList({ records, onCopy }: UseClipboardListOptions) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 重置选中索引当记录数组变化时
  useEffect(() => {
    if (records.length > 0 && selectedIndex >= records.length) {
      setSelectedIndex(0);
    } else if (records.length === 0) {
      setSelectedIndex(-1);
    }
  }, [records.length, selectedIndex]);

  // 默认选中第一个
  useEffect(() => {
    if (records.length > 0 && selectedIndex === -1) {
      setSelectedIndex(0);
    }
  }, [records.length, selectedIndex]);

  // 滚动到选中的卡片
  const scrollToSelected = useCallback((index: number) => {
    const container = containerRef.current;
    const card = cardRefs.current[index];
    
    if (container && card) {
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      
      const cardLeft = card.offsetLeft;
      const cardRight = cardLeft + card.offsetWidth;
      const containerScrollLeft = container.scrollLeft;
      const containerWidth = container.offsetWidth;
      
      // 如果卡片在可视区域右侧
      if (cardRight > containerScrollLeft + containerWidth) {
        container.scrollTo({
          left: cardRight - containerWidth,
          behavior: 'smooth'
        });
      }
      // 如果卡片在可视区域左侧
      else if (cardLeft < containerScrollLeft) {
        container.scrollTo({
          left: cardLeft,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  // 处理键盘事件
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (records.length === 0) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = Math.max(0, prev - 1);
          setTimeout(() => scrollToSelected(newIndex), 0);
          return newIndex;
        });
        break;
      
      case 'ArrowRight':
        event.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = Math.min(records.length - 1, prev + 1);
          setTimeout(() => scrollToSelected(newIndex), 0);
          return newIndex;
        });
        break;
      
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < records.length) {
          onCopy?.(records[selectedIndex]);
        }
        break;
    }
  }, [records, selectedIndex, onCopy, scrollToSelected]);

  // 处理鼠标滚轮事件
  const handleWheel = useCallback((event: WheelEvent) => {
    if (records.length === 0) return;

    // 只处理水平滚动或者按住 Shift 键的垂直滚动
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) {
      event.preventDefault();
      
      const direction = event.deltaX > 0 || event.deltaY > 0 ? 1 : -1;
      setSelectedIndex(prev => {
        const newIndex = Math.max(0, Math.min(records.length - 1, prev + direction));
        setTimeout(() => scrollToSelected(newIndex), 0);
        return newIndex;
      });
    }
  }, [records, scrollToSelected]);

  // 注册键盘和滚轮事件
  useEffect(() => {
    const container = containerRef.current;
    
    document.addEventListener('keydown', handleKeyDown);
    container?.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      container?.removeEventListener('wheel', handleWheel);
    };
  }, [handleKeyDown, handleWheel]);

  // 处理卡片点击
  const handleCardClick = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  // 处理卡片双击
  const handleCardDoubleClick = useCallback((index: number) => {
    if (index >= 0 && index < records.length) {
      onCopy?.(records[index]);
    }
  }, [records, onCopy]);

  // 设置卡片ref
  const setCardRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    cardRefs.current[index] = el;
  }, []);

  return {
    selectedIndex,
    containerRef,
    setCardRef,
    handleCardClick,
    handleCardDoubleClick,
    selectedRecord: selectedIndex >= 0 ? records[selectedIndex] : null,
  };
} 