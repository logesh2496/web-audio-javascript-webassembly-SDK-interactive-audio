// Based on this multiple player example: https://github.com/designbyadrian/web-audio-javascript-webassembly-SDK-interactive-audio/tree/example/multiple
// by designbyadrian

import {
  SuperpoweredGlue,
  SuperpoweredWebAudio,
} from "./superpowered/SuperpoweredWebAudio.js";

import songs from "./mp3-tracks/index.js";

var webaudioManager = null; // The SuperpoweredWebAudio helper class managing Web Audio for us.
var Superpowered = null; // A Superpowered instance.
var audioNode = null; // This example uses one audio node only.
var content = null; // The <div> displaying everything.

function playNote(e) {
  songs.map(({ url }, i) => {
    audioNode.sendMessageToAudioScope({ play: url });
  });
}

function onMessageFromAudioScope(message) {
  if (message.loaded) {
    // UI: innerHTML may be ugly but keeps this example small

    let html =
      "<button class='btn-note'>Play all</button><span id='num-playing' style='font-weight: 600;'></span><div> Songs: </div>";

    songs.forEach((note) => {
      html += `<div value="${note.url}">${note.name}</div>`;
    });

    content.innerHTML = html;
    const btn = document.getElementsByClassName("btn-note")[0];
    btn.addEventListener("mousedown", playNote);

    webaudioManager.audioContext.resume();
  }

  if (typeof message.activePlayersData !== "undefined") {
    document.getElementById(
      "num-playing"
    ).innerText = `num players playing: ${message.activePlayersData.numPlayersPlaying}`;
  }
}

// when the START button is clicked
async function start() {
  content.innerText = "Creating the audio context and node...";
  webaudioManager = new SuperpoweredWebAudio(44100, Superpowered);
  let currentPath = window.location.pathname.substring(
    0,
    window.location.pathname.lastIndexOf("/")
  );
  audioNode = await webaudioManager.createAudioNodeAsync(
    currentPath + "/processor.js",
    "MyProcessor",
    onMessageFromAudioScope
  );

  // audioNode -> audioContext.destination (audio output)
  webaudioManager.audioContext.suspend();
  audioNode.connect(webaudioManager.audioContext.destination);

  content.innerText = "Downloading and decoding music...";
}

async function loadJS() {
  // download and instantiate Superpowered
  Superpowered = await SuperpoweredGlue.fetch(
    "./superpowered/superpowered.wasm"
  );
  Superpowered.Initialize({
    licenseKey: "ExampleLicenseKey-WillExpire-OnNextUpdate",
    enableAudioAnalysis: false,
    enableFFTAndFrequencyDomain: false,
    enableAudioTimeStretching: true,
    enableAudioEffects: true,
    enableAudioPlayerAndDecoder: true,
    enableCryptographics: false,
    enableNetworking: false,
  });

  // display the START button
  content = document.getElementById("content");
  content.innerHTML = '<button id="startButton">START</button>';
  document.getElementById("startButton").addEventListener("click", start);
}

loadJS();
