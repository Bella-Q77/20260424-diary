import React, { useState } from 'react';
import { getTagColor } from '../App';

interface TagBarProps {
  tags: string[];
  onAddTag: (tag: string) => void;
}

const TagBar: React.FC<TagBarProps> = ({ tags, onAddTag }) => {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onAddTag(trimmedTag);
      setNewTag('');
      setShowAddInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    } else if (e.key === 'Escape') {
      setShowAddInput(false);
      setNewTag('');
    }
  };

  const handleDragStart = (e: React.DragEvent, tag: string) => {
    e.dataTransfer.setData('text/plain', tag);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="tag-bar">
      <span className="tag-label">标签：</span>
      {tags.map((tag) => {
        const colorClass = getTagColor(tag);
        return (
          <span
            key={tag}
            className={`tag tag-${colorClass}`}
            draggable
            onDragStart={(e) => handleDragStart(e, tag)}
            title={`拖动到记录上添加标签`}
          >
            {tag}
          </span>
        );
      })}
      {showAddInput ? (
        <input
          type="text"
          className="tag-input"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            handleAddTag();
            if (!newTag.trim()) {
              setShowAddInput(false);
            }
          }}
          placeholder="输入新标签"
          autoFocus
        />
      ) : (
        <button
          className="add-tag-button"
          onClick={() => setShowAddInput(true)}
        >
          + 新增标签
        </button>
      )}
    </div>
  );
};

export default TagBar;
