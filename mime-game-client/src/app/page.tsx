'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { useGameStore } from '@/store/gameStore';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f5f5f5;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
`;

const Form = styled.form`
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.8rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #2196f3;
  }
`;

const Button = styled.button`
  padding: 1rem;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1976d2;
  }
`;

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const { setCurrentPlayer } = useGameStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      const player = {
        id: Math.random().toString(36).substr(2, 9),
        nickname: nickname.trim(),
        score: 0,
        isHost: false
      };
      setCurrentPlayer(player);
      router.push('/rooms');
    }
  };

  return (
    <Container>
      <Title>밈 게임</Title>
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="닉네임을 입력하세요"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
        <Button type="submit">시작하기</Button>
      </Form>
    </Container>
  );
}
