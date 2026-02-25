from django.contrib import admin
from django.urls import include, path
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def api_root(_request):
    return Response(
        {
            "status": "ok",
            "message": "Backend API is running.",
            "endpoints": [
                "/admin/",
                "/api/solar/",
            ],
        }
    )

urlpatterns = [
    path("", api_root),
    path("admin/", admin.site.urls),
    path("api-auth/", include("rest_framework.urls")),

    path("api/solar/", include("solar.urls")),
]
