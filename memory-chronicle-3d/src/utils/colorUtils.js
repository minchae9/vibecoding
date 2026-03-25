// nuance 값을 색상으로 변환하는 유틸리티
// -1.0 (매우 부정) ~ 1.0 (매우 긍정)

export const nuanceToColor = (nuance) => {
  // nuance 범위: -1 ~ 1 → 0 ~ 1로 정규화
  const normalized = (nuance + 1) / 2;

  // 색상 스톱 정의
  const colorStops = [
    { pos: 0.0, r: 255, g: 45, b: 45 },    // 강렬한 빨강 (매우 부정)
    { pos: 0.25, r: 255, g: 140, b: 0 },   // 주황 (부정)
    { pos: 0.5, r: 127, g: 255, b: 212 },  // 연한 청록 (중립)
    { pos: 0.75, r: 0, g: 250, b: 154 },   // 민트 (긍정)
    { pos: 1.0, r: 0, g: 191, b: 255 },    // 네온 블루 (매우 긍정)
  ];

  // 두 색상 스톱 사이에서 보간
  let lower = colorStops[0];
  let upper = colorStops[colorStops.length - 1];

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (normalized >= colorStops[i].pos && normalized <= colorStops[i + 1].pos) {
      lower = colorStops[i];
      upper = colorStops[i + 1];
      break;
    }
  }

  const range = upper.pos - lower.pos;
  const factor = range === 0 ? 0 : (normalized - lower.pos) / range;

  const r = Math.round(lower.r + (upper.r - lower.r) * factor);
  const g = Math.round(lower.g + (upper.g - lower.g) * factor);
  const b = Math.round(lower.b + (upper.b - lower.b) * factor);

  return `rgb(${r}, ${g}, ${b})`;
};

// 투명도가 있는 색상 반환 (검색 필터링용)
export const nuanceToColorWithOpacity = (nuance, opacity = 1) => {
  const normalized = (nuance + 1) / 2;

  const colorStops = [
    { pos: 0.0, r: 255, g: 45, b: 45 },
    { pos: 0.25, r: 255, g: 140, b: 0 },
    { pos: 0.5, r: 127, g: 255, b: 212 },
    { pos: 0.75, r: 0, g: 250, b: 154 },
    { pos: 1.0, r: 0, g: 191, b: 255 },
  ];

  let lower = colorStops[0];
  let upper = colorStops[colorStops.length - 1];

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (normalized >= colorStops[i].pos && normalized <= colorStops[i + 1].pos) {
      lower = colorStops[i];
      upper = colorStops[i + 1];
      break;
    }
  }

  const range = upper.pos - lower.pos;
  const factor = range === 0 ? 0 : (normalized - lower.pos) / range;

  const r = Math.round(lower.r + (upper.r - lower.r) * factor);
  const g = Math.round(lower.g + (upper.g - lower.g) * factor);
  const b = Math.round(lower.b + (upper.b - lower.b) * factor);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
