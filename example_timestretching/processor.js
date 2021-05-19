import {
  SuperpoweredWebAudio,
  SuperpoweredTrackLoader,
} from "./superpowered/SuperpoweredWebAudio.js";
import songs from "./mp3-tracks/index.js";

const players = {};
class MyProcessor extends SuperpoweredWebAudio.AudioWorkletProcessor {
  // runs after the constructor
  onReady() {
    songs.forEach(({ url }) => {
      const player = new this.Superpowered.AdvancedAudioPlayer(
        this.samplerate,
        2,
        2,
        0,
        0.501,
        2,
        false
      );
      players[url] = player;
      SuperpoweredTrackLoader.downloadAndDecode(url, this);
    });
  }

  onMessageFromMainScope(message) {
    if (message.SuperpoweredLoaded) {
      const { buffer, url } = message.SuperpoweredLoaded;
      const player = players[url];
      const pointer = this.Superpowered.arrayBufferToWASM(buffer);
      player.openMemory(pointer, false, false);

      player.loaded = true;
      if (Object.keys(players).every((k) => players[k].loaded)) {
        this.sendMessageToMainScope({ loaded: true });
      }
    }
    if (message.play) {
      players[message.play].play();
      const playersPlaying = Object.keys(players)
        .filter((key) => players[key].isPlaying())
        .reduce((obj, key) => {
          obj[key] = players[key];
          return obj;
        }, {});

      const activePlayersData = {
        numPlayersPlaying: Object.keys(playersPlaying).length,
      };
      this.sendMessageToMainScope({ activePlayersData });
    }
  }

  processAudio(inputBuffer, outputBuffer, buffersize, parameters) {
    let mix = false;

    Object.keys(players).forEach((key, idx) => {
      const player = players[key];

      const hasAudioOutput = player.processStereo(
        outputBuffer.pointer,
        mix,
        buffersize,
        0.7
      );
      mix |= hasAudioOutput;
    });
    if (!mix) {
      for (let n = 0; n < buffersize * 2; n++) outputBuffer.array[n] = 0;
    }
  }
}

if (typeof AudioWorkletProcessor === "function")
  registerProcessor("MyProcessor", MyProcessor);
export default MyProcessor;
