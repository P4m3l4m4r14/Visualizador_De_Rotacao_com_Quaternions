import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';
import { GUI } from 'https://unpkg.com/three@0.165.0/examples/jsm/libs/lil-gui.module.min.js';

// Definimos os eixos de rotação como constantes
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

export function createGUI(sphere, rotationControls) {
    const gui = new GUI();

    // Pasta para Transformação (posição, escala)
    const transformFolder = gui.addFolder('Transformação');
    transformFolder.add(sphere.position, 'x', -10, 10).name('Posição X');
    transformFolder.add(sphere.position, 'y', -10, 10).name('Posição Y');
    transformFolder.add(sphere.position, 'z', -10, 10).name('Posição Z');
    
    const actions = {
        resetPosition: () => {
            sphere.position.set(0, 0, 0);
            rotationControls.angle = 0; 
            
            // Para resetar a rotação de um quaternion, usamos o método .identity()
            // sphere.rotation.y = 0; // <- Linha antiga
            sphere.quaternion.identity(); // <- Nova linha: Reseta para "nenhuma rotação"
        }
    };
    transformFolder.add(actions, 'resetPosition').name('Resetar Posição');

    // Pasta para Material
   // const materialFolder = gui.addFolder('Material');
   // materialFolder.addColor(sphere.material, 'color').name('Cor');
   // materialFolder.add(sphere.material, 'roughness', 0, 1).name('Rugosidade');
   // materialFolder.add(sphere.material, 'metalness', 0, 1).name('Metalicidade');

    // --- PASTA DE ROTAÇÃO ATUALIZADA ---
    const rotationFolder = gui.addFolder('Rotação (Eixo Y)');

    rotationFolder.add(rotationControls, 'angle', 0, 360).name('Ângulo °')
        .onChange(angleInDegrees => {
            const angleInRadians = angleInDegrees * (Math.PI / 180);
            
            rotationControls.sin = Math.sin(angleInRadians);
            rotationControls.cos = Math.cos(angleInRadians);

            // A MUDANÇA PRINCIPAL ESTÁ AQUI:
            // Em vez de definir um ângulo de Euler, definimos o quaternion da esfera
            // a partir de um eixo e um ângulo.
            // sphere.rotation.y = angleInRadians; // <- Linha antiga (Euler)
            sphere.quaternion.setFromAxisAngle(Y_AXIS, angleInRadians); // <- Nova linha (Quaternion)
        });

    rotationFolder.add(rotationControls, 'sin').name('Seno').listen().disable();
    rotationFolder.add(rotationControls, 'cos').name('Cosseno').listen().disable();

    return gui;
}