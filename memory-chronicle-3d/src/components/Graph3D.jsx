import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { nuanceToColorWithOpacity, nuanceToColor } from '../utils/colorUtils';
import { matchesSearchTerm } from '../utils/similarityUtils';
import { generateLinksForData } from '../data/dummyData';

const Graph3D = ({ data, searchTerm, selectedNode, onNodeClick, highlightedNodeId, bridgeLink }) => {
  const graphRef = useRef();
  const [hoverNode, setHoverNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // 윈도우 리사이즈
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 노드 선택 시 카메라 이동
  useEffect(() => {
    if (selectedNode && graphRef.current) {
      const { x, y, z } = selectedNode.coords;

      // 부드러운 카메라 이동
      graphRef.current.cameraPosition(
        { x: x + 40, y: y + 40, z: z + 80 },
        { x, y, z },
        2000
      );
    }
  }, [selectedNode]);

  // 검색어로 노드 필터링 (확장 매칭)
  const isNodeHighlighted = useCallback(
    (node) => {
      if (!searchTerm) return true;
      return matchesSearchTerm(node.keywords, searchTerm);
    },
    [searchTerm]
  );

  // 노드 색상
  const getNodeColor = useCallback(
    (node) => {
      const isHighlighted = isNodeHighlighted(node);
      const isSelected = selectedNode?.id === node.id;
      const isHighlightedBridge = highlightedNodeId === node.id;

      let opacity = isHighlighted ? 1 : 0.1;

      if (isSelected || isHighlightedBridge) {
        return nuanceToColor(node.nuance); // 완전 불투명
      }

      return nuanceToColorWithOpacity(node.nuance, opacity);
    },
    [isNodeHighlighted, selectedNode, highlightedNodeId]
  );

  // 노드 크기 (depth 기반 + 선택 시 확대)
  const getNodeSize = useCallback(
    (node) => {
      const baseSize = node.depth * 1.5 + 2;
      const isSelected = selectedNode?.id === node.id;
      const isHighlighted = highlightedNodeId === node.id;

      if (isSelected || isHighlighted) {
        return baseSize * 1.5;
      }
      return baseSize;
    },
    [selectedNode, highlightedNodeId]
  );

  // 링크 데이터 생성 (그물망 구조)
  const graphData = useMemo(() => {
    const baseLinks = generateLinksForData(data);
    const allLinks = [...baseLinks];

    // Bridge Link 추가
    if (bridgeLink) {
      allLinks.push({
        source: bridgeLink.source,
        target: bridgeLink.target,
        type: 'bridge',
        strength: 1,
      });
    }

    return {
      nodes: data,
      links: allLinks,
    };
  }, [data, bridgeLink]);

  // 링크 색상
  const getLinkColor = useCallback(
    (link) => {
      if (link.type === 'bridge') {
        return 'rgba(0, 255, 255, 0.8)';
      }
      if (link.type === 'semantic') {
        return `rgba(150, 200, 255, ${link.strength * 0.4})`;
      }
      return 'rgba(100, 150, 200, 0.15)';
    },
    []
  );

  // 링크 두께
  const getLinkWidth = useCallback((link) => {
    if (link.type === 'bridge') {
      return 3;
    }
    if (link.type === 'semantic') {
      return link.strength * 2;
    }
    return 0.5;
  }, []);

  // 링크 투명도
  const getLinkOpacity = useCallback((link) => {
    if (link.type === 'bridge') {
      return 1;
    }
    if (link.type === 'semantic') {
      return link.strength * 0.5;
    }
    return 0.2;
  }, []);

  // 노드 클릭 핸들러
  const handleNodeClick = useCallback(
    (node) => {
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  // 노드 호버 핸들러
  const handleNodeHover = useCallback((node) => {
    setHoverNode(node);
    document.body.style.cursor = node ? 'pointer' : 'default';
  }, []);

  // 마우스 이동 핸들러 (툴팁 위치)
  useEffect(() => {
    const handleMouseMove = (e) => {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="graph-container">
      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeColor={getNodeColor}
        nodeVal={getNodeSize}
        nodeOpacity={1}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkOpacity={getLinkOpacity}
        backgroundColor="#0a0a0f"
        enableNodeDrag={false}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        nodeLabel={() => ''}
        linkDirectionalParticles={bridgeLink ? 2 : 0}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={() => 'rgba(0, 255, 255, 0.8)'}
        linkDirectionalParticleSpeed={0.005}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        warmupTicks={100}
        cooldownTicks={100}
      />

      {/* 커스텀 툴팁 */}
      {hoverNode && hoverNode.id !== selectedNode?.id && (
        <div
          className="tooltip"
          style={{
            left: tooltipPos.x + 15,
            top: tooltipPos.y + 15,
          }}
        >
          <div className="tooltip-text">{hoverNode.text}</div>
          <div className="tooltip-meta">
            <span className="tooltip-nuance">뉘앙스: {hoverNode.nuance.toFixed(2)}</span>
            <span className="tooltip-depth">깊이: {hoverNode.depth}</span>
            <span className="tooltip-keywords">키워드: {hoverNode.keywords.join(', ')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Graph3D;
