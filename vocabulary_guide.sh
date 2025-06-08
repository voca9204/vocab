#!/bin/bash

# vocabulary 프로젝트 Context-Aware Guide 생성기
# 사용법: ./vocabulary_guide.sh

echo "🎯 vocabulary 프로젝트 Context-Aware Guide 시스템"
echo "=================================================="

PROJECT_NAME="vocabulary"
API_BASE="http://localhost:8084"

# 1. 프로젝트 상태 확인
echo ""
echo "📊 프로젝트 상태 분석 중..."
curl -s "${API_BASE}/api/guides/analysis/${PROJECT_NAME}" > /tmp/vocabulary_analysis.json

if [ $? -eq 0 ]; then
    echo "✅ 프로젝트 분석 완료"
    python3 -c "
import json
with open('/tmp/vocabulary_analysis.json', 'r') as f:
    data = json.load(f)
    if data.get('success'):
        analysis = data['analysis']
        print(f'   📁 프로젝트: {analysis[\"name\"]}')
        print(f'   🏗️ 아키텍처: {analysis[\"architecture\"]}')
        print(f'   📊 복잡도: {analysis[\"complexity_score\"]}/10')
        print(f'   📋 표준 준수율: {analysis[\"standards_compliance\"]}%')
    else:
        print('❌ 분석 실패')
"
else
    echo "❌ 서버 연결 실패. backend 서버가 실행 중인지 확인하세요."
    exit 1
fi

echo ""
echo "🎯 사용 가능한 가이드 옵션:"
echo "1. 📄 빠른 컨텍스트 복원 (30초)"
echo "2. 📋 표준 준수 가이드"  
echo "3. 🏗️ 아키텍처 가이드"
echo "4. 🔄 모든 가이드 생성"

read -p "선택하세요 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📄 빠른 컨텍스트 복원 가이드 생성 중..."
        curl -s "${API_BASE}/api/guides/project/${PROJECT_NAME}?guide_type=context" | \
        python3 -c "
import json, sys
data = json.load(sys.stdin)
if data.get('success'):
    print('🎯 vocabulary 프로젝트 30초 복원 가이드')
    print('=' * 50)
    print(data['guide']['content'])
    print('')
    print('📋 위 내용을 복사해서 새로운 Claude 세션에 붙여넣으세요!')
else:
    print('❌ 가이드 생성 실패:', data.get('error', 'Unknown error'))
"
        ;;
    2)
        echo ""
        echo "📋 표준 준수 가이드 생성 중..."
        curl -s "${API_BASE}/api/guides/project/${PROJECT_NAME}?guide_type=standards" | \
        python3 -c "
import json, sys
data = json.load(sys.stdin)
if data.get('success'):
    print('📋 vocabulary 프로젝트 표준 준수 가이드')
    print('=' * 50)
    print(data['guide']['content'])
else:
    print('❌ 가이드 생성 실패:', data.get('error', 'Unknown error'))
"
        ;;
    3)
        echo ""
        echo "🏗️ 아키텍처 가이드 생성 중..."
        curl -s "${API_BASE}/api/guides/project/${PROJECT_NAME}?guide_type=architecture" | \
        python3 -c "
import json, sys
data = json.load(sys.stdin)
if data.get('success'):
    print('🏗️ vocabulary 프로젝트 아키텍처 가이드')
    print('=' * 50)
    print(data['guide']['content'])
else:
    print('❌ 가이드 생성 실패:', data.get('error', 'Unknown error'))
"
        ;;
    4)
        echo ""
        echo "🔄 모든 가이드 생성 중..."
        
        # 가이드 버튼들 확인
        echo "📋 사용 가능한 가이드 버튼들:"
        curl -s "${API_BASE}/api/guides/buttons/${PROJECT_NAME}" | \
        python3 -c "
import json, sys
data = json.load(sys.stdin)
if data.get('success'):
    for btn in data['buttons']:
        print(f'   🎯 {btn[\"title\"]} ({btn[\"estimated_read_time\"]}분)')
        print(f'      {btn[\"description\"]}')
        print()
"
        
        echo "📄 컨텍스트 복원 가이드:"
        echo "=" * 30
        curl -s "${API_BASE}/api/guides/project/${PROJECT_NAME}?guide_type=context" | \
        python3 -c "
import json, sys
data = json.load(sys.stdin)
if data.get('success'):
    print(data['guide']['content'])
"
        ;;
    *)
        echo "❌ 올바른 옵션을 선택하세요 (1-4)"
        exit 1
        ;;
esac

echo ""
echo "🎉 vocabulary 프로젝트 가이드 생성 완료!"
echo "💡 팁: 이 스크립트를 vocabulary 프로젝트 폴더에 저장해서 언제든 사용하세요."
