/* ==========================================================
   Construye Aplicaciones Web · Script principal
   1 Utilidades · 2 Alertas · 3 Menú · 4 Progreso y botón subir
   5 Botones copiar · 6 Formularios · 7 Aviso de bienvenida
   8 Demostración de alertas
   ========================================================== */
"use strict";

/* 1. Utilidades */
function crearElemento(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto) el.textContent = texto;
  return el;
}

/* 2. Alertas visuales
   tipo: "exito" | "error" | "aviso" | "info" */
function mostrarAlerta(contenedor, tipo, titulo, mensaje, extra) {
  const alerta = crearElemento("div", "alerta alerta-" + tipo);
  alerta.setAttribute("role", tipo === "error" ? "alert" : "status");

  const cuerpo = crearElemento("div", "alerta-contenido");
  cuerpo.appendChild(crearElemento("strong", "", titulo));
  if (mensaje) cuerpo.appendChild(crearElemento("p", "", mensaje));
  if (extra) cuerpo.appendChild(extra);

  const cerrar = crearElemento("button", "alerta-cerrar", "×");
  cerrar.type = "button";
  cerrar.setAttribute("aria-label", "Cerrar mensaje");
  cerrar.addEventListener("click", function () { alerta.remove(); });

  alerta.appendChild(cuerpo);
  alerta.appendChild(cerrar);
  contenedor.replaceChildren(alerta);
  return alerta;
}

function contenedorFlotante() {
  let caja = document.getElementById("avisos");
  if (!caja) {
    caja = crearElemento("div", "avisos-flotantes");
    caja.id = "avisos";
    caja.setAttribute("aria-live", "polite");
    document.body.appendChild(caja);
  }
  return caja;
}

/* 3. Menú responsivo */
function iniciarMenu() {
  const barra = document.querySelector(".barra-navegacion");
  const boton = document.querySelector(".boton-menu");
  if (!barra || !boton) return;
  boton.addEventListener("click", function () {
    const abierto = barra.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", String(abierto));
  });
}

/* 4. Barra de progreso de lectura y botón para subir */
function iniciarProgreso() {
  const barra = crearElemento("div", "progreso");
  barra.setAttribute("aria-hidden", "true");
  const relleno = document.createElement("span");
  barra.appendChild(relleno);
  document.body.appendChild(barra);

  const subir = crearElemento("button", "subir", "↑");
  subir.type = "button";
  subir.setAttribute("aria-label", "Volver arriba");
  subir.addEventListener("click", function () { window.scrollTo({ top: 0 }); });
  document.body.appendChild(subir);

  function actualizar() {
    const alto = document.documentElement.scrollHeight - window.innerHeight;
    const porcentaje = alto > 0 ? (window.scrollY / alto) * 100 : 0;
    relleno.style.width = porcentaje + "%";
    subir.classList.toggle("visible", window.scrollY > 400);
  }
  window.addEventListener("scroll", actualizar, { passive: true });
  actualizar();
}

/* 5. Botón "Copiar" en los bloques de código */
function iniciarCopiar() {
  document.querySelectorAll("pre").forEach(function (bloque) {
    if (!navigator.clipboard) return;
    const boton = crearElemento("button", "copiar", "Copiar");
    boton.type = "button";
    boton.addEventListener("click", function () {
      navigator.clipboard.writeText(bloque.innerText.replace(/^Copiar\s*/, "")).then(function () {
        boton.textContent = "Copiado";
        setTimeout(function () { boton.textContent = "Copiar"; }, 1800);
      }).catch(function () {
        boton.textContent = "No se pudo copiar";
      });
    });
    bloque.appendChild(boton);
  });
}

/* 6. Formularios con validación y mensajes */
const MENSAJES = {
  valueMissing: "Este campo es obligatorio.",
  typeMismatch: "El formato no es válido.",
  tooShort: "Escribe más caracteres.",
  tooLong: "Escribiste demasiados caracteres.",
  rangeUnderflow: "El valor es menor al permitido.",
  rangeOverflow: "El valor es mayor al permitido.",
  patternMismatch: "Usa solo el formato indicado."
};

function mensajeDeError(campo) {
  const validez = campo.validity;
  for (const clave in MENSAJES) {
    if (validez[clave]) return (clave === "patternMismatch" && campo.dataset.mensaje) || MENSAJES[clave];
  }
  return "Revisa este campo.";
}

function validarCampo(campo) {
  const aviso = document.getElementById(campo.id + "-error");
  if (campo.checkValidity()) {
    campo.classList.remove("invalido");
    campo.removeAttribute("aria-invalid");
    if (aviso) aviso.textContent = "";
    return true;
  }
  campo.classList.add("invalido");
  campo.setAttribute("aria-invalid", "true");
  if (aviso) aviso.textContent = mensajeDeError(campo);
  return false;
}

function resumenDeDatos(formulario) {
  const datos = new FormData(formulario);
  const lista = document.createElement("dl");
  const etiquetas = {
    nombre: "Nombre", apellido: "Apellido", edad: "Edad", correo: "Correo",
    especialidad: "Especialidad", turno: "Turno", intereses: "Intereses", comentarios: "Comentarios"
  };
  Object.keys(etiquetas).forEach(function (clave) {
    const valores = datos.getAll(clave).filter(Boolean);
    if (!valores.length) return;
    lista.appendChild(crearElemento("dt", "", etiquetas[clave]));
    lista.appendChild(crearElemento("dd", "", valores.join(", ")));
  });
  return lista;
}

function iniciarFormularios() {
  document.querySelectorAll("form[data-validar]").forEach(function (formulario) {
    const zona = formulario.querySelector(".zona-alerta");
    const campos = formulario.querySelectorAll("input, select, textarea");

    campos.forEach(function (campo) {
      if (campo.type === "submit" || campo.type === "reset") return;
      campo.addEventListener("blur", function () { validarCampo(campo); });
      campo.addEventListener("input", function () {
        if (campo.classList.contains("invalido")) validarCampo(campo);
      });
    });

    const comentarios = formulario.querySelector("textarea[maxlength]");
    const contador = formulario.querySelector(".contador");
    if (comentarios && contador) {
      const maximo = comentarios.getAttribute("maxlength");
      const pintar = function () { contador.textContent = comentarios.value.length + " / " + maximo; };
      comentarios.addEventListener("input", pintar);
      pintar();
    }

    formulario.addEventListener("submit", function (evento) {
      evento.preventDefault();
      let primerError = null;
      let errores = 0;
      campos.forEach(function (campo) {
        if (campo.type === "submit" || campo.type === "reset") return;
        if (!validarCampo(campo)) {
          errores++;
          if (!primerError) primerError = campo;
        }
      });
      if (errores > 0) {
        mostrarAlerta(zona, "error", "Revisa el formulario",
          "Hay " + errores + (errores === 1 ? " campo" : " campos") + " por corregir.");
        primerError.focus();
        return;
      }
      mostrarAlerta(zona, "exito", "¡Formulario enviado correctamente!",
        "Estos son los datos que registraste:", resumenDeDatos(formulario));
      zona.scrollIntoView({ block: "nearest" });
    });

    formulario.addEventListener("reset", function () {
      campos.forEach(function (campo) {
        campo.classList.remove("invalido");
        campo.removeAttribute("aria-invalid");
      });
      formulario.querySelectorAll(".error-campo").forEach(function (e) { e.textContent = ""; });
      if (contador) contador.textContent = "0 / " + comentarios.getAttribute("maxlength");
      mostrarAlerta(zona, "info", "Formulario limpio", "Puedes capturar tus datos de nuevo.");
    });
  });
}

/* 7. Aviso de bienvenida (una vez por sesión, solo en el inicio) */
function iniciarBienvenida() {
  if (document.body.dataset.pagina !== "inicio") return;
  try {
    if (sessionStorage.getItem("bienvenida")) return;
    sessionStorage.setItem("bienvenida", "1");
  } catch (e) {
    /* El navegador puede bloquear el almacenamiento; se muestra de todos modos. */
  }
  const alerta = mostrarAlerta(contenedorFlotante(), "info", "¡Bienvenido!",
    "Usa el menú superior para recorrer los temas del proyecto.");
  setTimeout(function () { alerta.remove(); }, 7000);
}

/* 8. Botones de demostración de alertas (atributos data-alerta) */
function iniciarDemosAlerta() {
  document.querySelectorAll("[data-alerta]").forEach(function (boton) {
    boton.addEventListener("click", function () {
      const zona = document.getElementById(boton.dataset.destino);
      if (zona) mostrarAlerta(zona, boton.dataset.alerta, boton.dataset.titulo, boton.dataset.mensaje);
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  iniciarMenu();
  iniciarProgreso();
  iniciarCopiar();
  iniciarFormularios();
  iniciarBienvenida();
  iniciarDemosAlerta();
});
