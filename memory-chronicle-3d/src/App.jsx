import { useState, useCallback, useRef } from 'react';
import Graph3D from './components/Graph3D';
import SearchBar from './components/SearchBar';
import ThoughtInput from './components/ThoughtInput';
import ThoughtInspector from './components/ThoughtInspector';
import ReflectionPanel from './components/ReflectionPanel';
import { generateDummyData } from './data/dummyData';
import { findMostSimilarNode } from './utils/similarityUtils';
import { generateReverseQuestion } from './utils/reverseQuestionGenerator';
import './App.css';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const [bridgeLink, setBridgeLink] = useState(null);
  const [reflectionQuestion, setReflectionQuestion] = useState(null);
  const [showReflection, setShowReflection] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [data, setData] = useState(() => generateDummyData());

  // 현재 연결된 노드 (성찰 답변용)
  const connectedNodeRef = useRef(null);
  const currentInputRef = useRef('');

  // 노드 클릭 핸들러
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    setHighlightedNodeId(null);
    setBridgeLink(null);
  }, []);

  // 인스펙터 닫기
  const handleInspectorClose = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // 배경 클릭으로 선택 해제
  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // 성찰 패널 닫기
  const handleReflectionClose = useCallback(() => {
    setShowReflection(false);
    setReflectionQuestion(null);
    setBridgeLink(null);
    setHighlightedNodeId(null);
    connectedNodeRef.current = null;
    currentInputRef.current = '';
  }, []);

  // 성찰 답변 제출 → 더 깊은 노드 생성
  const handleAnswerSubmit = useCallback(
    (answer) => {
      const connectedNode = connectedNodeRef.current;
      const originalInput = currentInputRef.current;

      if (!connectedNode || !answer.trim()) return;

      // 새 노드 생성 (깊이 +1, 최대 5)
      const newDepth = Math.min(connectedNode.depth + 1, 5);
      const newId = `deepening_${Date.now()}`;

      // 키워드 추출
      const keywordPool = [
        '성장', '배움', '발견', '관계', '소통', '사랑', '불안', '두려움', '극복',
        '창의성', '영감', '표현', '평화', '고요', '명상', '도전', '용기', '시작',
        '후회', '반성', '치유', '행복', '감사', '기쁨', '피로', '휴식', '회복',
        '목표', '성취', '노력', '자연', '단순함', '아름다움', '가족', '우정', '연결',
        '혼란', '정리', '명확함', '음악', '예술', '변화', '적응', '유연함',
        '절망', '희망', '인내', '직관', '통찰', '이해', '여행', '탐험',
        '건강', '균형', '에너지', '완벽', '수용', '자비', '성찰',
      ];

      const newKeywords = [];
      const combinedText = `${originalInput} ${answer}`;
      keywordPool.forEach((keyword) => {
        if (combinedText.includes(keyword)) {
          newKeywords.push(keyword);
        }
      });
      if (newKeywords.length === 0) {
        newKeywords.push('성찰');
      }

      // 뉘앙스 계산 (기존 노드와 답변의 조합)
      const nuanceShift = (answer.includes('긍정') || answer.includes('희망') || answer.includes('감사')) ? 0.2 :
                          (answer.includes('부정') || answer.includes('불안') || answer.includes('두려움')) ? -0.2 : 0.1;
      const newNuance = Math.max(-1, Math.min(1, connectedNode.nuance + nuanceShift));

      // 새 노드 좌표 (연결된 노드 근처)
      const newCoords = {
        x: connectedNode.coords.x + (Math.random() - 0.5) * 20,
        y: connectedNode.coords.y + 15,
        z: connectedNode.coords.z + (Math.random() - 0.5) * 20,
      };

      const newNode = {
        id: newId,
        text: `[성찰] ${answer}`,
        timestamp: new Date().toISOString(),
        nuance: parseFloat(newNuance.toFixed(2)),
        depth: newDepth,
        keywords: newKeywords.slice(0, 3),
        context: `깊이 있는 성찰: ${connectedNode.context}`,
        coords: newCoords,
        parentThought: {
          id: connectedNode.id,
          text: connectedNode.text,
          input: originalInput,
        },
      };

      // 데이터에 새 노드 추가
      setData((prevData) => [...prevData, newNode]);

      // 새 브릿지 링크 (성찰 노드와 연결)
      setBridgeLink({
        source: newId,
        target: connectedNode.id,
        type: 'deepening',
      });

      // 새 노드 선택
      setSelectedNode(newNode);
      setHighlightedNodeId(newId);

      // 패널 닫기
      setShowReflection(false);
      setReflectionQuestion(null);
      connectedNodeRef.current = null;
      currentInputRef.current = '';
    },
    []
  );

  // 새로운 생각 입력 처리
  const handleThoughtSubmit = useCallback(
    async (inputText) => {
      setIsProcessing(true);

      // 입력에서 키워드 추출
      const inputKeywords = [];
      const keywordPool = [
        '성장', '배움', '발견', '관계', '소통', '사랑', '불안', '두려움', '극복',
        '창의성', '영감', '표현', '평화', '고요', '명상', '도전', '용기', '시작',
        '후회', '반성', '치유', '행복', '감사', '기쁨', '피로', '휴식', '회복',
        '목표', '성취', '노력', '자연', '단순함', '아름다움', '가족', '우정', '연결',
        '혼란', '정리', '명확함', '음악', '예술', '변화', '적응', '유연함',
        '절망', '희망', '인내', '직관', '통찰', '이해', '여행', '탐험',
        '건강', '균형', '에너지', '완벽', '수용', '자비',
      ];

      keywordPool.forEach((keyword) => {
        if (inputText.includes(keyword)) {
          inputKeywords.push(keyword);
        }
      });

      if (inputKeywords.length === 0) {
        inputKeywords.push('성찰');
      }

      const newThought = {
        text: inputText,
        keywords: inputKeywords.slice(0, 3),
      };

      // 가장 유사한 노드 찾기
      const result = findMostSimilarNode(newThought, data);

      if (result.node && result.score > 0.1) {
        // 연결된 노드 저장 (답변용)
        connectedNodeRef.current = result.node;
        currentInputRef.current = inputText;

        // 하이라이트 노드 설정
        setHighlightedNodeId(result.node.id);
        setSelectedNode(result.node);

        // 브릿지 링크는 답변 후 생성 (새 노드가 생긴 후)
        setBridgeLink(null);

        // 역지문 생성
        const question = await generateReverseQuestion(result.node, inputText);
        setReflectionQuestion(question);
        setShowReflection(true);
      } else {
        alert('연결할 수 있는 과거의 생각을 찾지 못했습니다. 다른 내용으로 시도해보세요.');
      }

      setIsProcessing(false);
    },
    [data]
  );

  return (
    <div className="app">
      <header className="header">
        <h1>Memory Chronicle 3D</h1>
        <p>3차원 자아 연대기 - 나의 생각을 탐험하세요</p>
        <SearchBar onSearch={setSearchTerm} />
      </header>

      <main className="main">
        <Graph3D
          data={data}
          searchTerm={searchTerm}
          selectedNode={selectedNode}
          onNodeClick={handleNodeClick}
          highlightedNodeId={highlightedNodeId}
          bridgeLink={bridgeLink}
        />
      </main>

      {/* 생각 인스펙터 */}
      {selectedNode && (
        <ThoughtInspector
          node={selectedNode}
          onClose={handleInspectorClose}
          onBackgroundClick={handleBackgroundClick}
        />
      )}

      {/* 성찰 패널 */}
      <ReflectionPanel
        question={reflectionQuestion}
        isVisible={showReflection}
        onClose={handleReflectionClose}
        onAnswerSubmit={handleAnswerSubmit}
      />

      {/* 생각 입력창 */}
      <ThoughtInput onSubmit={handleThoughtSubmit} isProcessing={isProcessing} />

      <footer className="footer">
        <div className="legend">
          <div className="legend-item">
            <span className="color-box" style={{ background: 'rgb(255, 45, 45)' }}></span>
            <span>매우 부정 (-1)</span>
          </div>
          <div className="legend-item">
            <span className="color-box" style={{ background: 'rgb(127, 255, 212)' }}></span>
            <span>중립 (0)</span>
          </div>
          <div className="legend-item">
            <span className="color-box" style={{ background: 'rgb(0, 191, 255)' }}></span>
            <span>매우 긍정 (+1)</span>
          </div>
        </div>
        <p className="hint">
          마우스로 드래그하여 회전 | 스크롤로 확대/축소 | 노드 클릭으로 상세 보기 | 하단에 생각을 입력하여 과거와
          연결
        </p>
      </footer>
    </div>
  );
}

export default App;
