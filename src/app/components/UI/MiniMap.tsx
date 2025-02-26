// Updated MiniMap.tsx with accurate planet positioning and cleaner visualization
import React, { useRef, useEffect, useCallback } from "react";
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
  const isRotatingRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number } | null>(
    null
  );

  // Tracking objects
  const planetMeshesRef = useRef<Record<string, THREE.Mesh>>({});
  const orbitLinesRef = useRef<THREE.Line[]>([]);

  // Initialization tracking to prevent duplicate setups
  const isInitializedRef = useRef<boolean>(false);

  // Scale factor for the minimap - this is critical for accurate positioning
  const SCALE_FACTOR = useRef<number>(0.00001);

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
    Object.values(planetMeshesRef.current).forEach((mesh) => {
      mesh.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const meshChild = child as THREE.Mesh;
          if (meshChild.geometry) meshChild.geometry.dispose();
          if (meshChild.material) {
            if (Array.isArray(meshChild.material)) {
              meshChild.material.forEach((m) => m.dispose());
            } else {
              meshChild.material.dispose();
            }
          }
        }
      });
      sceneRef.current?.remove(mesh);
    });
    planetMeshesRef.current = {};

    // Clean up orbit lines
    orbitLinesRef.current.forEach((line) => {
      if (line.geometry) line.geometry.dispose();
      if (line.material) {
        if (Array.isArray(line.material)) {
          line.material.forEach((m) => m.dispose());
        } else {
          line.material.dispose();
        }
      }
      sceneRef.current?.remove(line);
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
      const ambientLight = new THREE.AmbientLight(0x444444);
      scene.add(ambientLight);

      // Add point light at origin (sun position)
      const pointLight = new THREE.PointLight(0xffffff, 1.5);
      pointLight.position.set(0, 0, 0);
      scene.add(pointLight);

      // Create camera
      const aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 10000);
      camera.position.set(0, 400, 0); // Position camera top-down
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
      renderer.setClearColor(0x000000, 0);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Create camera position indicator
      const cameraMarkerGeometry = new THREE.ConeGeometry(8, 15, 8);
      const cameraMarkerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3333,
        transparent: true,
        opacity: 0.8,
      });
      const cameraMarker = new THREE.Mesh(
        cameraMarkerGeometry,
        cameraMarkerMaterial
      );
      cameraMarker.rotation.x = Math.PI;
      scene.add(cameraMarker);
      cameraMarkerRef.current = cameraMarker;

      // Calculate appropriate scale factor based on the furthest planet
      const furthestPlanet = planets.reduce(
        (max, planet) => {
          if (planet.distanceFromSun > max.distanceFromSun) return planet;
          return max;
        },
        { distanceFromSun: 0 }
      );

      if (furthestPlanet.distanceFromSun > 0) {
        // Aim to fit the furthest planet within 80% of the minimap radius (350 units)
        const mapRadius = 350;
        SCALE_FACTOR.current =
          (mapRadius * 0.8) / furthestPlanet.distanceFromSun;
        console.log(`MiniMap scale factor: ${SCALE_FACTOR.current}`);
      }

      // Setup the planets
      updatePlanets();

      // Start animation loop
      animate();

      console.log("MiniMap scene initialized successfully");
    } catch (error) {
      console.error("Error initializing MiniMap scene:", error);
      isInitializedRef.current = false;
    }
  }, [planets]);

  // Update planet positions and handle cleanup of removed objects
  const updatePlanets = useCallback(() => {
    if (!sceneRef.current) {
      console.warn("Scene not available for updatePlanets");
      return;
    }

    try {
      // Dispose and remove old orbit lines
      orbitLinesRef.current.forEach((line) => {
        if (line.geometry) line.geometry.dispose();
        if (line.material) {
          if (Array.isArray(line.material)) {
            line.material.forEach((m) => m.dispose());
          } else {
            line.material.dispose();
          }
        }
        sceneRef.current?.remove(line);
      });
      orbitLinesRef.current = [];

      // Remove and dispose planet meshes that are no longer in the planets list
      const activePlanetNames = planets.map((p) => p.name);
      Object.keys(planetMeshesRef.current).forEach((planetName) => {
        if (!activePlanetNames.includes(planetName)) {
          const mesh = planetMeshesRef.current[planetName];
          mesh.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const meshChild = child as THREE.Mesh;
              if (meshChild.geometry) meshChild.geometry.dispose();
              if (meshChild.material) {
                if (Array.isArray(meshChild.material)) {
                  meshChild.material.forEach((m) => m.dispose());
                } else {
                  meshChild.material.dispose();
                }
              }
            }
          });
          sceneRef.current?.remove(mesh);
          delete planetMeshesRef.current[planetName];
        }
      });

      // Create Sun if needed
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
        sunMesh.position.set(0, 0, 0);
        sceneRef.current.add(sunMesh);
        planetMeshesRef.current["Sun"] = sunMesh;

        // Add glow effect to sun
        const sunGlowGeometry = new THREE.SphereGeometry(20, 32, 32);
        const sunGlowMaterial = new THREE.MeshBasicMaterial({
          color: 0xffff00,
          transparent: true,
          opacity: 0.3,
        });
        const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
        sunMesh.add(sunGlow);
      }

      // Create or update other planets
      planets.forEach((planet) => {
        if (planet.name === "Sun") return; // Skip Sun as it's handled above

        // Get planet radius - scale smaller planets up a bit for visibility
        let planetSize;
        if (planet.radius < 10000) {
          planetSize = 5; // Small planets (Mercury, Mars, etc.)
        } else if (planet.radius < 40000) {
          planetSize = 7; // Medium planets (Earth, Venus)
        } else if (planet.radius < 100000) {
          planetSize = 10; // Large planets (Uranus, Neptune)
        } else {
          planetSize = 12; // Giant planets (Jupiter, Saturn)
        }

        // Create orbit visualization based on planet's actual semi-major axis
        if (planet.semiMajorAxis && planet.eccentricity !== undefined) {
          const semiMajorAxis = planet.semiMajorAxis * SCALE_FACTOR.current;
          const semiMinorAxis =
            semiMajorAxis *
            Math.sqrt(1 - planet.eccentricity * planet.eccentricity);

          // Create elliptical path points
          const segments = 128;
          const points: THREE.Vector3[] = [];

          for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const x = semiMajorAxis * Math.cos(theta);
            const z = semiMinorAxis * Math.sin(theta);
            points.push(new THREE.Vector3(x, 0, z));
          }

          const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
            points
          );

          // Apply orbital inclination if available
          if (planet.orbitalInclination) {
            const inclinationRad = (planet.orbitalInclination * Math.PI) / 180;
            const rotMatrix = new THREE.Matrix4().makeRotationX(inclinationRad);
            orbitGeometry.applyMatrix4(rotMatrix);
          }

          // Create the orbit line with appropriate color
          let orbitColor = 0x3498db; // Default blue

          switch (planet.name.toLowerCase()) {
            case "mercury":
              orbitColor = 0xcccccc;
              break;
            case "venus":
              orbitColor = 0xeedd82;
              break;
            case "earth":
              orbitColor = 0x6495ed;
              break;
            case "mars":
              orbitColor = 0xcd5c5c;
              break;
            case "jupiter":
              orbitColor = 0xffa500;
              break;
            case "saturn":
              orbitColor = 0xffd700;
              break;
            case "uranus":
              orbitColor = 0x40e0d0;
              break;
            case "neptune":
              orbitColor = 0x0000cd;
              break;
            case "pluto":
              orbitColor = 0x8b4513;
              break;
          }

          const orbitMaterial = new THREE.LineBasicMaterial({
            color: orbitColor,
            transparent: true,
            opacity: planet.name === currentPlanet?.name ? 0.8 : 0.4,
          });

          const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
          orbitLine.name = `${planet.name}-orbit`;
          sceneRef.current?.add(orbitLine);
          orbitLinesRef.current.push(orbitLine);
        }

        // Create or update planet mesh
        if (!planetMeshesRef.current[planet.name]) {
          const planetGeometry = new THREE.SphereGeometry(planetSize, 16, 16);
          const planetMaterial = new THREE.MeshLambertMaterial({
            color: planetColors[planet.name] || 0xffffff,
            emissive: planetColors[planet.name] || 0xffffff,
            emissiveIntensity: 0.2,
          });
          const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
          planetMesh.name = planet.name;

          // Add hitbox for interaction (slightly larger than visible planet)
          const hitboxGeometry = new THREE.SphereGeometry(
            planetSize * 1.5,
            8,
            8
          );
          const hitboxMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
          });
          const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
          hitbox.name = `${planet.name}-hitbox`;
          planetMesh.add(hitbox);

          sceneRef.current?.add(planetMesh);
          planetMeshesRef.current[planet.name] = planetMesh;

          // Add rings for Saturn
          if (planet.name === "Saturn") {
            const ringGeometry = new THREE.RingGeometry(
              planetSize * 1.4,
              planetSize * 2,
              32
            );
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

        // Position the planet using its actual position
        const planetMesh = planetMeshesRef.current[planet.name];

        // Only update if planet has valid position data
        if (
          planet.position &&
          !isNaN(planet.position.x) &&
          !isNaN(planet.position.y) &&
          !isNaN(planet.position.z)
        ) {
          // Scale the actual planet position to fit in the minimap
          const scaledX = planet.position.x * SCALE_FACTOR.current;
          const scaledY = planet.position.y * SCALE_FACTOR.current;
          const scaledZ = planet.position.z * SCALE_FACTOR.current;

          planetMesh.position.set(scaledX, scaledY, scaledZ);
        }

        // Highlight current planet
        if (currentPlanet && planet.name === currentPlanet.name) {
          planetMesh.scale.set(1.5, 1.5, 1.5);
          // Add a highlight effect
          if (!planetMesh.userData.highlighted) {
            const highlightGeometry = new THREE.RingGeometry(
              planetSize * 2,
              planetSize * 2.2,
              32
            );
            const highlightMaterial = new THREE.MeshBasicMaterial({
              color: 0x00ffff,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.7,
            });
            const highlight = new THREE.Mesh(
              highlightGeometry,
              highlightMaterial
            );
            highlight.rotation.x = Math.PI / 2;
            highlight.name = "highlight";
            planetMesh.add(highlight);
            planetMesh.userData.highlighted = true;
          }
        } else {
          planetMesh.scale.set(1, 1, 1);
          // Remove highlight if exists
          if (planetMesh.userData.highlighted) {
            const highlight = planetMesh.children.find(
              (child) => child.name === "highlight"
            );
            if (highlight) {
              planetMesh.remove(highlight);
            }
            planetMesh.userData.highlighted = false;
          }
        }
      });

      // Update camera marker position
      if (cameraMarkerRef.current) {
        const scaledX = cameraPosition.x * SCALE_FACTOR.current;
        const scaledY = cameraPosition.y * SCALE_FACTOR.current;
        const scaledZ = cameraPosition.z * SCALE_FACTOR.current;

        const maxDist = 380; // Keep within map bounds
        const dist = Math.sqrt(
          scaledX * scaledX + scaledY * scaledY + scaledZ * scaledZ
        );

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

        // Make the camera marker point in the right direction
        if (dist > 0) {
          cameraMarkerRef.current.lookAt(0, 0, 0);
        }
      }
    } catch (error) {
      console.error("Error updating planet positions:", error);
    }
  }, [planets, currentPlanet, cameraPosition]);

  // Animation loop
  const animate = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    try {
      // Only rotate scene if that feature is enabled and not dragging
      if (isRotatingRef.current && !isDraggingRef.current && sceneRef.current) {
        sceneRef.current.rotation.y += 0.001;
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      requestRef.current = requestAnimationFrame(animate);
    } catch (error) {
      console.error("Error in animation loop:", error);
    }
  }, []);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current)
      return;

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

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
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
    let initialClickPosition = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      initialClickPosition = { x: e.clientX, y: e.clientY };
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (
        isDraggingRef.current &&
        previousMousePositionRef.current &&
        sceneRef.current
      ) {
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
      const dx = event.clientX - initialClickPosition.x;
      const dy = event.clientY - initialClickPosition.y;
      const dragDistance = Math.sqrt(dx * dx + dy * dy);

      if (dragDistance > 5) return; // Skip if this was a drag, not a click

      if (!cameraRef.current || !rendererRef.current || !sceneRef.current)
        return;

      try {
        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);

        // Get all planet meshes to check for intersections
        const planetMeshes = Object.values(planetMeshesRef.current);
        const intersects = raycaster.intersectObjects(planetMeshes, true);

        if (intersects.length > 0) {
          const intersectedObject = intersects[0].object;

          // Find the planet name from the intersected object or its parent
          let planetName = Object.keys(planetMeshesRef.current).find(
            (name) =>
              planetMeshesRef.current[name] === intersectedObject ||
              planetMeshesRef.current[name].children.includes(intersectedObject)
          );

          if (!planetName) {
            // Check if it's a child of a planet mesh
            let parent = intersectedObject.parent;
            while (parent && !planetName) {
              planetName = Object.keys(planetMeshesRef.current).find(
                (name) => planetMeshesRef.current[name] === parent
              );
              parent = parent?.parent || null;
            }
          }

          if (planetName) {
            // Find the planet object from the name
            const selectedPlanet = planets.find((p) => p.name === planetName);
            if (selectedPlanet) {
              onSelectPlanet(selectedPlanet);
            }
          }
        }
      } catch (error) {
        console.error("Error handling click:", error);
      }
    };

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("click", handleClick);

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
