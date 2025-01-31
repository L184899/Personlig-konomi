let utgiftChart = null;
let yearChart = null;  // Ny referanse til stolpediagrammet

// Hent hele datastrukturen for året
function hentAllData() {
  let lagretData = localStorage.getItem("okonomiData");
  if (lagretData) {
    return JSON.parse(lagretData);
  } else {
    return {};
  }
}

// Returnerer data for én måned
function hentMaanedsData(maaned) {
  let allData = hentAllData();
  return allData[maaned] || {};
}

// Lagrer input til localStorage for valgt måned
function lagreData() {
  const maaned = document.getElementById("monthSelect").value;
  let data = {
    loenn: document.getElementById("loenn").value || "0",
    mat:   document.getElementById("mat").value   || "0",
    leie:  document.getElementById("leie").value  || "0",
    strom: document.getElementById("strom").value || "0",
    annet: document.getElementById("annet").value || "0"
  };

  let allData = hentAllData();
  allData[maaned] = data;
  localStorage.setItem("okonomiData", JSON.stringify(allData));
}

function oppdaterSkjema() {
  const maaned = document.getElementById("monthSelect").value;
  const data = hentMaanedsData(maaned);

  document.getElementById("loenn").value = data.loenn || "";
  document.getElementById("mat").value   = data.mat   || "";
  document.getElementById("leie").value  = data.leie  || "";
  document.getElementById("strom").value = data.strom || "";
  document.getElementById("annet").value = data.annet || "";

  // Oppdater overskrift
  const monthHeading = document.getElementById("monthHeading");
  monthHeading.textContent = `Inntekt`;
}

function oppdaterDiagram() {
  const maaned = document.getElementById("monthSelect").value;
  const data = hentMaanedsData(maaned);

  let loenn = Number(data.loenn) || 0;
  let mat   = Number(data.mat)   || 0;
  let leie  = Number(data.leie)  || 0;
  let strom = Number(data.strom) || 0;
  let annet = Number(data.annet) || 0;

  let sumUtgifter = mat + leie + strom + annet;
  let gjenvBelop  = loenn - sumUtgifter;
  let gjenvBelopForDiagram = gjenvBelop < 0 ? 0 : gjenvBelop;

  const gjenvTekstEl = document.getElementById("gjenvTekst");
  gjenvTekstEl.textContent = `Gjenværende beløp: ${gjenvBelop} kr`;

  const ctx = document.getElementById("chartUtgifter");
  if (!ctx) return;

  if (utgiftChart) {
    utgiftChart.destroy();
  }

  utgiftChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ["Mat", "Boutgifter", "Strøm", "Annet", "Gjenværende beløp"],
      datasets: [{
        data: [mat, leie, strom, annet, gjenvBelopForDiagram],
        backgroundColor: [
          "#FF9800",
          "#FF5722",
          "#4CAF50",
          "#9C27B0",
          "#03A9F4"
        ]
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: mapKeyToFullName(maaned)
        }
      }
    }
  });
}

/**
 *  Oppdaterer stolpediagram for HELE ÅRET
 *  -> For hver måned: inntekt, utgifter, gjenværende beløp
 *     Tegn 3 stolper per måned
 */
function oppdaterYearChart() {
  // 1) Forbered data
  const manederKeys = ["jan","feb","mar","apr","mai","jun","jul","aug","sep","okt","nov","des"];
  // Hvis du vil vise fullstendige navn på x-aksen:
  const manederLabels = manederKeys.map(k => mapKeyToFullName(k));

  let allData = hentAllData();

  // For hver måned, beregn:
  let allInntekt = [];
  let allUtgifter = [];
  let allGjenv = [];

  manederKeys.forEach(maaned => {
    let mData = allData[maaned] || {};
    let loenn = Number(mData.loenn) || 0;
    let mat   = Number(mData.mat)   || 0;
    let leie  = Number(mData.leie)  || 0;
    let strom = Number(mData.strom) || 0;
    let annet = Number(mData.annet) || 0;

    let sumUtgifter = mat + leie + strom + annet;
    let gjenvBelop  = loenn - sumUtgifter;

    allInntekt.push(loenn);
    allUtgifter.push(sumUtgifter);
    allGjenv.push(gjenvBelop);
  });

  // 2) Tegn "grouped bar chart"
  const ctx = document.getElementById("yearChart");
  if (!ctx) return;

  // Slett tidligere chart om det finnes
  if (yearChart) {
    yearChart.destroy();
  }

  yearChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: manederLabels,
      datasets: [
        {
          label: "Inntekt",
          data: allInntekt,
          backgroundColor: "#4CAF50" 
        },
        {
          label: "Utgifter",
          data: allUtgifter,
          backgroundColor: "#FF5722" 
        },
        {
          label: "Gjenværende beløp",
          data: allGjenv,
          backgroundColor: "#03A9F4" 
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Beløp (kr)"
          }
        }
      },
      plugins: {
        title: {
          display: true,
        }
      }
    }
  });
 
  const totalGjenvBelop = allGjenv.reduce((acc, val) => acc + val, 0);

  // Oppdater <p id="totalGjenv">
  document.getElementById("totalGjenv").textContent =
    `Totalt overskudd: ${totalGjenvBelop} kr`;
}


// Hjelpefunksjon: mapp 'jan' -> 'Januar', etc.
function mapKeyToFullName(maanedKey) {
  const mapping = {
    jan: "Januar",
    feb: "Februar",
    mar: "Mars",
    apr: "April",
    mai: "Mai",
    jun: "Juni",
    jul: "Juli",
    aug: "August",
    sep: "September",
    okt: "Oktober",
    nov: "November",
    des: "Desember"
  };
  return mapping[maanedKey] || maanedKey;
}
