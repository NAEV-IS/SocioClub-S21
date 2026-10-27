// 1. Clase Actividad con método esAptaParaEdad(edad)
class Actividad {
    constructor(nombre, disciplina, dias, horario, edadMinima, edadMaxima, cupo, cuota, profesor) {
        this.nombre = nombre;
        this.disciplina = disciplina;
        this.dias = dias;
        this.horario = horario;
        this.edadMinima = edadMinima;
        this.edadMaxima = edadMaxima;
        this.cupo = cupo;
        this.cuota = cuota;
        this.profesor = profesor;
    }

    esAptaParaEdad(edad) {
        return edad >= this.edadMinima && edad <= this.edadMaxima;
    }
}

// 2. Array de 8 actividades con los datos exactos del enunciado
const actividades = [
    new Actividad("Fútbol infantil", "Fútbol", "Lun y Mié", "18:00", 6, 12, 40, 18000, "Diego Ferreyra"),
    new Actividad("Vóley mixto", "Vóley", "Mar y Jue", "19:00", 13, 60, 24, 20000, "Laura Ceballos"),
    new Actividad("Básquet juvenil", "Básquet", "Lun y Vie", "19:30", 12, 17, 20, 19000, "Martín Oviedo"),
    new Actividad("Natación", "Natación", "Mar y Jue", "17:00", 5, 70, 30, 26000, "Sofía Bustos"),
    new Actividad("Patín artístico", "Patín", "Mié y Vie", "17:30", 5, 15, 25, 21000, "Carla Peralta"),
    new Actividad("Ajedrez", "Ajedrez", "Sáb", "10:00", 8, 99, 16, 9000, "Raúl Giménez"),
    new Actividad("Funcional adultos", "Fitness", "Lun, Mié y Vie", "20:30", 18, 65, 30, 22000, "Paula Luna"),
    new Actividad("Yoga", "Bienestar", "Mar y Jue", "09:00", 16, 99, 15, 17000, "Inés Arguello")
];

// 3. Renderizado dinámico del catálogo
function renderCatalogo(lista) {
    const contenedor = document.getElementById("catalogo");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (lista.length === 0) {
        const aviso = document.createElement("p");
        aviso.textContent = "No hay actividades que coincidan con el filtro.";
        contenedor.appendChild(aviso);
        return;
    }

    lista.forEach((act) => {
        const card = document.createElement("article");
        card.className = "card";
        card.setAttribute("data-disciplina", act.disciplina);

        card.innerHTML = `
            <h3>${act.nombre}</h3>
            <ul>
                <li><strong>Disciplina:</strong> ${act.disciplina}</li>
                <li><strong>Profesor/a:</strong> ${act.profesor}</li>
                <li><strong>Días y horario:</strong> ${act.dias} · ${act.horario} hs</li>
                <li><strong>Edades:</strong> ${act.edadMinima} a ${act.edadMaxima} años</li>
                <li><strong>Cupo máximo:</strong> ${act.cupo} lugares</li>
                <li><strong>Cuota mensual:</strong> $${act.cuota.toLocaleString("es-AR")}</li>
            </ul>
        `;

        contenedor.appendChild(card);
    });
}

// 4. Filtro combinado por disciplina y edad
function aplicarFiltros() {
    const selectDisciplina = document.getElementById("filtroDisciplina");
    const inputEdad = document.getElementById("filtroEdad");
    if (!selectDisciplina || !inputEdad) return;

    const disciplinaSeleccionada = selectDisciplina.value;
    const edadValor = inputEdad.value.trim();
    const edadNumero = edadValor !== "" ? parseInt(edadValor, 10) : null;

    const filtradas = actividades.filter((act) => {
        const coincideDisciplina =
            disciplinaSeleccionada === "todas" || act.disciplina === disciplinaSeleccionada;
        const coincideEdad =
            edadNumero === null || isNaN(edadNumero) || act.esAptaParaEdad(edadNumero);
        return coincideDisciplina && coincideEdad;
    });

    renderCatalogo(filtradas);
}

// 5. Validación de formulario de preinscripción (incluye RN7: DNI 7 u 8 dígitos sin puntos)
function validarFormulario(evento) {
    evento.preventDefault();

    // Limpiar errores previos y ocultar mensaje de éxito
    document.querySelectorAll(".error").forEach((span) => {
        span.textContent = "";
    });
    const mensajeExito = document.getElementById("mensajeExito");
    if (mensajeExito) {
        mensajeExito.hidden = true;
    }

    const nombre = document.getElementById("nombre").value.trim();
    const dni = document.getElementById("dni").value.trim();
    const email = document.getElementById("email").value.trim();
    const edadTexto = document.getElementById("edad").value.trim();
    const actividad = document.getElementById("actividad").value;

    let esValido = true;

    if (nombre === "") {
        document.getElementById("errorNombre").textContent = "El nombre y apellido es obligatorio.";
        esValido = false;
    }

    // RN7: DNI debe tener 7 u 8 dígitos numéricos, sin puntos
    const regexDni = /^[0-9]{7,8}$/;
    if (!regexDni.test(dni)) {
        document.getElementById("errorDni").textContent =
            "El DNI debe tener 7 u 8 dígitos numéricos, sin puntos.";
        esValido = false;
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)) {
        document.getElementById("errorEmail").textContent = "Ingresá un correo electrónico válido.";
        esValido = false;
    }

    const edad = parseInt(edadTexto, 10);
    if (isNaN(edad) || edad < 1 || edad > 99) {
        document.getElementById("errorEdad").textContent = "La edad debe estar entre 1 y 99 años.";
        esValido = false;
    }

    if (actividad === "") {
        document.getElementById("errorActividad").textContent = "Seleccioná una actividad de interés.";
        esValido = false;
    }

    if (esValido && mensajeExito) {
        mensajeExito.hidden = false;
        document.getElementById("formPreinscripcion").reset();
    }
}

// 6. Carga dinámica de opciones en el select de preinscripción
function cargarSelectActividades() {
    const selectActividad = document.getElementById("actividad");
    if (!selectActividad) return;

    actividades.forEach((act) => {
        const option = document.createElement("option");
        option.value = act.nombre;
        option.textContent = `${act.nombre} (${act.edadMinima} a ${act.edadMaxima} años)`;
        selectActividad.appendChild(option);
    });
}

// 7. Inicialización y registro de eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    renderCatalogo(actividades);
    cargarSelectActividades();

    const filtroDisciplina = document.getElementById("filtroDisciplina");
    if (filtroDisciplina) {
        filtroDisciplina.addEventListener("change", aplicarFiltros);
    }

    const filtroEdad = document.getElementById("filtroEdad");
    if (filtroEdad) {
        filtroEdad.addEventListener("input", aplicarFiltros);
    }

    const btnLimpiar = document.getElementById("btnLimpiar");
    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", () => {
            if (filtroDisciplina) filtroDisciplina.value = "todas";
            if (filtroEdad) filtroEdad.value = "";
            renderCatalogo(actividades);
        });
    }

    const formPreinscripcion = document.getElementById("formPreinscripcion");
    if (formPreinscripcion) {
        formPreinscripcion.addEventListener("submit", validarFormulario);
    }

    const btnVolver = document.getElementById("btnVolver");
    if (btnVolver) {
        btnVolver.addEventListener("click", () => {
            window.history.back();
        });
    }
});
