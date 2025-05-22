#!/bin/bash

# 에러 발생 시 스크립트 중단
set -e

# 서버/클라이언트 빌드 파일이 복사된 위치로 이동
cd /home/ubuntu/mime-game-deploy

# (선택) 의존성 설치 (필요시)
# cd mime-game-server
# npm ci --only=production

# pm2로 서버 재시작 (my-app-1, my-app-2는 pm2에서 관리하는 이름)
pm2 reload my-app-1 || pm2 start dist/main.js --name my-app-1 --env PORT=3000
pm2 reload my-app-2 || pm2 start dist/main.js --name my-app-2 --env PORT=3001

echo "배포 완료!"