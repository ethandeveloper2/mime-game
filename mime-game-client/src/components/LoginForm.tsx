// src/components/LoginForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import styled from '@emotion/styled';
import { useAuthStore } from '@/store/authStore';

const FormContainer = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background-color: #f9fafb;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  margin: 0.5rem 0;
  border: 1px solid #d1d5db;
  border-radius: 4px;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.5rem;
  background-color: #374151;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #1f2937;
  }
`;

const LoginForm: React.FC = () => {
  const { register, handleSubmit } = useForm<LoginData>();
  const { setUser, setLoading, setError } = useAuthStore();

  type LoginData = {
    email: string;
    password: string;
  }

  const onSubmit = async (data: LoginData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('로그인 실패');
      }

      const result = await response.json();
      setUser(result.user);
      document.cookie = `mime-museum-token=${result.access_token}; path=/; max-age=86400; SameSite=Strict`;
      setLoading(false);
      window.location.href = '/'
      // 로그인 성공 후 처리 (예: 토큰 저장, 리다이렉트 등)
    } catch (error) {
      console.error(error);
      setError('로그인 실패');
    }
  };

  return (
    <FormContainer>
      <form onSubmit={() => {handleSubmit(onSubmit);}}>
        <Input type="text" placeholder="이메일" {...register('email', { required: true })} />
        <Input type="password" placeholder="비밀번호" {...register('password', { required: true })} />
        <Button type="submit">로그인</Button>
      </form>
    </FormContainer>
  );
};

export default LoginForm;