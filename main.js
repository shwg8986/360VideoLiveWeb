import * as THREE from "/360VideoLiveWeb/build/three.module.js";
import { OrbitControls } from "/360VideoLiveWeb/controls/OrbitControls.js";
import { VRButton } from "./VRButton.js"; // VRButtonをインポート

let camera, scene, renderer;
let video, texture, mesh, controls;

function init() {
  console.log("init");

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
  camera.position.set(0, 0, 501);
  console.log("camera.position", camera.position);

  // カメラの注視点を設定（ビデオテクスチャの位置）
  camera.lookAt(0, 0, 0);
  // camera.lookAt(scene.position);

  const geometry = new THREE.SphereBufferGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1);

  texture = new THREE.VideoTexture(video);
  texture.format = THREE.RGBFormat;

  const material = new THREE.MeshBasicMaterial({ map: texture });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0xefefef);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(VRButton.createButton(renderer));
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false; // ズーム操作を無効化
  // controls.enablePan = false; // パン操作を無効化
  controls.enableDamping = true; // 滑らかにカメラコントローラーを制御する
  controls.dampingFactor = 0.2;
  // controls.minDistance = 0.1;
  // controls.maxDistance = 2000;

  // WebXR APIが利用可能かどうかを確認し、利用可能な場合にはVRモードを有効化
  // if ("XR" in navigator) {
  //   renderer.xr.enabled = true;
  //   document.body.appendChild(VRButton.createButton(renderer));
  //   console.log("XR is supported.");
  // } else {
  //   console.log("XR is not supported.");
  //   console.log("ユーザーの端末情報は、", navigator.userAgent);
  // }

  animate();
}

function animate() {
  // console.log("animate");
  // requestAnimationFrame(animate);
  // controls.update();
  // renderer.render(scene, camera);
  renderer.setAnimationLoop(function () {
    renderer.render(scene, camera);
  });
  controls.update();
}

async function connectToSora() {
  video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.loop = true;
  video.muted = false;
  video.playsInline = true; // この行を追加しないとiOS Safariで動画が再生されない

  const debug = false;
  const sora = Sora.connection(
    // "wss://sora.ikeilabsora.0am.jp/signaling",
    "wss://u1.xr360d.net/signaling",
    // "ws://192.168.11.64:5000/signaling",
    debug
  );
  const channelId = "SimpleView";
  const metadata = undefined;
  const options = { 
    multistream: true,
    audio: true,
    audioBitRate: 64, // オーディオのビットレートを 64 kbps に設定
  };
  const recvonly = sora.recvonly(channelId, metadata, options);

  const startButton = document.getElementById("startButton");
  let remoteStream;

  recvonly.on("track", (event) => {
    console.log("Received Video.");
    document.getElementById("noVideoMessage").style.display = "none";
    remoteStream = event.streams[0];
    startButton.style.display = "block"; // 映像が配信されたらボタンを表示する
  });

  startButton.addEventListener("click", () => {
    console.log("Start button was pushed !");
    startButton.style.display = "none"; // スタートボタンを非表示にする
    video.srcObject = remoteStream;
    video.onloadeddata = () => {
      video.play().catch((error) => console.error("Play video error:", error));
    };
    init();
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

}
window.onload = function () {
  connectToSora();
};
