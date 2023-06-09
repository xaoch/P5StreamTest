var star;

var xpos=0;
var ypos=0;
var vol=0;
var power=0;

function gotData(data, id) {
    //print(id + ":" + data);
    // If it is JSON, parse it
    let d = JSON.parse(data);
    xpos = d.NoseX;
    ypos = d.NoseY;
    vol = d.Volume;
    power = d.Power;
  }


function gotDisconnect(id) {
    print(id + ": disconnected");
}

function setup() {
        // Create the canvas
        var canvas = createCanvas(300, 300);
        // Create the star
        var position = createVector(width / 2, height / 2);
        var radius = 40;
        var fadingFactor = 0.2;
        var flaresActivity = 0.8;
        var imageWidth = Math.max(width, height);
        var flaresColor=255
        star = new Star(position, radius, fadingFactor, flaresActivity, flaresColor,imageWidth);
        p5lm = new p5LiveMedia(this, "DATA", null, "Mindhive-Stream");
        p5lm.on('data', gotData);
        p5lm.on('disconnect', gotDisconnect);
    };

    // Execute the sketch
function draw() {
        // Clean the canvas
        
        let colBac = parseInt(map(power, -200, 200, 0, 255));
        background(colBac);
        
        let colorVol = parseInt(map(vol, 0, 10, 0, 255));
        star.setColor(colorVol)
        
        star.setFadingFactor(0.7 * (1 - 2* xpos / width));
        star.setFlaresActivity(0.1 + 2 * ypos / height);
        
        
        //Update the star
        star.update();

        // Paint the star
        star.paint();
    };

    /*
     * The Star class
     */
    function Star(position, radius, fadingFactor, flaresActivity, flaresColor,imageWidth) {
        this.position = position;
        this.radius = radius;
        this.fadingFactor = fadingFactor;
        this.flaresActivity = flaresActivity;
        this.imageWidth = imageWidth;
        this.body = createImage(this.imageWidth, this.imageWidth);
        this.flares = createImage(this.imageWidth, this.imageWidth);
        this.timeCounter = 0;
        this.flaresColor=flaresColor;

        // Initialize the star's body image
        var x, y, pixel, distanceSq;
        var radiusSq = sq(this.radius);
        var center = this.imageWidth / 2;

        this.body.loadPixels();

        for (x = 0; x < this.imageWidth; x++) {
            for (y = 0; y < this.imageWidth; y++) {
                pixel = 4 * (x + y * this.imageWidth);
                distanceSq = sq(x - center) + sq(y - center);
                this.body.pixels[pixel] = 255;
                this.body.pixels[pixel + 1] = 255;
                this.body.pixels[pixel + 2] = 255;
                this.body.pixels[pixel + 3] = 255 * (0.95 - distanceSq / radiusSq);
            }
        }

        this.body.updatePixels();
    }

    //
    // The update method
    //
    Star.prototype.update = function () {
        var x, y, deltaX, deltaY, pixel, distanceSq, relativeAngle;
        var dx, dy, sumColor, counter, pixelColor;
        var radiusSq = sq(this.radius);
        var center = this.imageWidth / 2;
        var nPixels = sq(this.imageWidth);

        // Create the flares in the star's body (save the result in the red channel)
        this.flares.loadPixels();

        for (x = 0; x < this.imageWidth; x++) {
            for (y = 0; y < this.imageWidth; y++) {
                deltaX = x - center;
                deltaY = y - center;
                distanceSq = sq(deltaX) + sq(deltaY);

                if (distanceSq < radiusSq) {
                    relativeAngle = atan2(deltaY, deltaX) / TWO_PI;

                    if (relativeAngle < 0) {
                        relativeAngle++;
                    }

                    pixel = 4 * (x + y * this.imageWidth);
                    this.flares.pixels[pixel] = 255 * noise(0.1 * (Math.sqrt(distanceSq) - this.timeCounter), 10 * relativeAngle);
                }
            }
        }

        // Smooth the flares (save the result in the blue and alpha channels)
        for (x = 2; x < this.imageWidth - 2; x++) {
            for (y = 2; y < this.imageWidth - 2; y++) {
                pixel = 4 * (x + y * this.imageWidth);
                deltaX = x - center;
                deltaY = y - center;
                distanceSq = sq(deltaX) + sq(deltaY);
                sumColor = 0;
                counter = 0;

                // Loop over nearby pixels
                for (dx = -2; dx <= 2; dx++) {
                    for (dy = -2; dy <= 2; dy++) {
                        if (sq(deltaX + dx) + sq(deltaY + dy) < distanceSq) {
                            sumColor += this.flares.pixels[pixel + 4 * (dx + dy * this.imageWidth)];
                            counter++;
                        }
                    }
                }

                if (counter > 0) {
                    this.flares.pixels[pixel + 2] = sumColor / counter;
                    this.flares.pixels[pixel + 3] = 255 * (1 - this.fadingFactor) * radiusSq / distanceSq;
                } else {
                    this.flares.pixels[pixel + 2] = 0;
                    this.flares.pixels[pixel + 3] = 0;
                }
            }
        }

        // Update the flares image (i.e. the red and green channels)
        for (i = 0; i < nPixels; i++) {
            pixel = 4 * i;
            pixelColor = this.flares.pixels[pixel + 2];
            this.flares.pixels[pixel] = pixelColor;
            this.flares.pixels[pixel + 1] = this.flaresColor;
        }

        this.flares.updatePixels();

        // Increase the time counter
        this.timeCounter += this.flaresActivity;
    };

    //
    // The paint method
    //
    Star.prototype.paint = function () {
        push();
        translate(this.position.x - this.imageWidth / 2, this.position.y - this.imageWidth / 2);
        image(this.flares, 0, 0);
        image(this.body, 0, 0);
        pop();
    };

    //
    // Update the fading factor parameter
    //
    Star.prototype.setFadingFactor = function (fadingFactor) {
        this.fadingFactor = fadingFactor;
    };

    Star.prototype.setFlaresActivity = function (flaresActivity) {
        this.flaresActivity = flaresActivity;
    };

    //
    // Update the flares activity parameter
    //
    Star.prototype.setColor = function (flaresColor) {
        this.flaresColor = flaresColor;
    };