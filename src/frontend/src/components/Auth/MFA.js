import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';


const MFA = () => {
    const { confirmMFA } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Obtener el username pasado desde Login
    const { username } = location.state || {};

    const [token, setToken] = useState('');
    const [tokenError, setTokenError] = useState('');
    const [loading, setLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockTimer, setBlockTimer] = useState(300); // Bloqueo por 5 minutos (300 segundos)

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
                            <h3 className="text-center mb-4">Verificación MFA Autentificación</h3>
                            <p>
                                Ingresa el token MFA que recibiste en tu dispositivo de autenticación.
                            </p>
                            <form onSubmit={handleSubmit}>

                                {/*ingreso Token MFA */}
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

                                {/*verificar con spinner */}
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

                                {/*Cancelar */}
                                <button
                                    type="button"
                                    className="btn btn-danger w-100"
                                    onClick={() => navigate('/login')}
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MFA;
