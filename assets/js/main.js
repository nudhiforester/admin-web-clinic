/* Helpers shared by login and dashboard pages. */
const readJson = async (path) => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Tidak dapat memuat ${path} (${response.status}).`);
  }
  return response.json();
};

const setText = (selector, value) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
};

const getJakartaDateKey = (date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const formatVisitDateTime = (date) => new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
}).format(date);

const showAlert = (title, text, icon = "info") => {
  if (window.Swal) {
    return window.Swal.fire({ title, text, icon, confirmButtonText: "Mengerti" });
  }
  window.alert(`${title}\n\n${text}`);
  return Promise.resolve();
};

const showPatientDetails = (patient, card) => {
  const modal = document.getElementById("patient-modal");
  const photo = document.getElementById("patient-modal-photo");
  const status = document.getElementById("patient-modal-status");
  const noImage = "assets/img/patient/no-image.png";

  modal.style.setProperty("--patient-modal-background", getComputedStyle(card).backgroundColor);
  document.getElementById("patient-modal-title").textContent = patient.name;
  document.getElementById("patient-modal-id").textContent = patient.id;
  photo.src = patient.photo || noImage;
  photo.alt = `Foto ${patient.name}`;
  photo.onerror = () => {
    photo.onerror = null;
    photo.src = noImage;
  };
  document.getElementById("patient-modal-age").textContent = `${patient.age} tahun`;
  document.getElementById("patient-modal-gender").textContent = patient.gender;
  document.getElementById("patient-modal-visit").textContent = `${formatVisitDateTime(new Date(patient.visitAt))} WIB`;
  document.getElementById("patient-modal-purpose").textContent = patient.purpose;
  document.getElementById("patient-modal-diagnosis").textContent = patient.diagnosis;
  status.textContent = patient.handled ? "Sudah ditangani" : "Belum ditangani";
  status.className = `patient-modal-status ${patient.handled ? "handled" : "pending"}`;

  modal.showModal();
};

const showRecordDetails = (type, title, subtitle, details) => {
  const modal = document.getElementById("record-modal");
  document.getElementById("record-modal-eyebrow").textContent = type;
  document.getElementById("record-modal-title").textContent = title;
  document.getElementById("record-modal-subtitle").textContent = subtitle;

  const detailList = document.getElementById("record-modal-details");
  detailList.replaceChildren();
  details.forEach(([label, value]) => {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    if (label === "Obat dan Aturan Pakai") {
      item.className = "record-modal-full-width";
    }
    term.textContent = label;
    description.textContent = value;
    item.append(term, description);
    detailList.append(item);
  });

  modal.showModal();
};

const makeListItemInteractive = (item, label, openDetails) => {
  item.tabIndex = 0;
  item.setAttribute("role", "button");
  item.setAttribute("aria-haspopup", "dialog");
  item.setAttribute("aria-label", label);
  item.addEventListener("click", openDetails);
  item.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetails();
    }
  });
};

/* The login page reads facility and demo account data from local JSON files. */
const initializeLogin = async () => {
  const form = document.getElementById("login-form");
  const errorMessage = document.getElementById("login-error");
  const submitButton = form.querySelector('[type="submit"]');
  const passwordInput = document.getElementById("password");

  try {
    const [config, userData] = await Promise.all([
      readJson("data/json/config.json"),
      readJson("data/json/user.json")
    ]);
    const clinic = config.clinic;
    setText("[data-clinic-name]", clinic.name);
    setText("[data-clinic-location]", clinic.city);
    setText("[data-clinic-motto]", clinic.motto);
    document.querySelectorAll("[data-clinic-logo]").forEach((logo) => {
      logo.src = clinic.logo;
    });
    document.title = `Masuk | ${clinic.displayName}`;
    document.getElementById("login-help").textContent =
      `Jika terjadi kesalahan sistem, silakan hubungi admin di ${clinic.phone} untuk mendapatkan bantuan.`;

    document.getElementById("password-toggle").addEventListener("click", (event) => {
      const button = event.currentTarget;
      const isVisible = passwordInput.type === "text";
      passwordInput.type = isVisible ? "password" : "text";
      button.setAttribute("aria-pressed", String(!isVisible));
      button.setAttribute("aria-label", isVisible ? "Tampilkan password" : "Sembunyikan password");
      button.innerHTML = `<i class="bi ${isVisible ? "bi-eye" : "bi-eye-slash"}"></i>`;
    });

    document.getElementById("forgot-password").addEventListener("click", () => {
      showAlert("Lupa password?", `Silakan hubungi administrator fasilitas kesehatan di ${clinic.phone}.`);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      errorMessage.hidden = true;

      if (!form.reportValidity()) {
        return;
      }

      const email = form.elements.email.value.trim().toLowerCase();
      const password = form.elements.password.value;
      const user = userData.users.find((item) =>
        item.email.toLowerCase() === email && item.password === password
      );

      if (!user) {
        errorMessage.textContent = "Email atau password tidak sesuai.";
        errorMessage.hidden = false;
        passwordInput.focus();
        return;
      }

      sessionStorage.setItem("clinicDemoUser", JSON.stringify({
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email
      }));
      window.location.assign("index.html");
    });
  } catch (error) {
    submitButton.disabled = true;
    errorMessage.textContent = `Tidak dapat memuat data login. ${error.message}`;
    errorMessage.hidden = false;
  }
};

/* Populate the patient cards without inserting data as HTML. */
const renderPatients = (patients) => {
  const list = document.getElementById("patient-list");
  const noImage = "assets/img/patient/no-image.png";
  patients
    .slice()
    .sort((first, second) => new Date(second.visitAt) - new Date(first.visitAt))
    .forEach((patient) => {
      const card = document.createElement("article");
      card.className = `patient-card${patient.highlight ? " highlighted" : ""}`;
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-haspopup", "dialog");
      card.setAttribute("aria-label", `Tampilkan detail pasien ${patient.name}`);
      const openDetails = () => showPatientDetails(patient, card);
      card.addEventListener("click", openDetails);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetails();
        }
      });

      const header = document.createElement("div");
      header.className = "patient-card-header";
      const photo = document.createElement("img");
      photo.className = "patient-photo";
      photo.src = patient.photo || noImage;
      photo.alt = `Foto ${patient.name}`;
      photo.onerror = () => {
        photo.onerror = null;
        photo.src = noImage;
      };
      const title = document.createElement("strong");
      title.textContent = patient.name;
      header.append(photo, title);
      card.append(header);

      [
        ["Usia", `${patient.age} thn`],
        ["Gender", patient.gender],
        ["Kunjungan", formatVisitDateTime(new Date(patient.visitAt))],
        ["Tujuan", patient.purpose],
        ["Diagnosis", patient.diagnosis],
        ["Status", patient.handled ? "Sudah ditangani" : "Belum ditangani"]
      ].forEach(([label, value]) => {
        const row = document.createElement("p");
        const rowLabel = document.createElement("span");
        const rowValue = document.createElement("span");
        rowLabel.textContent = label;
        rowValue.textContent = value;
        if (label === "Status") {
          rowValue.className = `patient-status ${patient.handled ? "handled" : "pending"}`;
        }
        row.append(rowLabel, rowValue);
        card.append(row);
      });

      list.append(card);
    });
};

/* Render all stock records in a scrollable list with client-side search. */
const renderMedications = (medications, query) => {
    const list = document.getElementById("medication-list");
    const normalizedQuery = query.trim().toLocaleLowerCase("id");
    const filteredMedications = medications.filter((medication) =>
      [medication.name, medication.category, medication.strength, medication.form]
        .join(" ")
        .toLocaleLowerCase("id")
        .includes(normalizedQuery)
    );
    document.getElementById("medication-count").textContent =
      `Jumlah Obat: ${medications.length.toLocaleString("id-ID")} Record`;

    list.replaceChildren();
    filteredMedications.forEach((medication) => {
      const row = document.createElement("article");
      row.className = "medication-row";

      const details = document.createElement("div");
      const category = document.createElement("span");
      category.textContent = `${medication.category} · ${medication.form}`;
      const name = document.createElement("strong");
      name.textContent = `${medication.name} ${medication.strength}`;
      details.append(category, name);

      const stock = document.createElement("span");
      const stockLevel = medication.stock <= 0
        ? "empty"
        : medication.stock <= medication.minimumStock
          ? "low"
          : "available";
      stock.className = `stock-pill ${stockLevel}`;
      stock.textContent = stockLevel === "empty"
        ? "Habis"
        : `${medication.stock} ${medication.unit}`;
      stock.setAttribute("aria-label", stockLevel === "empty"
        ? "Stok habis"
        : `Stok ${medication.stock} ${medication.unit}`);

      row.append(details, stock);
      makeListItemInteractive(row, `Tampilkan detail obat ${medication.name}`, () => {
        const stockDescription = stockLevel === "empty"
          ? "Habis"
          : stockLevel === "low"
            ? "Stok menipis"
            : "Tersedia";
        showRecordDetails("Detail Obat", medication.name, medication.id, [
          ["Kategori", medication.category],
          ["Kekuatan", medication.strength],
          ["Bentuk", medication.form],
          ["Jumlah Stok", `${medication.stock.toLocaleString("id-ID")} ${medication.unit}`],
          ["Batas Stok Minimum", `${medication.minimumStock.toLocaleString("id-ID")} ${medication.unit}`],
          ["Kondisi Stok", stockDescription]
        ]);
      });
      list.append(row);
    });

    if (filteredMedications.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "empty-search";
      emptyMessage.textContent = medications.length === 0
        ? "Data obat belum tersedia."
        : "Obat tidak ditemukan.";
      list.append(emptyMessage);
    }
};

/* Render searchable prescription history with patient and status details. */
const renderPrescriptions = (prescriptions, medications, query = "") => {
    const list = document.getElementById("prescription-list");
    const normalizedQuery = query.trim().toLocaleLowerCase("id");
    const matchingPrescriptions = prescriptions.filter((prescription) =>
      [prescription.prescriptionNumber, prescription.patientName, prescription.status]
        .some((value) => value.toLocaleLowerCase("id").includes(normalizedQuery))
    );
    document.getElementById("prescription-count").textContent =
      `Jumlah Resep: ${prescriptions.length.toLocaleString("id-ID")} Record`;
    const sortedPrescriptions = matchingPrescriptions
      .slice()
      .sort((first, second) => new Date(second.issuedAt) - new Date(first.issuedAt));

    list.replaceChildren();
    sortedPrescriptions.forEach((prescription) => {
      const item = document.createElement("li");
      const details = document.createElement("span");
      const number = document.createElement("strong");
      const patient = document.createElement("small");
      const status = document.createElement("span");

      number.textContent = prescription.prescriptionNumber;
      patient.textContent = prescription.patientName;
      status.className = `prescription-status ${prescription.status.toLocaleLowerCase("id")}`;
      status.textContent = prescription.status;
      details.append(number, patient);

      item.append(details, status);
      makeListItemInteractive(item, `Tampilkan detail resep ${prescription.prescriptionNumber}`, () => {
        const issueDate = new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          dateStyle: "long",
          timeStyle: "short"
        }).format(new Date(prescription.issuedAt));
        const prescriptionItems = prescription.items.map((prescriptionItem) => {
          const medication = medications.find(({ id }) => id === prescriptionItem.medicationId);
          const medicationName = medication
            ? `${medication.name} ${medication.strength}`
            : prescriptionItem.medicationId;
          return `${medicationName} — ${prescriptionItem.dosage}, ${prescriptionItem.quantity} unit`;
        });
        showRecordDetails("Detail Resep", prescription.prescriptionNumber, prescription.patientName, [
          ["ID Pasien", prescription.patientId],
          ["Dokter", prescription.doctorName],
          ["Waktu Terbit", `${issueDate} WIB`],
          ["Status", prescription.status],
          ["Obat dan Aturan Pakai", prescriptionItems.join("\n")]
        ]);
      });
      list.append(item);
    });

    if (sortedPrescriptions.length === 0) {
      const emptyMessage = document.createElement("li");
      emptyMessage.className = "prescription-empty";
      emptyMessage.textContent = normalizedQuery
        ? "Resep tidak ditemukan."
        : "Belum ada riwayat resep.";
      list.append(emptyMessage);
    }
};

/* Initialize the dashboard once a valid demo session is present. */
const initializeDashboard = async () => {
  const session = sessionStorage.getItem("clinicDemoUser");
  if (!session) {
    window.location.replace("login.html");
    return;
  }
  const user = JSON.parse(session);

  try {
    const [config, patientData, medicationData, prescriptionData] = await Promise.all([
      readJson("data/json/config.json"),
      readJson("data/json/patient.json"),
      readJson("data/json/medication.json"),
      readJson("data/json/medication_request.json")
    ]);
    const clinic = config.clinic;
    setText("[data-clinic-name]", clinic.displayName);
    setText("[data-clinic-address]", clinic.address);
    setText("[data-user-name]", user.name);
    setText("[data-user-role]", user.role);
    document.querySelectorAll("[data-clinic-logo]").forEach((logo) => {
      logo.src = clinic.logo;
    });
    document.title = `Dashboard | ${clinic.displayName}`;

    document.getElementById("summary-patient-count").textContent =
      patientData.patients.length.toLocaleString("id-ID");
    document.getElementById("summary-medication-count").textContent =
      medicationData.medications.length.toLocaleString("id-ID");
    document.getElementById("summary-prescription-count").textContent =
      prescriptionData.prescriptions.length.toLocaleString("id-ID");

    const now = new Date();
    const todayKey = getJakartaDateKey(now);
    const patientsToday = patientData.patients.filter((patient) =>
      getJakartaDateKey(new Date(patient.visitAt)) === todayKey
    );
    const handledToday = patientsToday.filter((patient) => patient.handled).length;
    const pendingToday = patientsToday.length - handledToday;
    const progress = patientsToday.length
      ? Math.round((handledToday / patientsToday.length) * 100)
      : 0;
    document.getElementById("progress-handled-count").textContent = `${handledToday} sudah ditangani`;
    document.getElementById("progress-pending-count").textContent = `${pendingToday} belum ditangani`;
    document.getElementById("progress-percentage").textContent = `${progress}%`;
    document.querySelector(".progress-track").setAttribute("aria-valuenow", String(progress));
    document.querySelector(".progress-track").setAttribute(
      "aria-label",
      `${handledToday} dari ${patientsToday.length} pasien hari ini sudah ditangani`
    );
    document.querySelector(".progress-track span").style.width = `${progress}%`;
    renderPatients(patientData.patients);
    const patientModal = document.getElementById("patient-modal");
    document.getElementById("patient-modal-close").addEventListener("click", () => {
      patientModal.close();
    });
    const recordModal = document.getElementById("record-modal");
    document.getElementById("record-modal-close").addEventListener("click", () => {
      recordModal.close();
    });
    patientModal.addEventListener("click", (event) => {
      if (event.target === patientModal) {
        patientModal.close();
      }
    });
    recordModal.addEventListener("click", (event) => {
      if (event.target === recordModal) {
        recordModal.close();
      }
    });

    const prescriptionSearch = document.getElementById("prescription-search");
    const updatePrescriptionList = () =>
      renderPrescriptions(prescriptionData.prescriptions, medicationData.medications, prescriptionSearch.value);
    updatePrescriptionList();
    prescriptionSearch.addEventListener("input", updatePrescriptionList);

    const medicationSearch = document.getElementById("medication-search");
    const updateMedicationList = () => {
      renderMedications(medicationData.medications, medicationSearch.value);
    };
    updateMedicationList();
    medicationSearch.addEventListener("input", updateMedicationList);

    const currentDate = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta"
    }).format(now);
    document.getElementById("today-label").textContent = currentDate;

    const todayDate = new Date(`${todayKey}T12:00:00Z`);
    const visitsByDate = new Map();
    patientData.patients.forEach((patient) => {
      const visitDate = getJakartaDateKey(new Date(patient.visitAt));
      visitsByDate.set(visitDate, (visitsByDate.get(visitDate) || 0) + 1);
    });

    const formatChartDate = (date) => new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "short"
    }).format(date);
    const formatChartPeriodDate = (date, includeYear = false) => new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "short",
      ...(includeYear ? { year: "numeric" } : {})
    }).format(date);
    let chartPeriodOffset = 0;
    const getChartPeriod = () => {
      const periodEnd = new Date(todayDate);
      periodEnd.setUTCDate(periodEnd.getUTCDate() + chartPeriodOffset);
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(periodEnd);
        date.setUTCDate(date.getUTCDate() - (6 - index));
        return date;
      });
    };
    const getChartData = (dates) => dates.map((date) => ({
      x: formatChartDate(date),
      y: visitsByDate.get(getJakartaDateKey(date)) || 0
    }));
    const updateChartPeriod = () => {
      const dates = getChartPeriod();
      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];
      const periodLabel = document.getElementById("chart-period-label");
      periodLabel.textContent =
        `${formatChartPeriodDate(firstDate, firstDate.getUTCFullYear() !== lastDate.getUTCFullYear())} – ${formatChartPeriodDate(lastDate, true)}`;
      periodLabel.setAttribute(
        "aria-label",
        `Data dari ${formatChartPeriodDate(firstDate, true)} sampai ${formatChartPeriodDate(lastDate, true)}`
      );
      document.getElementById("chart-period-next").disabled = chartPeriodOffset >= 0;
      return dates;
    };
    const initialChartDates = updateChartPeriod();
    const chart = new ApexCharts(document.getElementById("visits-chart"), {
      chart: {
        type: "bar",
        height: 220,
        toolbar: { show: false },
        fontFamily: "Geologica, sans-serif",
        foreColor: "var(--muted)"
      },
      series: [{ name: "Pasien", data: getChartData(initialChartDates) }],
      colors: initialChartDates.map((date) =>
        getJakartaDateKey(date) === todayKey ? "#ff9d43" : "#b9e84b"
      ),
      plotOptions: {
        bar: {
          borderRadius: 9,
          columnWidth: "42%",
          distributed: true
        }
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: { show: false, padding: { left: -8, right: -8, bottom: -9 } },
      xaxis: {
        categories: initialChartDates.map(formatChartDate),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { fontSize: "10px" } }
      },
      yaxis: { show: false },
      tooltip: { y: { formatter: (value) => `${value} pasien` } }
    });
    await chart.render();

    const refreshChartPeriod = () => {
      const dates = updateChartPeriod();
      chart.updateOptions({
        series: [{ name: "Pasien", data: getChartData(dates) }],
        colors: dates.map((date) =>
          getJakartaDateKey(date) === todayKey ? "#ff9d43" : "#b9e84b"
        ),
        xaxis: { categories: dates.map(formatChartDate) }
      });
    };
    document.getElementById("chart-period-prev").addEventListener("click", () => {
      chartPeriodOffset -= 7;
      refreshChartPeriod();
    });
    document.getElementById("chart-period-next").addEventListener("click", () => {
      if (chartPeriodOffset < 0) {
        chartPeriodOffset = Math.min(0, chartPeriodOffset + 7);
        refreshChartPeriod();
      }
    });

    document.getElementById("download-chart").addEventListener("click", async () => {
      try {
        const image = await chart.dataURI();
        const download = document.createElement("a");
        download.href = image.imgURI;
        download.download = "grafik-pasien-minggu-ini.svg";
        download.click();
      } catch (error) {
        showAlert("Grafik tidak dapat diunduh", error.message, "error");
      }
    });
  } catch (error) {
    showAlert("Dashboard tidak dapat dimuat", error.message, "error");
  }

  /* Dashboard controls for navigation, preferences, search, and demo records. */
  const sidebar = document.getElementById("sidebar");
  const menuToggles = document.querySelectorAll("[data-menu-toggle]");
  menuToggles.forEach((menuToggle) => menuToggle.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 760px)").matches) {
      const isOpen = document.body.classList.toggle("sidebar-open");
      sidebar.classList.toggle("sidebar-collapsed", !isOpen);
      menuToggles.forEach((toggle) => {
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
      });
      return;
    }

    const isCollapsed = sidebar.classList.toggle("sidebar-collapsed");
    menuToggles.forEach((toggle) => {
      toggle.setAttribute("aria-expanded", String(!isCollapsed));
      toggle.setAttribute("aria-label", isCollapsed ? "Perluas menu" : "Ciutkan menu");
    });
  }));

  const activityTotal = [...document.querySelectorAll(".activity-list [data-activity-item] strong")]
    .reduce((total, count) => total + Number(count.textContent.trim()), 0);
  document.getElementById("activity-total-count").textContent =
    activityTotal.toLocaleString("id-ID");

  const notificationToggle = document.getElementById("notification-toggle");
  const notificationPanel = document.getElementById("notification-panel");
  notificationToggle.addEventListener("click", () => {
    const isOpen = notificationPanel.hidden;
    notificationPanel.hidden = !isOpen;
    notificationToggle.setAttribute("aria-expanded", String(isOpen));
  });

  const userMenuToggle = document.getElementById("user-menu-toggle");
  const userMenu = document.getElementById("user-menu");
  userMenuToggle.addEventListener("click", () => {
    const isOpen = userMenu.hidden;
    userMenu.hidden = !isOpen;
    userMenuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.getElementById("logout-button").addEventListener("click", () => {
    sessionStorage.removeItem("clinicDemoUser");
    window.location.assign("login.html");
  });

  const themeToggle = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("clinicTheme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
  }
  const updateThemeToggle = () => {
    const isDark = document.body.classList.contains("dark-theme");
    themeToggle.innerHTML = `<i class="bi ${isDark ? "bi-moon" : "bi-sun"}"></i>`;
    themeToggle.setAttribute("aria-label", isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap");
  };
  const setTheme = (isDark) => {
    document.body.classList.toggle("dark-theme", isDark);
    localStorage.setItem("clinicTheme", isDark ? "dark" : "light");
    updateThemeToggle();
  };
  updateThemeToggle();
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark-theme");
    if (isDark || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTheme(!isDark);
      return;
    }

    const buttonBounds = themeToggle.getBoundingClientRect();
    const overlay = document.createElement("div");
    overlay.className = "theme-reveal-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.setProperty("--reveal-x", `${buttonBounds.left + buttonBounds.width / 2}px`);
    overlay.style.setProperty("--reveal-y", `${buttonBounds.top + buttonBounds.height / 2}px`);
    themeToggle.disabled = true;
    overlay.addEventListener("animationend", () => {
      setTheme(true);
      overlay.remove();
      themeToggle.disabled = false;
    }, { once: true });
    document.body.append(overlay);
  });

  document.getElementById("patient-prev").addEventListener("click", () => {
    document.getElementById("patient-list").scrollBy({ left: -220, behavior: "smooth" });
  });
  document.getElementById("patient-next").addEventListener("click", () => {
    document.getElementById("patient-list").scrollBy({ left: 220, behavior: "smooth" });
  });

};

/* Route initialization based on the page's explicit data attribute. */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "login") {
    initializeLogin();
  } else if (page === "dashboard") {
    initializeDashboard();
  }
});