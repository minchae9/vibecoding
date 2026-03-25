import { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [value, setValue] = useState('');

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    onSearch(newValue);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className="search-bar">
      <div className="search-icon">
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
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <input
        type="text"
        placeholder="키워드로 검색 (예: 성장, 사랑, 불안...)"
        value={value}
        onChange={handleChange}
      />
      {value && (
        <button className="clear-btn" onClick={handleClear}>
          ×
        </button>
      )}
    </div>
  );
};

export default SearchBar;
