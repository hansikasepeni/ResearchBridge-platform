import pytest


@pytest.mark.asyncio
async def test_feature_1_explainable_ai_talent_matcher(async_client, prof_token, student_token):
    # Create project as professor
    proj_res = await async_client.post(
        "/api/v1/research-projects",
        json={
            "title": "Quantum Attention Mechanisms",
            "summary": "Exploring quantum gate approximations in transformers.",
            "description": "Empirical benchmarking of attention layers with linear algebra and PyTorch.",
            "prerequisite_skills": ["Python", "PyTorch", "Linear Algebra"],
            "weekly_hours": 10,
            "openings_count": 2,
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert proj_res.status_code == 201
    proj_id = proj_res.json()["id"]

    # Student cannot run faculty talent matcher -> 403
    unauth = await async_client.get(
        f"/api/v1/recommendations/projects/{proj_id}/talent-matcher",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert unauth.status_code == 403

    # Professor evaluates student candidates with explanations
    res = await async_client.get(
        f"/api/v1/recommendations/projects/{proj_id}/talent-matcher",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_evaluated_candidates"] >= 1
    assert len(data["matched_candidates"]) > 0
    top = data["matched_candidates"][0]
    assert "matched_skills" in top
    assert "missing_skills" in top
    assert "explanation" in top
    assert "readiness_level" in top


@pytest.mark.asyncio
async def test_feature_2_evidence_based_skill_passport(async_client, student_token, prof_token):
    # Student adds verified skill with evidence trail
    res = await async_client.post(
        "/api/v1/skills/passport",
        json={
            "skill_name": "PyTorch",
            "proficiency_level": "advanced",
            "verification_tier": "project_supported",
            "evidence_url": "https://github.com/alicechen/neural-transformer-impl",
            "evidence_description": "Implemented custom multi-head attention module from scratch.",
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 201
    passport_entry = res.json()
    assert passport_entry["skill_name"] == "PyTorch"
    assert passport_entry["verification_tier"] == "project_supported"
    skill_id = passport_entry["id"]

    # List passport entries
    list_res = await async_client.get(
        "/api/v1/skills/passport",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert list_res.status_code == 200
    assert any(s["id"] == skill_id for s in list_res.json())

    # Faculty reviews and endorses skill
    endorse_res = await async_client.post(
        f"/api/v1/skills/passport/{skill_id}/endorse",
        json={
            "endorsement_notes": "Reviewed GitHub implementation and verified exceptional code quality.",
            "verified_proficiency": "expert",
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert endorse_res.status_code == 200
    updated = endorse_res.json()
    assert updated["verification_tier"] == "faculty_endorsed"
    assert updated["proficiency_level"] == "expert"
    assert updated["endorsement_notes"] is not None


@pytest.mark.asyncio
async def test_feature_3_ai_team_composer(async_client, prof_token):
    res = await async_client.post(
        "/api/v1/teams/compose",
        json={
            "project_title": "Autonomous Campus Robotics",
            "roles": [
                {"role_name": "Perception & Vision", "required_skills": ["Python", "Computer Vision", "ROS"]},
                {"role_name": "Planning & Algorithms", "required_skills": ["Python", "Algorithms", "PyTorch"]},
            ],
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "recommended_team" in data
    assert data["recommended_team"]["overall_coverage_score"] > 0
    assert len(data["recommended_team"]["members"]) == 2
    assert "alternative_teams" in data


@pytest.mark.asyncio
async def test_feature_4_opportunity_gap_analyzer(async_client, student_token, prof_token):
    # Create project requiring niche skills
    proj_res = await async_client.post(
        "/api/v1/research-projects",
        json={
            "title": "Quantum Cryptographic Protocols",
            "summary": "Post-quantum key exchange study.",
            "description": "Requires advanced abstract algebra and lattice-based cryptography.",
            "prerequisite_skills": ["Lattice Cryptography", "Quantum Algorithms", "Python"],
            "weekly_hours": 12,
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    proj_id = proj_res.json()["id"]

    # Student requests gap analysis
    res = await async_client.get(
        f"/api/v1/research-projects/{proj_id}/gap-analysis",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "readiness_percentage" in data
    assert "missing_skills" in data
    assert len(data["preparation_path"]) > 0
    assert len(data["recommended_beginner_tasks"]) > 0
    assert data["can_reapply"] is True


@pytest.mark.asyncio
async def test_feature_5_research_idea_to_prototype_pipeline(async_client, prof_token, student_token):
    # Faculty posts early-stage idea
    idea_res = await async_client.post(
        "/api/v1/pipeline/ideas",
        json={
            "title": "Edge AI for Wildlife Conservation",
            "problem_statement": "Solar-powered micro-controllers suffer from memory bottlenecks.",
            "vision_description": "Develop 8-bit quantized visual sensors for remote endangered species tracking.",
            "required_disciplines": ["Embedded Systems", "Computer Vision"],
            "target_prototype_outcome": "Working Raspberry Pi / ESP32 demo with audio-visual triggers.",
            "is_interdisciplinary": True,
            "is_beginner_friendly": True,
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert idea_res.status_code == 201
    idea = idea_res.json()
    assert idea["stage"] == "ideation"
    idea_id = idea["id"]

    # Student views pipeline ideas
    list_res = await async_client.get(
        "/api/v1/pipeline/ideas",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert list_res.status_code == 200
    assert any(i["id"] == idea_id for i in list_res.json())

    # Student submits proposal
    prop_res = await async_client.post(
        f"/api/v1/pipeline/ideas/{idea_id}/proposals",
        json={
            "proposal_title": "TinyML Quantization Strategy",
            "proposed_approach": "Apply post-training int8 quantization with pruning on MobileNetV3.",
            "contributor_role": "TinyML Student Researcher",
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert prop_res.status_code == 201
    assert prop_res.json()["status"] == "submitted"


@pytest.mark.asyncio
async def test_feature_6_contribution_and_impact_tracker(async_client, student_token, prof_token):
    # Log contribution task
    proj_res = await async_client.get(
        "/api/v1/research-projects",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    proj_id = proj_res.json()["items"][0]["id"]

    contrib_res = await async_client.post(
        "/api/v1/contributions",
        json={
            "project_id": proj_id,
            "task_name": "API Benchmark Pipeline",
            "deliverable_summary": "Implemented async benchmarking client achieving 450 requests/sec with latency logging.",
            "deliverable_url": "https://github.com/alicechen/benchmark-results",
            "hours_logged": 16,
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert contrib_res.status_code == 201
    student_id = contrib_res.json()["student_id"]

    # Generate verified portfolio summary
    port_res = await async_client.get(
        f"/api/v1/contributions/portfolio/{student_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert port_res.status_code == 200
    port = port_res.json()
    assert port["total_hours_contributed"] >= 16
    assert len(port["verified_tasks"]) >= 1
    assert "verified_statement" in port


@pytest.mark.asyncio
async def test_feature_7_cross_department_talent_discovery(async_client, prof_token):
    res = await async_client.get(
        "/api/v1/recommendations/cross-department?skill=Python",
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["target_skill"] == "Python"
    assert data["total_cross_dept_found"] >= 1
    first_match = data["results"][0]
    assert "interdisciplinary_synergy" in first_match
    assert first_match["match_score"] >= 70.0


@pytest.mark.asyncio
async def test_feature_8_opportunity_radar_for_hidden_talent(async_client, student_token):
    res = await async_client.get(
        "/api/v1/opportunities/radar",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "radar_opportunities" in data
    assert len(data["radar_opportunities"]) > 0
    alert = data["radar_opportunities"][0]
    assert "radar_score" in alert
    assert "potential_explanation" in alert
    assert "matched_strengths" in alert


@pytest.mark.asyncio
async def test_feature_9_research_collaboration_graph(async_client, student_token):
    res = await async_client.get(
        "/api/v1/collaboration-graph",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 200
    graph = res.json()
    assert graph["total_nodes"] > 0
    assert graph["total_edges"] > 0
    node_types = set(n["type"] for n in graph["nodes"])
    assert "student" in node_types
    assert "professor" in node_types
    assert "project" in node_types


@pytest.mark.asyncio
async def test_feature_10_fair_opportunity_monitor(async_client, admin_token, student_token):
    # Student cannot view admin fair monitor -> 403
    unauth = await async_client.get(
        "/api/v1/admin/fair-opportunity-monitor",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert unauth.status_code == 403

    # Admin views fairness audit metrics
    res = await async_client.get(
        "/api/v1/admin/fair-opportunity-monitor",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    report = res.json()
    assert report["total_evaluated_students"] > 0
    assert "recommendation_concentration_index" in report
    assert "department_metrics" in report
    assert report["fairness_audit_passed"] is True
    assert len(report["audit_notes"]) > 0


@pytest.mark.asyncio
async def test_feature_11_automatic_research_project_breakdown(async_client, prof_token):
    res = await async_client.post(
        "/api/v1/ai/project-breakdown",
        json={
            "research_idea": "Build a real-time smart campus energy and microgrid optimization system.",
            "target_duration": "1 semester (16 weeks)",
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "project_title" in data
    assert "executive_summary" in data
    assert len(data["recommended_tasks"]) >= 3
    first_task = data["recommended_tasks"][0]
    assert "task_name" in first_task
    assert "role" in first_task
    assert "prerequisite_skills" in first_task
    assert "deliverable" in first_task
