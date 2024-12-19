from django.shortcuts import render
from rest_framework import viewsets
from .models import Transaccion
from .serializers import TransaccionSerializer
from django.contrib.auth.views import LoginView

class CustomLoginView(LoginView):
    template_name = 'login.html'


class TransaccionViewSet(viewsets.ModelViewSet):
    queryset = Transaccion.objects.all()
    serializer_class = TransaccionSerializer
