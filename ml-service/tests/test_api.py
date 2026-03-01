from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_top_questions():
    response = client.post('/predict/top_questions', json={
        "query": "most probable chapters for CBSE physics",
        "board": "CBSE",
        "subject": "Physics",
        "class_level": 12
    })
    assert response.status_code == 200
    data = response.json()
    assert 'results' in data
    assert 'disclaimer' in data
