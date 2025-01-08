import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';

const MFA = () => {
    const { confirmMFA } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Obtener el username pasado desde Login
    const { username } = location.state || {};

    const [token, setToken] = useState('');
    const [tokenError, setTokenError] = useState('');
    const [loading, setLoading] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [resendTimer, setResendTimer] = useState(60); // Tiempo en segundos
    const [attempts, setAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockTimer, setBlockTimer] = useState(300); // Bloqueo por 5 minutos (300 segundos)

    // Temporizador para habilitar el botón de reenviar
    useEffect(() => {
        let timer;
        if (!canResend) {
            timer = setInterval(() => {
                setResendTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCanResend(true);
                        return 60;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [canResend]);

    // Temporizador para desbloquear MFA después del bloqueo
    useEffect(() => {
        let blockTimerInterval;
        if (isBlocked) {
            blockTimerInterval = setInterval(() => {
                setBlockTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(blockTimerInterval);
                        setIsBlocked(false);
                        setAttempts(0);
                        return 300;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(blockTimerInterval);
    }, [isBlocked]);

    // Función para reenviar el código MFA
    const resendMfaCode = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/users/mfa/resend/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
            });

            if (response.status === 200) {
                Swal.fire({
                    title: 'Éxito',
                    text: 'Código MFA reenviado correctamente.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                });
                setCanResend(false);
                setResendTimer(60);
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo reenviar el código MFA.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            }
        } catch (error) {
            console.error('Error al reenviar código MFA:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo reenviar el código MFA.',
                icon: 'error',
                confirmButtonText: 'OK',
            });
        }
    };

    // Validamos manualmente antes de enviar
    const validateFields = () => {
        let valid = true;
        setTokenError('');

        if (!token.trim()) {
            setTokenError('El token MFA es requerido');
            valid = false;
        }

        return valid;
    };

    // Lógica de envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar campos
        if (!validateFields()) {
            return;
        }

        if (isBlocked) {
            Swal.fire({
                title: 'Bloqueado',
                text: `Demasiados intentos fallidos. Inténtalo de nuevo en ${blockTimer} segundos.`,
                icon: 'error',
                confirmButtonText: 'OK',
            });
            return;
        }

        setLoading(true);
        const response = await confirmMFA(username, token);
        setLoading(false);

        if (response.success) {
            // Redirigir a accounts
            navigate('/cuentas');
        } else {
            setAttempts(prev => prev + 1);
            if (attempts + 1 >= 3) {
                setIsBlocked(true);
                Swal.fire({
                    title: 'Bloqueado',
                    text: 'Demasiados intentos fallidos de MFA. Inténtalo de nuevo en 5 minutos.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: response.message,
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            }
        }
    };

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card mt-5">
                        <div className="card-body">
                            <h2 className="text-center mb-4">Verificación MFA</h2>
                            <form onSubmit={handleSubmit}>

                                {/* Campo Token MFA */}
                                <div className="mb-3">
                                    <label htmlFor="token" className="form-label">Token MFA</label>
                                    <input
                                        id="token"
                                        type="text"
                                        className={`form-control ${tokenError ? 'is-invalid' : ''}`}
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        autoComplete="one-time-code"
                                        disabled={isBlocked}
                                    />
                                    {tokenError && (
                                        <div className="invalid-feedback">{tokenError}</div>
                                    )}
                                </div>

                                {/* Botón con spinner */}
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 mb-2"
                                    disabled={loading || isBlocked}
                                >
                                    {loading ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                                aria-hidden="true"
                                            ></span>
                                            Verificando...
                                        </>
                                    ) : (
                                        'Verificar'
                                    )}
                                </button>

                                {/* Botón para reenviar código MFA */}
                                <button
                                    type="button"
                                    className="btn btn-secondary w-100 mb-2"
                                    onClick={resendMfaCode}
                                    disabled={!canResend || isBlocked}
                                >
                                    {canResend ? 'Reenviar Código MFA' : `Reenviar en ${resendTimer}s`}
                                </button>

                                {/* Botón Cancelar */}
                                <button
                                    type="button"
                                    className="btn btn-danger w-100"
                                    onClick={() => navigate('/login')}
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                            </form>

                            <div className="text-center mt-3">
                                <p>
                                    <Link to="/login">Volver al Login</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MFA;
