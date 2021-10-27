const electron = require("electron");
const { ReadStream } = require("original-fs");
const { desktopCapturer, remote } = electron;
const videoElement = $("video");
const startBtn = $("#startBtn");
const stopBtn = $("#stopBtn");
const videoSelectBtn = $("#videoSelectBtn");
const { dialog, Menu } = remote;

videoSelectBtn.onclick = getVideoSources;

async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => selectSource(source),
      };
    })
  );

  videoOptionsMenu.popup();
}

let mediaRecorder;
const recordedChunks = [];

async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constrains = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  };

  const steam = await navigator.mediaDevices.getUserMedia(constrains);

  videoElement.srcObject = steam;
  videoElement.play();

  const options = { mimeType: "video/webm; codec=vp9" };
  mediaRecorder = new MediaRecorder(steam, options);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

startBtn.onclick = (e) => {
  mediaRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.innerText = "Recording";
};

stopBtn.onclick = (e) => {
  mediaRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.innerText = "Start";
};

function handleDataAvailable(e) {
  console.log("video data available");
  recordedChunks.push(e.data);
}

const { writeFile } = require("fs");

async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codec=vp9",
  });

  const buffer = Buffer.from(await blob.arrayBuffer());
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.webm`,
  });

  console.log(filePath);

  writeFile(filePath, buffer, () => console.log("video saved successfully!"));
}

function $(selector) {
  return document.querySelector(selector);
}
