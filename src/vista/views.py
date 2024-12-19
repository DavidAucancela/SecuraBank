from django.http import HttpResponse

def home(request):
    return HttpResponse("Bienvenido a la API de gestión de transacciones.")
