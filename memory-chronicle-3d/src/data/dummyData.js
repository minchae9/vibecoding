// 50개의 더미 데이터 생성 (그물망 구조)

const thoughts = [
  "오늘 새로운 아이디어가 떠올랐다. 혁신적인 것은 아니지만 의미있는 작은 발견이다.",
  "인생에 대한 깊은 성찰을 했다. 무엇이 진정으로 중요한지 다시 생각하게 되었다.",
  "친구와의 대화에서 많은 위로를 받았다. 인간관계의 소중함을 느꼈다.",
  "실패에 대한 두려움이 나를 가로막고 있다. 이 불안을 극복해야 한다.",
  "새로운 프로젝트를 시작했다. 설렘과 걱정이 교차한다.",
  "조용한 아침, 혼자만의 시간이 주는 평온함이 좋다.",
  "복잡한 문제를 해결했다. 끈기가 결실을 맺은 순간이다.",
  "감사하는 마음으로 하루를 시작했다. 작은 것들에 행복을 느낀다.",
  "피로가 쌓였다. 휴식이 필요한 시점이다.",
  "책에서 인상적인 구절을 읽었다. 삶을 바라보는 관점이 달라졌다.",
  "가족과 함께한 시간이 소중했다. 사랑의 힘을 다시 느꼈다.",
  "목표를 향해 한 걸음 더 나아갔다. 꾸준함이 중요하다.",
  "불확실한 미래가 걱정된다. 지금 할 수 있는 것에 집중해야겠다.",
  "자연을 보며 마음의 평화를 얻었다. 단순함의 아름다움.",
  "새로운 기술을 배웠다. 성장의 기쁨을 느낀다.",
  "후회되는 선택을 했다. 다음에는 더 신중해야겠다.",
  "음악이 마음을 치유했다. 예술의 힘은 위대하다.",
  "혼란스러운 생각들을 정리했다. 명확해지니 마음이 가벼워졌다.",
  "누군가에게 도움을 주었다. 베푸는 기쁨을 알게 되었다.",
  "루틴을 깨고 새로운 것을 시도했다. 변화가 필요했다.",
  "깊은 절망감이 들었다. 하지만 이 또한 지나갈 것이다.",
  "작은 성취가 쌓여간다. 매일의 노력이 의미있다.",
  "타인과의 비교를 멈추고 나 자신에게 집중하기로 했다.",
  "예상치 못한 기회가 찾아왔다. 준비된 자만이 잡을 수 있다.",
  "과거의 상처가 떠올랐다. 치유는 시간이 필요하다.",
  "창의적인 영감이 샘솟았다. 표현하고 싶은 욕구가 생겼다.",
  "무기력함이 찾아왔다. 작은 것부터 다시 시작해야겠다.",
  "진정한 친구를 만났다. 소통의 가치를 깨달았다.",
  "실수로부터 배웠다. 실패는 성장의 밑거름이다.",
  "하루의 끝에서 오늘을 되돌아본다. 충분히 잘했다.",
  "새벽 기도로 하루를 시작했다. 평온한 마음이 든다.",
  "복잡한 감정이 교차한다. 정리가 필요하다.",
  "용기내어 첫 발을 내디뎠다. 시작이 반이다.",
  "고요함 속에서 깊은 생각에 잠겼다. 존재의 의미를 고민한다.",
  "사소한 일로 화가 났다. 감정 조절이 필요하다.",
  "꿈을 꿨다. 무의식이 전하는 메시지일까?",
  "긍정적인 변화가 보이기 시작했다. 희망이 생겼다.",
  "혼자만의 여행을 떠났다. 나를 다시 발견하는 시간.",
  "중요한 결정을 앞두고 있다. 신중함이 필요하다.",
  "소소한 행복을 발견했다. 일상 속 기쁨.",
  "강박적인 생각이 들었다. 놓아주는 연습이 필요하다.",
  "새로운 사람을 만났다. 인연의 신비로움.",
  "체력의 한계를 느꼈다. 건강 관리가 시급하다.",
  "통찰력이 생겼다. 문제의 본질이 보인다.",
  "그리움이 밀려왔다. 추억은 아름답다.",
  "자신감이 생겼다. 할 수 있다는 믿음.",
  "혼자 있고 싶다. 내면의 소리가 필요하다.",
  "감동적인 이야기를 들었다. 삶은 역시 아름답다.",
  "완벽주의가 나를 힘들게 한다. 적당함도 필요하다.",
  "오늘 하루도 무사히 마쳤다. 존재만으로도 충분하다.",
];

const keywordPool = [
  ["성장", "배움", "발견"],
  ["관계", "소통", "사랑"],
  ["불안", "두려움", "극복"],
  ["창의성", "영감", "표현"],
  ["평화", "고요", "명상"],
  ["도전", "용기", "시작"],
  ["후회", "반성", "치유"],
  ["행복", "감사", "기쁨"],
  ["피로", "휴식", "회복"],
  ["목표", "성취", "노력"],
  ["자연", "단순함", "아름다움"],
  ["가족", "우정", "연결"],
  ["혼란", "정리", "명확함"],
  ["음악", "예술", "치유"],
  ["변화", "적응", "유연함"],
  ["절망", "희망", "인내"],
  ["직관", "통찰", "이해"],
  ["여행", "탐험", "발견"],
  ["건강", "균형", "에너지"],
  ["완벽", "수용", "자비"],
];

// 키워드 그룹별 중심 좌표 (클러스터링용)
const clusterCenters = {};
keywordPool.forEach((group, index) => {
  const angle = (index / keywordPool.length) * Math.PI * 2;
  const radius = 60;
  clusterCenters[group[0]] = {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    z: (Math.random() - 0.5) * 40,
  };
});

// 5년간 균등 분포 타임스탬프 생성 (2020-2025)
const generateTimestamp = (index, total) => {
  const startDate = new Date('2020-01-01').getTime();
  const endDate = new Date('2025-01-01').getTime();
  const range = endDate - startDate;
  const offset = (range / total) * index + Math.random() * (range / total);
  return new Date(startDate + offset).toISOString();
};

// 키워드 기반 좌표 생성 (클러스터링 + 시간적 분산)
const generateCoords = (keywordGroup, index, total) => {
  const center = clusterCenters[keywordGroup[0]] || { x: 0, y: 0, z: 0 };

  // 시간적 offset (최신일수록 약간 위로)
  const timeOffset = (index / total) * 30 - 15;

  // 클러스터 내 랜덤 분산
  const scatter = 25;

  return {
    x: center.x + (Math.random() - 0.5) * scatter,
    y: center.y + (Math.random() - 0.5) * scatter + timeOffset,
    z: center.z + (Math.random() - 0.5) * scatter,
  };
};

// 키워드 유사도 기반 링크 생성
const generateLinks = (data) => {
  const links = [];

  data.forEach((node, i) => {
    // 1. 시간순 연결 (약한 연결)
    if (i < data.length - 1) {
      links.push({
        source: node.id,
        target: data[i + 1].id,
        type: 'temporal',
        strength: 0.3,
      });
    }

    // 2. 키워드 유사 연결
    data.forEach((otherNode, j) => {
      if (i >= j) return;

      const commonKeywords = node.keywords.filter((k) => otherNode.keywords.includes(k));
      if (commonKeywords.length > 0) {
        links.push({
          source: node.id,
          target: otherNode.id,
          type: 'semantic',
          strength: commonKeywords.length * 0.4,
          commonKeywords,
        });
      }
    });
  });

  return links;
};

// 50개 더미 데이터 생성
export const generateDummyData = () => {
  const data = [];

  for (let i = 0; i < 50; i++) {
    const thoughtIndex = i % thoughts.length;
    const keywordGroupIndex = i % keywordPool.length;
    const keywordGroup = keywordPool[keywordGroupIndex];

    // nuance: -1 ~ 1 (다양한 분포)
    const nuance = Math.sin((i / 50) * Math.PI * 3) * 0.7 + (Math.random() - 0.5) * 0.6;
    const clampedNuance = Math.max(-1, Math.min(1, nuance));

    // depth: 1 ~ 5
    const depth = Math.floor(Math.random() * 5) + 1;

    data.push({
      id: `thought_${String(i + 1).padStart(3, '0')}`,
      text: thoughts[thoughtIndex],
      timestamp: generateTimestamp(i, 50),
      nuance: parseFloat(clampedNuance.toFixed(2)),
      depth,
      keywords: keywordGroup,
      context: `${keywordGroup[0]}에 관한 생각`,
      coords: generateCoords(keywordGroup, i, 50),
    });
  }

  // timestamp 순으로 정렬
  data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return data;
};

// 링크 데이터 생성 (별도 함수)
export const generateLinksForData = (data) => {
  return generateLinks(data);
};

export default generateDummyData;
