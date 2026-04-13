export type EventKey = 'wedding' | 'date' | 'graduation' | 'travel';

export interface CareDirection {
  icon: string;
  title: string;
  desc: string;
}

export interface EventConfigItem {
  type: EventKey;
  label: string;
  icon: string;
  emoji: string;
  themeColor: string;
  accentColor: string;
  greeting: string;
  subtitle: string;
  dateQuestion: string;
  careDirections: CareDirection[];
}

export const EVENT_CONFIG: Record<EventKey, EventConfigItem> = {
  wedding: {
    type: 'wedding',
    label: '웨딩',
    icon: 'diamond-outline',
    emoji: '💍',
    themeColor: '#F5E6E8',
    accentColor: '#C9A99A',
    greeting: '새 신부님, 축하드려요',
    subtitle: '가장 빛나는 날을 위해 함께 준비해요',
    dateQuestion: '웨딩은 언제인가요?',
    careDirections: [
      { icon: 'shield-outline', title: '트러블 제로 케어', desc: '자극 최소화, 순한 성분만 사용해요' },
      { icon: 'sparkles-outline', title: '고민 부위 집중 개선', desc: '주름→탄력, 색소침착→미백 집중' },
      { icon: 'water-outline', title: '피부 장벽 강화', desc: 'D-day 2주 전부터 새 제품은 NO' },
    ],
  },
  date: {
    type: 'date',
    label: '데이트',
    icon: 'heart-outline',
    emoji: '💕',
    themeColor: '#FCE4EC',
    accentColor: '#F48FB1',
    greeting: '설레는 그 날을 위해',
    subtitle: '빛나는 피부로 자신감 있게',
    dateQuestion: '특별한 날이 언제인가요?',
    careDirections: [
      { icon: 'sunny-outline', title: '글로우 집중 케어', desc: '광채 피부로 빛나게' },
      { icon: 'resize-outline', title: '모공 & 결 정돈', desc: '매끄러운 피부 텍스처' },
      { icon: 'flash-outline', title: '빠른 효과 루틴', desc: '단기간 집중 케어' },
    ],
  },
  graduation: {
    type: 'graduation',
    label: '졸업',
    icon: 'school-outline',
    emoji: '🎓',
    themeColor: '#E3F2FD',
    accentColor: '#90CAF9',
    greeting: '졸업을 진심으로 축하해요',
    subtitle: '인생 사진을 위한 완벽한 피부',
    dateQuestion: '졸업식이 언제인가요?',
    careDirections: [
      { icon: 'color-palette-outline', title: '화사한 피부톤', desc: '칙칙함 개선, 미백 집중' },
      { icon: 'camera-outline', title: '촬영용 피부', desc: '고른 피부결, 모공 케어' },
      { icon: 'leaf-outline', title: '피부 진정 + 수분', desc: '촬영 전날 수분 집중 팩' },
    ],
  },
  travel: {
    type: 'travel',
    label: '여행',
    icon: 'airplane-outline',
    emoji: '✈️',
    themeColor: '#E0F7FA',
    accentColor: '#80DEEA',
    greeting: '신나는 여행을 떠나요',
    subtitle: '여행지에서도 빛나는 피부',
    dateQuestion: '여행은 언제 떠나나요?',
    careDirections: [
      { icon: 'shield-checkmark-outline', title: '피부 장벽 강화', desc: '환경 변화, 건조함 대비' },
      { icon: 'sunny-outline', title: '선케어 강화', desc: '자외선 차단 철저히' },
      { icon: 'bag-outline', title: '간편한 루틴', desc: '여행지에서도 쉽게 유지' },
    ],
  },
};
