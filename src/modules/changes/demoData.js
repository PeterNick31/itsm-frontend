// Datos de demostración del módulo Cambios (se usan con VITE_DEMO_MODE=true).
// Mismo formato que la API itsm-cambios (docs/modelo.json).

const TITULOS = [
  ["Actualizar firmware del firewall perimetral", "Aplicar parche de seguridad del fabricante.", "Restaurar firmware previo desde backup."],
  ["Renovar certificado TLS del portal", "Instalar certificado nuevo y reiniciar balanceador.", "Reinstalar el certificado anterior."],
  ["Aplicar parches mensuales de Windows Server", "Instalar parches por lotes en ventana nocturna.", "Desinstalar KB problemáticos."],
  ["Ampliar almacenamiento del servidor de archivos", "Agregar 2 TB al volumen compartido.", "Revertir snapshot del volumen."],
  ["Cambiar reglas de VPN para sede remota", "Agregar subred y políticas en el concentrador.", "Restaurar configuración anterior."],
  ["Escalar cluster de aplicaciones", "Agregar dos nodos al grupo de autoescalado.", "Reducir capacidad al valor anterior."],
];
const ESTADOS = ["BORRADOR", "PENDIENTE_APROBACION", "APROBADO", "PROGRAMADO", "IMPLEMENTADO", "RECHAZADO", "PROGRAMADO", "IMPLEMENTADO"];
const TIPOS = ["NORMAL", "ESTANDAR", "NORMAL", "EMERGENCIA"];
const RIESGOS = ["ALTO", "MEDIO", "BAJO"];

function iso(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function buildDemoChanges(tenantId) {
  const now = new Date();
  const items = [];
  for (let n = 1; n <= 36; n += 1) {
    const [titulo, plan, rollback] = TITULOS[n % TITULOS.length];
    const estado = ESTADOS[n % ESTADOS.length];
    const creado = new Date(now.getTime() - n * 26 * 3600 * 1000);
    const item = {
      tenant_id: tenantId,
      cambio_id: `chg-${tenantId}-${String(n).padStart(6, "0")}`,
      titulo,
      descripcion: `${titulo}. Registro de demostración #${n}.`,
      tipo: TIPOS[n % TIPOS.length],
      riesgo: RIESGOS[n % RIESGOS.length],
      estado,
      plan_implementacion: plan,
      plan_rollback: rollback,
      solicitante_id: `usr-${tenantId}-${String((n % 100) + 2).padStart(5, "0")}`,
      aprobador_id: ["APROBADO", "PROGRAMADO", "IMPLEMENTADO", "RECHAZADO"].includes(estado) ? `usr-${tenantId}-00001` : null,
      motivo_rechazo: estado === "RECHAZADO" ? "Plan de rollback insuficiente." : null,
      problema_id: n % 3 === 0 ? `prb-${tenantId}-${String(n * 7).padStart(6, "0")}` : null,
      solicitud_id: null,
      creado_en: iso(creado),
      actualizado_en: iso(creado),
    };
    if (estado === "PROGRAMADO" || estado === "IMPLEMENTADO") {
      const offsetDays = estado === "PROGRAMADO" ? (n % 25) + 1 : -((n % 20) + 1);
      const inicio = new Date(now);
      inicio.setDate(inicio.getDate() + offsetDays);
      inicio.setHours(n % 2 ? 22 : 2, 0, 0, 0);
      item.ventana_inicio = iso(inicio);
      item.ventana_fin = iso(new Date(inicio.getTime() + 2 * 3600 * 1000));
    }
    items.push(item);
  }
  return items;
}
