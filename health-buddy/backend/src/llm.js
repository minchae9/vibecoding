/**
 * Health Profile Schema
 * 건강검진 PDF에서 추출하여 정형화하는 스키마
 */

export const healthProfileSchema = {
  // 기본 정보
  basicInfo: {
    name: { type: 'string', description: '환자명' },
    age: { type: 'number', description: '나이' },
    gender: { type: 'string', enum: ['male', 'female'], description: '성별' },
    examDate: { type: 'string', format: 'date', description: '검진일' }
  },

  // 신체 계측
  bodyMeasurements: {
    height: { type: 'number', unit: 'cm', description: '키' },
    weight: { type: 'number', unit: 'kg', description: '몸무게' },
    bmi: { type: 'number', description: '체질량지수' },
    waistCircumference: { type: 'number', unit: 'cm', description: '허리둘레' },
    bodyFatPercentage: { type: 'number', unit: '%', description: '체지방률' }
  },

  // 혈액 검사
  bloodTest: {
    // 혈액 일반
    hemoglobin: { type: 'number', unit: 'g/dL', normalRange: [12, 16], description: '혈색소' },
    hematocrit: { type: 'number', unit: '%', normalRange: [37, 52], description: '적혈구용적' },
    wbc: { type: 'number', unit: '/μL', normalRange: [4000, 10000], description: '백혈구' },
    platelet: { type: 'number', unit: '/μL', normalRange: [150000, 400000], description: '혈소판' },

    // 간 기능
    ast: { type: 'number', unit: 'IU/L', normalRange: [0, 40], description: 'AST(SGOT)' },
    alt: { type: 'number', unit: 'IU/L', normalRange: [0, 40], description: 'ALT(SGPT)' },
    ggt: { type: 'number', unit: 'IU/L', normalRange: [0, 60], description: '감마-GTP' },

    // 신장 기능
    creatinine: { type: 'number', unit: 'mg/dL', normalRange: [0.7, 1.4], description: '크레아티닌' },
    bun: { type: 'number', unit: 'mg/dL', normalRange: [7, 20], description: '요소질소' },
    egfr: { type: 'number', unit: 'mL/min', normalRange: [90, null], description: 'eGFR' },

    // 지질
    totalCholesterol: { type: 'number', unit: 'mg/dL', normalRange: [0, 200], description: '총콜레스테롤' },
    ldl: { type: 'number', unit: 'mg/dL', normalRange: [0, 100], description: 'LDL콜레스테롤' },
    hdl: { type: 'number', unit: 'mg/dL', normalRange: [40, null], description: 'HDL콜레스테롤' },
    triglyceride: { type: 'number', unit: 'mg/dL', normalRange: [0, 150], description: '중성지방' },

    // 혈당
    fastingGlucose: { type: 'number', unit: 'mg/dL', normalRange: [70, 100], description: '공복혈당' },
    hba1c: { type: 'number', unit: '%', normalRange: [4, 5.6], description: '당화혈색소' },

    // 요산
    uricAcid: { type: 'number', unit: 'mg/dL', normalRange: [3.4, 7.0], description: '요산' }
  },

  // 요검사
  urinalysis: {
    protein: { type: 'string', enum: ['negative', 'trace', '1+', '2+', '3+'], description: '단백' },
    glucose: { type: 'string', enum: ['negative', 'trace', '1+', '2+', '3+'], description: '당' },
    blood: { type: 'string', enum: ['negative', 'trace', '1+', '2+', '3+'], description: '잠혈' }
  },

  // 혈압
  bloodPressure: {
    systolic: { type: 'number', unit: 'mmHg', normalRange: [90, 120], description: '수축기혈압' },
    diastolic: { type: 'number', unit: 'mmHg', normalRange: [60, 80], description: '이완기혈압' }
  },

  // 종합 판정
  assessment: {
    overallStatus: { type: 'string', description: '종합 건강 상태 요약' },
    abnormalItems: { type: 'array', items: 'string', description: '이상 소견 항목들' },
    recommendations: { type: 'array', items: 'string', description: '권장 사항' }
  }
};

/**
 * LLM에게 전달할 프롬프트 생성
 */
export function createExtractionPrompt(pdfText) {
  return `다음은 건강검진 결과 PDF에서 추출한 텍스트입니다. 이를 정형화된 JSON 형태로 변환해주세요.

텍스트:
${pdfText}

요구사항:
1. 제공된 스키마에 맞춰 JSON으로 변환
2. 수치는 숫자로 변환 (단위 제거)
3. 정상 범위와 비교하여 이상 소견 파악
4. 값이 없는 필드는 null로 표시
5. 종합적인 건강 평가와 권장 사항 포함

JSON으로만 응답해주세요.`;
}

/**
 * 대화 요약 프롬프트 생성
 */
export function createSummaryPrompt(messages) {
  return `다음은 사용자의 최근 대화 내용입니다. 이를 '활동', '섭취', '기분' 카테고리로 요약해주세요.

대화 내용:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

요구사항:
1. 각 카테고리별로 1-2문장으로 요약
2. 건강과 관련된 정보만 추출
3. JSON 형식으로 응답:
{
  "activity": "활동 관련 요약",
  "intake": "섭취(식사, 음료) 관련 요약",
  "mood": "기분/상태 관련 요약",
  "general": "기타 중요 정보"
}`;
}

export default healthProfileSchema;
