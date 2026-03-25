// 키워드 확장 매핑 (유사한 키워드 그룹)
const keywordExpansion = {
  성장: ['성장', '배움', '발견', '발전', '진보', '성숙'],
  배움: ['배움', '성장', '발견', '학습', '지혜', '깨달음'],
  관계: ['관계', '소통', '사랑', '연결', '유대', '인연'],
  사랑: ['사랑', '관계', '소통', '애정', '마음', '감정'],
  불안: ['불안', '두려움', '걱정', '불안감', '초조', '긴장'],
  두려움: ['두려움', '불안', '공포', '걱정', '염려'],
  창의성: ['창의성', '영감', '표현', '상상력', '아이디어', '혁신'],
  영감: ['영감', '창의성', '표현', '직관', '통찰'],
  평화: ['평화', '고요', '명상', '평온', '안정', '침착'],
  고요: ['고요', '평화', '명상', '침묵', '정적'],
  도전: ['도전', '용기', '시작', '모험', '시도', '결단'],
  용기: ['용기', '도전', '시작', '결단', '배짱', '과감'],
  후회: ['후회', '반성', '치유', '아쉬움', '미련', '자책'],
  반성: ['반성', '후회', '치유', '성찰', '돌아봄'],
  행복: ['행복', '감사', '기쁨', '즐거움', '만족', '웃음'],
  감사: ['감사', '행복', '기쁨', '고마움', '은혜'],
  피로: ['피로', '휴식', '회복', '지침', '고단', '피곤'],
  휴식: ['휴식', '피로', '회복', '재충전', '여유'],
  목표: ['목표', '성취', '노력', '비전', '계획', '열정'],
  성취: ['성취', '목표', '노력', '결실', '성공', '완성'],
  자연: ['자연', '단순함', '아름다움', '풍경', '계절', '생명'],
  가족: ['가족', '우정', '연결', '소중함', '유대', '사랑'],
  우정: ['우정', '가족', '연결', '친구', '신뢰', '우정'],
  혼란: ['혼란', '정리', '명확함', '복잡', '갈등', '혼동'],
  정리: ['정리', '혼란', '명확함', '정돈', '분류'],
  음악: ['음악', '예술', '치유', '선율', '노래', '감동'],
  예술: ['예술', '음악', '치유', '창작', '미학', '표현'],
  변화: ['변화', '적응', '유연함', '전환', '변동', '새로움'],
  적응: ['적응', '변화', '유연함', '수용', '조율'],
  절망: ['절망', '희망', '인내', '좌절', '어둠', '고통'],
  희망: ['희망', '절망', '인내', '기대', '꿈', '미래'],
  직관: ['직관', '통찰', '이해', '감각', '느낌', '본능'],
  통찰: ['통찰', '직관', '이해', '깨달음', '관점'],
  여행: ['여행', '탐험', '발견', '떠남', '경험', '새로움'],
  탐험: ['탐험', '여행', '발견', '모험', '탐구'],
  건강: ['건강', '균형', '에너지', '웰빙', '체력', '생명'],
  균형: ['균형', '건강', '에너지', '조화', '중용'],
  완벽: ['완벽', '수용', '자비', '완벽주의', '이상'],
  수용: ['수용', '완벽', '자비', '인정', '이해'],
};

// 키워드 확장 함수
export const expandKeywords = (keyword) => {
  const expanded = new Set([keyword]);
  const lowerKeyword = keyword.toLowerCase();

  // 직접 매핑 확인
  if (keywordExpansion[keyword]) {
    keywordExpansion[keyword].forEach((k) => expanded.add(k));
  }

  // 부분 매칭
  Object.keys(keywordExpansion).forEach((key) => {
    if (key.includes(lowerKeyword) || lowerKeyword.includes(key)) {
      keywordExpansion[key].forEach((k) => expanded.add(k));
    }
  });

  return Array.from(expanded);
};

// Jaccard 유사도 계산 (키워드 배열 기반)
export const calculateJaccardSimilarity = (keywords1, keywords2) => {
  const expanded1 = new Set(keywords1.flatMap(expandKeywords));
  const expanded2 = new Set(keywords2.flatMap(expandKeywords));

  if (expanded1.size === 0 && expanded2.size === 0) return 1;
  if (expanded1.size === 0 || expanded2.size === 0) return 0;

  const intersection = new Set([...expanded1].filter((x) => expanded2.has(x)));
  const union = new Set([...expanded1, ...expanded2]);

  return intersection.size / union.size;
};

// 텍스트 유사도 계산 (단어 기반)
export const calculateTextSimilarity = (text1, text2) => {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const stopWords = new Set([
    '의',
    '가',
    '이',
    '은',
    '는',
    '을',
    '를',
    '에',
    '와',
    '과',
    '도',
    '로',
    '으로',
    '에서',
    '부터',
    '까지',
    '한다',
    '했다',
    '되어',
    '있다',
    '없다',
    '이런',
    '그런',
    '저런',
    '어떤',
    '무엇',
    '이것',
    '그것',
    '저것',
  ]);

  const filtered1 = new Set([...words1].filter((w) => !stopWords.has(w) && w.length > 1));
  const filtered2 = new Set([...words2].filter((w) => !stopWords.has(w) && w.length > 1));

  if (filtered1.size === 0 && filtered2.size === 0) return 0.5;
  if (filtered1.size === 0 || filtered2.size === 0) return 0;

  const intersection = new Set([...filtered1].filter((x) => filtered2.has(x)));
  const union = new Set([...filtered1, ...filtered2]);

  return intersection.size / union.size;
};

// 시간 가중치 계산 (최신일수록 높은 점수)
export const calculateTimeRecency = (timestamp, allTimestamps) => {
  const nodeTime = new Date(timestamp).getTime();
  const now = Date.now();

  // 전체 기간 계산
  const sortedTimes = allTimestamps.map((t) => new Date(t).getTime()).sort((a, b) => a - b);
  const oldestTime = sortedTimes[0];
  const newestTime = sortedTimes[sortedTimes.length - 1];
  const totalSpan = newestTime - oldestTime;

  if (totalSpan === 0) return 0.5;

  // 최신에 가까울수록 1, 오래될수록 0
  const recency = (nodeTime - oldestTime) / totalSpan;
  return recency;
};

// Bridge Score 계산
export const calculateBridgeScore = (newThought, node, allNodes) => {
  // 1. 의미적 유사도 (70%)
  const keywordSimilarity = calculateJaccardSimilarity(newThought.keywords || [], node.keywords);
  const textSimilarity = calculateTextSimilarity(newThought.text || '', node.text);
  const semanticSimilarity = keywordSimilarity * 0.6 + textSimilarity * 0.4;

  // 2. 시간 가중치 (30%)
  const allTimestamps = allNodes.map((n) => n.timestamp);
  const timeRecency = calculateTimeRecency(node.timestamp, allTimestamps);

  // 3. 최종 점수
  const bridgeScore = semanticSimilarity * 0.7 + timeRecency * 0.3;

  return {
    score: bridgeScore,
    semanticSimilarity,
    timeRecency,
  };
};

// 가장 유사한 노드 찾기
export const findMostSimilarNode = (newThought, allNodes) => {
  let bestMatch = null;
  let bestScore = -1;
  let bestDetails = null;

  allNodes.forEach((node) => {
    const result = calculateBridgeScore(newThought, node, allNodes);
    if (result.score > bestScore) {
      bestScore = result.score;
      bestMatch = node;
      bestDetails = result;
    }
  });

  return {
    node: bestMatch,
    score: bestScore,
    details: bestDetails,
  };
};

// 검색용 키워드 매칭 (확장 포함)
export const matchesSearchTerm = (keywords, searchTerm) => {
  if (!searchTerm) return true;

  const expandedSearch = expandKeywords(searchTerm);
  const nodeKeywords = keywords.flatMap(expandKeywords);

  return nodeKeywords.some((k) =>
    expandedSearch.some((s) => k.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(k.toLowerCase()))
  );
};

export default {
  expandKeywords,
  calculateJaccardSimilarity,
  calculateTextSimilarity,
  calculateTimeRecency,
  calculateBridgeScore,
  findMostSimilarNode,
  matchesSearchTerm,
};
