import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_API_URL?: string;
    }
  }
}

// Get the API URL from environment variables
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  gap: 2rem;
`;

const PuzzleBox = styled.div`
  background-color: #2a2a2a;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 800px;
`;

const Title = styled.h2`
  color: white;
  text-align: center;
`;

const PuzzleGridContainer = styled.div`
  position: relative;
  width: 400px;
  height: 400px;
  margin-bottom: 2rem;
  margin-left: auto;
  margin-right: auto;
`;

const ConnectionsOverlay = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const Square = styled.rect`
  fill: none;
  stroke: white;
  stroke-width: 2;
`;

const LetterPosition = styled.div`
  position: absolute;
  z-index: 2;
`;

const SideContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

interface StyledProps {
  highlightColor?: string;
}

const Letter = styled.div<StyledProps>`
  background-color: ${(props: StyledProps) => props.highlightColor || '#FF5A57'};
  color: white;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-size: 1.6rem;
  font-weight: bold;
  transition: transform 0.2s ease;
  min-width: 3.2rem;
  height: 3.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${(props: StyledProps) => props.highlightColor ? `0 0 10px ${props.highlightColor}` : 'none'};
`;

const SolutionsContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  width: 100%;
`;

const SolutionSection = styled.div`
  background-color: #333;
  padding: 1rem;
  border-radius: 5px;
  margin-top: 1rem;
  flex: 1;
  min-width: 0;
`;

const SolutionTitle = styled.h3`
  color: white;
  margin-bottom: 1rem;
`;

const SolutionList = styled.ul`
  list-style: none;
  padding: 0;
  color: white;
`;

const SolutionItem = styled.li`
  padding: 0.5rem;
  border-bottom: 1px solid #444;
  
  &:last-child {
    border-bottom: none;
  }
`;

// Update the AnimatedPath styled component to reverse the animation
const AnimatedPath = styled.path`
  stroke-dasharray: 5, 5;
  animation: dashOffset 1.5s linear infinite;
  
  @keyframes dashOffset {
    from {
      stroke-dashoffset: 20; /* Start from 20 instead of 0 */
    }
    to {
      stroke-dashoffset: 0; /* End at 0 instead of 20 */
    }
  }
`;

// Add a styled span for the first letter highlight with dynamic color
const HighlightedLetter = styled.span<{ color: string }>`
  color: ${props => props.color};
  font-weight: bold;
  font-size: 1.2em;
`;

// Define the color array at the component level so it can be used in multiple places
const wordColors = ['#faa6a4', '#64C9CF', '#9D65C9', '#5CDB95', '#FFD166'];

interface PuzzleData {
  square: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  nyt_solution: string[];
  lotta_solution: string[];
  error: string | null;
}

// Update the SwapIcon to be larger and without margin
const SwapIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M7 16l-4-4 4-4" />
    <path d="M17 8l4 4-4 4" />
    <path d="M3 12h18" />
  </svg>
);

// Update the ToggleButton to be more compact and square
const ToggleButton = styled.button`
  background-color: #2a2a2a;
  color: white;
  border: 2px solid white;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  
  &:hover {
    background-color: #3D3D3D;
    border-color: white;
  }
`;

const PuzzleDisplay: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingRetries, setLoadingRetries] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Loading puzzle...");
  const [puzzleData, setPuzzleData] = useState<PuzzleData>({
    square: {
      top: '',
      right: '',
      bottom: '',
      left: ''
    },
    nyt_solution: [],
    lotta_solution: [],
    error: null
  });
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [letterPositions, setLetterPositions] = useState<{[key: string]: {x: number, y: number}}>({});
  const [showNYTSolution, setShowNYTSolution] = useState(false);

  // Function to handle automatic retrying
  const retryFetchWithDelay = (delay = 2000, maxRetries = 20) => {
    if (loadingRetries >= maxRetries) {
      setError("Timed out waiting for data. Please refresh the page.");
      setIsLoading(false);
      return;
    }

    setLoadingRetries(prev => prev + 1);
    setLoadingMessage(`Loading puzzle... (Attempt ${loadingRetries + 1}/${maxRetries})`);
    
    setTimeout(() => {
      console.log(`Retrying data fetch (attempt ${loadingRetries + 1})`);
      fetchPuzzleData();
    }, delay);
  };

  const fetchPuzzleData = async () => {
    try {
      setIsLoading(true);
      console.log('Attempting to fetch from:', `${API_URL}/api/puzzle`);
      
      const response = await fetch(`${API_URL}/api/puzzle`);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.error) {
        console.error('API returned error:', data.error);
        setError(data.error);
        return;
      }

      if (!data.square || !data.nyt_solution || !data.lotta_solution) {
        console.error('Invalid data structure received:', data);
        setError('Received invalid data structure from server');
        return;
      }
      
      console.log('Setting puzzle data:', data);
      setPuzzleData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Detailed fetch error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        API_URL,
        env: process.env
      });
      setError('Failed to fetch puzzle data. Please try again later.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPuzzleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setContainerSize({ width, height });
    }
  }, [puzzleData]);

  const calculateLetterPositions = () => {
    const positions: {[key: string]: {x: number, y: number}} = {};
    const padding = 45;
    const width = containerSize.width - 2 * padding;
    const height = containerSize.height - 2 * padding;
    
    if (puzzleData.square.top) {
      const topLetters = puzzleData.square.top.split('');
      const letterWidth = width / topLetters.length;
      topLetters.forEach((letter, index) => {
        positions[`top-${index}`] = {
          x: padding + letterWidth * index + letterWidth / 2,
          y: padding
        };
      });
    }
    
    if (puzzleData.square.right) {
      const rightLetters = puzzleData.square.right.split('');
      const letterHeight = height / rightLetters.length;
      rightLetters.forEach((letter, index) => {
        positions[`right-${index}`] = {
          x: width + padding,
          y: padding + letterHeight * index + letterHeight / 2
        };
      });
    }
    
    if (puzzleData.square.bottom) {
      const bottomLetters = puzzleData.square.bottom.split('');
      const letterWidth = width / bottomLetters.length;
      bottomLetters.forEach((letter, index) => {
        positions[`bottom-${index}`] = {
          x: padding + letterWidth * index + letterWidth / 2,
          y: height + padding
        };
      });
    }
    
    if (puzzleData.square.left) {
      const leftLetters = puzzleData.square.left.split('');
      const letterHeight = height / leftLetters.length;
      leftLetters.forEach((letter, index) => {
        positions[`left-${index}`] = {
          x: padding,
          y: padding + letterHeight * index + letterHeight / 2
        };
      });
    }
    
    setLetterPositions(positions);
  };
  
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      calculateLetterPositions();
    }
  }, [containerSize, puzzleData]);

  const generateConnections = () => {
    const solution = showNYTSolution ? puzzleData.nyt_solution : puzzleData.lotta_solution;
    
    if (!puzzleData || !solution || !solution.length) {
      return null;
    }
    
    const paths = [];
    
    for (let wordIndex = 0; wordIndex < solution.length; wordIndex++) {
      const word = solution[wordIndex];
      const color = wordColors[wordIndex % wordColors.length];
      
      for (let i = 0; i < word.length - 1; i++) {
        const startLetter = word[i];
        const endLetter = word[i + 1];
        
        const startPos = findLetterPosition(startLetter);
        const endPos = findLetterPosition(endLetter);
        
        if (startPos && endPos) {
          paths.push(
            <AnimatedPath 
              key={`path-${wordIndex}-${i}`}
              d={`M ${startPos.x} ${startPos.y} L ${endPos.x} ${endPos.y}`}
              stroke={color}
              strokeWidth="2"
              strokeOpacity="0.6"
              fill="none"
            />
          );
        }
      }
    }
    
    return paths;
  };
  
  const findLetterPosition = (letter: string) => {
    const sides = ['top', 'right', 'bottom', 'left'];
    
    for (const side of sides) {
      const letters = puzzleData.square[side as keyof typeof puzzleData.square].split('');
      const index = letters.findIndex(l => l.toUpperCase() === letter.toUpperCase());
      
      if (index !== -1) {
        return letterPositions[`${side}-${index}`];
      }
    }
    
    return null;
  };

  const getHighlightColor = (letter: string) => {
    const solution = showNYTSolution ? puzzleData.nyt_solution : puzzleData.lotta_solution;
    
    if (!solution) return null;
    
    for (let i = 0; i < solution.length; i++) {
      const word = solution[i];
      if (word.charAt(0).toUpperCase() === letter.toUpperCase()) {
        return wordColors[i % wordColors.length];
      }
    }
    
    return null;
  };

  const TitleContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  `;

  if (isLoading) {
    return <Container>{loadingMessage}</Container>;
  }

  if (error || !puzzleData) {
    return <Container>Error: {error || 'Failed to load puzzle data'}</Container>;
  }

  return (
    <Container>
      <PuzzleBox>
        <TitleContainer>
          <Title>Today's Puzzle</Title>
          <ToggleButton 
            onClick={() => setShowNYTSolution(!showNYTSolution)}
            title={showNYTSolution ? "Show LottaWords Solution" : "Show NYT Solution"}
          >
            <SwapIcon />
          </ToggleButton>
        </TitleContainer>
        
        <PuzzleGridContainer ref={containerRef}>
          {containerSize.width > 0 && (
            <ConnectionsOverlay>
              <Square 
                x={45} 
                y={45} 
                width={containerSize.width - 90} 
                height={containerSize.height - 90} 
              />
              {generateConnections()}
            </ConnectionsOverlay>
          )}
          
          {/* Top side */}
          {puzzleData?.square?.top && puzzleData.square.top.split('').map((letter, index) => (
            <LetterPosition 
              key={`top-${index}`}
              style={{
                top: letterPositions[`top-${index}`]?.y - 25 || 0,
                left: letterPositions[`top-${index}`]?.x - 25 || 0,
              }}
            >
              <Letter highlightColor={getHighlightColor(letter) || undefined}>{letter}</Letter>
            </LetterPosition>
          ))}
          
          {/* Right side */}
          {puzzleData?.square?.right && puzzleData.square.right.split('').map((letter, index) => (
            <LetterPosition 
              key={`right-${index}`}
              style={{
                top: letterPositions[`right-${index}`]?.y - 20 || 0,
                left: letterPositions[`right-${index}`]?.x - 20 || 0,
              }}
            >
              <Letter highlightColor={getHighlightColor(letter) || undefined}>{letter}</Letter>
            </LetterPosition>
          ))}
          
          {/* Bottom side */}
          {puzzleData?.square?.bottom && puzzleData.square.bottom.split('').map((letter, index) => (
            <LetterPosition 
              key={`bottom-${index}`}
              style={{
                top: letterPositions[`bottom-${index}`]?.y - 20 || 0,
                left: letterPositions[`bottom-${index}`]?.x - 20 || 0,
              }}
            >
              <Letter highlightColor={getHighlightColor(letter) || undefined}>{letter}</Letter>
            </LetterPosition>
          ))}
          
          {/* Left side */}
          {puzzleData?.square?.left && puzzleData.square.left.split('').map((letter, index) => (
            <LetterPosition 
              key={`left-${index}`}
              style={{
                top: letterPositions[`left-${index}`]?.y - 20 || 0,
                left: letterPositions[`left-${index}`]?.x - 20 || 0,
              }}
            >
              <Letter highlightColor={getHighlightColor(letter) || undefined}>{letter}</Letter>
            </LetterPosition>
          ))}
        </PuzzleGridContainer>

        <SolutionsContainer>
          <SolutionSection>
            <SolutionTitle>LottaWords Solution</SolutionTitle>
            <SolutionList>
              {puzzleData.lotta_solution.map((solution: string, index: number) => (
                <SolutionItem key={`lotta-${index}`}>
                  <HighlightedLetter color={wordColors[index % wordColors.length]}>
                    {solution.charAt(0)}
                  </HighlightedLetter>
                  {solution.substring(1)}
                </SolutionItem>
              ))}
            </SolutionList>
          </SolutionSection>

          <SolutionSection>
            <SolutionTitle>NYT Solution</SolutionTitle>
            <SolutionList>
              {puzzleData.nyt_solution.map((solution: string, index: number) => (
                <SolutionItem key={`nyt-${index}`}>
                  <HighlightedLetter color={wordColors[index % wordColors.length]}>
                    {solution.charAt(0)}
                  </HighlightedLetter>
                  {solution.substring(1)}
                </SolutionItem>
              ))}
            </SolutionList>
          </SolutionSection>
        </SolutionsContainer>
      </PuzzleBox>
    </Container>
  );
};

export default PuzzleDisplay;