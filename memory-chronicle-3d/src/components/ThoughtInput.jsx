import { useState, useRef } from 'react';

const ThoughtInput = ({ onSubmit, isProcessing }) => {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !isProcessing) {
      onSubmit(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="thought-input-container">
      <form onSubmit={handleSubmit} className="thought-input-form">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="지금 든 생각을 적어보세요... (Enter로 전송)"
            disabled={isProcessing}
            rows={2}
          />
          <button type="submit" disabled={!text.trim() || isProcessing} className="submit-btn">
            {isProcessing ? (
              <span className="loading-spinner"></span>
            ) : (
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
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
        </div>
        <div className="input-hint">과거의 생각과 연결하여 통찰을 얻어보세요</div>
      </form>
    </div>
  );
};

export default ThoughtInput;
