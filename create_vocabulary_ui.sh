#!/bin/bash

# vocabulary 프로젝트 전용 웹 UI 생성
# 기존 start2 프론트엔드를 vocabulary용으로 복사

echo "🎯 vocabulary 프로젝트 전용 웹 UI 생성"
echo "======================================"

VOCAB_DIR="/users/sinclair/projects/vocabulary"
START2_FRONTEND="/users/sinclair/projects/start2/frontend"

# 1. frontend 폴더가 없으면 생성
if [ ! -d "${VOCAB_DIR}/frontend" ]; then
    echo "📁 frontend 폴더 생성 중..."
    cp -r "${START2_FRONTEND}" "${VOCAB_DIR}/frontend"
    echo "✅ frontend 폴더 생성 완료"
else
    echo "⚠️ frontend 폴더가 이미 존재합니다."
fi

# 2. package.json에서 포트 변경 (5174 → 5175)
echo "🔧 포트 설정 변경 중... (5174 → 5175)"
sed -i '' 's/5174/5175/g' "${VOCAB_DIR}/frontend/package.json"
sed -i '' 's/5174/5175/g' "${VOCAB_DIR}/frontend/vite.config.js"

# 3. App.jsx에서 프로젝트명 변경
echo "🎯 프로젝트명 변경 중... (start2 → vocabulary)"
sed -i '' 's/start2/vocabulary/g' "${VOCAB_DIR}/frontend/src/App.jsx"

echo "🎉 vocabulary 전용 웹 UI 생성 완료!"
echo "📡 실행 방법:"
echo "   cd ${VOCAB_DIR}/frontend"
echo "   npm install"
echo "   npm run dev"
echo "   브라우저: http://localhost:5175"
