import { useEffect, useRef } from 'react';
import { nuanceToColor } from '../utils/colorUtils';

const ThoughtInspector = ({ node, onClose, onBackgroundClick }) => {
  const panelRef = useRef(null);

  // 타임스탬프 포맷팅
  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    const hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');
    const ampm = hour >= 12 ? '오후' : '오전';
    const hour12 = hour % 12 || 12;

    return `${year}년 ${month}월 ${day}일 (${weekday}) ${ampm} ${hour12}:${minute}`;
  };

  // 뉘앙스 라벨
  const getNuanceLabel = (nuance) => {
    if (nuance >= 0.6) return '매우 긍정';
    if (nuance >= 0.2) return '긍정';
    if (nuance >= -0.2) return '중립';
    if (nuance >= -0.6) return '부정';
    return '매우 부정';
  };

  // 깊이 라벨
  const getDepthLabel = (depth) => {
    const labels = ['', '가볍게 스침', '일상적 생각', '어느 정도 깊이', '심도 있는 고민', '깊은 성찰'];
    return labels[depth] || '';
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onBackgroundClick?.();
      }
    };

    // 약간의 지연 후 이벤트 등록 (즉시 닫히는 것 방지)
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onBackgroundClick]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!node) return null;

  return (
    <div className="thought-inspector" ref={panelRef}>
      <div className="inspector-header">
        <div className="inspector-time">{formatTimestamp(node.timestamp)}</div>
        <button className="inspector-close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="inspector-keywords">
        {node.keywords.map((kw, i) => (
          <span key={i} className="hashtag">
            #{kw}
          </span>
        ))}
      </div>

      <div className="inspector-text">{node.text}</div>

      <div className="inspector-metrics">
        <div className="metric">
          <div className="metric-label">
            <span>뉘앙스</span>
            <span className="metric-value">{getNuanceLabel(node.nuance)}</span>
          </div>
          <div className="metric-bar">
            <div
              className="metric-fill nuance"
              style={{
                width: `${((node.nuance + 1) / 2) * 100}%`,
                background: nuanceToColor(node.nuance),
              }}
            />
            <div className="metric-indicator" style={{ left: `${((node.nuance + 1) / 2) * 100}%` }} />
          </div>
          <div className="metric-scale">
            <span>부정</span>
            <span>중립</span>
            <span>긍정</span>
          </div>
        </div>

        <div className="metric">
          <div className="metric-label">
            <span>깊이</span>
            <span className="metric-value">{getDepthLabel(node.depth)}</span>
          </div>
          <div className="metric-bar">
            <div
              className="metric-fill depth"
              style={{
                width: `${(node.depth / 5) * 100}%`,
              }}
            />
          </div>
          <div className="metric-scale depth-scale">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={node.depth >= n ? 'active' : ''}>
                ●
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="inspector-context">
        <span className="context-label">요약</span>
        <span className="context-text">{node.context}</span>
      </div>

      {/* 부모 생각 (깊이진 경우) */}
      {node.parentThought && (
        <div className="inspector-parent">
          <div className="parent-label">연결된 원래 생각</div>
          <div className="parent-text">{node.parentThought.text}</div>
          <div className="parent-input">
            <strong>당시 입력:</strong> {node.parentThought.input}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThoughtInspector;
