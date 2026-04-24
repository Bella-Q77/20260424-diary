import React, { useState, useMemo, useEffect } from 'react';
import { DiaryData, DiaryDay } from '../types';

interface DirectoryTreeProps {
  data: DiaryData | null;
  selectedYear: string;
  selectedMonth: string;
  selectedDay: string;
  onSelectDate: (year: string, month: string, day: string) => void;
  onExportData: () => void;
  onImportData: () => void;
}

interface TreeNodeProps {
  label: string;
  icon?: string;
  hasChildren?: boolean;
  expanded?: boolean;
  active?: boolean;
  onToggle?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  level: 'year' | 'month' | 'day';
}

const TreeNode: React.FC<TreeNodeProps> = ({
  label,
  icon,
  hasChildren,
  expanded,
  active,
  onToggle,
  onClick,
  level,
}) => {
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren && onToggle) {
      onToggle(e);
    }
  };

  const handleNodeClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className={`tree-node ${active ? 'active' : ''}`} onClick={handleNodeClick}>
      {hasChildren ? (
        <span
          className={`tree-toggle ${expanded ? 'expanded' : ''}`}
          onClick={handleToggleClick}
          style={{ cursor: 'pointer' }}
        >
          ▶
        </span>
      ) : (
        <span style={{ width: '20px', marginRight: '8px' }} />
      )}
      {icon && <span className="tree-icon">{icon}</span>}
      <span className={`tree-label ${level}`}>{label}</span>
    </div>
  );
};

const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

function formatMonthLabel(month: string): string {
  const monthNum = parseInt(month, 10);
  return monthNames[monthNum - 1] || `${month}月`;
}

function getMonthsFromData(data: DiaryData | null, year: string): string[] {
  if (!data) return [];
  const yearData = data.years[year];
  if (!yearData) return [];
  return Object.keys(yearData).sort((a, b) => parseInt(a) - parseInt(b));
}

function getDaysFromData(data: DiaryData | null, year: string, month: string): string[] {
  if (!data) return [];
  const yearData = data.years[year];
  if (!yearData) return [];
  const monthData = yearData[month];
  if (!monthData) return [];
  return Object.keys(monthData).sort((a, b) => parseInt(a) - parseInt(b));
}

function getDayFromData(data: DiaryData | null, year: string, month: string, day: string): DiaryDay | undefined {
  if (!data) return undefined;
  const yearData = data.years[year];
  if (!yearData) return undefined;
  const monthData = yearData[month] as unknown as { [dayKey: string]: DiaryDay };
  if (!monthData) return undefined;
  return monthData[day];
}

const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  data,
  selectedYear,
  selectedMonth,
  selectedDay,
  onSelectDate,
  onExportData,
  onImportData,
}) => {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const sortedYears = useMemo(() => {
    if (!data || !data.years) return [];
    return Object.keys(data.years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [data]);

  useEffect(() => {
    if (selectedYear && !expandedYears.has(selectedYear)) {
      setExpandedYears(prev => new Set(prev).add(selectedYear));
    }
    const monthKey = `${selectedYear}-${selectedMonth}`;
    if (selectedMonth && !expandedMonths.has(monthKey)) {
      setExpandedMonths(prev => new Set(prev).add(monthKey));
    }
  }, [selectedYear, selectedMonth, expandedYears, expandedMonths]);

  const toggleYear = (year: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  const toggleMonth = (year: string, month: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const monthKey = `${year}-${month}`;
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">📅 日记目录</span>
        <div className="sidebar-buttons">
          <button className="sidebar-button" onClick={onExportData}>
            导出
          </button>
          <button className="sidebar-button" onClick={onImportData}>
            导入
          </button>
        </div>
      </div>
      <div className="directory-tree">
        {sortedYears.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
            暂无日记数据
          </div>
        ) : (
          sortedYears.map(year => (
            <div key={year} className="tree-item">
              <TreeNode
                label={`${year}年`}
                icon="📆"
                hasChildren
                expanded={expandedYears.has(year)}
                active={selectedYear === year && !selectedMonth}
                onToggle={(e) => toggleYear(year, e)}
                level="year"
              />
              {expandedYears.has(year) && (
                <div style={{ paddingLeft: '24px' }}>
                  {getMonthsFromData(data, year).map(month => {
                    const monthKey = `${year}-${month}`;
                    const monthActive = selectedYear === year && selectedMonth === month && !selectedDay;
                    return (
                      <div key={month} className="tree-item">
                        <TreeNode
                          label={formatMonthLabel(month)}
                          icon="📁"
                          hasChildren
                          expanded={expandedMonths.has(monthKey)}
                          active={monthActive}
                          onToggle={(e) => toggleMonth(year, month, e)}
                          level="month"
                        />
                        {expandedMonths.has(monthKey) && (
                          <div style={{ paddingLeft: '24px' }}>
                            {getDaysFromData(data, year, month).map(day => {
                              const dayData = getDayFromData(data, year, month, day);
                              const dayActive = selectedYear === year && selectedMonth === month && selectedDay === day;
                              return (
                                <div key={day} className="tree-item">
                                  <TreeNode
                                    label={dayData?.date || `${day}日`}
                                    icon="📄"
                                    active={dayActive}
                                    onClick={() => onSelectDate(year, month, day)}
                                    level="day"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DirectoryTree;
