export interface DiaryRecord {
  id: string;
  content: string;
  tags: string[];
  completed: boolean;
  createdAt: string;
}

export interface DiaryDay {
  date: string;
  weather: string;
  records: DiaryRecord[];
}

export interface DiaryMonth {
  [day: string]: DiaryDay;
}

export interface DiaryYear {
  [month: string]: DiaryMonth;
}

export interface DiaryData {
  years: DiaryYear;
  tags: string[];
}
