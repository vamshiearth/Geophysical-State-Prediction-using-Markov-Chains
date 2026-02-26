from unittest.mock import Mock, patch


def _mock_response(payload):
    response = Mock()
    response.raise_for_status = Mock()
    response.json = Mock(return_value=payload)
    return response


@patch("solar.views.requests.get")
def test_solar_summary_success(mock_get, client):
    hourly_payload = {
        "properties": {
            "parameter": {
                "ALLSKY_SFC_SW_DWN": {
                    "2026021800": 12.0,
                    "2026021801": 22.0,
                    "2026021802": 35.0,
                }
            }
        }
    }
    daily_payload = {
        "properties": {
            "parameter": {
                "ALLSKY_SFC_SW_DWN": {
                    "20240101": 2.1,
                    "20240102": 3.2,
                    "20240103": 4.5,
                    "20240104": 2.9,
                    "20240105": 4.8,
                    "20240106": 3.7,
                }
            }
        }
    }

    mock_get.side_effect = [_mock_response(hourly_payload), _mock_response(daily_payload)]

    res = client.post(
        "/api/solar/summary/",
        data={"lat": 42.36, "lon": -71.06, "years": 5},
        content_type="application/json",
    )

    assert res.status_code == 200
    body = res.json()
    assert body["location"]["lat"] == 42.36
    assert body["location"]["lon"] == -71.06
    assert body["current_hour"]["value"] == 35.0
    assert body["latest_daily"]["value"] == 3.7
    assert "model" not in body
    assert "solar_parameters" in body


def test_solar_summary_invalid_payload(client):
    res = client.post(
        "/api/solar/summary/",
        data={"lat": 999, "lon": 0},
        content_type="application/json",
    )
    assert res.status_code == 400
