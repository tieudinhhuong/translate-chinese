const workers = [];
const data = [];
let dataCount = 0;
const dataBefore = [];
let checkWorkTimeout;
const maxCol = 15;
function initWorker() {
  for (let index = 0; index < navigator.hardwareConcurrency; index++) {
    const worker = new Worker("worker.js");
    worker.onmessage = function (e) {
      const row = dataBefore.shift();
      if (row) {
        worker.postMessage(row);
      }
      const wordElement = document.getElementById(`word${e.data["STT"]}`);
      if (e.data["success"]) {
        wordElement.classList.remove("failed");
        wordElement.classList.add("success");
      } else {
        wordElement.classList.add("failed");
        wordElement.classList.remove("success");
      }
      delete e.data["success"];
      data.push(e.data);
    };
    workers.push(worker);
  }
}
function startWorkers() {
  workers.forEach((worker) => {
    worker.postMessage(dataBefore.shift());
  });
}
function populateTable(data) {
  let row = 0;
  const tableElement = document.getElementById("translateTable");
  const tbodyElement = tableElement.getElementsByTagName("tbody")[0];
  {
    const theadElement = tableElement.getElementsByTagName("thead")[0];
    while (theadElement.firstChild) {
      theadElement.removeChild(theadElement.firstChild);
    }
    const headerRowelement = document.createElement("tr");
    const cornerCellElement = document.createElement("th");
    cornerCellElement.innerText = "#";
    headerRowelement.appendChild(cornerCellElement);
    for (let i = 0; i < maxCol; i++) {
      const headerCellLement = document.createElement("th");
      headerCellLement.innerText = `${i + 1}`;
      headerRowelement.appendChild(headerCellLement);
    }
    theadElement.appendChild(headerRowelement);
  }
  while (tbodyElement.firstChild) {
    tbodyElement.removeChild(tbodyElement.firstChild);
  }
  let index = row * maxCol;
  while (index < data.length) {
    const rowElement = document.createElement("tr");
    const headerCellElement = document.createElement("td");
    headerCellElement.classList.add("row");
    headerCellElement.innerText = `${row * maxCol}`;
    rowElement.appendChild(headerCellElement);
    for (let i = 0; i < maxCol; i++) {
      index = row * maxCol + i;
      if (index < data.length) {
        const cellElement = document.createElement("td");
        cellElement.setAttribute("id", `word${index + 1}`);
        cellElement.setAttribute("title", `STT ${index + 1}`);
        cellElement.classList.add("failed");
        cellElement.innerText = data[index]["CHỮ HÁN"];
        rowElement.appendChild(cellElement);
      }
    }
    row++;
    tbodyElement.appendChild(rowElement);
  }
}
function upload() {
  const file = document.getElementById("formFile");
  const reader = new FileReader();

  reader.onload = function (e) {
    const excelData = e.target.result;
    const workbook = XLSX.read(excelData, {
      type: "binary",
    });

    dataBefore.push(
      ...XLSX.utils.sheet_to_row_object_array(
        workbook.Sheets[workbook.SheetNames[0]]
      )
    );
    data.splice(0, data.length);
    dataCount = dataBefore.length;
    populateTable(dataBefore);
    startWorkers();
    checkWork();
  };

  reader.onerror = function (ex) {
    console.log(ex);
  };

  reader.readAsBinaryString(file.files[0]);
}
function checkWork() {
  console.log(dataCount);
  if (dataCount <= data.length) {
    clearTimeout(checkWorkTimeout);
    finishWork();
  } else {
    checkWorkTimeout = setTimeout(checkWork, 1000);
  }
}
function finishWork() {
  const file = document.getElementById("formFile");
  data.sort((a, b) => {
    return parseInt(a["STT"]) - parseInt(b["STT"]);
  });
  const ws = XLSX.utils.json_to_sheet(data, {
    header: ["STT", "CHỮ HÁN", "PHIÊN ÂM", "HÁN VIỆT", "NGHĨA"],
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const exportFileName = file.files[0].name.replace(".xlsx", "_full.xlsx");
  XLSX.writeFile(wb, exportFileName);
}
initWorker();
