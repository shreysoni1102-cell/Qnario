import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    response = client.get('/health')
    assert response.status_code == 200

def test_generate_requires_body(client):
    response = client.post('/generate', json={})
    assert response.status_code in [400, 422]
