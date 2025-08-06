import { forwardRef } from "react";
import { ClipboardRecord } from "../../hooks/clipboard";
import { formatDate, getContentInfo } from "../../utils/clipboard";

interface ClipboardCardProps {
  record: ClipboardRecord;
  isSelected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  className?: string;
}

// 简化的内容渲染组件
const ContentRenderer = ({ content }: { content: any }) => {
  // 图片内容
  if (content.image) {
    return (
      <div className="text-center">
        <div className="text-2xl mb-1">🖼️</div>
        <div className="text-xs text-gray-500">
          图片 ({content.image.width}×{content.image.height})
        </div>
      </div>
    );
  }

  // 文件内容
  if (content.files?.length > 0) {
    return (
      <div className="text-center">
        <div className="text-2xl mb-1">📁</div>
        <div className="text-xs text-gray-500">
          {content.files.length} 个文件
        </div>
      </div>
    );
  }

  // 文本内容
  const textContent =
    content.text ||
    content.html?.replace(/<[^>]*>/g, "").trim() ||
    content.rtf
      ?.replace(/\\[a-z]+/g, "")
      .replace(/[{}]/g, "")
      .trim() ||
    "";

  if (!textContent) return null;

  return (
    <div className="text-sm text-gray-800 line-clamp-3 leading-relaxed">
      {textContent.length > 100
        ? textContent.substring(0, 100) + "..."
        : textContent}
    </div>
  );
};

const ClipboardCard = forwardRef<HTMLDivElement, ClipboardCardProps>(
  ({ record, isSelected, onClick, onDoubleClick, className }, ref) => {
    const contentInfo = getContentInfo(record);

    return (
      <div
        ref={ref}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={`
          flex-shrink-0 w-50 h-40 p-2 rounded-xl border-2 cursor-pointer
          transition-all duration-200 ease-in-out hover:shadow-lg
          ${
            isSelected
              ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200"
              : "border-gray-200 bg-white hover:border-gray-300"
          }
          ${className || ""}
        `}
      >
        {/* 头部信息 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{contentInfo.icon}</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {contentInfo.type}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">
              {formatDate(record.date)}
            </span>
          </div>
        </div>
        <div className={`flex-1 overflow-hidden max-h-40 overflow-y-auto`}>
          <ContentRenderer content={record.content} />
        </div>
      </div>
    );
  }
);

ClipboardCard.displayName = "ClipboardCard";

export default ClipboardCard;
