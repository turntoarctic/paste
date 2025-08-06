import { useState, useEffect } from "react";
import {
  useClipboard,
  onClipboardChange,
  ClipboardRecord,
} from "../../hooks/clipboard";
import { useClipboardList } from "../../hooks/clipboard-list";
import ClipboardCard from "./clipboard-card";

function Clipboard() {
  const {
    isListening,
    lastUpdate,
    records,
    startListen,
    stopListen,
    clearRecords,
  } = useClipboard();

  const [copyMessage, setCopyMessage] = useState<string>("");

  // 使用列表交互 hook
  const {
    selectedIndex,
    containerRef,
    setCardRef,
    handleCardClick,
    handleCardDoubleClick,
    selectedRecord,
  } = useClipboardList({
    records,
    onCopy: handleCopyToClipboard,
  });

  // 复制到剪贴板功能
  async function handleCopyToClipboard(record: ClipboardRecord) {
    try {
      if (record.content.text) {
        await navigator.clipboard.writeText(record.content.text);
        showCopyMessage("文本已复制");
      } else if (record.content.html) {
        // 对于 HTML，我们复制纯文本版本
        const textContent = record.content.html.replace(/<[^>]*>/g, "");
        await navigator.clipboard.writeText(textContent);
        showCopyMessage("HTML内容已复制");
      } else if (record.content.files && record.content.files.length > 0) {
        // 对于文件，复制文件路径
        await navigator.clipboard.writeText(record.content.files.join("\n"));
        showCopyMessage("文件路径已复制");
      } else {
        showCopyMessage("无法复制此内容类型");
      }
    } catch (error) {
      console.error("复制失败:", error);
      showCopyMessage("复制失败");
    }
  }

  function showCopyMessage(message: string) {
    setCopyMessage(message);
    setTimeout(() => setCopyMessage(""), 2000);
  }

  // 监听剪贴板变化
  useEffect(() => {
    const unlisten = onClipboardChange((record) => {
      console.log("剪贴板变化:", record);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleStartListen = async () => {
    try {
      await startListen();
    } catch (error) {
      console.error("Failed to start listening:", error);
    }
  };

  const handleStopListen = async () => {
    try {
      await stopListen();
    } catch (error) {
      console.error("Failed to stop listening:", error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 复制成功提示 */}
      {copyMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg transition-all duration-300">
          {copyMessage}
        </div>
      )}

      <div className="container mx-auto p-6 max-w-7xl">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paste</h1>
            <p className="text-sm text-gray-500">
              {records.length} 个剪贴板记录
              {lastUpdate && ` · 最后更新 ${formatDate(lastUpdate)}`}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isListening ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                {isListening ? "监听中" : "已停止"}
              </span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleStartListen}
                disabled={isListening}
                className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md disabled:bg-gray-300 hover:bg-green-600 transition-colors"
              >
                开始
              </button>
              <button
                onClick={handleStopListen}
                disabled={!isListening}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-md disabled:bg-gray-300 hover:bg-red-600 transition-colors"
              >
                停止
              </button>
              <button
                onClick={clearRecords}
                className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                清空
              </button>
            </div>
          </div>
        </div>

        {/* 使用提示 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">使用提示：</span>
            使用 ←→ 方向键或鼠标滚轮切换选中的剪贴板记录，按 Enter
            键或双击卡片复制内容。
          </p>
        </div>

        {/* 剪贴板卡片列表 */}
        <div className="relative">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-lg font-medium">暂无剪贴板记录</p>
              <p className="text-sm">开始监听后，复制的内容将显示在这里</p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {records.map((record, index) => (
                <ClipboardCard
                  key={record.id}
                  ref={setCardRef(index)}
                  record={record}
                  isSelected={selectedIndex === index}
                  onClick={() => handleCardClick(index)}
                  onDoubleClick={() => handleCardDoubleClick(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Clipboard;
