import * as THREE from 'three';


export class EnhancedTextureLoader {
  private loader: THREE.TextureLoader;
  private textureCache: Map<string, THREE.Texture>;
  private baseUrl: string;

  constructor() {
    this.loader = new THREE.TextureLoader();
    this.textureCache = new Map<string, THREE.Texture>();
    
        if (typeof window !== 'undefined') {
      this.baseUrl = window.location.origin;
    } else {
      this.baseUrl = '';
    }
  }

  
  public load(path: string): THREE.Texture {
        if (this.textureCache.has(path)) {
      return this.textureCache.get(path)!;
    }

        let normalizedPath = path;
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }
    
        normalizedPath = normalizedPath.replace(/\/+/g, '/');
    
        const defaultTexture = this.createDefaultTexture();
    
        try {
      const texture = this.loader.load(
        normalizedPath,
        (loadedTexture) => {
          console.log(`Loaded texture: ${normalizedPath}`);
          this.textureCache.set(path, loadedTexture);
        },
        undefined,         (error) => {
          console.error(`Error loading texture ${normalizedPath}:`, error);
        }
      );
      
      return texture;
    } catch (error) {
      console.error(`Failed to load texture ${normalizedPath}:`, error);
      return defaultTexture;
    }
  }

  
  private createDefaultTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#888888';
      context.fillRect(0, 0, 64, 64);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}

export const textureLoader = new EnhancedTextureLoader();


export function loadPlanetTexture(planetName: string): THREE.Texture {
  const lowerName = planetName.toLowerCase();
  return textureLoader.load(`/assets/images/${lowerName}.jpeg`);
}