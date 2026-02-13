def test_solar_health(client):
    r = client.get("/api/solar/health/")
    assert r.status_code == 200
    assert r.json()["service"] == "solar"

def test_drought_health(client):
    r = client.get("/api/drought/health/")
    assert r.status_code == 200
    assert r.json()["service"] == "drought"

def test_geomagnetic_health(client):
    r = client.get("/api/geomagnetic/health/")
    assert r.status_code == 200
    assert r.json()["service"] == "geomagnetic"
