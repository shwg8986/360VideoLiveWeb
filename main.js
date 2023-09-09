import * as THREE from "/360VideoLiveWeb/build/three.module.js";
import { OrbitControls } from "/360VideoLiveWeb/controls/OrbitControls.js";

let camera, scene, renderer;
let video, texture, mesh, controls;

function init() {
  console.log("init");

  const constraints = { video: true, audio: true };

  try {
    const stream = navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
  } catch (error) {
    console.error("Error accessing webcam:", error);
  }

  scene = new THREE.Scene();
  const container = document.createElement("div");
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    3000
  );
  camera.target = new THREE.Vector3(0, 0, 0);

  // カメラの初期位置を設定
  camera.position.set(0, 0, 100);

  // カメラの注視点を設定（ビデオテクスチャの位置）
  camera.lookAt(0, 0, 0);
  // camera.lookAt(scene.position);

  const geometry = new THREE.SphereBufferGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1);

  // video = document.createElement("video");
  // video.crossOrigin = "anonymous";
  // video.loop = true;
  // video.muted = true;

  texture = new THREE.VideoTexture(video);
  texture.format = THREE.RGBFormat;

  const material = new THREE.MeshBasicMaterial({ map: texture });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0xefefef);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true;
  // controls.enablePan = false; // パン操作を無効化
  controls.enableDamping = true; // 滑らかにカメラコントローラーを制御する
  controls.dampingFactor = 0.2;
  controls.minDistance = 0.1;
  controls.maxDistance = 2000;

  // document.getElementById("noVideoMessage").style.display = "block";
  animate();
}

function animate() {
  console.log("animate");
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

async function connectToSora() {
  // document.getElementById("noVideoMessage").style.display = "none";
  // document.getElementById("startButton").style.display = "none"; // スタートボタンを非表示にする
  video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.loop = true;
  video.muted = true;

  const debug = false;
  const sora = Sora.connection(
    "wss://sora.ikeilabsora.0am.jp/signaling",
    debug
  );
  const channelId = "SimpleView-Right";
  const metadata = undefined;
  const options = { multistream: true };
  const recvonly = sora.recvonly(channelId, metadata, options);

  recvonly.on("track", (event) => {
    console.log("Received Video.");
    document.getElementById("noVideoMessage").style.display = "none";
    const remoteStream = event.streams[0];
    video.srcObject = remoteStream;
    video.onloadeddata = () => {
      video.play().catch((error) => console.error("Play video error:", error));
      const startButton = document.getElementById("startButton");
      startButton.style.display = "block"; // 映像が配信されたらボタンを表示する
      startButton.addEventListener("click", () => {
        startButton.style.display = "none"; // スタートボタンを非表示にする
        init();
      });
    };
  });

  recvonly.on("removetrack", (event) => {
    const target = event.target;
    if (target.getTracks().length === 0) {
      document.getElementById("noVideoMessage").style.display = "block";
      location.reload();
    }
  });

  await recvonly.connect();

  console.log("Connected to Sora");

  // init();
}
window.onload = function () {
  // init();
  // animate();
  connectToSora();
};
