from django.urls import path

from .views import download_csv, geocode, health, reverse_geocode, summary

urlpatterns = [
    path("health/", health, name="solar-health"),
    path("summary/", summary, name="solar-summary"),
    path("geocode/", geocode, name="solar-geocode"),
    path("reverse-geocode/", reverse_geocode, name="solar-reverse-geocode"),
    path("download-csv/", download_csv, name="solar-download-csv"),
]
