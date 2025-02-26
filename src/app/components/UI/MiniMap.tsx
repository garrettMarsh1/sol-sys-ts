// Updated MiniMap.tsx with improved functionality
import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";

interface HolographicMiniMapProps {
  cameraPosition: { x: number; y: number; z: number };
  planets: any[];
  currentPlanet: any | null;
  onSelectPlanet: (planet: any) => void;
}

const HolographicMiniMap: React.FC<HolographicMiniMapProps> = ({
  cameraPosition,
  planets,
  currentPlanet,
  onSelectPlanet,
}) => {
  // DOM References
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Three.js objects
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cameraMarkerRef = useRef<THREE.Mesh | null>(null);
  
  // Animation frame tracking
  const requestRef = useRef<number | null>(null);
  
  // User interaction state
  const isRotatingRef = useRef<boolean>(true);
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number } | null>(null);
  
  // Tracking objects
  const planetMeshesRef = useRef<Record<string, THREE.Mesh>>({});
  const orbitLinesRef = useRef<THREE.Line[]>([]);
  
  // Initialization tracking to prevent duplicate setups
  const isInitializedRef = useRef<boolean>(false);

  // Planet colors - using vibrant, game-like colors
  const planetColors: Record<string, string> = {
    Sun: "#ffdd00",
    Mercury: "#b5b5b5",
    Venus: "#ffd700",
    Earth: "#4287f5",
    Mars: "#ff4500",
    Jupiter: "#ffa500",
    Saturn: "#f0e68c",
    Uranus: "#00ffff",
    Neptune: "#0000ff",
    Pluto: "#964b00",
  };

  // Clean up function to properly dispose Three.js objects
  const cleanupScene = useCallback(() => {
    // Cancel animation frame if active
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    // Clean up planet meshes
    Object.values(planetMeshesRef.current).forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    planetMeshesRef.current = {};

    // Clean up orbit lines
    orbitLinesRef.current.forEach(line => {
      if (line.geometry) line.geometry.dispose();
      if (line.material) {
        if (Array.isArray(line.material)) {
          line.material.forEach(m => m.dispose());
        } else {
          line.material.dispose();
        }
      }
    });
    orbitLinesRef.current = [];

    // Clean up renderer
    if (rendererRef.current && containerRef.current) {
      containerRef.current.removeChild(rendererRef.current.domElement);
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    // Reset scene and camera
    sceneRef.current = null;
    cameraRef.current = null;
    cameraMarkerRef.current = null;
    
    // Reset initialization flag
    isInitializedRef.current = false;
  }, []);

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!containerRef.current || isInitializedRef.current) return;

    try {
      console.log("Initializing MiniMap scene");
      
      // Set initialization flag to prevent duplicate setup
      isInitializedRef.current = true;
  
      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;
  
      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0x333333);
      scene.add(ambientLight);
  
      // Add point light at origin (sun position)
      const pointLight = new THREE.PointLight(0xffffff, 1.5);
      pointLight.position.set(0, 0, 0);
      scene.add(pointLight);
  
      // Create camera
      const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 10000);
      camera.position.set(0, 300, 500);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;
  
      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.setClearColor(0x000000, 0);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
  
      // Add base plane
      const planeGeometry = new THREE.PlaneGeometry(800, 800);
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: 0x0a2463,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = Math.PI / 2;
      plane.position.y = -20;
      scene.add(plane);
  
      // Add grid
      const gridHelper = new THREE.GridHelper(800, 20, 0x2e78d4, 0x2e78d4);
      gridHelper.position.y = -19;
      const gridMaterial = new THREE.LineBasicMaterial({
        color: 0x3498db,
        transparent: true,
        opacity: 0.3,
      });
      gridHelper.material = gridMaterial;
      scene.add(gridHelper);
  
      // Create camera position indicator
      const cameraMarkerGeometry = new THREE.ConeGeometry(10, 20, 8);
      const cameraMarkerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.7,
      });
      const cameraMarker = new THREE.Mesh(cameraMarkerGeometry, cameraMarkerMaterial);
      cameraMarker.rotation.x = Math.PI;
      scene.add(cameraMarker);
      cameraMarkerRef.current = cameraMarker;
  
      // Setup the planets
      updatePlanets();
  
      // Start animation loop
      animate();

      console.log("MiniMap scene initialized successfully");
    } catch (error) {
      console.error("Error initializing MiniMap scene:", error);
      isInitializedRef.current = false;
    }
  }, []);

  // Update planet positions
  const updatePlanets = useCallback(() => {
    if (!sceneRef.current) {
      console.warn("Scene not available for updatePlanets");
      return;
    }

    try {
      // Scale factor for the minimap
      const scale = 0.00001;
  
      // Clear old orbit lines
      orbitLinesRef.current.forEach((line) => {
        sceneRef.current?.remove(line);
      });
      orbitLinesRef.current = [];
  
      // Create sun at center if it doesn't exist
      const sunPlanet = planets.find((p) => p.name === "Sun");
      if (sunPlanet && !planetMeshesRef.current["Sun"]) {
        const sunGeometry = new THREE.SphereGeometry(15, 32, 32);
        const sunMaterial = new THREE.MeshLambertMaterial({
          color: planetColors["Sun"],
          emissive: planetColors["Sun"],
          emissiveIntensity: 1,
        });
        const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        sunMesh.name = "Sun";
        sceneRef.current.add(sunMesh);
        planetMeshesRef.current["Sun"] = sunMesh;
  
        // Add glow effect to sun
        const sunGlowGeometry = new THREE.SphereGeometry(20, 32, 32);
        const sunGlowMaterial = new THREE.MeshBasicMaterial({
          color: 0xffff00,
          transparent: true,
          opacity: 0.4,
        });
        const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
        sceneRef.current.add(sunGlow);
      }
  
      // Create or update other planets
      planets.forEach((planet) => {
        if (planet.name === "Sun") return; // Skip Sun as we already created it
  
        // Get planet data - use actual distance or fallback to preset values
        let distanceFromSun = Math.max(50, (planet.distanceFromSun || 0) * scale);
        
        // If distance is missing, use predefined values
        if (!distanceFromSun || distanceFromSun <= 50) {
          switch(planet.name) {
            case "Mercury": distanceFromSun = 60; break;
            case "Venus": distanceFromSun = 80; break;
            case "Earth": distanceFromSun = 100; break;
            case "Mars": distanceFromSun = 130; break;
            case "Jupiter": distanceFromSun = 180; break;
            case "Saturn": distanceFromSun = 240; break;
            case "Uranus": distanceFromSun = 290; break;
            case "Neptune": distanceFromSun = 340; break;
            case "Pluto": distanceFromSun = 380; break;
            default: distanceFromSun = 100; break;
          }
        }
        
        const planetSize = Math.max(5, Math.min(12, ((planet.radius || planet.diameter / 2 || 5) * scale * 100)));
  
        // Create orbit path
        const orbitPath = new THREE.EllipseCurve(
          0, 0,           // Center x, y
          distanceFromSun, distanceFromSun, // Radius x, y
          0, 2 * Math.PI, // Start angle, end angle
          false,          // Clockwise
          0               // Rotation
        );
  
        const orbitPoints = orbitPath.getPoints(100);
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const orbitLine = new THREE.Line(
          orbitGeometry,
          new THREE.LineBasicMaterial({
            color: 0x3498db,
            transparent: true,
            opacity: 0.3,
          })
        );
  
        // Adjust orbit to be flat on the XZ plane
        orbitLine.rotation.x = Math.PI / 2;
        if (sceneRef.current) {
          sceneRef.current.add(orbitLine);
        }
        orbitLinesRef.current.push(orbitLine);
  
        // Create or update planet mesh
        if (!planetMeshesRef.current[planet.name]) {
          // Create new planet mesh
          const planetGeometry = new THREE.SphereGeometry(planetSize, 16, 16);
          const planetMaterial = new THREE.MeshLambertMaterial({
            color: planetColors[planet.name] || 0xffffff,
            emissive: planetColors[planet.name] || 0xffffff,
            emissiveIntensity: 0.2,
          });
          const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
          planetMesh.name = planet.name;
  
          // Make planet meshes slightly bigger for easier clicking
          const hitboxGeometry = new THREE.SphereGeometry(planetSize * 1.5, 8, 8);
          const hitboxMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
          });
          const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
          hitbox.name = `${planet.name}-hitbox`;
          planetMesh.add(hitbox);
  
          if (sceneRef.current) {
            sceneRef.current.add(planetMesh);
          }
          planetMeshesRef.current[planet.name] = planetMesh;
  
          // Add a ring for Saturn
          if (planet.name === "Saturn") {
            const ringGeometry = new THREE.RingGeometry(planetSize * 1.4, planetSize * 2, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
              color: 0xf0e68c,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.7,
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            planetMesh.add(ring);
          }
        }
  
        // Position the planet
        const planetMesh = planetMeshesRef.current[planet.name];
        
        // Calculate position based on either stored position or orbital parameters
        let angle = 0;
        
        // Try to use actual planet position if available
        if (planet.position && 
            !isNaN(planet.position.x) && 
            !isNaN(planet.position.y) && 
            !isNaN(planet.position.z)) {
          
          // Calculate angle from actual position (simplified for mini-map)
          angle = Math.atan2(planet.position.z, planet.position.x);
          
        } else {
          // Fall back to random position if actual position not available
          angle = Math.random() * Math.PI * 2;
        }
  
        // Position planets with a slight vertical offset so they don't all appear on the exact same plane
        planetMesh.position.set(
          Math.cos(angle) * distanceFromSun,
          planet.orbitalInclination ? Math.sin(planet.orbitalInclination * 0.1) * 10 : 0,
          Math.sin(angle) * distanceFromSun
        );
  
        // Highlight current planet
        if (currentPlanet && planet.name === currentPlanet.name) {
          planetMesh.scale.set(1.5, 1.5, 1.5);
        } else {
          planetMesh.scale.set(1, 1, 1);
        }
      });
  
      // Update camera marker position
      if (cameraMarkerRef.current) {
        // Convert real position to minimap scale
        const scaledX = cameraPosition.x * scale;
        const scaledY = cameraPosition.y * scale;
        const scaledZ = cameraPosition.z * scale;
  
        // Clamp to visible area
        const maxDist = 400;
        const dist = Math.sqrt(scaledX * scaledX + scaledY * scaledY + scaledZ * scaledZ);
  
        if (dist > maxDist) {
          const factor = maxDist / dist;
          cameraMarkerRef.current.position.set(
            scaledX * factor,
            scaledY * factor,
            scaledZ * factor
          );
        } else {
          cameraMarkerRef.current.position.set(scaledX, scaledY, scaledZ);
        }
  
        // Point in direction of movement
        if (dist > 0) {
          cameraMarkerRef.current.lookAt(0, 0, 0);
        }
      }
    } catch (error) {
      console.error("Error updating planet positions:", error);
    }
  }, [planets, currentPlanet, cameraPosition, planetColors]);

  // Animation loop
  const animate = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    try {
      // Rotate scene if enabled and not dragging
      if (isRotatingRef.current && !isDraggingRef.current && sceneRef.current) {
        sceneRef.current.rotation.y += 0.001;
      }
  
      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      
      // Request next frame
      requestRef.current = requestAnimationFrame(animate);
    } catch (error) {
      console.error("Error in animation loop:", error);
    }
  }, []);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
    
    try {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    } catch (error) {
      console.error("Error handling resize:", error);
    }
  }, []);

  // Initialize scene on mount
  useEffect(() => {
    if (containerRef.current && !isInitializedRef.current) {
      initScene();
    }
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      cleanupScene();
    };
  }, [initScene, handleResize, cleanupScene]);
  
  // Update planets when dependencies change
  useEffect(() => {
    if (isInitializedRef.current) {
      updatePlanets();
    }
  }, [planets, currentPlanet, cameraPosition, updatePlanets]);

  // Mouse interaction setup
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // Mouse event variables
    let initialClickPosition = { x: 0, y: 0 };
    
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      initialClickPosition = { x: e.clientX, y: e.clientY };
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && previousMousePositionRef.current && sceneRef.current) {
        const deltaX = e.clientX - previousMousePositionRef.current.x;
        sceneRef.current.rotation.y += deltaX * 0.01;
        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleMouseLeave = () => {
      isDraggingRef.current = false;
    };

    const handleClick = (event: MouseEvent) => {
      // Check if this was a drag or a click
      const dx = event.clientX - initialClickPosition.x;
      const dy = event.clientY - initialClickPosition.y;
      const dragDistance = Math.sqrt(dx * dx + dy * dy);
      
      // If dragged too much, don't treat as click
      if (dragDistance > 5) return;
      
      if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return;
      
      try {
        // Get mouse position in normalized device coordinates
        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
        
        // Raycasting for planet selection
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);
        
        const planetMeshes = Object.values(planetMeshesRef.current);
        
        // Check for intersections
        const intersects = raycaster.intersectObjects(planetMeshes, true);
        if (intersects.length > 0) {
          // Try to find the planet that was clicked
          const intersectedObject = intersects[0].object;
          let planetName = Object.keys(planetMeshesRef.current).find(name => 
            planetMeshesRef.current[name] === intersectedObject ||
            planetMeshesRef.current[name].children.includes(intersectedObject)
          );
          
          // If not found directly, check parent objects
          if (!planetName) {
            let parent = intersectedObject.parent;
            while (parent && !planetName) {
              planetName = Object.keys(planetMeshesRef.current).find(
                name => planetMeshesRef.current[name] === parent
              );
              parent = parent?.parent || null;
            }
          }
          
          // If planet found, select it
          if (planetName) {
            const selectedPlanet = planets.find(p => p.name === planetName);
            if (selectedPlanet) {
              onSelectPlanet(selectedPlanet);
            }
          }
        }
      } catch (error) {
        console.error("Error handling click:", error);
      }
    };

    // Add event listeners
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("click", handleClick);

    // Remove event listeners on cleanup
    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("click", handleClick);
    };
  }, [planets, onSelectPlanet]);

  // Toggle rotation handler
  const toggleRotation = () => {
    isRotatingRef.current = !isRotatingRef.current;
  };

  return (
    <div 
      className="flex-1 h-full relative" 
      style={{ overflow: "hidden", borderRadius: "4px" }}
    >
      {/* Container for THREE.js renderer */}
      <div ref={containerRef} className="w-full h-full" />
      
      {/* UI Controls */}
      <div className="absolute bottom-2 left-2 text-xs text-cyan-400">
        Drag to rotate • Click to select
      </div>
      
      <div className="absolute top-2 right-2 flex gap-2">
        <button
          onClick={toggleRotation}
          className="game-panel-button"
          title={isRotatingRef.current ? "Pause rotation" : "Resume rotation"}
        >
          {isRotatingRef.current ? "⏸️" : "▶️"}
        </button>
      </div>
    </div>
  );
};

export default React.memo(HolographicMiniMap);