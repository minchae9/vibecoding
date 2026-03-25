// 역지문 생성 유틸리티
// LLM API 연동 구조 (현재는 시뮬레이션)

// 날짜 포맷팅
const formatDate = (isoString) => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const hour = date.getHours();
  const ampm = hour >= 12 ? '오후' : '오전';
  const hour12 = hour % 12 || 12;

  return `${year}년 ${month}월 ${day}일 ${ampm} ${hour12}시`;
};

// 텍스트 요약 (처음 30자 + ...)
const summarizeText = (text, maxLength = 30) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 키워드에서 주제 추출
const extractMainTheme = (keywords) => {
  if (!keywords || keywords.length === 0) return '어떤 주제';
  return keywords.slice(0, 2).join('과 ');
};

// 역지문 템플릿 (다양성 확보)
const questionTemplates = [
  (pastNode, currentInput) => {
    const pastDate = formatDate(pastNode.timestamp);
    const pastTheme = extractMainTheme(pastNode.keywords);
    const pastSummary = summarizeText(pastNode.text, 40);
    return `당신은 ${pastDate}경, 「${pastTheme}」에 대해 "${pastSummary}"라고 기록했었네요.\n\n그런데 지금은 "${summarizeText(currentInput, 40)}"라는 생각을 하고 계신 것 같아요.\n\n그 사이에 어떤 마음의 변화가 있었나요?`;
  },

  (pastNode, currentInput) => {
    const pastTheme = extractMainTheme(pastNode.keywords);
    return `과거에 「${pastTheme}」와 관련하여 "${summarizeText(pastNode.text, 35)}"라고 쓰셨던 기억이 나네요.\n\n지금 든 생각은 "${summarizeText(currentInput, 35)}"이고요.\n\n두 시점 사이, 당신에게 무슨 일이 있었을까요?`;
  },

  (pastNode, currentInput) => {
    const pastDate = formatDate(pastNode.timestamp);
    const pastNuance = pastNode.nuance > 0.3 ? '긍정적인' : pastNode.nuance < -0.3 ? '부정적인' : '중립적인';
    return `${pastDate}의 당신은 ${pastNuance} 마음으로 "${summarizeText(pastNode.text, 35)}"라고 생각했었군요.\n\n오늘의 당신은 "${summarizeText(currentInput, 35)}"라고 말합니다.\n\n과거의 당신이 지금의 당신에게 묻는다면, 무슨 말을 할까요?`;
  },

  (pastNode, currentInput) => {
    const pastTheme = extractMainTheme(pastNode.keywords);
    return `「${pastTheme}」에 대해 과거에는 이렇게 썼었죠:\n"${summarizeText(pastNode.text, 40)}"\n\n그리고 지금은:\n"${summarizeText(currentInput, 40)}"\n\n이 두 생각을 연결하는 끈은 무엇일까요?`;
  },

  (pastNode, currentInput) => {
    const yearsDiff = Math.abs(new Date().getFullYear() - new Date(pastNode.timestamp).getFullYear());
    const timeContext = yearsDiff > 2 ? `${yearsDiff}년 전` : yearsDiff > 1 ? '1년 이상 전' : '얼마 전';
    return `${timeContext}, 당신은 "${summarizeText(pastNode.text, 30)}"라고 기록했었네요.\n\n지금의 생각: "${summarizeText(currentInput, 30)}"\n\n시간이 흐르면서, 당신의 관점은 어떻게 변했나요?`;
  },
];

// 시뮬레이션 기반 역지문 생성 (LLM 없이)
export const generateReverseQuestion = async (pastNode, currentInput, options = {}) => {
  // 실제 LLM API 호출로 대체 가능
  // 현재는 템플릿 기반 시뮬레이션

  const { delay = 30 } = options;

  // 랜덤하게 템플릿 선택 (다양성)
  const templateIndex = Math.floor(Math.random() * questionTemplates.length);
  const questionText = questionTemplates[templateIndex](pastNode, currentInput);

  // 타이핑 효과를 위한 정보 반환
  return {
    text: questionText,
    delay,
  };
};

// LLM API 연동 구조 (향후 확장용)
export const generateReverseQuestionWithLLM = async (pastNode, currentInput, apiKey) => {
  // TODO: 실제 LLM API 구현
  // 예: Claude API, OpenAI API 등

  const prompt = `
과거의 생각:
- 날짜: ${formatDate(pastNode.timestamp)}
- 키워드: ${pastNode.keywords.join(', ')}
- 뉘앙스: ${pastNode.nuance > 0 ? '긍정적' : pastNode.nuance < 0 ? '부정적' : '중립적'}
- 내용: ${pastNode.text}

현재의 생각:
- 내용: ${currentInput}

위 정보를 바탕으로, 과거와 현재의 대비를 보여주며 심경의 변화를 묻는 통찰력 있는 질문을 한 문단으로 작성해주세요.
한국어로 자연스럽게 작성해주세요.
`;

  // 현재는 시뮬레이션 반환
  return generateReverseQuestion(pastNode, currentInput);
};

export default {
  generateReverseQuestion,
  generateReverseQuestionWithLLM,
};
