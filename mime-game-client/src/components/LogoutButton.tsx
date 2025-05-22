'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: #fef2f2;
  color: #dc2626;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #fee2e2;
  }
`;

const Icon = styled.svg`
  width: 1.25rem;
  height: 1.25rem;
`;

export default function LogoutButton() {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <Button onClick={handleLogout}>
      <Icon
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </Icon>
      로그아웃
    </Button>
  );
} 