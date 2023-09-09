import * as THREE from "/360VideoLiveWeb/build/three.module.js";
import { OrbitControls } from "/360VideoLiveWeb/controls/OrbitControls.js";

("use strict");

let camera, scene, renderer;
let video, texture, mesh, controls;

function init() {
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
  // camera.lookAt(0, 0, 0);
  camera.lookAt(scene.position);

  const geometry = new THREE.SphereBufferGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1);

  video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.loop = true;
  video.muted = true;

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

  // 座標軸を表示
  // const axes = new THREE.AxesHelper(1500);
  // axes.position.x = 0;
  // scene.add(axes); //x 軸は赤, y 軸は緑, z 軸は青

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true;
  controls.enablePan = false; // パン操作を無効化
  controls.enableDamping = true; // 滑らかにカメラコントローラーを制御する
  controls.dampingFactor = 0.2;
  controls.minDistance = 0.1;
  controls.maxDistance = 2000;

  document.getElementById("noVideoMessage").style.display = "block";
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

async function connectToSora() {
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
    document.getElementById("noVideoMessage").style.display = "none";
    const remoteStream = event.streams[0];
    video.srcObject = remoteStream;
    video.onloadeddata = () => {
      video.play().catch((error) => console.error("Play video error:", error));
    };
  });

  recvonly.on("removetrack", (event) => {
    const target = event.target;
    if (target.getTracks().length === 0) {
      document.getElementById("noVideoMessage").style.display = "block";
      scene.remove(mesh);
    }
  });

  await recvonly.connect();

  console.log("Connected to Sora");
}
window.onload = function () {
  init();
  animate();
  connectToSora();
};
