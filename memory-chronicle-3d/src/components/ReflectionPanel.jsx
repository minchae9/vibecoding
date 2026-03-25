import { useState, useEffect, useRef } from 'react';

const ReflectionPanel = ({ question, isVisible, onClose, onAnswerSubmit }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [answer, setAnswer] = useState('');
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef(null);

  // 타이핑 효과
  useEffect(() => {
    if (!question || !isVisible) {
      setDisplayedText('');
      setAnswer('');
      setShowAnswerInput(false);
      indexRef.current = 0;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const text = question.text || '';
    const delay = question.delay || 30;
    const chars = text.split('');

    setDisplayedText('');
    setAnswer('');
    setShowAnswerInput(false);
    indexRef.current = 0;
    setIsTyping(true);

    intervalRef.current = setInterval(() => {
      if (indexRef.current < chars.length) {
        setDisplayedText((prev) => prev + chars[indexRef.current]);
        indexRef.current++;
      } else {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsTyping(false);
        setShowAnswerInput(true);
      }
    }, delay);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [question, isVisible]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answer.trim()) {
      onAnswerSubmit?.(answer.trim());
      setAnswer('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isVisible || !question) return null;

  return (
    <div className="reflection-panel">
      <div className="reflection-header">
        <div className="reflection-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <span className="reflection-title">성찰의 질문</span>
        <button className="reflection-close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="reflection-content">
        <p className="reflection-text">
          {displayedText}
          {isTyping && <span className="cursor">|</span>}
        </p>
      </div>

      {/* 답변 입력 영역 */}
      {showAnswerInput && (
        <form onSubmit={handleSubmit} className="answer-form">
          <div className="answer-label">이 질문에 대한 당신의 생각:</div>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="답변을 입력하면 더 깊은 생각으로 기록됩니다..."
            rows={3}
            autoFocus
          />
          <div className="answer-actions">
            <span className="answer-hint">Enter로 전송</span>
            <button type="submit" disabled={!answer.trim()} className="answer-submit">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              깊이 더하기
            </button>
          </div>
        </form>
      )}

      <div className="reflection-footer">
        <span className="reflection-hint">
          {showAnswerInput ? '당신의 성찰이 생각의 깊이를 더합니다' : '이 질문에 대해 깊이 생각해보세요'}
        </span>
      </div>
    </div>
  );
};

export default ReflectionPanel;
