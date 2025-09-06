function formatearInputMonto(input) {
  // Elimina todo lo que no sea número
  let valor = input.value.replace(/\D/g, '');
  if (!valor) {
    input.value = '';
    return;
  }
  // Formatea con puntos de miles
  input.value = valor.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function calcular() {
  const montoStr = document.getElementById("monto").value.replace(/\./g, '');
  const aporteStr = document.getElementById("aporte").value.replace(/\./g, '');
  const objetivoStr = document.getElementById("objetivo").value.replace(/\./g, '');
  const monto = parseFloat(montoStr);
  const aporte = parseFloat(aporteStr);
  const objetivo = parseFloat(objetivoStr);
  const tna = parseFloat(document.getElementById("tna").value) / 100;

  if (isNaN(monto) || isNaN(aporte) || isNaN(objetivo) || isNaN(tna) || monto <= 0 || aporte < 0 || objetivo <= 0) {
    document.getElementById("resultado").innerHTML = "⚠️ Ingresá valores válidos";
    document.getElementById("progreso").innerHTML = "";
    if (window.graficoBarra) window.graficoBarra.destroy();
    return;
  }

  // Cálculo mes a mes
  let saldo = monto;
  let mes = 0;
  let historial = [];
  let ingresoMensual = 0;
  const tnaMensual = tna / 12;

  while (mes < 600) { // Máximo 50 años
    // Calcular ingreso pasivo mensual (interés del mes)
    ingresoMensual = saldo * tnaMensual;
    historial.push({
      mes: mes + 1,
      saldo: saldo,
      ingreso: ingresoMensual
    });
    if (ingresoMensual >= objetivo) break;
    saldo += aporte + ingresoMensual;
    mes++;
  }

  function formatearPesos(valor) {
    return valor
      .toFixed(2)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  if (ingresoMensual >= objetivo) {
    document.getElementById("resultado").innerHTML = `
      <strong>¡Objetivo alcanzado!</strong><br>
      Vas a generar $${formatearPesos(ingresoMensual)} mensuales pasivos<br>
      en <b>${mes + 1} meses</b> (${((mes + 1) / 12).toFixed(1)} años aprox).<br>
      Saldo acumulado: $${formatearPesos(saldo)}
    `;
  } else {
    document.getElementById("resultado").innerHTML = `
      <strong>No se alcanza el objetivo en 50 años.</strong>
    `;
  }

  // Tabla de progreso (máximo 24 meses para no saturar)
  let rows = '';
  for (let i = 0; i < historial.length && i < 24; i++) {
    rows += `<tr>
      <td>${historial[i].mes}</td>
      <td>$${formatearPesos(historial[i].saldo)}</td>
      <td>$${formatearPesos(historial[i].ingreso)}</td>
    </tr>`;
  }
  document.getElementById("progreso").innerHTML = `
    <strong>Progreso (primeros 24 meses):</strong>
    <div style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>Mes</th>
            <th>Saldo</th>
            <th>Ingreso mensual</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;

  // Gráfico de barras: evolución del ingreso pasivo mensual mes a mes
  const ctx = document.getElementById('graficoGanancia').getContext('2d');
  if (window.graficoBarra) window.graficoBarra.destroy();

  // Prepara los datos para el gráfico (máximo 60 meses para no saturar)
  const labels = historial.slice(0, 60).map(h => `Mes ${h.mes}`);
  const data = historial.slice(0, 60).map(h => h.ingreso);

  window.graficoBarra = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Ingreso pasivo mensual ($)',
        data: data,
        backgroundColor: data.map(v => v >= objetivo ? '#f59e42' : '#6366f1')
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return '$' + context.parsed.y.toLocaleString('es-AR', {minimumFractionDigits: 2});
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Ingreso pasivo mensual ($)', color: '#f3f4f6' },
          ticks: {
            color: '#f3f4f6',
            callback: function(value) {
              return '$' + value.toLocaleString('es-AR');
            }
          },
          grid: { color: '#27272a' }
        },
        x: {
          title: { display: true, text: 'Mes', color: '#f3f4f6' },
          ticks: { color: '#f3f4f6', maxRotation: 90, minRotation: 45 },
          grid: { color: '#27272a' }
        }
      }
    }
  });
}
