def test_solar_health(client):
    r = client.get("/api/solar/health/")
    assert r.status_code == 200
    assert r.json()["service"] == "solar"
