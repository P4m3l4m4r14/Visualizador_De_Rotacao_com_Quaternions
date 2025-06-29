import * as THREE from "https://esm.sh/three";
// 1. Importando a biblioteca Three.js
import { OrbitControls } from "https://esm.sh/three/addons/controls/OrbitControls.js";
//import { createGUI } from './gui.js'; 
// 2. Importando a função createGUI do arquivo gui.js
import { GUI } from 'https://unpkg.com/three@0.165.0/examples/jsm/libs/lil-gui.module.min.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(5, 5, 5);
controls.update();

// ---- 2. HELPERS DA CENA ----
const gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);
const axesHelper = new THREE.AxesHelper(30);
scene.add(axesHelper);

// ---- 3. LUZES E OBJETOS ----
// Luzes
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

const geometry = new THREE.SphereGeometry(2, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    wireframe: true, 
    transparent: true, 
    opacity: 0.2 
});
const sphere = new THREE.Mesh(geometry, sphereMaterial);
scene.add(sphere);

// Marcador para o ponto original 'p'

const pMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x2be9e5 }) // ciano
);
scene.add(pMarker);
// Marcador para o ponto rotacionado 'pPrime'
const pPrimeMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff0099 }) // rosa
);
scene.add(pPrimeMarker);

// Linha para o eixo de rotação
//const axisMaterial = new THREE.LineBasicMaterial({ color: 0xd284e3 }); // lilás
//let rotationAxisLine = new THREE.Line(new THREE.BufferGeometry(), axisMaterial);
//scene.add(rotationAxisLine);

const rotationAxisRadius = 0.02; // <- CONTROLE A GROSSURA DO EIXO DE ROTAÇÃO AQUI
const rotationAxisMaterial = new THREE.MeshBasicMaterial({ color: 0xd284e3 }); // lilás
// Começamos com uma geometria vazia, que será criada na função de atualização
let rotationAxisLine = new THREE.Mesh(new THREE.BufferGeometry(), rotationAxisMaterial);
scene.add(rotationAxisLine);


//const rotationControls = {
  //  angle: 0,
   // sin: Math.sin(0),
   // cos: Math.cos(0),
//};

// ---- 4. ESTADO E CONTROLES ----
const vizControls = {
    angle: 45, // ângulo em graus
    axisX: 0,
    axisY: 1,
    axisZ: 0,
    pointPx: 2,
    pointPy: 0,
    pointPz: 0
};

// Elemento do painel de informações
const infoPanel = document.getElementById('infoPanel');

// ---- 5. A LÓGICA PRINCIPAL DE ATUALIZAÇÃO ----
function updateVisualization() {
    // a. Define o ponto original 'p'
    const p = new THREE.Vector3(vizControls.pointPx, vizControls.pointPy, vizControls.pointPz);
    pMarker.position.copy(p);

    // b. Define o eixo de rotação e normaliza (essencial!)
    const axis = new THREE.Vector3(vizControls.axisX, vizControls.axisY, vizControls.axisZ).normalize();

    // c. Define o quaternion de rotação 'q'
    const angleRad = THREE.MathUtils.degToRad(vizControls.angle);
    const q = new THREE.Quaternion().setFromAxisAngle(axis, angleRad);

    // d. CALCULA O PONTO ROTACIONADO p' = q * p * q⁻¹
    const pPrime = p.clone().applyQuaternion(q);
    pPrimeMarker.position.copy(pPrime);
    
    // e. Atualiza a linha do eixo de rotação visual
    /*const points = [axis.clone().multiplyScalar(-10), axis.clone().multiplyScalar(10)];
    rotationAxisLine.geometry.setFromPoints(points);
    rotationAxisLine.geometry.computeBoundingSphere(); // Necessário para a visibilidade*/
     rotationAxisLine.geometry.dispose(); 
    
    // Criamos o caminho (curva da linha) para o tubo
    const rotationPath = new THREE.LineCurve3(
        axis.clone().multiplyScalar(-10), // Ponto inicial
        axis.clone().multiplyScalar(10)   // Ponto final
    );
    // Criamos uma nova geometria de tubo e a atribuímos ao nosso mesh
    rotationAxisLine.geometry = new THREE.TubeGeometry(rotationPath, 1, rotationAxisRadius, 8, false);

    // f. Atualiza o painel de texto
    updateInfoPanel(p, q, pPrime);

    // g. Atualiza a esfera com o quaternion
    sphere.quaternion.copy(q);
    // 1. Calcula a distância do ponto 'p' até a origem (seu comprimento/magnitude)
    const newRadius = p.length();
    // 2. Descarta a geometria antiga da esfera para liberar memória
    sphere.geometry.dispose();
    // 3. Cria e atribui uma nova geometria de esfera com o novo raio
    sphere.geometry = new THREE.SphereGeometry(Math.max(0.1, newRadius), 32, 32);
    
}

// ---- 6. ATUALIZAÇÃO DO PAINEL DE INFORMAÇÕES ----
function updateInfoPanel(p, q, pPrime) {
    const formatVec = (v) => `${v.x.toFixed(2)}i + ${v.y.toFixed(2)}j + ${v.z.toFixed(2)}k`;
    const formatQuat = (quat) => {
        const angle = Math.acos(quat.w); // Extrai o ângulo
        const axis = new THREE.Vector3(quat.x, quat.y, quat.z).normalize();
        return `cos(${(THREE.MathUtils.radToDeg(angle)).toFixed(1)}°) + sin(${(THREE.MathUtils.radToDeg(angle)).toFixed(1)}°) * (${formatVec(axis)})`;
    };

    infoPanel.innerHTML = `
        <strong>Ponto Original (p):</strong><br>
        <span class = "color-p">${formatVec(p)}</span><br><br>

        <strong>Eixo de Rotação (e):</strong><br>
        <span class = "color-line">${formatVec(new THREE.Vector3(vizControls.axisX, vizControls.axisY, vizControls.axisZ))}</span><br><br>
        
        <strong>Quaternion (q):</strong><br>${formatQuat(q)}<br><br>

        <strong>Ponto Rotacionado (p'):</strong><br>
        <span class = "color-p-prime">${formatVec(pPrime)}</span>
    `;
}


//createGUI(sphere, rotationControls);

// ---- 7. SETUP DA GUI ----
const gui = new GUI();
const pFolder = gui.addFolder("Ponto a Rotacionar (p)");
pFolder.add(vizControls, 'pointPx', -5, 5).name('p.x').onChange(updateVisualization);
pFolder.add(vizControls, 'pointPy', -5, 5).name('p.y').onChange(updateVisualization);
pFolder.add(vizControls, 'pointPz', -5, 5).name('p.z').onChange(updateVisualization);

const qFolder = gui.addFolder("Quaternion de Rotação (q)");
qFolder.add(vizControls, 'angle', -180, 180).name('Ângulo °').onChange(updateVisualization);
qFolder.add(vizControls, 'axisX', -1, 1).name('Eixo.x').onChange(updateVisualization);
qFolder.add(vizControls, 'axisY', -1, 1).name('Eixo.y').onChange(updateVisualization);
qFolder.add(vizControls, 'axisZ', -1, 1).name('Eixo.z').onChange(updateVisualization);


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

updateVisualization();
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});