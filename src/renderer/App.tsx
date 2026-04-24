import React, { useState, useEffect, useCallback } from 'react';
import DirectoryTree from './components/DirectoryTree';
import Editor from './components/Editor';
import TagBar from './components/TagBar';
import { DiaryData, DiaryDay, DiaryMonth, DiaryYear, DiaryRecord } from './types';

const defaultTags = ['生活', '工作', '学习', '娱乐', '购物', '美食', '兴趣', '待办'];

const tagColorMap: Record<string, string> = {
  '生活': 'life',
  '工作': 'work',
  '学习': 'study',
  '娱乐': 'entertainment',
  '购物': 'shopping',
  '美食': 'food',
  '兴趣': 'hobby',
  '待办': 'todo',
};

export function getTagColor(tag: string): string {
  return tagColorMap[tag] || 'custom';
}

function formatDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekDay = weekDays[date.getDay()];
  return `${month}月${day}日 ${weekDay}`;
}

function getTodayKey(): { year: string; month: string; day: string } {
  const today = new Date();
  return {
    year: String(today.getFullYear()),
    month: String(today.getMonth() + 1).padStart(2, '0'),
    day: String(today.getDate()).padStart(2, '0'),
  };
}

function createEmptyDay(date: Date): DiaryDay {
  return {
    date: formatDate(date),
    weather: '',
    records: [],
  };
}

function getDayFromData(data: DiaryData | null, year: string, month: string, day: string): DiaryDay | undefined {
  if (!data) return undefined;
  
  const yearData = data.years[year];
  if (!yearData) return undefined;
  
  const monthData = yearData[month] as unknown as { [dayKey: string]: DiaryDay };
  if (!monthData) return undefined;
  
  return monthData[day];
}

function ensureDayExists(years: DiaryYear, year: string, month: string, day: string, date: Date): DiaryYear {
  const newYears: DiaryYear = JSON.parse(JSON.stringify(years));
  
  if (!newYears[year]) {
    newYears[year] = {} as unknown as DiaryMonth;
  }
  
  const yearObj = newYears[year] as unknown as { [monthKey: string]: { [dayKey: string]: DiaryDay } };
  
  if (!yearObj[month]) {
    yearObj[month] = {};
  }
  
  if (!yearObj[month][day]) {
    yearObj[month][day] = createEmptyDay(date);
  }
  
  return newYears;
}

function updateDayInData(data: DiaryData, year: string, month: string, day: string, updatedDay: DiaryDay): DiaryData {
  const newYears: DiaryYear = JSON.parse(JSON.stringify(data.years));
  
  const yearObj = newYears[year] as unknown as { [monthKey: string]: { [dayKey: string]: DiaryDay } };
  if (!yearObj[month]) {
    yearObj[month] = {};
  }
  yearObj[month][day] = updatedDay;
  
  return {
    ...data,
    years: newYears,
  };
}

const App: React.FC = () => {
  const [data, setData] = useState<DiaryData | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (): Promise<DiaryData | null> => {
    try {
      const savedData = await window.electronAPI.loadData();
      if (savedData) {
        return savedData as unknown as DiaryData;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    return null;
  }, []);

  const saveData = useCallback(async (newData: DiaryData) => {
    try {
      await window.electronAPI.saveData(newData);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const savedData = await loadData();
      
      const { year, month, day } = getTodayKey();
      const today = new Date();
      
      let initialData: DiaryData;
      if (savedData) {
        initialData = {
          ...savedData,
          years: ensureDayExists(savedData.years, year, month, day, today),
        };
      } else {
        initialData = {
          years: ensureDayExists({} as DiaryYear, year, month, day, today),
          tags: [...defaultTags],
        };
      }

      if (!initialData.tags || initialData.tags.length === 0) {
        initialData.tags = [...defaultTags];
      }

      setData(initialData);
      setSelectedYear(year);
      setSelectedMonth(month);
      setSelectedDay(day);
      setLoading(false);

      if (!savedData) {
        await saveData(initialData);
      }
    };

    initialize();
  }, [loadData, saveData]);

  const handleSelectDate = (year: string, month: string, day: string) => {
    if (!data) return;

    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const newYears = ensureDayExists(data.years, year, month, day, date);
    
    const newData: DiaryData = {
      ...data,
      years: newYears,
    };

    setData(newData);
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDay(day);
    saveData(newData);
  };

  const handleUpdateDay = (updatedDay: DiaryDay) => {
    if (!data || !selectedYear || !selectedMonth || !selectedDay) return;

    const newData = updateDayInData(data, selectedYear, selectedMonth, selectedDay, updatedDay);

    setData(newData);
    saveData(newData);
  };

  const handleAddTag = (tag: string) => {
    if (!data) return;
    if (data.tags.includes(tag)) return;

    const newData: DiaryData = {
      ...data,
      tags: [...data.tags, tag],
    };

    setData(newData);
    saveData(newData);
  };

  const handleExportData = async () => {
    if (!data) return;
    await window.electronAPI.exportData();
  };

  const handleImportData = async () => {
    const result = await window.electronAPI.importData();
    if (result.success && result.data) {
      setData(result.data as unknown as DiaryData);
      const { year, month, day } = getTodayKey();
      setSelectedYear(year);
      setSelectedMonth(month);
      setSelectedDay(day);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  const currentDay = getDayFromData(data, selectedYear, selectedMonth, selectedDay);
  const tags = data?.tags || defaultTags;

  return (
    <div className="app-container">
      <DirectoryTree
        data={data}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDay={selectedDay}
        onSelectDate={handleSelectDate}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />
      <div className="main-content">
        <TagBar tags={tags} onAddTag={handleAddTag} />
        {currentDay ? (
          <Editor day={currentDay} tags={tags} onUpdateDay={handleUpdateDay} />
        ) : (
          <div className="editor-container">
            <div className="editor-content">
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <div className="empty-state-text">请选择一个日期查看日记</div>
                <div className="empty-state-hint">点击左侧目录树中的日期</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
