import React, { useState } from 'react';
import styled from 'styled-components';

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #1a1a1a;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  
`;

const NavLinks = styled.div<{ isOpen: boolean }>`
  display: flex;
  gap: 2rem;

  @media (max-width: 768px) {
    display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
    flex-direction: column;
    position: absolute;
    top: 70px;
    left: 0;
    right: 0;
    background-color: #1a1a1a;
    padding: 1rem;
    gap: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }
`;

const NavLink = styled.a`
  color: white;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.2s ease;
  
  &:hover {
    color: #ff5a57;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 0;
    width: 100%;
    text-align: center;
  }
`;

const HamburgerButton = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: white;

  @media (max-width: 768px) {
    display: block;
  }
`;

const HamburgerIcon = styled.div<{ isOpen: boolean }>`
  width: 24px;
  height: 2px;
  background: ${({ isOpen }) => (isOpen ? 'transparent' : 'white')};
  position: relative;
  transition: all 0.3s ease;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 2px;
    background: white;
    transition: all 0.3s ease;
  }

  &::before {
    transform: ${({ isOpen }) =>
      isOpen ? 'rotate(45deg)' : 'translateY(-8px)'};
  }

  &::after {
    transform: ${({ isOpen }) =>
      isOpen ? 'rotate(-45deg)' : 'translateY(8px)'};
  }
`;

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Nav>
      <Logo>LottaWords</Logo>
      <HamburgerButton onClick={() => setIsOpen(!isOpen)}>
        <HamburgerIcon isOpen={isOpen} />
      </HamburgerButton>
      <NavLinks isOpen={isOpen}>
        <NavLink 
          href="https://www.nytimes.com/puzzles/letter-boxed" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          NYT Letter Boxed
        </NavLink>
        <NavLink 
          href="https://github.com/bauRoccella/LottaWords" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          GitHub Repo
        </NavLink>
        <NavLink 
          href="https://www.linkedin.com/in/bautistaroccella/" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          LinkedIn
        </NavLink>
      </NavLinks>
    </Nav>
  );
};

export default Navbar;
