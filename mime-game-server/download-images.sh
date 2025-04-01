#!/bin/bash

# public/images 디렉토리 생성
mkdir -p public/images

# 테스트용 이미지 다운로드
curl -o public/images/test1.jpg https://picsum.photos/400/300
curl -o public/images/test2.jpg https://picsum.photos/400/300
curl -o public/images/test3.jpg https://picsum.photos/400/300
curl -o public/images/test4.jpg https://picsum.photos/400/300
curl -o public/images/test5.jpg https://picsum.photos/400/300

echo "이미지 다운로드 완료!" 