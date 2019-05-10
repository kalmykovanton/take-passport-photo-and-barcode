(function() {
  var videoBoxEvent = null;
  var isLandscape = () => window.innerHeight < window.innerWidth;
  var constraints = {
    audio: false,
    video: {
      // front camera
      // facingMode: "user",
      // rear camera
      facingMode: { exact: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    }
  };

  // change photo overlay width and height with parameters below
  var photoWMultiplier = 0.18;
  var photoHMultiplier = 0.4;

  // change photo overlay position with parameters below
  var portraitPhotoXMultiplier = 0.04;
  var portraitPhotoYMultiplier = 0.25;
  var landscapePhotoXMultiplier = 0.32;
  var landscapePhotoYMultiplier = 0.03;

  // change barcode overlay width and height with parameters below
  var barcodeWMultiplier = 0.64;
  var barcodeHMultiplier = 0.16;

  // change barcode overlay position with parameters below
  var portraitBarcodeXMultiplier = 0.04;
  var portraitBarcodeYMultiplier = 0.68;
  var landscapeBarcodeXMultiplier = 0.12;
  var landscapeBarcodeYMultiplier = 0.03;

  var videoBox = document.getElementById("video-box");
  var takePhotoButton = document.getElementById("take-photo-btn");

  var addOverlay = function(type, element, videoRealWidth, videoRealHeight) {
    element.width = videoRealWidth;
    element.height = videoRealHeight;
    var ctx = element.getContext("2d");
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#fff";

    var width;
    var height;
    var x;
    var y;

    switch (type) {
      case "photo": {
        if (isLandscape()) {
          // landscape
          var width = videoRealWidth * photoWMultiplier;
          var height = videoRealHeight * photoHMultiplier;
          var x = videoRealWidth * portraitPhotoXMultiplier;
          var y = videoRealHeight * portraitPhotoYMultiplier;
        } else {
          // portrait
          var width = videoRealWidth * photoHMultiplier;
          var height = videoRealHeight * photoWMultiplier;
          var x = videoRealWidth * landscapePhotoXMultiplier;
          var y = videoRealHeight * landscapePhotoYMultiplier;
        }
        break;
      }
      case "barcode": {
        if (isLandscape()) {
          // landscape
          var width = videoRealWidth * barcodeWMultiplier;
          var height = videoRealHeight * barcodeHMultiplier;
          var x = videoRealWidth * portraitBarcodeXMultiplier;
          var y = videoRealHeight * portraitBarcodeYMultiplier;
        } else {
          // portrait
          var width = videoRealWidth * barcodeHMultiplier;
          var height = videoRealHeight * barcodeWMultiplier;
          var x = videoRealWidth * landscapeBarcodeXMultiplier;
          var y = videoRealHeight * landscapeBarcodeYMultiplier;
        }
        break;
      }
    }

    ctx.strokeRect(x, y, width, height);
  };

  var createOverlay = function() {
    var photoOverlay = document.createElement("canvas");
    var barcodeOverlay = document.createElement("canvas");
    photoOverlay.id = "photo-overlay";
    photoOverlay.classList.add("photo-overlay");
    barcodeOverlay.id = "barcode-overlay";
    barcodeOverlay.classList.add("barcode-overlay");

    return { photoOverlay: photoOverlay, barcodeOverlay: barcodeOverlay };
  };

  var appendOverlay = function() {
    var photoOverlay = document.getElementById("photo-overlay");
    var barcodeOverlay = document.getElementById("barcode-overlay");
    var width = videoBox.clientWidth;
    var height = videoBox.clientHeight;

    if (photoOverlay && barcodeOverlay) {
      photoOverlay.remove();
      barcodeOverlay.remove();
    }

    var overlays = createOverlay();
    photoOverlay = overlays.photoOverlay;
    barcodeOverlay = overlays.barcodeOverlay;

    document.body.appendChild(photoOverlay);
    document.body.appendChild(barcodeOverlay);

    addOverlay("photo", photoOverlay, width, height);
    addOverlay("barcode", barcodeOverlay, width, height);
  };

  var crop = function(wMultiplier, hMultiplier, xMultiplier, yMultiplier) {
    var photoRealW = videoBoxEvent.target.videoWidth;
    var photoRealH = videoBoxEvent.target.videoHeight;

    var buffer = document.createElement("canvas");
    buffer.width = photoRealW;
    buffer.height = photoRealH;
    var bufferCtx = buffer.getContext("2d");
    bufferCtx.drawImage(videoBox, 0, 0, photoRealW, photoRealH);

    var croppedPhotoW = photoRealW * wMultiplier;
    var croppedPhotoH = photoRealH * hMultiplier;
    var croppedPhotoX = photoRealW * xMultiplier;
    var croppedPhotoY = photoRealH * yMultiplier;

    var cropped = document.createElement("canvas");
    cropped.width = croppedPhotoW;
    cropped.height = croppedPhotoH;
    var croppedCtx = cropped.getContext("2d");
    croppedCtx.drawImage(
      buffer,
      croppedPhotoX,
      croppedPhotoY,
      croppedPhotoW,
      croppedPhotoH,
      0,
      0,
      croppedPhotoW,
      croppedPhotoH
    );

    return cropped.toDataURL();
  };

  var takePhoto = function() {
    var win = window.open();

    var photo;
    var barcode;

    if (isLandscape()) {
      // landscape
      photo = crop(
        photoWMultiplier,
        photoHMultiplier,
        portraitPhotoXMultiplier,
        portraitPhotoYMultiplier
      );

      barcode = crop(
        barcodeWMultiplier,
        barcodeHMultiplier,
        portraitBarcodeXMultiplier,
        portraitBarcodeYMultiplier
      );
    } else {
      // portrait
      photo = crop(
        photoHMultiplier,
        photoWMultiplier,
        landscapePhotoXMultiplier,
        landscapePhotoYMultiplier
      );

      barcode = crop(
        barcodeHMultiplier,
        barcodeWMultiplier,
        landscapeBarcodeXMultiplier,
        landscapeBarcodeYMultiplier
      );
    }

    win.document.write(
      "<img src='" + photo + "' />" + "<br />" + "<img src='" + barcode + "' />"
    );

    var url = "https://s3-bucket-proxy.mobidevdemo.com/upload";
    var postPhoto = axios.post(url, {
      photo: photo,
      name: "passport_photo_" + Date.now()
    });
    var postBarcode = axios.post(url, {
      photo: barcode,
      name: "passport_barcode_" + Date.now()
    });

    Promise.all([postPhoto, postBarcode])
      .then(r => r)
      .catch(e => console.error("PHOTO UPLOAD ERROR => ", e));
  };

  var play = function() {
    if (isLandscape()) {
      takePhotoButton.classList.remove("take-photo-btn--portrait");
      takePhotoButton.classList.add("take-photo-btn--landscape");
    } else {
      takePhotoButton.classList.remove("take-photo-btn--landscape");
      takePhotoButton.classList.add("take-photo-btn--portrait");
    }

    videoBox.play();
    videoBox.width = document.body.clientWidth;
    appendOverlay();
  };

  setTimeout(function() {
    takePhotoButton.classList.add("take-photo-btn--shown");
  }, 3000);

  if (navigator.mediaDevices) {
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function(mediaStream) {
        videoBox.srcObject = mediaStream;
        videoBox.onloadedmetadata = function(e) {
          videoBoxEvent = e;

          play();
          window.addEventListener("resize", play);
          takePhotoButton.addEventListener("click", takePhoto);
        };
      })
      .catch(function(err) {
        console.error(err.name + ": " + err.message);
      });
  }
})();
