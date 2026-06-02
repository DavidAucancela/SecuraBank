from django_otp.models import Device


def verify_mfa_code(user, mfa_code):
    device = Device.objects.filter(user=user, confirmed=True).first()
    if device and device.verify_token(mfa_code):
        return True
    return False


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')
