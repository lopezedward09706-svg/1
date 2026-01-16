
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BranchType, Knot, ParticleType } from '../types';

interface Props {
  branch: BranchType;
  knots: Knot[];
  showTorsion: boolean;
  showStringDensity: boolean;
}

const SimulationCanvas: React.FC<Props> = ({ branch, knots, showTorsion, showStringDensity }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const networkRef = useRef<THREE.Group | null>(null);
  const photonsRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 50);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Create Network Grid
    const network = new THREE.Group();
    const gridDim = 10;
    const spacing = 2;
    const material = new THREE.LineBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.3 });

    for (let x = -gridDim; x <= gridDim; x++) {
      for (let y = -gridDim; y <= gridDim; y++) {
        const points = [new THREE.Vector3(x * spacing, y * spacing, -gridDim * spacing), new THREE.Vector3(x * spacing, y * spacing, gridDim * spacing)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        network.add(new THREE.Line(geometry, material));
      }
    }
    scene.add(network);
    networkRef.current = network;

    const photons = new THREE.Group();
    scene.add(photons);
    photonsRef.current = photons;

    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate network slightly for dynamic feel
      network.rotation.y += 0.001;
      
      // Update photon paths (simplified representation)
      if (photonsRef.current && photonsRef.current.children.length === 0) {
        // Mock photon propagation
        const photonMaterial = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
        const photonGeo = new THREE.SphereGeometry(0.1);
        for(let i=0; i<5; i++) {
          const p = new THREE.Mesh(photonGeo, photonMaterial);
          p.position.set(-20, (Math.random()-0.5)*10, (Math.random()-0.5)*10);
          (p as any).velocity = new THREE.Vector3(0.2, 0, 0);
          photonsRef.current.add(p);
        }
      }

      photonsRef.current.children.forEach(p => {
        const photon = p as THREE.Mesh;
        const vel = (photon as any).velocity as THREE.Vector3;
        
        // Basic R-QNT bending logic simulation
        let localC = 1.0;
        knots.forEach(k => {
          const knotPos = new THREE.Vector3(...k.position);
          const dist = photon.position.distanceTo(knotPos);
          if (dist < 5) {
            const pull = knotPos.clone().sub(photon.position).normalize().multiplyScalar(0.02 / (dist + 0.1));
            vel.add(pull);
            if (branch === BranchType.C_VARIABLE) {
               localC = Math.max(0.1, 1.0 - (1.0 / (dist + 1.0)));
            }
          }
        });

        photon.position.add(vel.clone().multiplyScalar(localC));
        if (photon.position.x > 20) photon.position.x = -20;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [branch, knots]);

  // Handle Knot Visualization
  useEffect(() => {
    if (!networkRef.current) return;
    
    // Clear old knots
    const oldKnots = networkRef.current.children.filter(c => c.name === 'knot');
    oldKnots.forEach(k => networkRef.current?.remove(k));

    knots.forEach(k => {
      const geo = k.type === ParticleType.NEUTRON ? new THREE.TorusKnotGeometry(0.5, 0.1, 64, 8) : new THREE.SphereGeometry(0.6, 32, 32);
      const mat = new THREE.MeshPhongMaterial({ 
        color: k.type === ParticleType.PROTON ? 0xef4444 : k.type === ParticleType.ELECTRON ? 0x3b82f6 : 0x10b981,
        emissive: 0x111111,
        shininess: 100
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...k.position);
      mesh.name = 'knot';
      networkRef.current?.add(mesh);
    });
  }, [knots]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default SimulationCanvas;
