import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useState, useEffect, useCallback, useRef } from "react";

// 类型定义
export interface ClipboardContent {
  text?: string;
  html?: string;
  rtf?: string;
  image?: {
    width: number;
    height: number;
    path: string;
  };
  files?: string[];
}

export interface ClipboardRecord {
  id: string;
  timestamp: number;
  date: Date;
  formats: ClipboardFormat[];
  content: ClipboardContent;
}

// 图片读取结果类型
export interface ReadImageResult {
  width: number;
  height: number;
  image: string;
}

// 剪贴板内容格式类型
export type ClipboardFormat = "text" | "html" | "rtf" | "image" | "files";

// 剪贴板变化回调函数类型
export type ClipboardChangeCallback = (record: ClipboardRecord) => void;

// 剪贴板变化选项
export interface ClipboardChangeOptions {
  beforeChange?: () => void;
  debounceMs?: number; // 防抖时间，默认300ms
}

// 事件常量
export const CLIPBOARD_EVENTS = {
  CLIPBOARD_CHANGED: "plugin:clipboard://clipboard_update",
} as const;

export interface UseClipboardOptions {
  autoListen?: boolean; // 是否自动开始监听剪贴板变化
  maxRecords?: number; // 最大记录数量
  debounceMs?: number; // 防抖时间，默认300ms
}

export const useClipboard = (options: UseClipboardOptions = {}) => {
  const { autoListen = true, maxRecords = 100, debounceMs = 300 } = options; // 默认开启监听
  const [isListening, setIsListening] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [records, setRecords] = useState<ClipboardRecord[]>([]);

  // 防抖用的 ref
  const debounceTimerRef = useRef<number | null>(null);
  const lastContentHashRef = useRef<string>("");

  // 监听剪贴板变化
  const startListen = useCallback(async (): Promise<void> => {
    try {
      await invoke("plugin:clipboard|start_listen");
      setIsListening(true);
    } catch (error) {
      throw new Error(`Failed to start clipboard listener: ${error}`);
    }
  }, []);

  // 停止监听剪贴板变化
  const stopListen = useCallback(async (): Promise<void> => {
    try {
      await invoke("plugin:clipboard|stop_listen");
      setIsListening(false);
    } catch (error) {
      throw new Error(`Failed to stop clipboard listener: ${error}`);
    }
  }, []);

  // 检查剪贴板是否包含指定格式的内容
  const hasContent = useCallback(
    async (format: ClipboardFormat): Promise<boolean> => {
      try {
        switch (format) {
          case "text":
            return await invoke("plugin:clipboard|has_text");
          case "html":
            return await invoke("plugin:clipboard|has_html");
          case "rtf":
            return await invoke("plugin:clipboard|has_rtf");
          case "image":
            return await invoke("plugin:clipboard|has_image");
          case "files":
            return await invoke("plugin:clipboard|has_files");
          default:
            throw new Error(`Unsupported format: ${format}`);
        }
      } catch (error) {
        throw new Error(`Failed to check clipboard content: ${error}`);
      }
    },
    []
  );

  // 获取剪贴板所有可用的内容格式
  const getAvailableFormats = useCallback(async (): Promise<
    ClipboardFormat[]
  > => {
    const formats: ClipboardFormat[] = [];

    try {
      const [hasText, hasHtml, hasRtf, hasImage, hasFiles] = await Promise.all([
        hasContent("text"),
        hasContent("html"),
        hasContent("rtf"),
        hasContent("image"),
        hasContent("files"),
      ]);

      if (hasText) formats.push("text");
      if (hasHtml) formats.push("html");
      if (hasRtf) formats.push("rtf");
      if (hasImage) formats.push("image");
      if (hasFiles) formats.push("files");

      return formats;
    } catch (error) {
      throw new Error(`Failed to get available formats: ${error}`);
    }
  }, [hasContent]);

  // 读取剪贴板内容
  const readClipboardContent = useCallback(
    async (formats: ClipboardFormat[]): Promise<ClipboardContent> => {
      const content: ClipboardContent = {};

      try {
        // 并行读取所有可用格式的内容
        const readPromises = formats.map(async (format) => {
          try {
            switch (format) {
              case "text":
                content.text = await invoke("plugin:clipboard|read_text");
                break;
              case "html":
                content.html = await invoke("plugin:clipboard|read_html");
                break;
              case "rtf":
                content.rtf = await invoke("plugin:clipboard|read_rtf");
                break;
              case "files":
                content.files = await invoke("plugin:clipboard|read_files");
                break;
              case "image":
                // 为图片创建临时路径
                const tempPath = `/tmp/clipboard_image_${Date.now()}.png`;
                const imageResult = (await invoke(
                  "plugin:clipboard|read_image",
                  { path: tempPath }
                )) as ReadImageResult;
                content.image = {
                  width: imageResult.width,
                  height: imageResult.height,
                  path: tempPath,
                };
                break;
            }
          } catch (error) {
            console.error(`Failed to read ${format}:`, error);
          }
        });

        await Promise.all(readPromises);
        return content;
      } catch (error) {
        console.error("Failed to read clipboard content:", error);
        return content;
      }
    },
    []
  );

  // 创建内容哈希用于去重
  const createContentHash = useCallback((content: ClipboardContent): string => {
    return JSON.stringify({
      text: content.text?.substring(0, 100), // 只取前100个字符参与哈希
      html: content.html?.substring(0, 100),
      rtf: content.rtf?.substring(0, 100),
      files: content.files,
      image: content.image
        ? `${content.image.width}x${content.image.height}`
        : undefined,
    });
  }, []);

  // 创建剪贴板记录
  const createClipboardRecord =
    useCallback(async (): Promise<ClipboardRecord | null> => {
      try {
        const now = new Date();
        const formats = await getAvailableFormats();

        if (formats.length === 0) {
          return null; // 没有内容，不创建记录
        }

        const content = await readClipboardContent(formats);
        const contentHash = createContentHash(content);

        // 检查是否与上次内容相同，避免重复记录
        if (contentHash === lastContentHashRef.current) {
          return null;
        }

        lastContentHashRef.current = contentHash;

        return {
          id: `${now.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now.getTime(),
          date: now,
          formats,
          content,
        };
      } catch (error) {
        console.error("Failed to create clipboard record:", error);
        return null;
      }
    }, [getAvailableFormats, readClipboardContent, createContentHash]);

  // 添加剪贴板记录
  const addRecord = useCallback(
    (record: ClipboardRecord) => {
      setRecords((prev) => {
        const newRecords = [record, ...prev];
        // 限制记录数量
        return newRecords.slice(0, maxRecords);
      });
    },
    [maxRecords]
  );

  // 清空记录
  const clearRecords = useCallback(() => {
    setRecords([]);
    lastContentHashRef.current = "";
  }, []);

  // 获取最新记录
  const getLatestRecord = useCallback((): ClipboardRecord | null => {
    return records[0] || null;
  }, [records]);

  // 防抖处理剪贴板变化
  const handleClipboardChange = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(async () => {
      const now = new Date();
      setLastUpdate(now);

      try {
        const record = await createClipboardRecord();
        if (record) {
          addRecord(record);
        }
      } catch (error) {
        console.error("Failed to handle clipboard change:", error);
      }
    }, debounceMs);
  }, [createClipboardRecord, addRecord, debounceMs]);

  // 组件挂载时设置事件监听
  useEffect(() => {
    let unlisten: UnlistenFn | null = null;

    const setupListener = async () => {
      // 监听剪贴板更新事件
      unlisten = await listen(
        CLIPBOARD_EVENTS.CLIPBOARD_CHANGED,
        handleClipboardChange
      );

      // 如果启用自动监听，则开始监听
      if (autoListen) {
        await startListen();
      }
    };

    setupListener().catch(console.error);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (unlisten) {
        unlisten();
      }
      if (isListening) {
        stopListen().catch(console.error);
      }
    };
  }, [autoListen, startListen, stopListen, isListening, handleClipboardChange]);

  return {
    // 状态
    isListening,
    lastUpdate,
    records,

    // 监听控制
    startListen,
    stopListen,

    // 内容检查
    hasContent,
    getAvailableFormats,

    // 记录管理
    addRecord,
    clearRecords,
    getLatestRecord,

    // 内容读取
    readClipboardContent,
  };
};

// 剪贴板变化监听函数
export const onClipboardChange = (
  cb: ClipboardChangeCallback,
  options: ClipboardChangeOptions = {}
) => {
  const { beforeChange, debounceMs = 300 } = options;
  let debounceTimer: number | null = null;
  let lastContentHash = "";

  const createContentHash = (content: ClipboardContent): string => {
    return JSON.stringify({
      text: content.text?.substring(0, 100),
      html: content.html?.substring(0, 100),
      rtf: content.rtf?.substring(0, 100),
      files: content.files,
      image: content.image
        ? `${content.image.width}x${content.image.height}`
        : undefined,
    });
  };

  return listen(CLIPBOARD_EVENTS.CLIPBOARD_CHANGED, async () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = window.setTimeout(async () => {
      beforeChange?.();

      try {
        // 获取可用格式
        const formats: ClipboardFormat[] = [];

        const [hasText, hasHtml, hasRtf, hasImage, hasFiles] =
          await Promise.all([
            invoke("plugin:clipboard|has_text"),
            invoke("plugin:clipboard|has_html"),
            invoke("plugin:clipboard|has_rtf"),
            invoke("plugin:clipboard|has_image"),
            invoke("plugin:clipboard|has_files"),
          ]);

        if (hasText) formats.push("text");
        if (hasHtml) formats.push("html");
        if (hasRtf) formats.push("rtf");
        if (hasImage) formats.push("image");
        if (hasFiles) formats.push("files");

        if (formats.length === 0) return;

        // 读取内容
        const content: ClipboardContent = {};
        const readPromises = formats.map(async (format) => {
          try {
            switch (format) {
              case "text":
                content.text = await invoke("plugin:clipboard|read_text");
                break;
              case "html":
                content.html = await invoke("plugin:clipboard|read_html");
                break;
              case "rtf":
                content.rtf = await invoke("plugin:clipboard|read_rtf");
                break;
              case "files":
                content.files = await invoke("plugin:clipboard|read_files");
                break;
              case "image":
                const tempPath = `/tmp/clipboard_image_${Date.now()}.png`;
                const imageResult = (await invoke(
                  "plugin:clipboard|read_image",
                  { path: tempPath }
                )) as ReadImageResult;
                content.image = {
                  width: imageResult.width,
                  height: imageResult.height,
                  path: tempPath,
                };
                break;
            }
          } catch (error) {
            console.error(`Failed to read ${format}:`, error);
          }
        });

        await Promise.all(readPromises);

        const contentHash = createContentHash(content);
        if (contentHash === lastContentHash) {
          return; // 内容相同，跳过
        }
        lastContentHash = contentHash;

        const now = new Date();
        const record: ClipboardRecord = {
          id: `${now.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now.getTime(),
          date: now,
          formats,
          content,
        };

        cb(record);
      } catch (error) {
        console.error("Failed to handle clipboard change:", error);
      }
    }, debounceMs);
  });
};

// 便捷的导出函数
export const createClipboardHook = (options?: UseClipboardOptions) => {
  return () => useClipboard(options);
};
