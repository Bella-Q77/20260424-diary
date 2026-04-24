import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DiaryDay, DiaryRecord } from '../types';
import { getTagColor } from '../App';

interface EditorProps {
  day: DiaryDay;
  tags: string[];
  onUpdateDay: (day: DiaryDay) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function autoResize(textarea: HTMLTextAreaElement) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

const Editor: React.FC<EditorProps> = ({ day, tags, onUpdateDay }) => {
  const [records, setRecords] = useState<DiaryRecord[]>(day.records || []);
  const [weather, setWeather] = useState(day.weather || '');
  const [newRecordText, setNewRecordText] = useState('');
  const [dragOverRecordId, setDragOverRecordId] = useState<string | null>(null);
  const newRecordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecords(day.records || []);
    setWeather(day.weather || '');
  }, [day]);

  const saveChanges = useCallback((updatedRecords: DiaryRecord[], updatedWeather: string) => {
    onUpdateDay({
      ...day,
      weather: updatedWeather,
      records: updatedRecords,
    });
  }, [day, onUpdateDay]);

  const handleWeatherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWeather = e.target.value;
    setWeather(newWeather);
    saveChanges(records, newWeather);
  };

  const handleAddRecord = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    if (e) e.preventDefault();

    const trimmedText = newRecordText.trim();
    if (!trimmedText) return;

    const newRecord: DiaryRecord = {
      id: generateId(),
      content: trimmedText,
      tags: [],
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedRecords = [...records, newRecord];
    setRecords(updatedRecords);
    setNewRecordText('');
    saveChanges(updatedRecords, weather);

    setTimeout(() => {
      newRecordInputRef.current?.focus();
    }, 0);
  };

  const handleRecordContentChange = (id: string, content: string) => {
    const updatedRecords = records.map(record =>
      record.id === id ? { ...record, content } : record
    );
    setRecords(updatedRecords);
  };

  const handleRecordBlur = (id: string) => {
    saveChanges(records, weather);
  };

  const handleToggleCompleted = (id: string) => {
    const updatedRecords = records.map(record =>
      record.id === id ? { ...record, completed: !record.completed } : record
    );
    setRecords(updatedRecords);
    saveChanges(updatedRecords, weather);
  };

  const handleRemoveTag = (recordId: string, tag: string) => {
    const updatedRecords = records.map(record => {
      if (record.id === recordId) {
        return {
          ...record,
          tags: record.tags.filter(t => t !== tag),
        };
      }
      return record;
    });
    setRecords(updatedRecords);
    saveChanges(updatedRecords, weather);
  };

  const handleDragOver = (e: React.DragEvent, recordId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverRecordId(recordId);
  };

  const handleDragLeave = (e: React.DragEvent, recordId: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverRecordId(null);
  };

  const handleDrop = (e: React.DragEvent, recordId: string) => {
    e.preventDefault();
    setDragOverRecordId(null);

    const tag = e.dataTransfer.getData('text/plain');
    if (!tag) return;

    const updatedRecords = records.map(record => {
      if (record.id === recordId) {
        if (!record.tags.includes(tag)) {
          return {
            ...record,
            tags: [...record.tags, tag],
          };
        }
      }
      return record;
    });

    setRecords(updatedRecords);
    saveChanges(updatedRecords, weather);
  };

  const handleKeyDown = (e: React.KeyboardEvent, recordId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveChanges(records, weather);
      handleAddRecord();
    }
    if (e.key === 'Backspace') {
      const record = records.find(r => r.id === recordId);
      if (record && record.content === '') {
        e.preventDefault();
        const updatedRecords = records.filter(r => r.id !== recordId);
        setRecords(updatedRecords);
        saveChanges(updatedRecords, weather);
      }
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-content">
        <div className="header">
          <div className="header-date">{day.date}</div>
          <div className="header-weather">
            <span className="weather-label">天气：</span>
            <input
              type="text"
              className="weather-input"
              value={weather}
              onChange={handleWeatherChange}
              placeholder="输入天气"
            />
          </div>
        </div>

        {records.length === 0 && (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-text">开始记录今天的日记吧</div>
            <div className="empty-state-hint">在下方输入内容，按回车添加记录</div>
          </div>
        )}

        {records.map((record) => (
          <div
            key={record.id}
            className={`record-item ${dragOverRecordId === record.id ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, record.id)}
            onDragLeave={(e) => handleDragLeave(e, record.id)}
            onDrop={(e) => handleDrop(e, record.id)}
          >
            <div className="record-content">
              <input
                type="checkbox"
                className="record-checkbox"
                checked={record.completed}
                onChange={() => handleToggleCompleted(record.id)}
              />
              <textarea
                className={`record-textarea ${record.completed ? 'completed' : ''}`}
                value={record.content}
                onChange={(e) => {
                  handleRecordContentChange(record.id, e.target.value);
                  autoResize(e.target);
                }}
                onBlur={() => handleRecordBlur(record.id)}
                onKeyDown={(e) => handleKeyDown(e, record.id)}
                placeholder="输入记录内容..."
                rows={1}
              />
            </div>
            {record.tags.length > 0 && (
              <div className="record-tags">
                {record.tags.map((tag) => {
                  const colorClass = getTagColor(tag);
                  return (
                    <span
                      key={tag}
                      className={`record-tag tag-${colorClass}`}
                    >
                      {tag}
                      <span
                        className="record-tag-remove"
                        onClick={() => handleRemoveTag(record.id, tag)}
                        title="移除标签"
                      >
                        ×
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <div className="new-record">
          <input
            type="checkbox"
            className="new-record-checkbox"
            disabled
          />
          <input
            ref={newRecordInputRef}
            type="text"
            className="new-record-input"
            value={newRecordText}
            onChange={(e) => setNewRecordText(e.target.value)}
            onKeyDown={handleAddRecord}
            placeholder="输入新记录，按回车添加..."
          />
        </div>
      </div>
    </div>
  );
};

export default Editor;
