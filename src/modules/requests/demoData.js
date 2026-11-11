// Datos de demostración del módulo Solicitudes (VITE_DEMO_MODE=true).
// Mismo formato que la API itsm-solicitudes (docs/modelo.json del repo del microservicio).

const CATALOGO = [
  ["Alta de cuenta de correo", "ACCESOS", 24, true, false],
  ["Reset de contraseña", "ACCESOS", 2, false, true],
  ["Acceso VPN", "ACCESOS", 4, true, false],
  ["Instalar software", "SOFTWARE", 48, true, true],
  ["Actualizar licencia Office", "SOFTWARE", 8, false, true],
  ["Configurar impresora", "HARDWARE", 4, false, true],
  ["Reemplazo de laptop", "HARDWARE", 72, true, false],
  ["Acceso a GitLab", "APLICACIONES", 8, true, false],
  ["Restaurar archivo borrado", "DATOS", 8, false, true],
  ["Renovar certificado SSL", "SEGURIDAD", 48, true, false],
];

const JUSTIFICACIONES = [
  "Necesito el acceso para el proyecto del trimestre.",
  "Mi equipo actual falla desde la semana pasada.",
  "Ingreso de una persona nueva al área.",
  "Requerido por auditoría interna.",
  "Reemplaza la configuración anterior que caducó.",
];

const iso = (date) => date.toISOString().replace(/\.\d{3}Z$/, "Z");

export function buildDemoCatalog(tenantId) {
  return CATALOGO.map(([nombre, categoria, sla_horas, requiere_aprobacion, es_cambio_estandar], index) => ({
    tenant_id: tenantId,
    servicio_id: `srv-${tenantId}-${String(index + 1).padStart(3, "0")}`,
    nombre,
    categoria,
    sla_horas,
    requiere_aprobacion,
    es_cambio_estandar,
    activo: true,
  }));
}

const ESTADOS = ["EN_APROBACION", "APROBADA", "COMPLETADA", "COMPLETADA", "RECHAZADA", "EN_APROBACION", "CANCELADA", "COMPLETADA"];

export function buildDemoRequests(tenantId) {
  const catalogo = buildDemoCatalog(tenantId);
  const now = Date.now();
  const items = [];
  for (let n = 1; n <= 36; n += 1) {
    const servicio = catalogo[n % catalogo.length];
    let estado = ESTADOS[n % ESTADOS.length];
    // Un servicio sin aprobación nunca queda EN_APROBACION / RECHAZADA.
    if (!servicio.requiere_aprobacion && ["EN_APROBACION", "RECHAZADA"].includes(estado)) estado = "APROBADA";
    const creado = new Date(now - n * 19 * 3600 * 1000);
    const actualizado = new Date(Math.min(now, creado.getTime() + 3 * 3600 * 1000));
    const item = {
      tenant_id: tenantId,
      solicitud_id: `req-${tenantId}-${String(n).padStart(6, "0")}`,
      servicio_id: servicio.servicio_id,
      solicitante_id: `usr-${tenantId}-${String((n % 6) + 1).padStart(5, "0")}`,
      estado,
      datos_formulario: { justificacion: JUSTIFICACIONES[n % JUSTIFICACIONES.length] },
      cambio_id: null,
      creado_en: iso(creado),
      actualizado_en: iso(actualizado),
      estado_creado: `${estado}#${iso(creado)}`,
    };
    if (["APROBADA", "COMPLETADA"].includes(estado)) item.aprobador_id = `usr-${tenantId}-00001`;
    if (estado === "RECHAZADA") item.motivo_rechazo = "Requiere aprobación del jefe de área.";
    items.push(item);
  }
  return items;
}
