(function() {
  var videoBoxEvent = null;

  var photoWMultiplier = 0.22;
  var photoHMultiplier = 0.50;
  var photoXMultiplier = 0.04;
  var photoYMultiplier = 0.25;

  var videoBoxWrapper = document.getElementById("video-box-wrapper");
  var videoBox = document.getElementById("video-box");
  var takePhotoButton = document.getElementById("take-photo-btn");

  videoBox.width = videoBoxWrapper.clientWidth;

  setTimeout(function() {
    videoBoxWrapper.style.height = videoBox.clientHeight + "px";
    takePhotoButton.classList.add("take-photo-btn--shown");
  }, 1000);

  // videoBox.height = videoBoxWrapper.clientHeight;

  var constraints = {
    audio: false,
    video: {
      // facingMode: "user",
      facingMode: { exact: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  };

  var addPhotoOverlay = function(videoBoxRealWidth, videoBoxRealHeight) {
    var photoOverlay = document.getElementById("photo-overlay");
    photoOverlay.width = videoBoxRealWidth;
    photoOverlay.height = videoBoxRealHeight;
    var ctx = photoOverlay.getContext("2d");
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#fff";

    var photoW = videoBoxRealWidth * photoWMultiplier;
    var photoH = videoBoxRealHeight * photoHMultiplier;
    var photoX = videoBoxRealWidth * photoXMultiplier;
    var photoY = videoBoxRealHeight * photoYMultiplier;

    ctx.strokeRect(photoX, photoY, photoW, photoH);
  };

  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(mediaStream) {
      videoBox.srcObject = mediaStream;
      videoBox.onloadedmetadata = function(e) {
        // todo: remove after development finishing
        console.log("Metadata event => ", e);

        videoBoxEvent = e;
        videoBox.play();

        addPhotoOverlay(videoBox.clientWidth, videoBox.clientHeight);

      };
    })
    .catch(function(err) {
      console.error(err.name + ": " + err.message);
    });
  }

  var takePhoto = function() {
    var win = window.open();
    var photoRealW = videoBoxEvent.target.videoWidth;
    var photoRealH = videoBoxEvent.target.videoHeight;

    var buffer = document.createElement("canvas");
    buffer.width  = photoRealW;
    buffer.height = photoRealH;
    var bufferCtx = buffer.getContext("2d");
    bufferCtx.drawImage(videoBox, 0, 0, photoRealW, photoRealH);

    var croppedPhotoW = photoRealW * photoWMultiplier;
    var croppedPhotoH = photoRealH * photoHMultiplier;
    var croppedPhotoX = photoRealW * photoXMultiplier;
    var croppedPhotoY = photoRealH * photoYMultiplier;

    var cropped = document.createElement("canvas");
    cropped.width  = croppedPhotoW;
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
      croppedPhotoH,
    );


    win.document.write("<img src='" + cropped.toDataURL() + "' />")


    // var instance = axios.create();
    //
    // instance
    //   .post("https://s3-bucket-proxy.mobidevdemo.com/upload", {
    //     photo:"ddfd",
    //     name: "test_" + Date.now()
    //   })
    //   .then(r => r)
    //   .catch(e => console.error("UPLOAD ERROR => ", e));
  };

  takePhotoButton.addEventListener("click", takePhoto);
})()
