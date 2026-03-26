import Anthropic from '@anthropic-ai/sdk';

class LLMService {
  constructor() {
    this.client = new Anthropic({
      baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async chat(messages, context = {}) {
    const systemPrompt = this.buildSystemPrompt(context);

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      });

      return response.content[0].text;
    } catch (error) {
      console.error('LLM API Error:', error);
      throw new Error(`LLM API 호출 실패: ${error.message}`);
    }
  }

  buildSystemPrompt(context) {
    let prompt = `당신은 Health Buddy라는 건강 관리 AI 어시스턴트입니다.
사용자의 건강을 챙기고, 건강한 생활 습관을 유지하도록 돕습니다.
친근하고 따뜻한 톤으로 대화하며, 의학적 조언이 필요한 경우 전문의 상담을 권장합니다.`;

    if (context.healthProfile) {
      prompt += `\n\n## 사용자 건강 프로필\n${JSON.stringify(context.healthProfile, null, 2)}`;
    }

    if (context.recentSummaries && context.recentSummaries.length > 0) {
      prompt += `\n\n## 최근 활동 요약\n${context.recentSummaries.join('\n')}`;
    }

    if (context.todayEvents && context.todayEvents.length > 0) {
      prompt += `\n\n## 오늘의 타임라인\n${JSON.stringify(context.todayEvents, null, 2)}`;
    }

    return prompt;
  }

  async extractHealthProfile(pdfText) {
    const prompt = `다음 건강검진 결과 텍스트에서 건강 정보를 추출하여 JSON으로 변환해주세요.

텍스트:
${pdfText}

다음 형식의 JSON으로 응답해주세요:
{
  "basicInfo": { "name": "", "age": 0, "gender": "", "examDate": "" },
  "bodyMeasurements": { "height": 0, "weight": 0, "bmi": 0, "waistCircumference": 0, "bodyFatPercentage": 0 },
  "bloodTest": {
    "hemoglobin": 0, "hematocrit": 0, "wbc": 0, "platelet": 0,
    "ast": 0, "alt": 0, "ggt": 0,
    "creatinine": 0, "bun": 0, "egfr": 0,
    "totalCholesterol": 0, "ldl": 0, "hdl": 0, "triglyceride": 0,
    "fastingGlucose": 0, "hba1c": 0,
    "uricAcid": 0
  },
  "urinalysis": { "protein": "", "glucose": "", "blood": "" },
  "bloodPressure": { "systolic": 0, "diastolic": 0 },
  "assessment": {
    "overallStatus": "",
    "abnormalItems": [],
    "recommendations": []
  }
}

값이 없는 필드는 null로 표시하세요. JSON만 응답하세요.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.content[0].text;
      // JSON 추출
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('JSON 파싱 실패');
    } catch (error) {
      console.error('Profile extraction error:', error);
      throw error;
    }
  }

  async summarizeConversation(messages) {
    const prompt = `다음 대화 내용을 건강 관련 카테고리로 요약해주세요.

대화:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

다음 형식의 JSON으로 응답:
{
  "activity": "활동/운동 관련 요약 (없으면 빈 문자열)",
  "intake": "식사/섭취 관련 요약 (없으면 빈 문자열)",
  "mood": "기분/컨디션 관련 요약 (없으면 빈 문자열)",
  "general": "기타 중요 정보 (없으면 빈 문자열)"
}

JSON만 응답하세요.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { activity: '', intake: '', mood: '', general: '' };
    } catch (error) {
      console.error('Summary error:', error);
      return { activity: '', intake: '', mood: '', general: '' };
    }
  }

  async calculateHealthScore(context) {
    const prompt = `다음 정보를 바탕으로 사용자의 오늘 건강 점수를 0-100 사이로 계산해주세요.

건강 프로필: ${JSON.stringify(context.healthProfile?.assessment || {})}
오늘의 활동: ${JSON.stringify(context.todayEvents)}
최근 대화 요약: ${JSON.stringify(context.recentSummaries)}

점수 기준:
- 수면, 식사, 운동의 규칙성
- 기분 상태
- 건강 프로필과의 일치도

다음 형식으로만 응답:
{
  "score": 75,
  "factors": {
    "sleep": "좋음/보통/나쁨",
    "meal": "규칙적/불규칙",
    "activity": "활발함/보통/부족함",
    "mood": "긍정적/보통/부정적"
  },
  "comment": "한 줄 코멘트"
}`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { score: 50, factors: {}, comment: '' };
    } catch (error) {
      console.error('Health score error:', error);
      return { score: 50, factors: {}, comment: '' };
    }
  }
}

export default new LLMService();
