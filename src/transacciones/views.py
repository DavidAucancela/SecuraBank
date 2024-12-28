from django.shortcuts import render
from rest_framework import viewsets
from .models import Transaccion
from .serializers import TransaccionSerializer
from django.contrib.auth.views import LoginView

from django.contrib.auth import authenticate, login
from rest_framework.views import APIView
from rest_framework.response import Response


class TransaccionViewSet(viewsets.ModelViewSet):
    queryset = Transaccion.objects.all()
    serializer_class = TransaccionSerializer
