import sys
import os
import pytest
from unittest.mock import MagicMock, patch

# Add parent directory to sys.path so we can import services
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.retrieval_service import RetrievalService, EmbeddingGenerationError

def test_get_embedding_missing_or_dummy_key():
    service = RetrievalService()
    
    # Test None key
    with pytest.raises(EmbeddingGenerationError) as exc_info:
        service.get_embedding("hello", None)
    assert "No valid Gemini API key provided" in str(exc_info.value)
    
    # Test empty key
    with pytest.raises(EmbeddingGenerationError) as exc_info:
        service.get_embedding("hello", "")
    assert "No valid Gemini API key provided" in str(exc_info.value)
    
    # Test dummy key
    with pytest.raises(EmbeddingGenerationError) as exc_info:
        service.get_embedding("hello", "dummy_key_123")
    assert "No valid Gemini API key provided" in str(exc_info.value)

@patch("services.retrieval_service.requests.post")
def test_get_embedding_primary_success(mock_post):
    # Simulate a successful primary model call
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"embedding": {"values": [0.1, 0.2, 0.3]}}
    mock_post.return_value = mock_resp
    
    service = RetrievalService()
    result = service.get_embedding("hello", "valid_api_key")
    
    assert result == [0.1, 0.2, 0.3]
    assert mock_post.call_count == 1
    
    # Check that it called the primary endpoint with models/gemini-embedding-2
    args, kwargs = mock_post.call_args
    assert "gemini-embedding-2" in args[0]

@patch("services.retrieval_service.requests.post")
def test_get_embedding_fallback_success(mock_post):
    # Primary fails (500), Fallback succeeds (200)
    mock_resp_fail = MagicMock()
    mock_resp_fail.status_code = 500
    mock_resp_fail.text = "Internal Server Error"
    
    mock_resp_success = MagicMock()
    mock_resp_success.status_code = 200
    mock_resp_success.json.return_value = {"embedding": {"values": [0.4, 0.5, 0.6]}}
    
    mock_post.side_effect = [mock_resp_fail, mock_resp_success]
    
    service = RetrievalService()
    result = service.get_embedding("hello", "valid_api_key")
    
    assert result == [0.4, 0.5, 0.6]
    assert mock_post.call_count == 2
    
    # Verify primary call
    first_call_args = mock_post.call_args_list[0][0]
    assert "gemini-embedding-2" in first_call_args[0]
    
    # Verify fallback call
    second_call_args = mock_post.call_args_list[1][0]
    assert "gemini-embedding-001" in second_call_args[0]

@patch("services.retrieval_service.requests.post")
def test_get_embedding_all_fail(mock_post):
    # Both fail (400 and 500)
    mock_resp_fail1 = MagicMock()
    mock_resp_fail1.status_code = 400
    mock_resp_fail1.text = "Bad Request"
    
    mock_resp_fail2 = MagicMock()
    mock_resp_fail2.status_code = 500
    mock_resp_fail2.text = "Server Error"
    
    mock_post.side_effect = [mock_resp_fail1, mock_resp_fail2]
    
    service = RetrievalService()
    with pytest.raises(EmbeddingGenerationError) as exc_info:
        service.get_embedding("hello", "valid_api_key")
    
    assert "Embedding API call failed" in str(exc_info.value)
    assert "Primary (gemini-embedding-2) error: [Status 400: Bad Request]" in str(exc_info.value)
    assert "Fallback (gemini-embedding-001) error: [Status 500: Server Error]" in str(exc_info.value)
    assert mock_post.call_count == 2

@patch("services.retrieval_service.requests.post")
def test_index_document_embedding_failure(mock_post):
    # Fail primary & fallback embedding api calls
    mock_resp_fail = MagicMock()
    mock_resp_fail.status_code = 403
    mock_resp_fail.text = "Forbidden"
    mock_post.return_value = mock_resp_fail
    
    service = RetrievalService()
    # Mock chroma client
    mock_client = MagicMock()
    service.client = mock_client
    
    # Call index_document
    result = service.index_document(
        syllabus_id="test_syllabus",
        text="This is a test document with some text for chunking.",
        api_key="valid_api_key"
    )
    
    assert result["success"] is False
    assert "failed_at_chunk" in result
    assert result["failed_at_chunk"] == 0
    assert "Embedding API call failed" in result["error"]
    
    # Verify collection delete was triggered to clean up
    mock_client.delete_collection.assert_called_with(name="syllabus_test_syllabus")

@patch("services.retrieval_service.requests.post")
def test_retrieve_chunks_embedding_failure_propagates(mock_post):
    # Fail embedding api calls
    mock_resp_fail = MagicMock()
    mock_resp_fail.status_code = 500
    mock_resp_fail.text = "Internal error"
    mock_post.return_value = mock_resp_fail
    
    service = RetrievalService()
    mock_client = MagicMock()
    service.client = mock_client
    
    with pytest.raises(EmbeddingGenerationError):
        service.retrieve_chunks("test_syllabus", "query", "valid_api_key")
