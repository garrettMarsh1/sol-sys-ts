// src/app/components/UI/HolographicMiniMap.tsx
import React, { useRef, useEffect } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planetMeshesRef = useRef<Record<string, THREE.Mesh>>({});
  const orbitLinesRef = useRef<THREE.Line[]>([]);
  const cameraMarkerRef = useRef<THREE.Mesh | null>(null);
  const rotationSpeedRef = useRef<number>(0.001);
  const isRotatingRef = useRef<boolean>(true);
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number } | null>(
    null
  );

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

  // Set up and clean up Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    // Add point light
    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      10000
    );
    camera.position.set(0, 300, 500);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create renderer with transparent background
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setClearColor(0x000000, 0.0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add a subtle glow to the entire scene - base plane
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

    // Add grid lines
    const gridHelper = new THREE.GridHelper(800, 20, 0x2e78d4, 0x2e78d4);
    gridHelper.position.y = -19;
    // Make grid lines glow
    gridHelper.material = new THREE.LineBasicMaterial({
      color: 0x3498db,
      transparent: true,
      opacity: 0.3,
    });
    scene.add(gridHelper);

    // Create camera position indicator
    const cameraMarkerGeometry = new THREE.ConeGeometry(10, 20, 8);
    const cameraMarkerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.7,
    });
    const cameraMarker = new THREE.Mesh(
      cameraMarkerGeometry,
      cameraMarkerMaterial
    );
    cameraMarker.rotation.x = Math.PI;
    scene.add(cameraMarker);
    cameraMarkerRef.current = cameraMarker;

    // Animate function
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current)
        return;

      // Rotate the scene if not dragging
      if (isRotatingRef.current && !isDraggingRef.current) {
        sceneRef.current.rotation.y += rotationSpeedRef.current;
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      requestRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    requestRef.current = requestAnimationFrame(animate);

    // Event handlers for mouse interaction
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (
        isDraggingRef.current &&
        previousMousePositionRef.current &&
        sceneRef.current
      ) {
        const deltaX = e.clientX - previousMousePositionRef.current.x;

        // Rotate the scene based on mouse movement
        sceneRef.current.rotation.y += deltaX * 0.01;

        previousMousePositionRef.current = {
          x: e.clientX,
          y: e.clientY,
        };
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleMouseLeave = () => {
      isDraggingRef.current = false;
    };

    // Add event listeners
    const currentContainer = containerRef.current;
    currentContainer.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    currentContainer.addEventListener("mouseleave", handleMouseLeave);

    // Click handler for selecting planets
    // Click handler for selecting planets
    // Click handler for selecting planets
    const handleClick = (event: MouseEvent) => {
      if (isDraggingRef.current) return; // Don't select if dragging

      if (!cameraRef.current || !rendererRef.current || !sceneRef.current)
        return;

      console.log("MiniMap clicked");

      // Get container bounds
      const rect = currentContainer.getBoundingClientRect();

      // Calculate normalized device coordinates
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      // Raycasting to find intersected objects
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      // Get all planet meshes for intersection test
      const planetMeshes = Object.values(planetMeshesRef.current);
      console.log(
        "Available planets for selection:",
        Object.keys(planetMeshesRef.current)
      );

      // Make sure we're testing against all meshes
      const intersects = raycaster.intersectObjects(planetMeshes, true);

      if (intersects.length > 0) {
        console.log("Intersection found:", intersects[0]);
        const intersectedObject = intersects[0].object as THREE.Mesh;

        // Find which planet this mesh belongs to
        // We need to check both direct matches and parent/child relationships
        let planetName = Object.keys(planetMeshesRef.current).find((name) => {
          const mesh = planetMeshesRef.current[name];
          return (
            mesh === intersectedObject ||
            (mesh instanceof THREE.Object3D &&
              mesh.children.includes(intersectedObject))
          );
        });

        if (!planetName) {
          // Try to find by traversing up the parent chain
          let parent = intersectedObject.parent;
          while (parent && !planetName) {
            planetName = Object.keys(planetMeshesRef.current).find(
              (name) => planetMeshesRef.current[name] === parent
            );
            parent = parent?.parent || null;
          }
        }

        if (planetName) {
          console.log("Selected planet:", planetName);
          const selectedPlanet = planets.find((p) => p.name === planetName);
          if (selectedPlanet) {
            console.log("Triggering selection for:", selectedPlanet.name);
            onSelectPlanet(selectedPlanet);
          }
        }
      } else {
        console.log("No intersection found");
      }
    };

    currentContainer.addEventListener("click", handleClick);

    // Clean up
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }

      currentContainer.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      currentContainer.removeEventListener("mouseleave", handleMouseLeave);
      currentContainer.removeEventListener("click", handleClick);
    };
  }, []);

  // Update planet positions and camera marker whenever data changes
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear old orbit lines
    orbitLinesRef.current.forEach((line) => {
      sceneRef.current?.remove(line);
    });
    orbitLinesRef.current = [];

    // Scale factor for the minimap
    const scale = 0.000001;

    // Create sun at center
    const sunPlanet = planets.find((p) => p.name === "Sun");
    if (sunPlanet && !planetMeshesRef.current["Sun"]) {
      const sunGeometry = new THREE.SphereGeometry(15, 32, 32);
      const sunMaterial = new THREE.MeshLambertMaterial({
        color: planetColors["Sun"],
        emissive: planetColors["Sun"],
        emissiveIntensity: 1,
      });
      const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
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

      // Get planet data
      const distanceFromSun = planet.distanceFromSun * scale;
      const planetSize =
        planet.name === "Sun"
          ? 15
          : (planet.radius || planet.diameter / 2 || 5) * scale * 50; // Scale up to make visible
      const scaledSize = Math.max(3, Math.min(10, planetSize)); // Clamp size

      // Create orbit path
      const orbitPath = new THREE.EllipseCurve(
        0,
        0, // Center x, y
        distanceFromSun,
        distanceFromSun, // Radius x, y
        0,
        2 * Math.PI, // Start angle, end angle
        false, // Clockwise
        0 // Rotation
      );

      const orbitPoints = orbitPath.getPoints(100);
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
        orbitPoints
      );
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
        const planetGeometry = new THREE.SphereGeometry(scaledSize, 16, 16);
        const planetMaterial = new THREE.MeshLambertMaterial({
          color: planetColors[planet.name] || 0xffffff,
          emissive: planetColors[planet.name] || 0xffffff,
          emissiveIntensity: 0.2,
        });
        const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
        if (sceneRef.current) {
          sceneRef.current.add(planetMesh);
        }
        planetMeshesRef.current[planet.name] = planetMesh;

        // Add glow effect for highlighted planets
        if (currentPlanet && planet.name === currentPlanet.name) {
          const glowGeometry = new THREE.SphereGeometry(
            scaledSize * 1.5,
            16,
            16
          );
          const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
          });
          const glow = new THREE.Mesh(glowGeometry, glowMaterial);
          planetMesh.add(glow);
        }
      }

      // Position the planet
      const planetMesh = planetMeshesRef.current[planet.name];
      const angle =
        (planet.meanAnomaly || 0) +
        (planet.orbitalPeriod
          ? (2 *
              Math.PI *
              (Date.now() % (planet.orbitalPeriod * 24 * 60 * 60 * 1000))) /
            (planet.orbitalPeriod * 24 * 60 * 60 * 1000)
          : 0);

      // Position planets with a slight vertical offset so they don't all appear on the exact same plane
      planetMesh.position.set(
        Math.cos(angle) * distanceFromSun,
        planet.orbitalInclination
          ? Math.sin(planet.orbitalInclination * 0.1) * 10
          : 0,
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

      // Point in direction of movement
      cameraMarkerRef.current.lookAt(0, 0, 0);
    }
  }, [planets, currentPlanet, cameraPosition, planetColors]);

  return (
    <div className="absolute top-16 right-4 pointer-events-auto">
      <div className="game-panel minimap-panel">
        <div className="game-panel-header">
          <div className="game-panel-title">System Map</div>
          <div className="game-panel-controls">
            <button
              onClick={() => {
                isRotatingRef.current = !isRotatingRef.current;
              }}
              className="game-panel-button"
            >
              {isRotatingRef.current ? "⏸️" : "▶️"}
            </button>
          </div>
        </div>
        <div
          ref={containerRef}
          className="holographic-map"
          style={{ width: "240px", height: "240px" }}
        />
        <div className="game-panel-footer">
          <div className="text-xs text-cyan-400">
            Drag to rotate • Click to target
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolographicMiniMap;
