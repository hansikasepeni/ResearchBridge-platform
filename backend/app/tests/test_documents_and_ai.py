import pytest
import io


def create_minimal_pdf() -> bytes:
    """Returns valid minimal PDF bytes starting with %PDF-."""
    return (
        b"%PDF-1.4\n"
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj\n"
        b"xref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n"
        b"trailer << /Size 4 /Root 1 0 R >>\nstartxref\n195\n%%EOF"
    )


@pytest.mark.asyncio
async def test_document_upload_validation(async_client, student_token):
    # Reject non-PDF file
    invalid_file = io.BytesIO(b"This is a plain text file, not a PDF.")
    res = await async_client.post(
        "/api/v1/documents",
        files={"file": ("test.txt", invalid_file, "text/plain")},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert res.status_code == 415

    # Accept valid PDF
    pdf_bytes = create_minimal_pdf()
    valid_file = io.BytesIO(pdf_bytes)
    upload_res = await async_client.post(
        "/api/v1/documents",
        files={"file": ("sample_paper.pdf", valid_file, "application/pdf")},
        data={"title": "Representation Learning in Deep Models", "access_scope": "private"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    assert doc_data["title"] == "Representation Learning in Deep Models"
    assert "sha256_hash" in doc_data


@pytest.mark.asyncio
async def test_unauthorized_document_access(async_client, student_token, student2_token):
    # Student 1 uploads private document
    pdf_bytes = create_minimal_pdf()
    upload_res = await async_client.post(
        "/api/v1/documents",
        files={"file": ("private_notes.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"title": "Private Research Notes", "access_scope": "private"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    doc_id = upload_res.json()["id"]

    # Student 2 cannot download Student 1's private document
    dl_res = await async_client.get(
        f"/api/v1/documents/{doc_id}/download",
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert dl_res.status_code == 403


@pytest.mark.asyncio
async def test_unauthorized_ai_access_to_private_document(async_client, student_token, student2_token):
    # Student 1 document
    pdf_bytes = create_minimal_pdf()
    upload_res = await async_client.post(
        "/api/v1/documents",
        files={"file": ("secret_draft.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"title": "Secret Draft", "access_scope": "private"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    doc_id = upload_res.json()["id"]

    # Student 2 cannot chat with AI about Student 1's document
    chat_res = await async_client.post(
        "/api/v1/ai/chat",
        json={"message": "Summarize this secret draft", "document_id": doc_id},
        headers={"Authorization": f"Bearer {student2_token}"},
    )
    assert chat_res.status_code == 403


@pytest.mark.asyncio
async def test_gemini_paper_summarization_and_chat(async_client, student_token):
    # Student 1 uploads paper
    pdf_bytes = create_minimal_pdf()
    upload_res = await async_client.post(
        "/api/v1/documents",
        files={"file": ("quantum_computing.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"title": "Quantum Error Correction", "access_scope": "public"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    doc_id = upload_res.json()["id"]

    # Request paper summarization
    sum_res = await async_client.post(
        f"/api/v1/documents/{doc_id}/summarize",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert sum_res.status_code == 200
    summary = sum_res.json()
    assert "plain_language_overview" in summary
    assert "research_problem" in summary
    assert "motivation_significance" in summary
    assert "methodology" in summary
    assert "key_terminology" in summary
    assert "discussion_questions" in summary

    # Chat with AI about the paper
    chat_res = await async_client.post(
        "/api/v1/ai/chat",
        json={"message": "What is the core methodology of this work?", "document_id": doc_id},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "conversation_id" in chat_data
    assert "message" in chat_data
