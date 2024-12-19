import React, { useState, useEffect } from "react";
import axios from "axios";
import API_URL from "../config";

const Transacciones = () => {
    const [transacciones, setTransacciones] = useState([]);
    const [descripcion, setDescripcion] = useState("");
    const [monto, setMonto] = useState("");
    const [error, setError] = useState("");
    const [moneda, setMoneda] = useState("USD"); // Dólar como predeterminado

    /*
    // Funciones pendientes
    const [editando, setEditando] = useState(false);
    const [transaccionActual, setTransaccionActual] = useState(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [transaccionAEliminar, setTransaccionAEliminar] = useState(null);
    */
    


    // Obtener transacciones del backend
    const fetchTransacciones = async () => {
        try {
            const response = await axios.get(`${API_URL}transacciones/`);
            setTransacciones(response.data);
        } catch (error) {
            console.error("Error al obtener transacciones:", error);
        }
    };

    // Crear una nueva transacción
    const token = "tu_token_de_MFA"; // TOKEN
    const crearTransaccion = async () => {
        if (!descripcion || !monto || !moneda) {
            setError("Todos los campos son obligatorios.");
            return;
        }
        setError("");
        try {
            const nuevaTransaccion = {
                descripcion,
                monto,
                moneda, // Nuevo campo
            };
            const response = await axios.post(`${API_URL}transacciones/`, nuevaTransaccion, {
                headers: { Authorization: `Bearer ${token}` }, // Token de autenticación, si aplica
            });
            console.log("Transacción creada:", response.data);
            fetchTransacciones(); // Actualiza la lista
            setDescripcion("");
            setMonto("");
            setMoneda("USD");
        } catch (error) {
            console.error("Error al crear la transacción:", error);
        }
    };

    /* Activar modo edición
    const activarEdicion = (transaccion) => {
        setEditando(true);
        setTransaccionActual(transaccion);
        setDescripcion(transaccion.descripcion);
        setMonto(transaccion.monto);
    };
    */
   
    // Actualizar transacción
    /*
    const actualizarTransaccion = async () => {
        if (!descripcion || !monto) {
            setError("Todos los campos son obligatorios.");
            return;
        }
        setError("");
        try {
            await axios.put(`${API_URL}transacciones/${transaccionActual.id}/`, {
                descripcion,
                monto,
            });
            setEditando(false);
            fetchTransacciones();
            setDescripcion("");
            setMonto("");
            setTransaccionActual(null);
        } catch (error) {
            console.error("Error al actualizar la transacción:", error);
        }
    };
    

    // Mostrar modal de confirmación
    const confirmarEliminacion = (transaccion) => {
        setTransaccionAEliminar(transaccion);
        setMostrarModal(true);
    };

    // Eliminar transacción
    const eliminarTransaccion = async () => {
        try {
            await axios.delete(`${API_URL}transacciones/${transaccionAEliminar.id}/`);
            fetchTransacciones();
            setMostrarModal(false);
            setTransaccionAEliminar(null);
        } catch (error) {
            console.error("Error al eliminar la transacción:", error);
        }
    };
    */
    useEffect(() => {
        fetchTransacciones();
    }, []);


    return (
        <div className="container">
            <h1 className="my-4">Gestión de Transacciones</h1>

            {/* Formulario */}
            <div className="card my-4 p-4">
                <h4>Nueva Transacción</h4>
                <form>
                    <div className="mb-3">
                        <label className="form-label">Descripción</label>
                        <input
                            type="text"
                            className="form-control"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Monto</label>
                        <input
                            type="number"
                            className="form-control"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Moneda</label>
                        <select
                            className="form-select"
                            value={moneda}
                            onChange={(e) => setMoneda(e.target.value)}
                        >
                            <option value="USD">Dólar</option>
                            <option value="EUR">Euro</option>
                            <option value="PESO">Peso</option>
                        </select>
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={crearTransaccion}
                    >
                        Crear
                    </button>
                </form>
            </div>

            {/* Tabla de transacciones */}
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th>Monto</th>
                        <th>Moneda</th>
                        <th>Estado</th>
                        <th>Ubicación</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {transacciones.map((transaccion) => (
                        <tr key={transaccion.id}>
                            <td>{transaccion.descripcion}</td>
                            <td>${transaccion.monto}</td>
                            <td>{transaccion.moneda}</td>
                            <td>{transaccion.estado}</td>
                            <td>{transaccion.ubicacion}</td>
                            <td>
                                <button className="btn btn-warning me-2">Editar</button>
                                <button className="btn btn-danger">Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

};

export default Transacciones;
