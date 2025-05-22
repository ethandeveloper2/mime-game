// src/components/RegisterForm.tsx
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

const RegisterForm: React.FC = () => {
  type RegisterData = {
    email: string;
    password: string;
    name: string;
  } 
  const { register, handleSubmit } = useForm<RegisterData>();
  const { setUser, setLoading, setError } = useAuthStore();

  const onSubmit = async (data: RegisterData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('회원가입 실패');
      }

      const result = await response.json();
      setUser(result.user);
      document.cookie = `mime-museum-token=${result.access_token}; path=/; max-age=86400; SameSite=Strict`;
      setLoading(false);
      window.location.href = '/'

      // 회원가입 성공 후 처리 (예: 로그인 페이지로 리다이렉트)
    } catch (error) {
      console.error(error);
      setError('회원 가입 실패');
      // 에러 처리 (예: 사용자에게 알림)
    }
  };

  return (
    <FormContainer>
      <form onSubmit={() => {handleSubmit(onSubmit);}}>
        <Input type="text" placeholder="이메일" {...register('email', { required: true })} />
        <Input type="password" placeholder="비밀번호" {...register('password', { required: true })} />
        <Input type="text" placeholder="이름" {...register('name', { required: true })} />
        <Button type="submit">회원가입</Button>
      </form>
    </FormContainer>
  );
};

export default RegisterForm;