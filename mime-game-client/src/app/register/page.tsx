'use client';

import RegisterForm from '@/components/RegisterForm';
import React from 'react';
import styled from '@emotion/styled';
import { useRouter } from 'next/navigation';

const Container = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background-color: #f9fafb;
  text-align: center;
`;

const Link = styled.a`
  display: block;
  margin-top: 1rem;
  color: #374151;
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    color: #1f2937;
  }
`;

const RegisterPage: React.FC = () => {
  const router = useRouter();

  return (
    <Container>
      <h1>회원가입</h1>
      <RegisterForm />
      <Link onClick={() => router.push('/login')}>로그인 하러 가기</Link>
    </Container>
  );
};

export default RegisterPage;
