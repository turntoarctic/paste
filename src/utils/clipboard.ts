import { ClipboardRecord } from "../hooks/clipboard";

// 检测文本是否为JSON
export const isJsonString = (str: string): boolean => {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    return false;
  }
};

// 检测文本中的URL
export const detectUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

// 格式化JSON
export const formatJson = (jsonString: string): string => {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return jsonString;
  }
};

// 格式化日期
export const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
};

// 获取内容信息
export const getContentInfo = (record: ClipboardRecord): { type: string; icon: string } => {
  const { content } = record;

  if (content.text) {
    const isJson = isJsonString(content.text);
    const urls = detectUrls(content.text);

    if (isJson) {
      return { type: "JSON", icon: "📄" };
    }
    if (urls.length > 0) {
      return { type: "Link", icon: "🔗" };
    }
    return { type: "Text", icon: "📝" };
  }

  if (content.html) {
    return { type: "HTML", icon: "🌐" };
  }

  if (content.files && content.files.length > 0) {
    return { type: "Files", icon: "📁" };
  }

  if (content.image) {
    return { type: "Image", icon: "🖼️" };
  }

  if (content.rtf) {
    return { type: "RTF", icon: "📄" };
  }

  return { type: "Unknown", icon: "❓" };
};
