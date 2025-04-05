'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import LogoutButton from './LogoutButton';
import styled from '@emotion/styled';
import { useEffect } from 'react';

const Nav = styled.nav`
  background-color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
`;

const NavContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
  @media (min-width: 640px) {
    padding: 0 1.5rem;
  }
  @media (min-width: 1024px) {
    padding: 0 2rem;
  }
`;

const NavContent = styled.div`
  display: flex;
  justify-content: space-between;
  height: 4rem;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
`;

const LogoText = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const NavLink = styled(Link)`
  color: #4b5563;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  &:hover {
    color: #111827;
  }
`;

export default function Navbar() {
  const { isAuthenticated, initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return null; // 또는 로딩 스피너
  }

  return (
    <Nav>
      <NavContainer>
        <NavContent>
          <Logo href="/">
            <LogoText>Meme Museum</LogoText>
          </Logo>
          
          <NavLinks>
            {isAuthenticated ? (
              <>
                <NavLink href="/memes">밈 목록</NavLink>
                <NavLink href="/memes/new">밈 등록</NavLink>
                <LogoutButton />
              </>
            ) : (
              <NavLink href="/login">로그인</NavLink>
            )}
          </NavLinks>
        </NavContent>
      </NavContainer>
    </Nav>
  );
} 