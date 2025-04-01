import React from 'react';
import styled from '@emotion/styled';

const Card = styled.div`
  width: 100%;
  aspect-ratio: 16/9;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

interface ImageCardProps {
  imageUrl: string;
}

export default function ImageCard({ imageUrl }: ImageCardProps) {
  return (
    <Card>
      <Image src={imageUrl} alt="게임 이미지" />
    </Card>
  );
} 