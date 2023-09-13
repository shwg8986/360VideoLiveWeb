class VRButton {
  static createButton(renderer) {
    const button = document.createElement("button");

    function showEnterVR(/*device*/) {
      let currentSession = null;

      async function onSessionStarted(session) {
        session.addEventListener("end", onSessionEnded);

        await renderer.xr.setSession(session);
        button.textContent = "EXIT VR"; //VRモードから脱出

        currentSession = session;
      }

      function onSessionEnded(/*event*/) {
        currentSession.removeEventListener("end", onSessionEnded);

        button.textContent = "ENTER VR"; //VRモードに変更

        currentSession = null;
      }

      //

      button.style.display = "";

      button.style.cursor = "pointer";
      button.style.left = "calc(50% - 50px)";
      button.style.width = "100px";

      button.textContent = "ENTER VR";

      button.onmouseenter = function () {
        button.style.opacity = "1.0";
      };

      button.onmouseleave = function () {
        button.style.opacity = "0.5";
      };

      button.onclick = function () {
        if (currentSession === null) {

          const sessionInit = {
            optionalFeatures: [
              "local-floor",
              "bounded-floor",
              "hand-tracking",
              "layers",
            ],
          };
          navigator.xr
            .requestSession("immersive-vr", sessionInit)
            .then(onSessionStarted);
        } else {
          currentSession.end();
        }
      };
    }

    function disableButton() {
      button.style.display = "";

      button.style.cursor = "auto";
      button.style.left = "calc(50% - 75px)";
      button.style.width = "150px";

      button.onmouseenter = null;
      button.onmouseleave = null;

      button.onclick = null;
    }

    // WebVRはHMDのみにサポート
    function showWebXRNotFound() {
      disableButton();

      button.textContent = "WebVR is not supported on your device.";
    }

    function showVRNotAllowed(exception) {
      disableButton();

      console.warn(
        "Exception when trying to call xr.isSessionSupported",
        exception
      );

      button.textContent = "WebVR is not supported on your device";
    }

    function stylizeElement(element) {
      element.style.position = "absolute";
      element.style.bottom = "20px";
      element.style.padding = "12px 6px";
      element.style.border = "1px solid #fff";
      element.style.borderRadius = "4px";
      element.style.background = "rgba(0,0,0,0.1)";
      element.style.color = "#fff";
      element.style.font = "normal 13px sans-serif";
      element.style.textAlign = "center";
      element.style.opacity = "0.5";
      element.style.outline = "none";
      element.style.zIndex = "999";
    }

    if ("xr" in navigator) {
      button.id = "VRButton";
      button.style.display = "none";

      stylizeElement(button);

      navigator.xr
        .isSessionSupported("immersive-vr")
        .then(function (supported) {
          supported ? showEnterVR() : showWebXRNotFound();

          if (supported && VRButton.xrSessionIsGranted) {
            button.click();
          }
        })
        .catch(showVRNotAllowed);

      return button;
    } else {
      const message = document.createElement("a");

      if (window.isSecureContext === false) {
        message.href = document.location.href.replace(/^http:/, "https:");
        message.innerHTML = "WEBXR NEEDS HTTPS"; // WebXRではHTTPS通信が必須
      } else {
        message.href = "https://immersiveweb.dev/";
        message.innerHTML = "WebVR is not supported on your device";
      }

      message.style.left = "calc(50% - 90px)";
      message.style.width = "180px";
      message.style.textDecoration = "none";

      stylizeElement(message);

      return message;
    }
  }

  static registerSessionGrantedListener() {
    if ("xr" in navigator) {
      if (/WebXRViewer\//i.test(navigator.userAgent)) return;

      navigator.xr.addEventListener("sessiongranted", () => {
        VRButton.xrSessionIsGranted = true;
      });
    }
  }
}

VRButton.xrSessionIsGranted = false;
VRButton.registerSessionGrantedListener();

export { VRButton };
