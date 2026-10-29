#!/usr/bin/env bash
# =============================================================================
# RESEARCHBRIDGE BACKEND ENDPOINT VERIFICATION SUITE
# Rigorously tests every single endpoint using curl
# =============================================================================

set -e

PORT=${1:-8000}
BASE_URL="http://127.0.0.1:${PORT}"

# Auth tokens for pre-seeded test roles
ADMIN_TOKEN="test-token-00000000-0000-0000-0000-000000000001"
PROF_TOKEN="test-token-00000000-0000-0000-0000-000000000002"
STUDENT_TOKEN="test-token-00000000-0000-0000-0000-000000000003"
STUDENT2_TOKEN="test-token-00000000-0000-0000-0000-000000000004"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

assert_curl() {
    local method="$1"
    local path="$2"
    local expected_status="$3"
    local token="$4"
    local data="$5"
    local extra_flags="$6"

    local auth_header=""
    if [ -n "$token" ]; then
        auth_header="-H \"Authorization: Bearer $token\""
    fi

    local data_flag=""
    if [ -n "$data" ]; then
        data_flag="-H \"Content-Type: application/json\" -d '$data'"
    fi

    local cmd="curl -s -o /tmp/rb_curl_out.json -w '%{http_code}' -X $method $auth_header $data_flag $extra_flags \"${BASE_URL}${path}\""
    local status
    status=$(eval "$cmd")

    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ [PASS]${NC} $method $path -> HTTP $status"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}✗ [FAIL]${NC} $method $path -> Expected $expected_status, got $status"
        cat /tmp/rb_curl_out.json
        echo ""
        fail_count=$((fail_count + 1))
    fi
}

echo "=================================================================="
echo "Starting ResearchBridge Comprehensive Endpoint Curl Test Suite"
echo "Target: ${BASE_URL}"
echo "=================================================================="

# 1. Health & Discovery
assert_curl "GET" "/health" 200 ""
assert_curl "GET" "/ready" 200 ""
assert_curl "GET" "/api/v1/openapi.json" 200 ""

# 2. Authentication & Profiles
assert_curl "GET" "/api/v1/auth/me" 401 ""
assert_curl "GET" "/api/v1/auth/me" 200 "$STUDENT_TOKEN"
assert_curl "GET" "/api/v1/profiles/me" 200 "$PROF_TOKEN"
assert_curl "PATCH" "/api/v1/profiles/me" 200 "$STUDENT_TOKEN" '{"bio": "Passionate about research and AI"}'

# 3. Institutions & Metadata
assert_curl "GET" "/api/v1/institutions" 200 ""
assert_curl "GET" "/api/v1/departments" 200 ""
assert_curl "GET" "/api/v1/research-interests" 200 ""

# 4. Professors
assert_curl "GET" "/api/v1/professors" 200 "$STUDENT_TOKEN"
assert_curl "GET" "/api/v1/professors/00000000-0000-0000-0000-000000000002" 200 "$STUDENT_TOKEN"
assert_curl "GET" "/api/v1/professors/me/dashboard" 403 "$STUDENT_TOKEN"
assert_curl "GET" "/api/v1/professors/me/dashboard" 200 "$PROF_TOKEN"
assert_curl "PATCH" "/api/v1/professors/me" 200 "$PROF_TOKEN" '{"preferred_weekly_hours": 12}'

# 5. Publications
assert_curl "GET" "/api/v1/professors/00000000-0000-0000-0000-000000000002/publications" 200 "$STUDENT_TOKEN"
assert_curl "POST" "/api/v1/publications" 403 "$STUDENT_TOKEN" '{"title": "Student paper"}'

# Create a publication as Professor
curl -s -X POST -H "Authorization: Bearer $PROF_TOKEN" -H "Content-Type: application/json" \
    -d '{"title": "Foundations of Neural Turing Machines", "venue": "Nature", "year": 2026, "visibility": "public"}' \
    "${BASE_URL}/api/v1/publications" > /tmp/created_pub.json
PUB_ID=$(python3 -c "import json; print(json.load(open('/tmp/created_pub.json'))['id'])")

assert_curl "PATCH" "/api/v1/publications/${PUB_ID}" 200 "$PROF_TOKEN" '{"title": "Foundations of Neural Turing Machines (2nd Ed)"}'
assert_curl "DELETE" "/api/v1/publications/${PUB_ID}" 200 "$PROF_TOKEN"

# 6. Research Projects
assert_curl "GET" "/api/v1/research-projects" 200 "$STUDENT_TOKEN"
assert_curl "GET" "/api/v1/professors/me/research-projects" 200 "$PROF_TOKEN"

# Create a research project as Professor
curl -s -X POST -H "Authorization: Bearer $PROF_TOKEN" -H "Content-Type: application/json" \
    -d '{"title": "Adaptive Transformers", "summary": "Study on dynamic depth in transformers", "description": "Full research project exploring conditional computation mechanisms in attention layers.", "weekly_hours": 10, "openings_count": 1}' \
    "${BASE_URL}/api/v1/research-projects" > /tmp/created_proj.json
PROJ_ID=$(python3 -c "import json; print(json.load(open('/tmp/created_proj.json'))['id'])")

assert_curl "GET" "/api/v1/research-projects/${PROJ_ID}" 200 "$STUDENT_TOKEN"
assert_curl "PATCH" "/api/v1/research-projects/${PROJ_ID}" 200 "$PROF_TOKEN" '{"weekly_hours": 12}'

# 7. Research Requests (Applications)
curl -s -X POST -H "Authorization: Bearer $STUDENT_TOKEN" -H "Content-Type: application/json" \
    -d "{\"professor_id\": \"00000000-0000-0000-0000-000000000002\", \"project_id\": \"${PROJ_ID}\", \"subject\": \"Application for Adaptive Transformers\", \"motivation_statement\": \"I have read your paper and want to work on conditional computation.\", \"student_skills\": [\"PyTorch\", \"Linear Algebra\"]}" \
    "${BASE_URL}/api/v1/research-requests" > /tmp/created_req.json
REQ_ID=$(python3 -c "import json; print(json.load(open('/tmp/created_req.json'))['id'])")

assert_curl "GET" "/api/v1/research-requests" 200 "$STUDENT_TOKEN"
assert_curl "GET" "/api/v1/research-requests/${REQ_ID}" 200 "$STUDENT_TOKEN"
assert_curl "GET" "/api/v1/research-requests/${REQ_ID}" 403 "$STUDENT2_TOKEN"
assert_curl "POST" "/api/v1/research-requests/${REQ_ID}/request-information" 200 "$PROF_TOKEN" '{"notes": "Please share your transcript."}'
assert_curl "POST" "/api/v1/research-requests/${REQ_ID}/accept" 200 "$PROF_TOKEN" '{"notes": "Accepted!"}'

# 8. Messaging
assert_curl "POST" "/api/v1/research-requests/${REQ_ID}/messages" 201 "$STUDENT_TOKEN" '{"message_body": "Hello professor, thank you for accepting!"}'
assert_curl "GET" "/api/v1/research-requests/${REQ_ID}/messages" 200 "$PROF_TOKEN"
assert_curl "POST" "/api/v1/research-requests/${REQ_ID}/read" 200 "$PROF_TOKEN"

# 9. Documents (Upload minimal PDF)
cat << 'EOF' > /tmp/test_paper.pdf
%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj
xref
0 4
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
trailer << /Size 4 /Root 1 0 R >>
startxref
195
%%EOF
EOF

curl -s -X POST -H "Authorization: Bearer $STUDENT_TOKEN" \
    -F "file=@/tmp/test_paper.pdf;type=application/pdf" \
    -F "title=Neural Reasoning Paper" \
    -F "access_scope=public" \
    "${BASE_URL}/api/v1/documents" > /tmp/created_doc.json
DOC_ID=$(python3 -c "import json; print(json.load(open('/tmp/created_doc.json'))['id'])")

assert_curl "GET" "/api/v1/documents" 200 "$STUDENT_TOKEN"
assert_curl "GET" "/api/v1/documents/${DOC_ID}" 200 "$STUDENT_TOKEN"
assert_curl "GET" "/api/v1/documents/${DOC_ID}/download" 200 "$STUDENT_TOKEN"

# 10. Gemini AI Summaries & Chat
assert_curl "POST" "/api/v1/documents/${DOC_ID}/summarize" 200 "$STUDENT_TOKEN"
assert_curl "GET" "/api/v1/documents/${DOC_ID}/summary" 200 "$STUDENT_TOKEN"
assert_curl "POST" "/api/v1/ai/chat" 200 "$STUDENT_TOKEN" "{\"message\": \"Can you explain this paper?\", \"document_id\": \"${DOC_ID}\"}"
assert_curl "GET" "/api/v1/ai/conversations" 200 "$STUDENT_TOKEN"

# 11. Recommendations
assert_curl "GET" "/api/v1/recommendations/professors" 200 "$STUDENT_TOKEN"
assert_curl "GET" "/api/v1/recommendations/projects" 200 "$STUDENT_TOKEN"

# 12. Notifications
assert_curl "GET" "/api/v1/notifications" 200 "$PROF_TOKEN"
assert_curl "POST" "/api/v1/notifications/read-all" 200 "$PROF_TOKEN"

# 13. Admin Management
assert_curl "GET" "/api/v1/admin/audit-logs" 403 "$STUDENT_TOKEN"
assert_curl "GET" "/api/v1/admin/audit-logs" 200 "$ADMIN_TOKEN"

# Admin Onboarding flow
curl -s -X POST -H "Authorization: Bearer $STUDENT2_TOKEN" -H "Content-Type: application/json" \
    -d '{"institution_id": "22222222-2222-2222-2222-222222222201", "academic_title": "Adjunct Professor", "institutional_email": "bob.adjunct@stanford.edu"}' \
    "${BASE_URL}/api/v1/onboarding/professor-request" > /tmp/prof_req.json
ONBOARD_REQ_ID=$(python3 -c "import json; print(json.load(open('/tmp/prof_req.json'))['id'])")

assert_curl "GET" "/api/v1/admin/professors/pending" 200 "$ADMIN_TOKEN"
assert_curl "POST" "/api/v1/admin/professors/${ONBOARD_REQ_ID}/approve" 200 "$ADMIN_TOKEN" '{"decision": "approved", "admin_notes": "All checks passed"}'

# Admin Account Suspension & Reactivation
assert_curl "POST" "/api/v1/admin/users/00000000-0000-0000-0000-000000000004/suspend" 200 "$ADMIN_TOKEN" '{"reason": "Testing suspension"}'
assert_curl "POST" "/api/v1/admin/users/00000000-0000-0000-0000-000000000004/reactivate" 200 "$ADMIN_TOKEN"

# 14. Advanced Innovation Suite (11 Differentiator Features)
# Feature 1: Talent Matcher
assert_curl "GET" "/api/v1/recommendations/projects/${PROJ_ID}/talent-matcher" 200 "$PROF_TOKEN"

# Feature 2: Skill Passport
curl -s -X POST -H "Authorization: Bearer $STUDENT_TOKEN" -H "Content-Type: application/json" \
    -d '{"skill_name": "PyTorch", "proficiency_level": "advanced", "verification_tier": "project_supported", "evidence_url": "https://github.com/alicechen/scaling-impl"}' \
    "${BASE_URL}/api/v1/skills/passport" > /tmp/created_skill.json
SKILL_ID=$(python3 -c "import json; print(json.load(open('/tmp/created_skill.json'))['id'])")

assert_curl "GET" "/api/v1/skills/passport" 200 "$STUDENT_TOKEN"
assert_curl "POST" "/api/v1/skills/passport/${SKILL_ID}/endorse" 200 "$PROF_TOKEN" '{"endorsement_notes": "Reviewed and verified code quality.", "verified_proficiency": "expert"}'

# Feature 3: Team Composer
assert_curl "POST" "/api/v1/teams/compose" 200 "$PROF_TOKEN" '{"project_title": "Robotics Exploration", "roles": [{"role_name": "Vision", "required_skills": ["Python", "PyTorch"]}]}'

# Feature 4: Gap Analyzer
assert_curl "GET" "/api/v1/research-projects/${PROJ_ID}/gap-analysis" 200 "$STUDENT_TOKEN"

# Feature 5: Research Pipeline Ideas & Proposals
curl -s -X POST -H "Authorization: Bearer $PROF_TOKEN" -H "Content-Type: application/json" \
    -d '{"title": "Neuromorphic Sensor Benchmarking", "problem_statement": "Edge devices consume too much energy during inference.", "vision_description": "Quantized spiking networks for asynchronous vision processing."}' \
    "${BASE_URL}/api/v1/pipeline/ideas" > /tmp/created_idea.json
IDEA_ID=$(python3 -c "import json; print(json.load(open('/tmp/created_idea.json'))['id'])")

assert_curl "GET" "/api/v1/pipeline/ideas" 200 "$STUDENT_TOKEN"
assert_curl "POST" "/api/v1/pipeline/ideas/${IDEA_ID}/proposals" 201 "$STUDENT_TOKEN" '{"proposal_title": "Quantized Spike Inference", "proposed_approach": "Use int8 surrogate gradients.", "contributor_role": "ML Student"}'

# Feature 6: Contribution Tracker
assert_curl "POST" "/api/v1/contributions" 201 "$STUDENT_TOKEN" "{\"project_id\": \"${PROJ_ID}\", \"task_name\": \"Async API Benchmarking\", \"deliverable_summary\": \"Executed 500 req/sec benchmark.\", \"hours_logged\": 10}"
assert_curl "GET" "/api/v1/contributions/portfolio/00000000-0000-0000-0000-000000000003" 200 "$STUDENT_TOKEN"

# Feature 7: Cross-Department Talent Discovery
assert_curl "GET" "/api/v1/recommendations/cross-department?skill=Python" 200 "$PROF_TOKEN"

# Feature 8: Opportunity Radar
assert_curl "GET" "/api/v1/opportunities/radar" 200 "$STUDENT_TOKEN"

# Feature 9: Research Collaboration Graph
assert_curl "GET" "/api/v1/collaboration-graph" 200 "$STUDENT_TOKEN"

# Feature 10: Fair Opportunity Monitor
assert_curl "GET" "/api/v1/admin/fair-opportunity-monitor" 200 "$ADMIN_TOKEN"

# Feature 11: Automatic Project Breakdown
assert_curl "POST" "/api/v1/ai/project-breakdown" 200 "$PROF_TOKEN" '{"research_idea": "Build a real-time smart campus energy optimization system with telemetry."}'



echo "=================================================================="
echo -e "Test Results: ${GREEN}${pass_count} passed${NC}, ${RED}${fail_count} failed${NC}"
echo "=================================================================="

if [ "$fail_count" -gt 0 ]; then
    exit 1
fi
