import { Component } from '@angular/core';
import Amplify, { Storage, Predictions } from 'aws-amplify';
import { AmazonAIPredictionsProvider } from '@aws-amplify/predictions';
import awsconfig from '../../src/aws-exports';
import mic from 'microphone-stream';
Amplify.configure(awsconfig);
Amplify.addPluggable(new AmazonAIPredictionsProvider());

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'recording';
  response =
    'Press start recording to begin your transcription. Press STOP recording once you finish speaking.';
  recording = false;
  micStream: any;
  buffer = [];

  startRecording() {
    console.log('start recording');
    this.reset();

    window.navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then((stream) => {
        const startMic = new mic();

        console.log(startMic);
        startMic.setStream(stream);
        startMic.on('data', (chunk: any) => {
          var raw = mic.toRaw(chunk);
          if (raw == null) {
            return;
          }
          this.addData(raw);
        });
        this.recording = true;
        this.micStream = startMic;
      });
  }

  stopRecording() {
    console.log('stop recording');
    this.micStream.stop();
    this.micStream = null;
    this.recording = false;

    const resultBuffer = this.getData();

    this.convertFromBuffer(resultBuffer);
  }

  convertFromBuffer(bytes: any) {
    this.response = 'Converting text...';

    Predictions.convert({
      transcription: {
        source: {
          bytes,
        },
        language: 'en-US', // other options are "en-GB", "fr-FR", "fr-CA", "es-US"
      },
    })
      .then(({ transcription: { fullText } }) => {
        this.response = fullText;
        console.log(fullText);
      })
      .catch((err) => (this.response = JSON.stringify(err, null, 2)));
  }

  reset() {
    this.newBuffer();
    this.response =
      'Press start recording to begin your transcription. Press STOP recording once you finish speaking.';
  }

  addData(raw: any) {
    return this.add(raw);
  }

  getData() {
    return this.buffer;
  }

  add(raw: any) {
    this.buffer = this.buffer.concat(...raw);
    return this.buffer;
  }

  newBuffer() {
    console.log('resetting buffer');
    this.buffer = [];
  }
}
