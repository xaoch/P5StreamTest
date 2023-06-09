let p5lm;
let video;
let poseNet;
let poses = [];
let signals;
let index=0;
let maxIndex=0;
let scrollingWaveform;
let mic, fft;
let powerHistory =[];

const numFftBins = 1024;
const showLengthInSeconds = 15;
let colorSchemeIndex = 0;

function modelReady() {
  select('#status').html('Model Loaded');
}

function readEdfFile( buff ){
    decoder.setInput( buff );
    decoder.decode();
    var output = decoder.getOutput();
    console.log( output );
  }


function drawNose(keypoint)  {
    // Loop through all the poses detected
    fill(255, 0, 0);
    noStroke();
    ellipse(keypoint.position.x/3*width/320, keypoint.position.y/3*height/240, 10, 10) 
  }

function setup() {
        // Create the canvas
        var canvas = createCanvas(600, 600);
        let constraints = {audio: false, "video": {
        "width": 320,
        "height": 240
          }};
        video = createCapture(constraints);
        poseNet = ml5.poseNet(video, modelReady);
        // This sets up an event that fills the global variable "poses"
        // with an array every time new poses are detected
        poseNet.on('pose', function(results) {
          poses = results;
        });
        // Hide the video element, and just show the canvas
        video.hide();
        canvas.mousePressed(userStartAudio);
        mic = new p5.AudioIn();

        // start the Audio Input.
        // By default, it does not .connect() (to the computer speakers)
        mic.start();
        let micSamplingRate = sampleRate();
        let samplingRate=44100

        fft = new p5.FFT(0, numFftBins);
        fft.setInput(mic);


        var decoder = new edfdecoder.EdfDecoder();
        const fileName = 'S001E01.edf';

        fetch(fileName)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                decoder.setInput(arrayBuffer);
                decoder.decode();
                signals = decoder.getOutput();
                maxIndex=signals.getNumberOfRecords()
                print(maxIndex)
                console.log( signals );
                //readEdfFile(arrayBuffer);
            })
            .catch(error => {
                console.error('Error loading EDF file:', error);
            });
        
        p5lm = new p5LiveMedia(this, "DATA", null, "Mindhive-Stream");

        backgroundColor = color(90);
        let yTop = height/3;
        let yHeight = height / 3;
        scrollingSpectrogram = new Spectrogram(0, yTop, width, yHeight, backgroundColor, showLengthInSeconds);
        noFill();


    };

    function audioInErrorCallback(){
      print("Error setting up the microphone input"); 
    }

    // Execute the sketch
function draw() {
        // Clean the canvas
        background(255)
        fill(255);
        image(video, 0, 0, width/3, height/3);
        let waveform = fft.waveform(); // analyze the waveform
        let spectrum = fft.analyze();
        scrollingSpectrogram.update(spectrum);
        scrollingSpectrogram.draw();
        fill(255);
        textSize(12)
        text("fps: " + nfc(frameRate(), 1), 6, 30);
        textSize(32);
        fill(255,0,0);
        text("Video",400,100)
        text("Audio",400,300)
        text("Brain",400,500)

        


        power=0
        if (typeof signals != 'undefined') {
            rawsig=signals.getPhysicalSignal(0, index+1);
            power=rawsig[0]
            index=index+1
            if(index>maxIndex-2){
                index=0
            }
          }
        powerHistory.push(power)
        stroke(128);
        noFill();
        beginShape();
        for (var i=0; i< powerHistory.length; i++){
          var y = map(powerHistory[i],-100,100,height,height*2/3);
          if(y<height*2/3){
            y=height*2/3
          }
          vertex(i,y);
        }
        endShape();

        if (powerHistory.length > width){
          powerHistory.splice(0,1)
        }
        let vol = mic.getLevel()*100;
        
        xpos=0;
        ypos=0;
        if(poses.length>0){
          let pose = poses[0].pose;
          let keypoint = pose.keypoints[0];
          drawNose(keypoint);
          xpos=keypoint.position.x;
          ypos=keypoint.position.y;
        }
        
        select('#nose').html('<b>Nose position</b>:  X='+parseInt(xpos)+ ' - Y='+parseInt(ypos));
        select('#volume').html('<b>Volume</b>: '+vol)
        select('#power').html('<b>Channel 0 Amplitude</b>: '+parseInt(power))

        let dataToSend = {NoseX: xpos, NoseY: ypos, Volume: vol, Power: power};
        // Have to send string
        p5lm.send(JSON.stringify(dataToSend));
    };

