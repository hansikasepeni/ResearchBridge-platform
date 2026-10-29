import pytest


@pytest.mark.asyncio
async def test_student_cannot_create_publication(async_client, student_token):
    response = await async_client.post(
        "/api/v1/publications",
        json={
            "title": "Unauthorized Paper Attempt",
            "venue": "Conference",
            "year": 2025,
        },
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_professor_can_create_and_manage_publication(async_client, prof_token, student_token):
    # Professor creates publication
    create_res = await async_client.post(
        "/api/v1/publications",
        json={
            "title": "Scalable Neural Reasoning",
            "abstract": "A study on algorithmic reasoning.",
            "authors": ["Prof. Alan Turing"],
            "venue": "ICLR 2026",
            "year": 2026,
            "visibility": "public",
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert create_res.status_code == 201
    pub_id = create_res.json()["id"]

    # Student cannot modify professor's publication
    patch_res = await async_client.patch(
        f"/api/v1/publications/{pub_id}",
        json={"title": "Hacked Title"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert patch_res.status_code == 403

    # Professor can modify own publication
    prof_patch = await async_client.patch(
        f"/api/v1/publications/{pub_id}",
        json={"title": "Scalable Neural Reasoning (Revised)"},
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert prof_patch.status_code == 200
    assert prof_patch.json()["title"] == "Scalable Neural Reasoning (Revised)"


@pytest.mark.asyncio
async def test_professor_can_create_project(async_client, prof_token, student_token):
    res = await async_client.post(
        "/api/v1/research-projects",
        json={
            "title": "Deep Graph Reasoning",
            "summary": "Exploring graph neural networks for reasoning.",
            "description": "Comprehensive project investigating topological message passing algorithms.",
            "weekly_hours": 10,
            "openings_count": 2,
            "prerequisite_skills": ["Python", "PyTorch"],
        },
        headers={"Authorization": f"Bearer {prof_token}"},
    )
    assert res.status_code == 201
    proj_id = res.json()["id"]

    # Student cannot delete project
    del_res = await async_client.delete(
        f"/api/v1/research-projects/{proj_id}",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert del_res.status_code == 403
